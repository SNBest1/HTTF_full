"""
SQLite database module — thread-safe singleton with DDL and CRUD helpers.
Uses check_same_thread=False with a threading.Lock to safely share one connection
across FastAPI's async worker threads.
"""

import sqlite3
import threading
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "aac_data.db"

_conn: sqlite3.Connection | None = None
_lock = threading.Lock()


def get_connection() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
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
            """
        )
        conn.commit()


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
    cur = conn.execute(
        "SELECT id, phrase, timestamp, location, hour_of_day FROM phrase_logs ORDER BY id"
    )
    return [dict(row) for row in cur.fetchall()]


def count_phrases() -> int:
    """Return total number of logged phrases."""
    conn = get_connection()
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
    cur = conn.execute(
        "SELECT COUNT(*) AS total, SUM(was_accepted) AS accepted FROM autocomplete_logs"
    )
    row = cur.fetchone()
    total = row["total"] or 0
    accepted = row["accepted"] or 0
    return total, accepted
