#!/usr/bin/env python3
"""
Migrate an existing plaintext aac_data.db to SQLCipher AES-256 encryption.

Run ONCE, before starting the updated server for the first time.

Usage:
    cd backend
    python scripts/migrate_to_encrypted.py
"""

import shutil
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
DB_PATH = BACKEND_DIR / "aac_data.db"
ENCRYPTED_PATH = BACKEND_DIR / "aac_data_encrypted.db"
KEY_PATH = BACKEND_DIR / "aac.key"

if not DB_PATH.exists():
    print(f"ERROR: Source database not found: {DB_PATH}")
    sys.exit(1)

if not KEY_PATH.exists():
    print(f"ERROR: Key file not found: {KEY_PATH}")
    print('Run: python3 -c "import secrets; print(secrets.token_hex(32))" '
          f'> {KEY_PATH} && chmod 0600 {KEY_PATH}')
    sys.exit(1)

passphrase = KEY_PATH.read_text().strip()
if not passphrase:
    print(f"ERROR: Key file is empty: {KEY_PATH}")
    sys.exit(1)

# Backup original
backup_path = BACKEND_DIR / "aac_data.db.bak"
shutil.copy2(DB_PATH, backup_path)
print(f"[migrate] Backup saved to: {backup_path}")

# Open plaintext DB with SQLCipher using empty key, then export to encrypted copy
# sqlcipher_export() is a SQLCipher function — must use sqlcipher3 for both connections
try:
    import sqlcipher3.dbapi2 as _cipher_sqlite3
except ImportError:
    import pysqlcipher3.dbapi2 as _cipher_sqlite3  # type: ignore

# Open plaintext DB with sqlcipher3 without setting a key (reads as plaintext)
# Then ATTACH the new encrypted DB and export into it
plain_conn = _cipher_sqlite3.connect(str(DB_PATH))
plain_conn.execute(
    f"ATTACH DATABASE '{ENCRYPTED_PATH}' AS encrypted KEY '{passphrase}'"
)
plain_conn.execute("SELECT sqlcipher_export('encrypted')")
plain_conn.execute("DETACH DATABASE encrypted")
plain_conn.close()
print(f"[migrate] sqlcipher_export() complete → {ENCRYPTED_PATH}")

# Replace original with encrypted
DB_PATH.unlink()
ENCRYPTED_PATH.rename(DB_PATH)
print(f"[migrate] Replaced {DB_PATH} with encrypted version.")

# Verify
try:
    import sqlcipher3.dbapi2 as _cipher_sqlite3
except ImportError:
    import pysqlcipher3.dbapi2 as _cipher_sqlite3  # type: ignore

verify_conn = _cipher_sqlite3.connect(str(DB_PATH))
verify_conn.execute(f"PRAGMA key = '{passphrase}'")
row = verify_conn.execute("SELECT COUNT(*) FROM phrase_logs").fetchone()
verify_conn.close()
print(f"[migrate] Verification OK — {row[0]} phrases in encrypted DB.")
print("[migrate] Migration complete. You can now start the updated server.")
