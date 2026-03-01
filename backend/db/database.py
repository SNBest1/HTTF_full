"""
SQLite database module — thread-safe singleton with DDL and CRUD helpers.
Uses check_same_thread=False with a threading.Lock to safely share one connection
across FastAPI's async worker threads.

SQLCipher AES-256 encryption: the engine-level key is loaded from backend/aac.key
at startup by load_db_key() and applied via PRAGMA key immediately after every
connect().  The LLM always receives plaintext — encryption is data-at-rest only.
"""

import re
import threading
from pathlib import Path

# ── SQLCipher swap ────────────────────────────────────────────────────────────
# Drop-in replacement for the stdlib sqlite3 module.  The API is identical.
try:
    import sqlcipher3.dbapi2 as sqlite3
except ImportError:
    import pysqlcipher3.dbapi2 as sqlite3   # type: ignore[no-redef]

DB_PATH = Path(__file__).parent.parent / "aac_data.db"
_KEY_PATH = Path(__file__).parent.parent / "aac.key"

_conn: sqlite3.Connection | None = None
_lock = threading.Lock()

# Module-level variable populated by load_db_key() during app startup
_db_key: str = ""


def load_db_key() -> None:
    """
    Read the AES-256 passphrase from backend/aac.key (mode 0o600).
    Must be called before any get_connection() call, i.e. during FastAPI lifespan
    startup, before init_db().

    Raises FileNotFoundError if the key file is missing so the server refuses
    to start rather than silently opening an unencrypted DB.
    """
    global _db_key
    if not _KEY_PATH.exists():
        raise FileNotFoundError(
            f"Database key file not found: {_KEY_PATH}\n"
            "Run: python3 -c \"import secrets; print(secrets.token_hex(32))\" "
            f"> {_KEY_PATH} && chmod 0600 {_KEY_PATH}"
        )
    _db_key = _KEY_PATH.read_text().strip()
    if not _db_key:
        raise ValueError(f"Database key file is empty: {_KEY_PATH}")
    if not re.fullmatch(r'[0-9a-fA-F]+', _db_key):
        raise ValueError(
            f"Database key in {_KEY_PATH} must be a hex string. "
            "Re-generate with: python3 -c \"import secrets; print(secrets.token_hex(32))\" "
            f"> {_KEY_PATH} && chmod 0600 {_KEY_PATH}"
        )


def get_connection() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        if not _db_key:
            raise RuntimeError("load_db_key() must be called before get_connection().")
        _conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        # Apply encryption key immediately after connect — must be the very
        # first statement before any read or write.
        _conn.execute(f"PRAGMA key = '{_db_key}'")
        _conn.row_factory = sqlite3.Row
    return _conn


def init_db() -> None:
    """Create tables if they don't exist. Called once at startup."""
    conn = get_connection()
    with _lock:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS phrase_logs (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                phrase      TEXT    NOT NULL,
                timestamp   TEXT    NOT NULL DEFAULT (datetime('now')),
                location    TEXT    NOT NULL DEFAULT 'Home',
                hour_of_day INTEGER NOT NULL DEFAULT 12
            );

            CREATE TABLE IF NOT EXISTS autocomplete_logs (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                suggested_phrase TEXT    NOT NULL,
                was_accepted     INTEGER NOT NULL DEFAULT 0,
                timestamp        TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS reminders (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                text       TEXT NOT NULL,
                time       TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            """
        )
        conn.commit()


# ── phrase_logs helpers ───────────────────────────────────────────────────────

def insert_phrase(phrase: str, location: str, hour_of_day: int) -> int:
    """Insert a phrase log entry and return the new row id."""
    conn = get_connection()
    with _lock:
        cur = conn.execute(
            "INSERT INTO phrase_logs (phrase, location, hour_of_day) VALUES (?, ?, ?)",
            (phrase, location, hour_of_day),
        )
        conn.commit()
        return cur.lastrowid


def get_all_phrases() -> list[dict]:
    """Return all phrase logs as a list of dicts."""
    conn = get_connection()
    with _lock:
        cur = conn.execute(
            "SELECT id, phrase, timestamp, location, hour_of_day FROM phrase_logs ORDER BY id"
        )
        return [dict(row) for row in cur.fetchall()]


def count_phrases() -> int:
    """Return total number of logged phrases."""
    conn = get_connection()
    with _lock:
        cur = conn.execute("SELECT COUNT(*) FROM phrase_logs")
        return cur.fetchone()[0]


def insert_autocomplete_log(suggested_phrase: str, was_accepted: bool) -> None:
    """Log whether a suggested phrase was accepted or dismissed."""
    conn = get_connection()
    with _lock:
        conn.execute(
            "INSERT INTO autocomplete_logs (suggested_phrase, was_accepted) VALUES (?, ?)",
            (suggested_phrase, int(was_accepted)),
        )
        conn.commit()


def get_autocomplete_stats() -> tuple[int, int]:
    """Return (total_suggestions, total_accepted) counts."""
    conn = get_connection()
    with _lock:
        cur = conn.execute(
            "SELECT COUNT(*) AS total, SUM(was_accepted) AS accepted FROM autocomplete_logs"
        )
        row = cur.fetchone()
        total = row["total"] or 0
        accepted = row["accepted"] or 0
        return total, accepted


def get_phrase_acceptance_scores() -> dict[str, float]:
    """Return a mapping of suggested_phrase → acceptance rate (0.0–1.0)."""
    conn = get_connection()
    with _lock:
        cur = conn.execute(
            """
            SELECT suggested_phrase,
                   CAST(SUM(was_accepted) AS FLOAT) / COUNT(*) AS score
            FROM autocomplete_logs
            GROUP BY suggested_phrase
            """
        )
        return {row["suggested_phrase"]: row["score"] for row in cur.fetchall()}


# ── reminders helpers ─────────────────────────────────────────────────────────

def insert_reminder(text: str, time: str) -> int:
    """Insert a reminder and return the new row id."""
    conn = get_connection()
    with _lock:
        cur = conn.execute(
            "INSERT INTO reminders (text, time) VALUES (?, ?)",
            (text, time),
        )
        conn.commit()
        return cur.lastrowid


def get_reminders() -> list[dict]:
    """Return all reminders ordered by creation time, most recent first."""
    conn = get_connection()
    cur = conn.execute(
        "SELECT id, text, time, created_at FROM reminders ORDER BY id DESC"
    )
    return [dict(row) for row in cur.fetchall()]


def delete_reminder(reminder_id: int) -> bool:
    """Delete a reminder by id. Returns True if a row was deleted."""
    conn = get_connection()
    with _lock:
        cur = conn.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
        conn.commit()
        return cur.rowcount > 0
