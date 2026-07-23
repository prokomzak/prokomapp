from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import sqlite3
import sys
import time
from datetime import datetime, timedelta, timezone
from email.parser import BytesParser
from email.policy import default as email_default_policy
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlparse


APP_DIR = Path(__file__).resolve().parents[1]
OUTPUTS_DIR = APP_DIR.parent
CONFIGURED_DATA_DIR = os.environ.get("PROKOM_DATA_DIR") or os.environ.get("PROKOM_DB_DIR")
DEFAULT_DB_DIR = OUTPUTS_DIR / "prokom-lan-database"
DB_DIR = Path(CONFIGURED_DATA_DIR).expanduser().resolve() if CONFIGURED_DATA_DIR else DEFAULT_DB_DIR
DB_PATH = Path(os.environ.get("PROKOM_DB_PATH", DB_DIR / "prokom-lan.sqlite3")).expanduser().resolve()
DB_DIR = DB_PATH.parent
SECRET_PATH = Path(os.environ.get("PROKOM_SECRET_PATH", DB_DIR / ".session-secret")).expanduser().resolve()
if os.environ.get("PROKOM_UPLOAD_DIR"):
    UPLOAD_DIR = Path(os.environ["PROKOM_UPLOAD_DIR"]).expanduser().resolve()
elif CONFIGURED_DATA_DIR:
    UPLOAD_DIR = (DB_DIR / "uploads").resolve()
else:
    UPLOAD_DIR = APP_DIR / "uploads"
KNOWLEDGE_UPLOAD_DIR = UPLOAD_DIR / "knowledge"
REPORT_UPLOAD_DIR = UPLOAD_DIR / "reports"
ANNOUNCEMENT_UPLOAD_DIR = UPLOAD_DIR / "announcements"
SESSION_COOKIE = "prokom_session"
SESSION_TTL = 60 * 60 * 12
APP_ACCOUNT_ROSTER_MIGRATION_KEY = "app_account_roster_2026_07_21"
TADEUSZ_TITLE_MIGRATION_KEY = "tadeusz_title_szef_2026_07_22"
KNOWLEDGE_CONTENT_MIGRATION_KEY = "knowledge_content_real_docs_2026_07_21"
LEGACY_CONTENT_MIGRATION_KEY = "legacy_content_cleanup_2026_07_21"
WEEKLY_SCHEDULE_MIGRATION_KEY = "weekly_schedule_current_week_2026_07_22"
MAX_KNOWLEDGE_UPLOAD_BYTES = 25 * 1024 * 1024
WORK_DAYS = (
    ("mon", "Pon"),
    ("tue", "Wt"),
    ("wed", "Śr"),
    ("thu", "Czw"),
    ("fri", "Pt"),
)
WORK_DAY_KEYS = {key for key, _label in WORK_DAYS}
WORK_DAY_INDEX = {key: index for index, (key, _label) in enumerate(WORK_DAYS)}
AUTO_TIME_RECORD_NOTE = "ewidencja_czasu"

SEED_USERS = [
    {
        "login": "root",
        "display_name": "Root",
        "password": "root1234",
        "app_role": "root",
        "team_role": "Administrator SQL",
        "initials": "RT",
        "allow_raw_sql": 1,
        "can_create_users": 1,
        "can_manage_users": 1,
        "can_manage_schema": 1,
    },
    {
        "login": "tadeusz",
        "display_name": "Tadeusz",
        "password": None,
        "app_role": "admin",
        "team_role": "Szef",
        "initials": "TA",
        "allow_raw_sql": 0,
        "can_create_users": 1,
        "can_manage_users": 1,
        "can_manage_schema": 0,
    },
    {
        "login": "krystian",
        "display_name": "Krystian",
        "password": None,
        "app_role": "employee",
        "team_role": "Pracownik",
        "initials": "KR",
    },
    {
        "login": "kuba",
        "display_name": "Kuba",
        "password": None,
        "app_role": "employee",
        "team_role": "Pracownik",
        "initials": "KU",
    },
    {
        "login": "pawel",
        "display_name": "Pawe\u0142",
        "password": None,
        "app_role": "employee",
        "team_role": "Pracownik",
        "initials": "PA",
    },
]

APP_ROSTER_USERS = [user for user in SEED_USERS if user["app_role"] != "root"]

ROOT_PERMISSIONS = [
    "APP_ADMIN",
    "SQL_ALL",
    "SQL_SELECT",
    "SQL_INSERT",
    "SQL_UPDATE",
    "SQL_DELETE",
    "SQL_CREATE_TABLE",
    "SQL_ALTER_TABLE",
    "SQL_DROP_TABLE",
    "SQL_CREATE_USERS",
    "SQL_MANAGE_USERS",
    "SQL_MANAGE_PERMISSIONS",
    "SQL_BACKUP_DATABASE",
]

ADMIN_PERMISSIONS = [
    "APP_ADMIN",
    "SQL_SELECT",
    "SQL_INSERT",
    "SQL_UPDATE",
    "SQL_DELETE",
    "SQL_CREATE_USERS",
    "SQL_MANAGE_USERS",
]

ANNOUNCEMENT_REACTIONS = ("like", "done", "question")
ANNOUNCEMENT_SEED = []

TASK_COLUMNS = ("todo", "doing", "review", "done")
TASK_SEED = {column: [] for column in TASK_COLUMNS}

REPORT_STATUSES = ("Nowe", "W realizacji", "Za\u0142atwione")
REPORT_SEED = []

REQUEST_STATUSES = ("Oczekuje", "Do sprawdzenia", "Zaakceptowane", "Odrzucone")
REQUEST_KINDS = ("leave", "correction")
REQUEST_SEED = []

CALENDAR_SEED = []

KNOWLEDGE_ARTICLE_SEED = []

HANDOVER_NOTE_SEED = []



def now_text() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso_from_dt(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def local_period_starts(now: datetime) -> tuple[datetime, datetime, datetime]:
    local_now = now.astimezone()
    today_local = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_local = today_local - timedelta(days=today_local.weekday())
    month_local = today_local.replace(day=1)
    return (
        today_local.astimezone(timezone.utc),
        week_local.astimezone(timezone.utc),
        month_local.astimezone(timezone.utc),
    )


def normalize_week_start(value: str | None = None) -> str:
    if value:
        try:
            selected = datetime.strptime(value[:10], "%Y-%m-%d").date()
        except ValueError:
            selected = datetime.now().astimezone().date()
    else:
        selected = datetime.now().astimezone().date()
    monday = selected - timedelta(days=selected.weekday())
    return monday.strftime("%Y-%m-%d")


def schedule_week_days(week_start: str) -> list[dict]:
    start = datetime.strptime(week_start, "%Y-%m-%d").date()
    days = []
    for index, (key, label) in enumerate(WORK_DAYS):
        current = start + timedelta(days=index)
        days.append(
            {
                "key": key,
                "label": label,
                "date": current.strftime("%d.%m"),
                "isoDate": current.strftime("%Y-%m-%d"),
            }
        )
    return days


def seconds_between(start: datetime | None, end: datetime | None) -> int:
    if not start or not end or end <= start:
        return 0
    return max(0, int((end - start).total_seconds()))


def session_seconds(row: sqlite3.Row, range_start: datetime, range_end: datetime, now: datetime) -> int:
    started = parse_iso(row["started_at"])
    ended = parse_iso(row["ended_at"]) or now
    if not started:
        return 0
    overlap_start = max(started, range_start)
    overlap_end = min(ended, range_end)
    worked = seconds_between(overlap_start, overlap_end)
    if not worked:
        return 0
    break_seconds = int(row["total_break_seconds"] or 0)
    break_started = parse_iso(row["break_started_at"])
    if break_started and not row["ended_at"]:
        break_seconds += seconds_between(break_started, now)
    return max(0, worked - min(worked, break_seconds))


def parse_schedule_minutes(value: str | None) -> int | None:
    if not value:
        return None
    match = re.fullmatch(r"([01]?\d|2[0-3]):([0-5]\d)", value.strip())
    if not match:
        return None
    return int(match.group(1)) * 60 + int(match.group(2))


def schedule_cell_seconds(row: sqlite3.Row | dict | None) -> int:
    if not row:
        return 0
    start = parse_schedule_minutes(row["start_time"])
    end = parse_schedule_minutes(row["end_time"])
    if start is None or end is None or end <= start:
        return 0
    return (end - start) * 60


def b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_password(password: str) -> str:
    iterations = 310000
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${b64url_encode(salt)}${b64url_encode(digest)}"


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return True
    try:
        scheme, iterations_text, salt_text, digest_text = stored_hash.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        expected = b64url_decode(digest_text)
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            b64url_decode(salt_text),
            int(iterations_text),
        )
        return hmac.compare_digest(digest, expected)
    except (ValueError, TypeError):
        return False


def ensure_runtime_dirs() -> None:
    for path in (DB_DIR, UPLOAD_DIR, KNOWLEDGE_UPLOAD_DIR, REPORT_UPLOAD_DIR, ANNOUNCEMENT_UPLOAD_DIR):
        try:
            path.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            raise RuntimeError(f"Cannot create runtime directory {path}: {exc}") from exc


def session_secret() -> bytes:
    ensure_runtime_dirs()
    if SECRET_PATH.exists():
        return SECRET_PATH.read_bytes()
    secret = secrets.token_bytes(48)
    SECRET_PATH.write_bytes(secret)
    return secret


def make_session(login: str) -> str:
    payload = {"login": login, "exp": int(time.time()) + SESSION_TTL}
    body = b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(session_secret(), body.encode("ascii"), hashlib.sha256).digest()
    return f"{body}.{b64url_encode(signature)}"


def read_session(token: str | None) -> str | None:
    if not token or "." not in token:
        return None
    body, signature = token.rsplit(".", 1)
    expected = hmac.new(session_secret(), body.encode("ascii"), hashlib.sha256).digest()
    try:
        if not hmac.compare_digest(b64url_decode(signature), expected):
            return None
        payload = json.loads(b64url_decode(body))
    except (ValueError, json.JSONDecodeError):
        return None
    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    return str(payload.get("login") or "")


def connect() -> sqlite3.Connection:
    ensure_runtime_dirs()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def migrate_app_account_roster(conn: sqlite3.Connection) -> None:
    already_done = conn.execute(
        "SELECT value FROM database_meta WHERE key = ?",
        (APP_ACCOUNT_ROSTER_MIGRATION_KEY,),
    ).fetchone()
    if already_done:
        return

    for user in APP_ROSTER_USERS:
        existing = conn.execute("SELECT login FROM users WHERE login = ?", (user["login"],)).fetchone()
        if existing:
            conn.execute(
                """
                UPDATE users
                SET display_name = ?, password_hash = NULL, app_role = ?, team_role = ?, initials = ?,
                    active = 1, allow_raw_sql = ?, can_create_users = ?, can_manage_users = ?,
                    can_manage_schema = ?, updated_at = ?
                WHERE login = ?
                """,
                (
                    user["display_name"],
                    user["app_role"],
                    user["team_role"],
                    user["initials"],
                    int(user.get("allow_raw_sql", 0)),
                    int(user.get("can_create_users", 0)),
                    int(user.get("can_manage_users", 0)),
                    int(user.get("can_manage_schema", 0)),
                    now_text(),
                    user["login"],
                ),
            )
        else:
            conn.execute(
                """
                INSERT INTO users (
                  login, display_name, password_hash, app_role, team_role, initials,
                  active, allow_raw_sql, can_create_users, can_manage_users, can_manage_schema,
                  created_at, updated_at
                ) VALUES (?, ?, NULL, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["login"],
                    user["display_name"],
                    user["app_role"],
                    user["team_role"],
                    user["initials"],
                    int(user.get("allow_raw_sql", 0)),
                    int(user.get("can_create_users", 0)),
                    int(user.get("can_manage_users", 0)),
                    int(user.get("can_manage_schema", 0)),
                    now_text(),
                    now_text(),
                ),
            )

        conn.execute("DELETE FROM user_permissions WHERE user_login = ?", (user["login"],))
        permissions = ADMIN_PERMISSIONS if user["app_role"] == "admin" else []
        for permission in permissions:
            conn.execute(
                "INSERT INTO user_permissions(user_login, permission) VALUES(?, ?) "
                "ON CONFLICT(user_login, permission) DO NOTHING",
                (user["login"], permission),
            )

    if conn.execute("SELECT login FROM users WHERE login = 'szef'").fetchone():
        for table, column in (
            ("audit_log", "actor_login"),
            ("chat_groups", "created_by"),
            ("chat_messages", "author_login"),
            ("announcements", "author_login"),
            ("announcement_comments", "author_login"),
            ("company_tasks", "owner_login"),
            ("company_tasks", "created_by"),
            ("internal_reports", "owner_login"),
            ("employee_requests", "owner_login"),
            ("calendar_events", "created_by"),
            ("knowledge_articles", "created_by"),
            ("handover_notes", "author_login"),
        ):
            conn.execute(f"UPDATE {table} SET {column} = 'tadeusz' WHERE {column} = 'szef'")

        for table, column in (
            ("user_permissions", "user_login"),
            ("chat_group_members", "user_login"),
            ("chat_message_reads", "reader_login"),
            ("announcement_recipients", "user_login"),
            ("announcement_reads", "reader_login"),
            ("announcement_reactions", "user_login"),
            ("calendar_rsvps", "user_login"),
            ("handover_accepts", "user_login"),
        ):
            conn.execute(f"UPDATE OR IGNORE {table} SET {column} = 'tadeusz' WHERE {column} = 'szef'")
            conn.execute(f"DELETE FROM {table} WHERE {column} = 'szef'")

        conn.execute("DELETE FROM users WHERE login = 'szef'")

    conn.execute(
        "INSERT INTO audit_log(actor_login, action, details) VALUES(NULL, 'MIGRATE_APP_ACCOUNTS', ?)",
        ("Created Tadeusz, Krystian, Kuba and Pawel without initial passwords; removed szef.",),
    )
    conn.execute(
        "INSERT INTO database_meta(key, value) VALUES(?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (APP_ACCOUNT_ROSTER_MIGRATION_KEY, now_text()),
    )


def migrate_tadeusz_title(conn: sqlite3.Connection) -> None:
    already_done = conn.execute(
        "SELECT value FROM database_meta WHERE key = ?",
        (TADEUSZ_TITLE_MIGRATION_KEY,),
    ).fetchone()
    if already_done:
        return

    conn.execute("UPDATE users SET team_role = 'Szef', updated_at = ? WHERE login = 'tadeusz'", (now_text(),))
    conn.execute(
        "INSERT INTO audit_log(actor_login, action, details) VALUES(NULL, 'UPDATE_TADEUSZ_TITLE', ?)",
        ("Changed Tadeusz team role label to Szef.",),
    )
    conn.execute(
        "INSERT INTO database_meta(key, value) VALUES(?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (TADEUSZ_TITLE_MIGRATION_KEY, now_text()),
    )


def ensure_knowledge_schema(conn: sqlite3.Connection) -> None:
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(knowledge_articles)").fetchall()}
    for column, definition in (
        ("file_name", "file_name TEXT"),
        ("file_mime", "file_mime TEXT"),
        ("file_size", "file_size INTEGER NOT NULL DEFAULT 0"),
        ("file_storage_name", "file_storage_name TEXT"),
    ):
        if column not in columns:
            conn.execute(f"ALTER TABLE knowledge_articles ADD COLUMN {definition}")


def ensure_report_schema(conn: sqlite3.Connection) -> None:
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(internal_reports)").fetchall()}
    for column, definition in (
        ("file_name", "file_name TEXT"),
        ("file_mime", "file_mime TEXT"),
        ("file_size", "file_size INTEGER NOT NULL DEFAULT 0"),
        ("file_storage_name", "file_storage_name TEXT"),
    ):
        if column not in columns:
            conn.execute(f"ALTER TABLE internal_reports ADD COLUMN {definition}")


def ensure_announcement_schema(conn: sqlite3.Connection) -> None:
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(announcements)").fetchall()}
    for column, definition in (
        ("file_name", "file_name TEXT"),
        ("file_mime", "file_mime TEXT"),
        ("file_size", "file_size INTEGER NOT NULL DEFAULT 0"),
        ("file_storage_name", "file_storage_name TEXT"),
    ):
        if column not in columns:
            conn.execute(f"ALTER TABLE announcements ADD COLUMN {definition}")


def migrate_knowledge_content(conn: sqlite3.Connection) -> None:
    already_done = conn.execute(
        "SELECT value FROM database_meta WHERE key = ?",
        (KNOWLEDGE_CONTENT_MIGRATION_KEY,),
    ).fetchone()
    if already_done:
        return

    conn.execute(
        """
        DELETE FROM knowledge_articles
        WHERE id IN ('kb-1', 'kb-2', 'kb-3')
           OR COALESCE(file_storage_name, '') = ''
        """
    )

    conn.execute("DELETE FROM handover_notes WHERE id IN ('handover-1', 'handover-2')")

    conn.execute(
        "INSERT INTO audit_log(actor_login, action, details) VALUES(NULL, 'CLEAR_KNOWLEDGE_PLACEHOLDERS', ?)",
        ("Removed sample knowledge documents and handover notes.",),
    )
    conn.execute(
        "INSERT INTO database_meta(key, value) VALUES(?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (KNOWLEDGE_CONTENT_MIGRATION_KEY, now_text()),
    )


def delete_where_in(conn: sqlite3.Connection, table: str, column: str, values: tuple[str, ...]) -> None:
    if not values:
        return
    placeholders = ",".join("?" for _ in values)
    conn.execute(f"DELETE FROM {table} WHERE {column} IN ({placeholders})", values)


def migrate_legacy_content(conn: sqlite3.Connection) -> None:
    already_done = conn.execute(
        "SELECT value FROM database_meta WHERE key = ?",
        (LEGACY_CONTENT_MIGRATION_KEY,),
    ).fetchone()
    if already_done:
        return

    before_changes = conn.total_changes

    delete_where_in(conn, "announcements", "id", ("1", "2", "3"))
    conn.execute("DELETE FROM announcements WHERE LOWER(TRIM(title)) = 'test'")

    delete_where_in(
        conn,
        "company_tasks",
        "id",
        (
            "seed-todo-1",
            "seed-todo-2",
            "seed-doing-1",
            "seed-review-1",
            "seed-done-1",
        ),
    )
    conn.execute("DELETE FROM company_tasks WHERE LOWER(TRIM(title)) = 'test'")

    delete_where_in(conn, "internal_reports", "id", ("seed-report-1", "seed-report-2", "seed-report-3"))

    delete_where_in(conn, "employee_requests", "id", ("seed-request-1", "seed-request-2"))
    delete_where_in(conn, "employee_requests", "owner_login", ("anna", "marek"))

    delete_where_in(conn, "calendar_events", "id", ("event-1", "event-2", "event-3"))

    delete_where_in(conn, "chat_messages", "conversation_id", ("dm:marek:szef", "dm:root:szef"))
    conn.execute(
        """
        DELETE FROM chat_messages
        WHERE LOWER(TRIM(body)) LIKE 'test%'
        """
    )
    delete_where_in(conn, "chat_groups", "created_by", ("szef",))

    removed_count = conn.total_changes - before_changes
    conn.execute(
        "INSERT INTO audit_log(actor_login, action, details) VALUES(NULL, 'CLEAR_LEGACY_CONTENT', ?)",
        (f"Removed {removed_count} legacy rows from shared content tables.",),
    )
    conn.execute(
        "INSERT INTO database_meta(key, value) VALUES(?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (LEGACY_CONTENT_MIGRATION_KEY, now_text()),
    )


def migrate_weekly_schedule(conn: sqlite3.Connection) -> None:
    already_done = conn.execute(
        "SELECT value FROM database_meta WHERE key = ?",
        (WEEKLY_SCHEDULE_MIGRATION_KEY,),
    ).fetchone()
    if already_done:
        return

    current_week_start = normalize_week_start()
    rows = conn.execute("SELECT * FROM work_schedules").fetchall()
    copied = 0
    for row in rows:
        cursor = conn.execute(
            """
            INSERT INTO work_schedule_weeks(
              user_login, week_start, day_key, start_time, end_time, note, updated_by, updated_at
            )
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_login, week_start, day_key) DO NOTHING
            """,
            (
                row["user_login"],
                current_week_start,
                row["day_key"],
                row["start_time"],
                row["end_time"],
                row["note"] or "",
                row["updated_by"],
                row["updated_at"],
            ),
        )
        if cursor.rowcount:
            copied += 1

    conn.execute(
        "INSERT INTO audit_log(actor_login, action, details) VALUES(NULL, 'MIGRATE_WEEKLY_SCHEDULE', ?)",
        (f"Copied {copied} legacy schedule cells to week {current_week_start}.",),
    )
    conn.execute(
        "INSERT INTO database_meta(key, value) VALUES(?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (WEEKLY_SCHEDULE_MIGRATION_KEY, now_text()),
    )


def initialize_database() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS database_meta (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              login TEXT NOT NULL UNIQUE,
              display_name TEXT NOT NULL,
              password_hash TEXT,
              auth_scheme TEXT NOT NULL DEFAULT 'pbkdf2_sha256',
              app_role TEXT NOT NULL CHECK (app_role IN ('root', 'admin', 'employee')) DEFAULT 'employee',
              team_role TEXT NOT NULL DEFAULT 'Pracownik',
              initials TEXT NOT NULL,
              active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
              allow_raw_sql INTEGER NOT NULL DEFAULT 0 CHECK (allow_raw_sql IN (0, 1)),
              can_create_users INTEGER NOT NULL DEFAULT 0 CHECK (can_create_users IN (0, 1)),
              can_manage_users INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_users IN (0, 1)),
              can_manage_schema INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_schema IN (0, 1)),
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_permissions (
              user_login TEXT NOT NULL,
              permission TEXT NOT NULL,
              granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (user_login, permission),
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS user_presence (
              user_login TEXT PRIMARY KEY,
              clocked_in INTEGER NOT NULL DEFAULT 0 CHECK (clocked_in IN (0, 1)),
              break_active INTEGER NOT NULL DEFAULT 0 CHECK (break_active IN (0, 1)),
              started_at TEXT,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS time_sessions (
              id TEXT PRIMARY KEY,
              user_login TEXT NOT NULL,
              started_at TEXT NOT NULL,
              ended_at TEXT,
              total_break_seconds INTEGER NOT NULL DEFAULT 0,
              break_started_at TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS work_schedules (
              user_login TEXT NOT NULL,
              day_key TEXT NOT NULL CHECK (day_key IN ('mon', 'tue', 'wed', 'thu', 'fri')),
              start_time TEXT,
              end_time TEXT,
              note TEXT NOT NULL DEFAULT '',
              updated_by TEXT,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (user_login, day_key),
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE,
              FOREIGN KEY (updated_by) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS work_schedule_weeks (
              user_login TEXT NOT NULL,
              week_start TEXT NOT NULL,
              day_key TEXT NOT NULL CHECK (day_key IN ('mon', 'tue', 'wed', 'thu', 'fri')),
              start_time TEXT,
              end_time TEXT,
              note TEXT NOT NULL DEFAULT '',
              updated_by TEXT,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (user_login, week_start, day_key),
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE,
              FOREIGN KEY (updated_by) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS audit_log (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              actor_login TEXT,
              action TEXT NOT NULL,
              details TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (actor_login) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS chat_groups (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              created_by TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (created_by) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS chat_group_members (
              group_id TEXT NOT NULL,
              user_login TEXT NOT NULL,
              PRIMARY KEY (group_id, user_login),
              FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
              id TEXT PRIMARY KEY,
              conversation_id TEXT NOT NULL,
              author_login TEXT NOT NULL,
              body TEXT NOT NULL,
              attachments_json TEXT NOT NULL DEFAULT '[]',
              time_label TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (author_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS chat_message_reads (
              message_id TEXT NOT NULL,
              reader_login TEXT NOT NULL,
              read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (message_id, reader_login),
              FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
              FOREIGN KEY (reader_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS announcements (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              body TEXT NOT NULL,
              priority TEXT NOT NULL CHECK (priority IN ('normal', 'important', 'urgent')) DEFAULT 'normal',
              author_login TEXT,
              time_label TEXT NOT NULL,
              file_name TEXT,
              file_mime TEXT,
              file_size INTEGER NOT NULL DEFAULT 0,
              file_storage_name TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (author_login) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS announcement_recipients (
              post_id TEXT NOT NULL,
              user_login TEXT NOT NULL,
              PRIMARY KEY (post_id, user_login),
              FOREIGN KEY (post_id) REFERENCES announcements(id) ON DELETE CASCADE,
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS announcement_reads (
              post_id TEXT NOT NULL,
              reader_login TEXT NOT NULL,
              time_label TEXT NOT NULL,
              read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (post_id, reader_login),
              FOREIGN KEY (post_id) REFERENCES announcements(id) ON DELETE CASCADE,
              FOREIGN KEY (reader_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS announcement_reactions (
              post_id TEXT NOT NULL,
              reaction_id TEXT NOT NULL,
              user_login TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (post_id, reaction_id, user_login),
              FOREIGN KEY (post_id) REFERENCES announcements(id) ON DELETE CASCADE,
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS announcement_comments (
              id TEXT PRIMARY KEY,
              post_id TEXT NOT NULL,
              author_login TEXT,
              body TEXT NOT NULL,
              time_label TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (post_id) REFERENCES announcements(id) ON DELETE CASCADE,
              FOREIGN KEY (author_login) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS company_tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              owner_login TEXT,
              owner_name TEXT NOT NULL,
              due TEXT NOT NULL,
              priority TEXT NOT NULL CHECK (priority IN ('normal', 'important', 'urgent')) DEFAULT 'normal',
              column_key TEXT NOT NULL CHECK (column_key IN ('todo', 'doing', 'review', 'done')) DEFAULT 'todo',
              source TEXT NOT NULL,
              position INTEGER NOT NULL DEFAULT 0,
              created_by TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_login) REFERENCES users(login) ON DELETE SET NULL,
              FOREIGN KEY (created_by) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS internal_reports (
              id TEXT PRIMARY KEY,
              category TEXT NOT NULL,
              title TEXT NOT NULL,
              detail TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'Nowe',
              owner_login TEXT,
              owner_name TEXT NOT NULL,
              file_name TEXT,
              file_mime TEXT,
              file_size INTEGER NOT NULL DEFAULT 0,
              file_storage_name TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_login) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS employee_requests (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              detail TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'Oczekuje',
              kind TEXT NOT NULL CHECK (kind IN ('leave', 'correction')) DEFAULT 'leave',
              owner_login TEXT,
              owner_name TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_login) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS calendar_events (
              id TEXT PRIMARY KEY,
              day INTEGER NOT NULL,
              title TEXT NOT NULL,
              date_label TEXT NOT NULL,
              time_label TEXT NOT NULL,
              created_by TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (created_by) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS calendar_rsvps (
              event_id TEXT NOT NULL,
              user_login TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'Bede',
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (event_id, user_login),
              FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS knowledge_articles (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              title TEXT NOT NULL,
              detail TEXT NOT NULL,
              file_name TEXT,
              file_mime TEXT,
              file_size INTEGER NOT NULL DEFAULT 0,
              file_storage_name TEXT,
              created_by TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (created_by) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS handover_notes (
              id TEXT PRIMARY KEY,
              author_login TEXT,
              author_name TEXT NOT NULL,
              text TEXT NOT NULL,
              time_label TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (author_login) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS handover_accepts (
              note_id TEXT NOT NULL,
              user_login TEXT NOT NULL,
              accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (note_id, user_login),
              FOREIGN KEY (note_id) REFERENCES handover_notes(id) ON DELETE CASCADE,
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS weekly_kudos (
              id TEXT PRIMARY KEY,
              week_start TEXT NOT NULL,
              recipient_login TEXT NOT NULL,
              recipient_name TEXT NOT NULL,
              reason TEXT NOT NULL,
              created_by TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (recipient_login) REFERENCES users(login) ON DELETE CASCADE,
              FOREIGN KEY (created_by) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS quick_polls (
              id TEXT PRIMARY KEY,
              question TEXT NOT NULL,
              options_json TEXT NOT NULL,
              created_by TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (created_by) REFERENCES users(login) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS quick_poll_votes (
              poll_id TEXT NOT NULL,
              user_login TEXT NOT NULL,
              option_index INTEGER NOT NULL,
              voted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (poll_id, user_login),
              FOREIGN KEY (poll_id) REFERENCES quick_polls(id) ON DELETE CASCADE,
              FOREIGN KEY (user_login) REFERENCES users(login) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(app_role);
            CREATE INDEX IF NOT EXISTS idx_permissions_permission ON user_permissions(permission);
            CREATE INDEX IF NOT EXISTS idx_user_presence_clocked ON user_presence(clocked_in, updated_at);
            CREATE INDEX IF NOT EXISTS idx_time_sessions_user_started ON time_sessions(user_login, started_at);
            CREATE INDEX IF NOT EXISTS idx_time_sessions_open ON time_sessions(user_login, ended_at);
            CREATE INDEX IF NOT EXISTS idx_work_schedules_day ON work_schedules(day_key);
            CREATE INDEX IF NOT EXISTS idx_work_schedule_weeks_week ON work_schedule_weeks(week_start, day_key);
            CREATE INDEX IF NOT EXISTS idx_chat_group_members_user ON chat_group_members(user_login);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
            CREATE INDEX IF NOT EXISTS idx_chat_message_reads_reader ON chat_message_reads(reader_login, read_at);
            CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at);
            CREATE INDEX IF NOT EXISTS idx_announcement_recipients_user ON announcement_recipients(user_login);
            CREATE INDEX IF NOT EXISTS idx_announcement_reads_reader ON announcement_reads(reader_login, read_at);
            CREATE INDEX IF NOT EXISTS idx_announcement_comments_post ON announcement_comments(post_id, created_at);
            CREATE INDEX IF NOT EXISTS idx_company_tasks_column ON company_tasks(column_key, position);
            CREATE INDEX IF NOT EXISTS idx_company_tasks_owner ON company_tasks(owner_login);
            CREATE INDEX IF NOT EXISTS idx_internal_reports_status ON internal_reports(status, updated_at);
            CREATE INDEX IF NOT EXISTS idx_internal_reports_owner ON internal_reports(owner_login);
            CREATE INDEX IF NOT EXISTS idx_employee_requests_status ON employee_requests(status, updated_at);
            CREATE INDEX IF NOT EXISTS idx_employee_requests_owner ON employee_requests(owner_login);
            CREATE INDEX IF NOT EXISTS idx_calendar_events_day ON calendar_events(day, time_label);
            CREATE INDEX IF NOT EXISTS idx_calendar_rsvps_user ON calendar_rsvps(user_login, created_at);
            CREATE INDEX IF NOT EXISTS idx_knowledge_articles_created ON knowledge_articles(created_at);
            CREATE INDEX IF NOT EXISTS idx_handover_notes_created ON handover_notes(created_at);
            CREATE INDEX IF NOT EXISTS idx_handover_accepts_user ON handover_accepts(user_login, accepted_at);
            CREATE INDEX IF NOT EXISTS idx_weekly_kudos_week ON weekly_kudos(week_start, created_at);
            CREATE INDEX IF NOT EXISTS idx_weekly_kudos_recipient ON weekly_kudos(recipient_login, week_start);
            CREATE INDEX IF NOT EXISTS idx_quick_polls_created ON quick_polls(created_at);
            CREATE INDEX IF NOT EXISTS idx_quick_poll_votes_user ON quick_poll_votes(user_login, voted_at);
            """
        )
        meta = {
            "project": "Panel Firmowy PRO-KOM",
            "database_engine": "SQLite",
            "database_role": "LAN server local file",
            "planned_lan_ip": "192.168.1.101",
            "backend": "python-standard-library",
            "schema_version": "19",
        }
        for key, value in meta.items():
            conn.execute(
                "INSERT INTO database_meta(key, value) VALUES(?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (key, value),
            )
        ensure_knowledge_schema(conn)
        ensure_report_schema(conn)
        ensure_announcement_schema(conn)
        for user in SEED_USERS:
            existing = conn.execute("SELECT login FROM users WHERE login = ?", (user["login"],)).fetchone()
            if existing:
                continue
            conn.execute(
                """
                INSERT INTO users (
                  login, display_name, password_hash, app_role, team_role, initials,
                  active, allow_raw_sql, can_create_users, can_manage_users, can_manage_schema,
                  created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["login"],
                    user["display_name"],
                    hash_password(user["password"]) if user.get("password") else None,
                    user["app_role"],
                    user["team_role"],
                    user["initials"],
                    int(user.get("allow_raw_sql", 0)),
                    int(user.get("can_create_users", 0)),
                    int(user.get("can_manage_users", 0)),
                    int(user.get("can_manage_schema", 0)),
                    now_text(),
                    now_text(),
                ),
            )
            permissions = ROOT_PERMISSIONS if user["app_role"] == "root" else ADMIN_PERMISSIONS if user["app_role"] == "admin" else []
            for permission in permissions:
                conn.execute(
                    "INSERT INTO user_permissions(user_login, permission) VALUES(?, ?) "
                    "ON CONFLICT(user_login, permission) DO NOTHING",
                    (user["login"], permission),
                )
        migrate_app_account_roster(conn)
        migrate_tadeusz_title(conn)
        migrate_knowledge_content(conn)
        migrate_legacy_content(conn)
        migrate_weekly_schedule(conn)
        seed_announcements(conn)
        seed_tasks(conn)
        seed_reports(conn)
        seed_requests(conn)
        seed_calendar(conn)
        seed_knowledge(conn)
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(NULL, 'BACKEND_STARTED', 'Database schema checked.')"
        )


def normalize_login(value: str) -> str:
    return "".join(ch for ch in value.strip().lower() if ch.isalnum() or ch in ("-", "_"))[:40]


def normalize_report_status(value: str) -> str | None:
    status = str(value or "").strip()
    if status in REPORT_STATUSES:
        return status
    key = (
        status.lower()
        .replace("\u0142", "l")
        .replace("ą", "a")
        .replace("ę", "e")
        .replace("ó", "o")
        .replace("ś", "s")
        .replace("ż", "z")
        .replace("ź", "z")
        .replace("ć", "c")
        .replace("ń", "n")
    )
    aliases = {
        "nowe": "Nowe",
        "w realizacji": "W realizacji",
        "zalatwione": "Za\u0142atwione",
        "załatwione": "Za\u0142atwione",
        "zaĹ‚atwione": "Za\u0142atwione",
    }
    return aliases.get(key)


def make_initials(name: str) -> str:
    parts = [part for part in name.strip().split() if part]
    initials = "".join(part[0].upper() for part in parts[:2])
    return (initials or name[:2].upper() or "U")[:2]


def fetch_user(conn: sqlite3.Connection, login: str) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM users WHERE login = ?", (login,)).fetchone()


def active_announcement_recipient_logins(conn: sqlite3.Connection) -> list[str]:
    rows = conn.execute(
        """
        SELECT login
        FROM users
        WHERE active = 1 AND app_role != 'root'
        ORDER BY display_name COLLATE NOCASE
        """
    ).fetchall()
    return [row["login"] for row in rows]


def user_display_name(conn: sqlite3.Connection, login: str | None) -> str:
    if not login:
        return "Uzytkownik"
    row = fetch_user(conn, login)
    return row["display_name"] if row else login


def clean_upload_filename(filename: str) -> str:
    basename = Path(str(filename or "dokument").replace("\\", "/")).name
    cleaned = "".join(ch if ch.isalnum() or ch in (" ", ".", "-", "_") else "_" for ch in basename).strip(" .")
    return (cleaned or "dokument")[:140]


def storage_filename(article_id: str, original_filename: str) -> str:
    suffix = Path(original_filename).suffix.lower()
    safe_suffix = "".join(ch for ch in suffix if ch.isalnum() or ch == ".")[:16]
    return f"{article_id}{safe_suffix or '.bin'}"


def knowledge_type_from_file(mime: str, filename: str) -> str:
    lowered = filename.lower()
    if mime.startswith("image/"):
        return "IMG"
    if "pdf" in mime or lowered.endswith(".pdf"):
        return "PDF"
    if "spreadsheet" in mime or lowered.endswith((".xlsx", ".xls", ".csv")):
        return "XLS"
    if "word" in mime or lowered.endswith((".docx", ".doc")):
        return "DOC"
    if lowered.endswith((".txt", ".md")) or mime.startswith("text/"):
        return "TXT"
    return "PLIK"


def seed_announcements(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) AS count FROM announcements").fetchone()["count"]
    if count:
        return
    recipients = active_announcement_recipient_logins(conn)
    for post in ANNOUNCEMENT_SEED:
        conn.execute(
            """
            INSERT INTO announcements(id, title, body, priority, author_login, time_label, created_at)
            VALUES(?, ?, ?, ?, ?, ?, ?)
            """,
            (
                post["id"],
                post["title"],
                post["body"],
                post["priority"],
                post["author_login"],
                post["time_label"],
                now_text(),
            ),
        )
        for login in recipients:
            conn.execute(
                "INSERT INTO announcement_recipients(post_id, user_login) VALUES(?, ?) ON CONFLICT DO NOTHING",
                (post["id"], login),
            )
        for login, time_label in post["readers"]:
            if fetch_user(conn, login):
                conn.execute(
                    """
                    INSERT INTO announcement_reads(post_id, reader_login, time_label, read_at)
                    VALUES(?, ?, ?, ?)
                    ON CONFLICT(post_id, reader_login) DO NOTHING
                    """,
                    (post["id"], login, time_label, now_text()),
                )
        for reaction_id, logins in post["reactions"].items():
            if reaction_id not in ANNOUNCEMENT_REACTIONS:
                continue
            for login in logins:
                if fetch_user(conn, login):
                    conn.execute(
                        """
                        INSERT INTO announcement_reactions(post_id, reaction_id, user_login, created_at)
                        VALUES(?, ?, ?, ?)
                        ON CONFLICT DO NOTHING
                        """,
                        (post["id"], reaction_id, login, now_text()),
                    )
        for index, (login, body, time_label) in enumerate(post["comments"], start=1):
            if fetch_user(conn, login):
                conn.execute(
                    """
                    INSERT INTO announcement_comments(id, post_id, author_login, body, time_label, created_at)
                    VALUES(?, ?, ?, ?, ?, ?)
                    """,
                    (f"{post['id']}-comment-{index}", post["id"], login, body, time_label, now_text()),
                )


def task_owner_name(conn: sqlite3.Connection, owner_login: str | None, fallback: str = "Uzytkownik") -> str:
    if owner_login:
        row = fetch_user(conn, owner_login)
        if row:
            return row["display_name"]
    return fallback or "Uzytkownik"


def seed_tasks(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) AS count FROM company_tasks").fetchone()["count"]
    if count:
        return
    for column, items in TASK_SEED.items():
        for index, task in enumerate(items):
            owner_login = task.get("owner_login")
            conn.execute(
                """
                INSERT INTO company_tasks (
                  id, title, description, owner_login, owner_name, due, priority,
                  column_key, source, position, created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
                """,
                (
                    f"seed-{column}-{index + 1}",
                    task["title"],
                    task["description"],
                    owner_login,
                    task_owner_name(conn, owner_login),
                    task["due"],
                    task["priority"],
                    column,
                    task["source"],
                    index,
                    now_text(),
                    now_text(),
                ),
            )


def seed_reports(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) AS count FROM internal_reports").fetchone()["count"]
    if count:
        return
    for index, report in enumerate(REPORT_SEED, start=1):
        owner_login = report.get("owner_login")
        conn.execute(
            """
            INSERT INTO internal_reports (
              id, category, title, detail, status, owner_login, owner_name, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                f"seed-report-{index}",
                report["category"],
                report["title"],
                report["detail"],
                report["status"],
                owner_login,
                task_owner_name(conn, owner_login),
                now_text(),
                now_text(),
            ),
        )


def seed_requests(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) AS count FROM employee_requests").fetchone()["count"]
    if count:
        return
    for request in REQUEST_SEED:
        owner_login = request.get("owner_login")
        conn.execute(
            """
            INSERT INTO employee_requests (
              id, title, detail, status, kind, owner_login, owner_name, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                request["id"],
                request["title"],
                request["detail"],
                request["status"],
                request["kind"],
                owner_login,
                task_owner_name(conn, owner_login),
                now_text(),
                now_text(),
            ),
        )


def seed_calendar(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) AS count FROM calendar_events").fetchone()["count"]
    if count:
        return
    for event in CALENDAR_SEED:
        conn.execute(
            """
            INSERT INTO calendar_events(id, day, title, date_label, time_label, created_by, created_at, updated_at)
            VALUES(?, ?, ?, ?, ?, 'tadeusz', ?, ?)
            """,
            (
                event["id"],
                int(event["day"]),
                event["title"],
                event["date"],
                event["time"],
                now_text(),
                now_text(),
            ),
        )
        for login in event.get("attendees", []):
            if fetch_user(conn, login):
                conn.execute(
                    """
                    INSERT INTO calendar_rsvps(event_id, user_login, status, created_at)
                    VALUES(?, ?, 'Bede', ?)
                    ON CONFLICT(event_id, user_login) DO NOTHING
                    """,
                    (event["id"], login, now_text()),
                )


def seed_knowledge(conn: sqlite3.Connection) -> None:
    article_count = conn.execute("SELECT COUNT(*) AS count FROM knowledge_articles").fetchone()["count"]
    if not article_count:
        for article in KNOWLEDGE_ARTICLE_SEED:
            conn.execute(
                """
                INSERT INTO knowledge_articles(id, type, title, detail, created_by, created_at)
                VALUES(?, ?, ?, ?, ?, ?)
                """,
                (
                    article["id"],
                    article["type"],
                    article["title"],
                    article["detail"],
                    article.get("created_by"),
                    now_text(),
                ),
            )

    note_count = conn.execute("SELECT COUNT(*) AS count FROM handover_notes").fetchone()["count"]
    if note_count:
        return
    for note in HANDOVER_NOTE_SEED:
        author_login = note.get("author_login")
        conn.execute(
            """
            INSERT INTO handover_notes(id, author_login, author_name, text, time_label, created_at)
            VALUES(?, ?, ?, ?, ?, ?)
            """,
            (
                note["id"],
                author_login,
                user_display_name(conn, author_login),
                note["text"],
                note["time"],
                now_text(),
            ),
        )
        for login in note.get("accepted_by", []):
            if fetch_user(conn, login):
                conn.execute(
                    """
                    INSERT INTO handover_accepts(note_id, user_login, accepted_at)
                    VALUES(?, ?, ?)
                    ON CONFLICT(note_id, user_login) DO NOTHING
                    """,
                    (note["id"], login, now_text()),
                )


def account_payload(row: sqlite3.Row) -> dict:
    role = "admin" if row["app_role"] in ("root", "admin") else "employee"
    return {
        "login": row["login"],
        "name": row["display_name"],
        "label": row["display_name"],
        "role": role,
        "appRole": row["app_role"],
        "teamRole": row["team_role"],
        "initials": row["initials"],
        "active": bool(row["active"]),
        "requiresPassword": bool(row["password_hash"]),
        "isRoot": row["app_role"] == "root",
        "canCreateUsers": bool(row["can_create_users"]),
        "canManageUsers": bool(row["can_manage_users"]),
        "canManageSchema": bool(row["can_manage_schema"]),
        "allowRawSql": bool(row["allow_raw_sql"]),
    }


def presence_map(conn: sqlite3.Connection) -> dict[str, sqlite3.Row]:
    rows = conn.execute("SELECT * FROM user_presence").fetchall()
    return {row["user_login"]: row for row in rows}


def people_payload(conn: sqlite3.Connection, rows: list[sqlite3.Row]) -> list[dict]:
    presence = presence_map(conn)
    people = []
    for row in rows:
        if row["app_role"] == "root":
            continue
        person_presence = presence.get(row["login"])
        is_clocked = bool(person_presence and person_presence["clocked_in"])
        is_break = bool(person_presence and person_presence["break_active"])
        if not row["active"]:
            status = "Wyłączone"
            state = "off"
        elif is_clocked and is_break:
            status = "Przerwa"
            state = "break"
        elif is_clocked:
            status = "W pracy"
            state = "work"
        else:
            status = "Niewbity"
            state = "out"
        people.append(
            {
                "login": row["login"],
                "name": row["display_name"],
                "role": row["team_role"],
                "initials": row["initials"],
                "status": status,
                "state": state,
                "active": bool(row["active"]),
            }
        )
    return people


def snapshot(conn: sqlite3.Connection) -> dict:
    rows = conn.execute("SELECT * FROM users ORDER BY app_role = 'root' DESC, display_name COLLATE NOCASE").fetchall()
    return {
        "accounts": [account_payload(row) for row in rows],
        "people": people_payload(conn, rows),
    }


def active_app_user_rows(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT *
        FROM users
        WHERE active = 1 AND app_role != 'root'
        ORDER BY display_name COLLATE NOCASE
        """
    ).fetchall()


def open_time_session(conn: sqlite3.Connection, login: str) -> sqlite3.Row | None:
    return conn.execute(
        """
        SELECT *
        FROM time_sessions
        WHERE user_login = ? AND ended_at IS NULL
        ORDER BY started_at DESC, created_at DESC
        LIMIT 1
        """,
        (login,),
    ).fetchone()


def start_time_session(conn: sqlite3.Connection, login: str, started_at: str) -> sqlite3.Row:
    session = open_time_session(conn, login)
    if session:
        return session
    session_id = f"time-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
    conn.execute(
        """
        INSERT INTO time_sessions(id, user_login, started_at, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?)
        """,
        (session_id, login, started_at, started_at, started_at),
    )
    return open_time_session(conn, login)


def add_break_seconds(conn: sqlite3.Connection, session: sqlite3.Row, ended_at: str) -> None:
    break_started = parse_iso(session["break_started_at"])
    ended = parse_iso(ended_at)
    if not break_started or not ended:
        return
    conn.execute(
        """
        UPDATE time_sessions
        SET total_break_seconds = total_break_seconds + ?,
            break_started_at = NULL,
            updated_at = ?
        WHERE id = ?
        """,
        (seconds_between(break_started, ended), ended_at, session["id"]),
    )


def minutes_label(minutes: int) -> str:
    safe_minutes = max(0, min(23 * 60 + 59, minutes))
    return f"{safe_minutes // 60:02d}:{safe_minutes % 60:02d}"


def sync_completed_session_to_schedule(
    conn: sqlite3.Connection,
    user_login: str,
    started_at_text: str | None,
    ended_at_text: str | None,
) -> dict | None:
    started = parse_iso(started_at_text)
    ended = parse_iso(ended_at_text)
    if not started or not ended or ended <= started:
        return None
    local_started = started.astimezone()
    local_ended = ended.astimezone()
    day_index = local_started.weekday()
    if day_index >= len(WORK_DAYS):
        return None
    week_start = (local_started.date() - timedelta(days=day_index)).strftime("%Y-%m-%d")
    day_key = WORK_DAYS[day_index][0]
    start_minutes = local_started.hour * 60 + local_started.minute
    if local_ended.date() == local_started.date():
        end_minutes = local_ended.hour * 60 + local_ended.minute
    else:
        end_minutes = 23 * 60 + 59
    if end_minutes <= start_minutes:
        end_minutes = min(23 * 60 + 59, start_minutes + 1)
    if end_minutes <= start_minutes:
        return None

    existing = conn.execute(
        """
        SELECT *
        FROM work_schedule_weeks
        WHERE user_login = ? AND week_start = ? AND day_key = ?
        """,
        (user_login, week_start, day_key),
    ).fetchone()
    if existing and existing["note"] == AUTO_TIME_RECORD_NOTE:
        existing_start = parse_schedule_minutes(existing["start_time"])
        existing_end = parse_schedule_minutes(existing["end_time"])
        if existing_start is not None:
            start_minutes = min(start_minutes, existing_start)
        if existing_end is not None:
            end_minutes = max(end_minutes, existing_end)

    start_time = minutes_label(start_minutes)
    end_time = minutes_label(end_minutes)
    conn.execute(
        """
        INSERT INTO work_schedule_weeks(user_login, week_start, day_key, start_time, end_time, note, updated_by, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_login, week_start, day_key) DO UPDATE SET
          start_time = excluded.start_time,
          end_time = excluded.end_time,
          note = excluded.note,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at
        """,
        (user_login, week_start, day_key, start_time, end_time, AUTO_TIME_RECORD_NOTE, user_login, ended_at_text),
    )
    return {"weekStart": week_start, "day": day_key, "value": f"{start_time}-{end_time}"}


def schedule_rows_map(conn: sqlite3.Connection, week_start: str | None = None) -> dict[tuple[str, str], sqlite3.Row]:
    if week_start:
        rows = conn.execute(
            "SELECT * FROM work_schedule_weeks WHERE week_start = ?",
            (week_start,),
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM work_schedules").fetchall()
    return {(row["user_login"], row["day_key"]): row for row in rows}


def scheduled_month_seconds(conn: sqlite3.Connection, month_start: datetime) -> dict[str, int]:
    local_month_start = month_start.astimezone().date().replace(day=1)
    if local_month_start.month == 12:
        next_month = local_month_start.replace(year=local_month_start.year + 1, month=1)
    else:
        next_month = local_month_start.replace(month=local_month_start.month + 1)
    query_start = (local_month_start - timedelta(days=6)).strftime("%Y-%m-%d")
    query_end = next_month.strftime("%Y-%m-%d")
    rows = conn.execute(
        """
        SELECT *
        FROM work_schedule_weeks
        WHERE week_start >= ? AND week_start < ?
        """,
        (query_start, query_end),
    ).fetchall()
    totals: dict[str, int] = {}
    for row in rows:
        day_offset = WORK_DAY_INDEX.get(row["day_key"])
        if day_offset is None:
            continue
        try:
            day_date = datetime.strptime(row["week_start"], "%Y-%m-%d").date() + timedelta(days=day_offset)
        except ValueError:
            continue
        if local_month_start <= day_date < next_month:
            totals[row["user_login"]] = totals.get(row["user_login"], 0) + schedule_cell_seconds(row)
    return totals


def schedule_snapshot(conn: sqlite3.Connection, users: list[sqlite3.Row], week_start: str | None = None) -> dict:
    selected_week_start = normalize_week_start(week_start)
    schedules = schedule_rows_map(conn, selected_week_start)
    days = schedule_week_days(selected_week_start)
    rows = []
    for user in users:
        cells = []
        for day in days:
            day_key = day["key"]
            cell = schedules.get((user["login"], day_key))
            start_time = cell["start_time"] if cell else ""
            end_time = cell["end_time"] if cell else ""
            note = cell["note"] if cell else ""
            value = f"{start_time}-{end_time}" if start_time and end_time else note
            cells.append(
                {
                    "day": day_key,
                    "label": day["label"],
                    "date": day["date"],
                    "isoDate": day["isoDate"],
                    "startTime": start_time or "",
                    "endTime": end_time or "",
                    "note": note or "",
                    "value": value or "",
                }
            )
        rows.append(
            {
                "login": user["login"],
                "name": user["display_name"],
                "role": user["team_role"],
                "cells": cells,
            }
        )
    week_end = (datetime.strptime(selected_week_start, "%Y-%m-%d").date() + timedelta(days=4)).strftime("%Y-%m-%d")
    return {"weekStart": selected_week_start, "weekEnd": week_end, "days": days, "rows": rows}


def time_summary(conn: sqlite3.Connection, user: sqlite3.Row, schedule_week_start: str | None = None) -> dict:
    now = utc_now()
    now_iso = iso_from_dt(now)
    today_start, week_start, month_start = local_period_starts(now)
    earliest_start = min(today_start, week_start, month_start)
    users = active_app_user_rows(conn)
    current_presence = presence_map(conn)
    for user_row in users:
        person_presence = current_presence.get(user_row["login"])
        if not person_presence or not person_presence["clocked_in"] or open_time_session(conn, user_row["login"]):
            continue
        session = start_time_session(conn, user_row["login"], person_presence["started_at"] or now_iso)
        if person_presence["break_active"] and session and not session["break_started_at"]:
            conn.execute(
                "UPDATE time_sessions SET break_started_at = ?, updated_at = ? WHERE id = ?",
                (now_iso, now_iso, session["id"]),
            )
    people = people_payload(conn, users)
    sessions = conn.execute(
        """
        SELECT *
        FROM time_sessions
        WHERE ended_at IS NULL OR ended_at >= ? OR started_at >= ?
        ORDER BY started_at
        """,
        (iso_from_dt(earliest_start), iso_from_dt(earliest_start)),
    ).fetchall()
    sessions_by_user: dict[str, list[sqlite3.Row]] = {row["login"]: [] for row in users}
    for session in sessions:
        sessions_by_user.setdefault(session["user_login"], []).append(session)

    range_end = now
    people_stats = []
    company_today = company_week = company_month = 0
    scheduled_month_totals = scheduled_month_seconds(conn, month_start)
    for person in people:
        user_sessions = sessions_by_user.get(person["login"], [])
        today_seconds = sum(session_seconds(session, today_start, range_end, now) for session in user_sessions)
        week_seconds = sum(session_seconds(session, week_start, range_end, now) for session in user_sessions)
        month_seconds = sum(session_seconds(session, month_start, range_end, now) for session in user_sessions)
        company_today += today_seconds
        company_week += week_seconds
        company_month += month_seconds
        people_stats.append({
            **person,
            "todaySeconds": today_seconds,
            "weekSeconds": week_seconds,
            "monthSeconds": month_seconds,
            "scheduledMonthSeconds": scheduled_month_totals.get(person["login"], 0),
        })

    selected_schedule_week_start = normalize_week_start(schedule_week_start)
    current_schedule_week_start = normalize_week_start(datetime.now().astimezone().strftime("%Y-%m-%d"))
    schedule = schedule_snapshot(conn, users, selected_schedule_week_start)
    current_day_key = WORK_DAYS[datetime.now().astimezone().weekday()][0] if datetime.now().astimezone().weekday() < 5 else None
    scheduled_today_logins: set[str] = set()
    scheduled_week_seconds = 0
    schedules = schedule_rows_map(conn, current_schedule_week_start)
    for schedule_row in schedules.values():
        if schedule_row["day_key"] in WORK_DAY_KEYS:
            scheduled_week_seconds += schedule_cell_seconds(schedule_row)
        if current_day_key and schedule_row["day_key"] == current_day_key and schedule_cell_seconds(schedule_row):
            scheduled_today_logins.add(schedule_row["user_login"])
    started_today_logins = {
        stat["login"]
        for stat in people_stats
        if stat["todaySeconds"] > 0 or stat["state"] in ("work", "break")
    }
    working_now = sum(1 for stat in people_stats if stat["state"] == "work")
    break_now = sum(1 for stat in people_stats if stat["state"] == "break")

    return {
        "personal": next(
            (
                {
                    "todaySeconds": stat["todaySeconds"],
                    "weekSeconds": stat["weekSeconds"],
                    "monthSeconds": stat["monthSeconds"],
                    "scheduledMonthSeconds": stat["scheduledMonthSeconds"],
                }
                for stat in people_stats
                if stat["login"] == user["login"]
            ),
            {"todaySeconds": 0, "weekSeconds": 0, "monthSeconds": 0, "scheduledMonthSeconds": 0},
        ),
        "pulse": {
            "workingNow": working_now,
            "breakNow": break_now,
            "clockedNow": working_now + break_now,
            "scheduledToday": len(scheduled_today_logins),
            "startedToday": len(started_today_logins),
            "missingToday": len(scheduled_today_logins - started_today_logins),
            "companyTodaySeconds": company_today,
            "companyWeekSeconds": company_week,
            "companyMonthSeconds": company_month,
            "overtimeWeekSeconds": max(0, company_week - scheduled_week_seconds),
        },
        "people": people_stats,
        "schedule": schedule,
    }


def announcement_payload(conn: sqlite3.Connection, row: sqlite3.Row, user: sqlite3.Row) -> dict:
    recipient_rows = conn.execute(
        "SELECT user_login FROM announcement_recipients WHERE post_id = ? ORDER BY user_login COLLATE NOCASE",
        (row["id"],),
    ).fetchall()
    recipient_logins = [recipient["user_login"] for recipient in recipient_rows] or active_announcement_recipient_logins(conn)
    reader_rows = conn.execute(
        """
        SELECT r.reader_login, r.time_label, COALESCE(u.display_name, r.reader_login) AS display_name
        FROM announcement_reads r
        LEFT JOIN users u ON u.login = r.reader_login
        WHERE r.post_id = ?
        ORDER BY r.read_at, r.reader_login COLLATE NOCASE
        """,
        (row["id"],),
    ).fetchall()
    readers = [
        {"login": reader["reader_login"], "name": reader["display_name"], "time": reader["time_label"]}
        for reader in reader_rows
    ]
    read_logins = {reader["login"] for reader in readers}

    reactions = {reaction_id: [] for reaction_id in ANNOUNCEMENT_REACTIONS}
    reaction_rows = conn.execute(
        """
        SELECT reaction_id, user_login, COALESCE(u.display_name, user_login) AS display_name
        FROM announcement_reactions ar
        LEFT JOIN users u ON u.login = ar.user_login
        WHERE post_id = ?
        ORDER BY ar.created_at, ar.user_login COLLATE NOCASE
        """,
        (row["id"],),
    ).fetchall()
    for reaction in reaction_rows:
        if reaction["reaction_id"] in reactions:
            reactions[reaction["reaction_id"]].append(reaction["display_name"])

    comment_rows = conn.execute(
        """
        SELECT c.id, c.author_login, c.body, c.time_label, COALESCE(u.display_name, c.author_login, 'Uzytkownik') AS display_name
        FROM announcement_comments c
        LEFT JOIN users u ON u.login = c.author_login
        WHERE c.post_id = ?
        ORDER BY c.created_at, c.id
        """,
        (row["id"],),
    ).fetchall()
    comments = [
        {
            "id": comment["id"],
            "authorLogin": comment["author_login"],
            "author": comment["display_name"],
            "body": comment["body"],
            "time": comment["time_label"],
        }
        for comment in comment_rows
    ]

    counted_read_logins = read_logins.intersection(recipient_logins) if recipient_logins else read_logins
    file_storage_name = row["file_storage_name"] if "file_storage_name" in row.keys() else None
    file_name = row["file_name"] if "file_name" in row.keys() else None
    file_mime = row["file_mime"] if "file_mime" in row.keys() else None
    file_size = row["file_size"] if "file_size" in row.keys() else 0
    return {
        "id": row["id"],
        "title": row["title"],
        "body": row["body"],
        "priority": row["priority"],
        "author": user_display_name(conn, row["author_login"]),
        "authorLogin": row["author_login"],
        "read": len(counted_read_logins),
        "total": len(recipient_logins),
        "unread": user["login"] in recipient_logins and user["login"] not in read_logins,
        "readers": readers,
        "reactions": reactions,
        "comments": comments,
        "fileName": file_name or "",
        "fileMime": file_mime or "",
        "fileSize": int(file_size or 0),
        "fileUrl": f"/api/announcements/{quote(str(row['id']))}/download" if file_storage_name else "",
        "createdAt": row["created_at"],
    }


def announcements_snapshot(conn: sqlite3.Connection, user: sqlite3.Row) -> dict:
    rows = conn.execute(
        """
        SELECT *
        FROM announcements
        ORDER BY created_at DESC, id DESC
        """
    ).fetchall()
    return {"posts": [announcement_payload(conn, row, user) for row in rows]}


def task_payload(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "owner": row["owner_name"],
        "ownerLogin": row["owner_login"],
        "due": row["due"],
        "priority": row["priority"],
        "column": row["column_key"],
        "source": row["source"],
        "createdAt": row["created_at"],
    }


def tasks_snapshot(conn: sqlite3.Connection) -> dict:
    rows = conn.execute(
        """
        SELECT *
        FROM company_tasks
        ORDER BY column_key, position, created_at DESC, id
        """
    ).fetchall()
    grouped = {column: [] for column in TASK_COLUMNS}
    for row in rows:
        grouped.setdefault(row["column_key"], []).append(task_payload(row))
    return {"tasks": grouped}


def report_payload(row: sqlite3.Row) -> dict:
    file_name = row["file_name"] if "file_name" in row.keys() else None
    file_mime = row["file_mime"] if "file_mime" in row.keys() else None
    file_size = row["file_size"] if "file_size" in row.keys() else 0
    file_storage_name = row["file_storage_name"] if "file_storage_name" in row.keys() else None
    return {
        "id": row["id"],
        "category": row["category"],
        "title": row["title"],
        "detail": row["detail"],
        "status": row["status"],
        "owner": row["owner_name"],
        "ownerLogin": row["owner_login"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "fileName": file_name or "",
        "fileMime": file_mime or "",
        "fileSize": int(file_size or 0),
        "fileUrl": f"/api/reports/{quote(row['id'])}/download" if file_storage_name else "",
    }


def reports_snapshot(conn: sqlite3.Connection) -> dict:
    rows = conn.execute(
        """
        SELECT *
        FROM internal_reports
        ORDER BY updated_at DESC, created_at DESC, id DESC
        """
    ).fetchall()
    return {"reports": [report_payload(row) for row in rows]}


def request_payload(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "detail": row["detail"],
        "status": row["status"],
        "kind": row["kind"],
        "owner": row["owner_name"],
        "ownerLogin": row["owner_login"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def requests_snapshot(conn: sqlite3.Connection) -> dict:
    rows = conn.execute(
        """
        SELECT *
        FROM employee_requests
        ORDER BY updated_at DESC, created_at DESC, id DESC
        """
    ).fetchall()
    return {"requests": [request_payload(row) for row in rows]}


def calendar_event_payload(conn: sqlite3.Connection, row: sqlite3.Row, user: sqlite3.Row) -> dict:
    attendee_count = conn.execute(
        "SELECT COUNT(*) AS count FROM calendar_rsvps WHERE event_id = ?",
        (row["id"],),
    ).fetchone()["count"]
    rsvp = conn.execute(
        "SELECT status FROM calendar_rsvps WHERE event_id = ? AND user_login = ?",
        (row["id"], user["login"]),
    ).fetchone()
    return {
        "id": row["id"],
        "day": int(row["day"]),
        "title": row["title"],
        "date": row["date_label"],
        "time": row["time_label"],
        "attendees": int(attendee_count),
        "rsvp": "B\u0119d\u0119" if rsvp else "Niepotwierdzone",
        "createdBy": row["created_by"],
        "createdAt": row["created_at"],
    }


def calendar_snapshot(conn: sqlite3.Connection, user: sqlite3.Row) -> dict:
    rows = conn.execute(
        """
        SELECT *
        FROM calendar_events
        ORDER BY day, time_label, created_at, id
        """
    ).fetchall()
    return {"events": [calendar_event_payload(conn, row, user) for row in rows]}


def knowledge_article_payload(row: sqlite3.Row) -> dict:
    file_storage_name = row["file_storage_name"] if "file_storage_name" in row.keys() else None
    file_name = row["file_name"] if "file_name" in row.keys() else None
    file_mime = row["file_mime"] if "file_mime" in row.keys() else None
    file_size = row["file_size"] if "file_size" in row.keys() else 0
    return {
        "id": row["id"],
        "type": row["type"],
        "title": row["title"],
        "detail": row["detail"],
        "fileName": file_name or "",
        "fileMime": file_mime or "",
        "fileSize": int(file_size or 0),
        "fileUrl": f"/api/knowledge/articles/{quote(str(row['id']))}/download" if file_storage_name else "",
        "createdBy": row["created_by"],
        "createdAt": row["created_at"],
    }


def handover_note_payload(conn: sqlite3.Connection, row: sqlite3.Row, user: sqlite3.Row) -> dict:
    accepted_count = conn.execute(
        "SELECT COUNT(*) AS count FROM handover_accepts WHERE note_id = ?",
        (row["id"],),
    ).fetchone()["count"]
    accepted = conn.execute(
        "SELECT 1 FROM handover_accepts WHERE note_id = ? AND user_login = ?",
        (row["id"], user["login"]),
    ).fetchone()
    return {
        "id": row["id"],
        "authorLogin": row["author_login"],
        "author": row["author_name"],
        "text": row["text"],
        "time": row["time_label"],
        "accepted": bool(accepted),
        "acceptedCount": int(accepted_count),
        "createdAt": row["created_at"],
    }


def knowledge_snapshot(conn: sqlite3.Connection, user: sqlite3.Row) -> dict:
    article_rows = conn.execute(
        """
        SELECT *
        FROM knowledge_articles
        ORDER BY created_at DESC, id
        """
    ).fetchall()
    note_rows = conn.execute(
        """
        SELECT *
        FROM handover_notes
        ORDER BY created_at DESC, id
        """
    ).fetchall()
    return {
        "articles": [knowledge_article_payload(row) for row in article_rows],
        "handoverNotes": [handover_note_payload(conn, row, user) for row in note_rows],
    }


def weekly_kudos_payload(row: sqlite3.Row) -> dict:
    recipient_display = row["recipient_display_name"] if "recipient_display_name" in row.keys() else ""
    creator_display = row["creator_display_name"] if "creator_display_name" in row.keys() else ""
    return {
        "id": row["id"],
        "weekStart": row["week_start"],
        "recipientLogin": row["recipient_login"],
        "recipientName": recipient_display or row["recipient_name"],
        "reason": row["reason"],
        "createdBy": row["created_by"] or "",
        "creatorName": creator_display or row["created_by"] or "",
        "createdAt": row["created_at"],
    }


def weekly_kudos_snapshot(conn: sqlite3.Connection, week_start: str | None = None) -> dict:
    selected_week_start = normalize_week_start(week_start)
    rows = conn.execute(
        """
        SELECT
          k.*,
          recipient.display_name AS recipient_display_name,
          creator.display_name AS creator_display_name
        FROM weekly_kudos k
        LEFT JOIN users recipient ON recipient.login = k.recipient_login
        LEFT JOIN users creator ON creator.login = k.created_by
        WHERE k.week_start = ?
        ORDER BY k.created_at DESC, k.id DESC
        LIMIT 20
        """,
        (selected_week_start,),
    ).fetchall()
    return {"weekStart": selected_week_start, "kudos": [weekly_kudos_payload(row) for row in rows]}


def quick_poll_payload(conn: sqlite3.Connection, row: sqlite3.Row) -> dict:
    try:
        options = json.loads(row["options_json"] or "[]")
    except json.JSONDecodeError:
        options = []
    if not isinstance(options, list):
        options = []
    option_labels = [str(option).strip() for option in options if str(option).strip()]
    vote_rows = conn.execute(
        "SELECT user_login, option_index FROM quick_poll_votes WHERE poll_id = ?",
        (row["id"],),
    ).fetchall()
    votes = {
        vote["user_login"]: int(vote["option_index"])
        for vote in vote_rows
        if 0 <= int(vote["option_index"]) < len(option_labels)
    }
    return {
        "id": row["id"],
        "question": row["question"],
        "options": option_labels,
        "votes": votes,
        "createdBy": row["created_by"] or "",
        "createdAt": row["created_at"],
    }


def quick_polls_snapshot(conn: sqlite3.Connection) -> dict:
    rows = conn.execute(
        """
        SELECT *
        FROM quick_polls
        ORDER BY created_at DESC, question COLLATE NOCASE
        LIMIT 20
        """
    ).fetchall()
    return {"polls": [quick_poll_payload(conn, row) for row in rows]}


def chat_group_payload(conn: sqlite3.Connection, row: sqlite3.Row) -> dict:
    members = conn.execute(
        "SELECT user_login FROM chat_group_members WHERE group_id = ? ORDER BY user_login COLLATE NOCASE",
        (row["id"],),
    ).fetchall()
    return {
        "id": row["id"],
        "title": row["title"],
        "memberLogins": [member["user_login"] for member in members],
        "createdBy": row["created_by"],
        "createdAt": row["created_at"],
        "messages": [],
    }


def chat_groups_snapshot(conn: sqlite3.Connection, user: sqlite3.Row) -> dict:
    if user["app_role"] in ("root", "admin"):
        rows = conn.execute("SELECT * FROM chat_groups ORDER BY created_at, title COLLATE NOCASE").fetchall()
    else:
        rows = conn.execute(
            """
            SELECT g.*
            FROM chat_groups g
            JOIN chat_group_members m ON m.group_id = g.id
            WHERE m.user_login = ?
            ORDER BY g.created_at, g.title COLLATE NOCASE
            """,
            (user["login"],),
        ).fetchall()
    return {"groups": [chat_group_payload(conn, row) for row in rows]}


def direct_conversation_members(conversation_id: str) -> list[str]:
    if not conversation_id.startswith("dm:"):
        return []
    return [normalize_login(part) for part in conversation_id.removeprefix("dm:").split(":") if normalize_login(part)]


def can_access_conversation(conn: sqlite3.Connection, user: sqlite3.Row, conversation_id: str) -> bool:
    if not conversation_id:
        return False
    if user["app_role"] in ("root", "admin") and not conversation_id.startswith("dm:"):
        return True
    if conversation_id == "company":
        return bool(user["active"])
    if conversation_id == "service":
        return user["app_role"] in ("root", "admin") or user["team_role"] == "Serwis"
    if conversation_id.startswith("dm:"):
        members = direct_conversation_members(conversation_id)
        return len(members) == 2 and user["login"] in members
    group = conn.execute("SELECT id FROM chat_groups WHERE id = ?", (conversation_id,)).fetchone()
    if not group:
        return False
    if user["app_role"] in ("root", "admin"):
        return True
    member = conn.execute(
        "SELECT 1 FROM chat_group_members WHERE group_id = ? AND user_login = ?",
        (conversation_id, user["login"]),
    ).fetchone()
    return bool(member)


def chat_message_payload(row: sqlite3.Row, read_receipts: list[dict] | None = None) -> dict:
    try:
        attachments = json.loads(row["attachments_json"] or "[]")
    except json.JSONDecodeError:
        attachments = []
    receipts = read_receipts or []
    return {
        "id": row["id"],
        "conversationId": row["conversation_id"],
        "authorLogin": row["author_login"],
        "body": row["body"],
        "attachments": attachments if isinstance(attachments, list) else [],
        "time": row["time_label"],
        "createdAt": row["created_at"],
        "readBy": [receipt["login"] for receipt in receipts],
        "readReceipts": receipts,
    }


class ProkomHandler(BaseHTTPRequestHandler):
    server_version = "ProkomBackend/0.1"

    def log_message(self, fmt: str, *args: object) -> None:
        sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), fmt % args))

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.handle_api("GET", parsed.path, parsed.query)
            return
        self.serve_static(parsed.path)

    def do_POST(self) -> None:
        self.handle_api("POST", urlparse(self.path).path)

    def do_PATCH(self) -> None:
        self.handle_api("PATCH", urlparse(self.path).path)

    def do_DELETE(self) -> None:
        self.handle_api("DELETE", urlparse(self.path).path)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        if not raw:
            return {}
        try:
            value = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json({"error": "Nieprawidlowy JSON."}, HTTPStatus.BAD_REQUEST)
            raise
        return value if isinstance(value, dict) else {}

    def read_multipart_form(self) -> tuple[dict[str, str], dict[str, dict[str, object]]] | None:
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self.send_json({"error": "Oczekiwano formularza z plikiem."}, HTTPStatus.BAD_REQUEST)
            return None
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            self.send_json({"error": "Nie przeslano danych formularza."}, HTTPStatus.BAD_REQUEST)
            return None
        if length > MAX_KNOWLEDGE_UPLOAD_BYTES:
            self.send_json({"error": "Plik jest za duzy. Limit to 25 MB."}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            return None
        body = self.rfile.read(length)
        message = BytesParser(policy=email_default_policy).parsebytes(
            f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + body
        )
        if not message.is_multipart():
            self.send_json({"error": "Nieprawidlowy formularz pliku."}, HTTPStatus.BAD_REQUEST)
            return None

        fields: dict[str, str] = {}
        files: dict[str, dict[str, object]] = {}
        for part in message.iter_parts():
            if part.get_content_disposition() != "form-data":
                continue
            name = part.get_param("name", header="content-disposition")
            if not name:
                continue
            payload = part.get_payload(decode=True) or b""
            filename = part.get_filename()
            if filename:
                files[name] = {
                    "filename": clean_upload_filename(filename),
                    "mime": part.get_content_type() or "application/octet-stream",
                    "content": payload,
                }
            else:
                charset = part.get_content_charset() or "utf-8"
                fields[name] = payload.decode(charset, errors="replace")
        return fields, files

    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK, extra_headers: dict[str, str] | None = None) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(raw)

    def cookie_login(self) -> str | None:
        cookie_header = self.headers.get("Cookie", "")
        cookies = SimpleCookie(cookie_header)
        morsel = cookies.get(SESSION_COOKIE)
        return read_session(morsel.value) if morsel else None

    def current_user(self, conn: sqlite3.Connection) -> sqlite3.Row | None:
        login = self.cookie_login()
        if not login:
            return None
        user = fetch_user(conn, login)
        if not user or not user["active"]:
            return None
        return user

    def require_admin(self, conn: sqlite3.Connection) -> sqlite3.Row | None:
        user = self.current_user(conn)
        if not user or not user["can_manage_users"]:
            self.send_json({"error": "Brak uprawnien administratora."}, HTTPStatus.FORBIDDEN)
            return None
        return user

    def handle_api(self, method: str, path: str, query: str = "") -> None:
        try:
            if path == "/api/health" and method == "GET":
                self.send_json({"ok": True, "database": str(DB_PATH), "plannedLanIp": "192.168.1.101"})
                return
            with connect() as conn:
                if path == "/api/accounts" and method == "GET":
                    self.send_json(snapshot(conn))
                    return
                if path == "/api/login" and method == "POST":
                    self.login(conn)
                    return
                if path == "/api/logout" and method == "POST":
                    self.send_json(
                        {"ok": True},
                        extra_headers={"Set-Cookie": f"{SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"},
                    )
                    return
                if path == "/api/me" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.send_json({"user": account_payload(user)})
                    return
                if path == "/api/time/summary" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    params = parse_qs(query)
                    self.send_json(time_summary(conn, user, params.get("weekStart", [""])[0]))
                    return
                if path == "/api/time/schedule" and method in ("POST", "PATCH"):
                    actor = self.require_admin(conn)
                    if actor:
                        self.update_work_schedule(conn, actor)
                    return
                if path == "/api/time/presence" and method in ("POST", "PATCH"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.update_presence(conn, user)
                    return
                if path == "/api/password" and method in ("POST", "PATCH"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.change_user_password(conn, user, user["login"])
                    return
                if path == "/api/users" and method == "GET":
                    if not self.require_admin(conn):
                        return
                    self.send_json(snapshot(conn))
                    return
                if path == "/api/users" and method == "POST":
                    actor = self.require_admin(conn)
                    if actor:
                        self.create_user(conn, actor)
                    return
                if path == "/api/announcements" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.send_json(announcements_snapshot(conn, user))
                    return
                if path == "/api/announcements" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_announcement(conn, user)
                    return
                if path.startswith("/api/announcements/"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    tail = path.removeprefix("/api/announcements/")
                    parts = [unquote(part) for part in tail.split("/") if part]
                    if len(parts) == 2 and method == "GET" and parts[1] == "download":
                        self.serve_announcement_file(conn, user, parts[0])
                        return
                    if len(parts) == 2 and method == "POST" and parts[1] == "read":
                        self.mark_announcement_read(conn, user, parts[0])
                        return
                    if len(parts) == 2 and method == "POST" and parts[1] == "comments":
                        self.create_announcement_comment(conn, user, parts[0])
                        return
                    if len(parts) == 2 and method == "POST" and parts[1] == "reactions":
                        self.toggle_announcement_reaction(conn, user, parts[0])
                        return
                if path == "/api/tasks" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.send_json(tasks_snapshot(conn))
                    return
                if path == "/api/tasks" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_task(conn, user)
                    return
                if path.startswith("/api/tasks/"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    task_id = unquote(path.removeprefix("/api/tasks/"))
                    if method == "PATCH":
                        self.update_task(conn, user, task_id)
                        return
                    if method == "DELETE":
                        self.delete_task(conn, user, task_id)
                        return
                if path == "/api/reports" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.send_json(reports_snapshot(conn))
                    return
                if path == "/api/reports" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_report(conn, user)
                    return
                if path.startswith("/api/reports/"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    report_path = path.removeprefix("/api/reports/")
                    if report_path.endswith("/download") and method == "GET":
                        report_id = unquote(report_path.removesuffix("/download").rstrip("/"))
                        self.serve_report_file(conn, user, report_id)
                        return
                    report_id = unquote(report_path)
                    if method == "PATCH":
                        self.update_report(conn, user, report_id)
                        return
                    if method == "DELETE":
                        self.delete_report(conn, user, report_id)
                        return
                if path == "/api/requests" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.send_json(requests_snapshot(conn))
                    return
                if path == "/api/requests" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_request(conn, user)
                    return
                if path.startswith("/api/requests/"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    request_id = unquote(path.removeprefix("/api/requests/"))
                    if method == "PATCH":
                        self.update_request(conn, user, request_id)
                        return
                if path == "/api/calendar" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.send_json(calendar_snapshot(conn, user))
                    return
                if path == "/api/calendar" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_calendar_event(conn, user)
                    return
                if path.startswith("/api/calendar/"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    tail = path.removeprefix("/api/calendar/")
                    parts = [unquote(part) for part in tail.split("/") if part]
                    if len(parts) == 2 and method == "POST" and parts[1] == "rsvp":
                        self.mark_calendar_rsvp(conn, user, parts[0])
                        return
                if path == "/api/knowledge" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.send_json(knowledge_snapshot(conn, user))
                    return
                if path == "/api/knowledge/articles" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_knowledge_article(conn, user)
                    return
                if path.startswith("/api/knowledge/articles/"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    tail = path.removeprefix("/api/knowledge/articles/")
                    parts = [unquote(part) for part in tail.split("/") if part]
                    if len(parts) == 2 and method == "GET" and parts[1] == "download":
                        self.serve_knowledge_article_file(conn, user, parts[0])
                        return
                if path == "/api/knowledge/handover" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_handover_note(conn, user)
                    return
                if path.startswith("/api/knowledge/handover/"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    tail = path.removeprefix("/api/knowledge/handover/")
                    parts = [unquote(part) for part in tail.split("/") if part]
                    if len(parts) == 2 and method == "POST" and parts[1] == "accept":
                        self.accept_handover_note(conn, user, parts[0])
                        return
                    if len(parts) == 1 and method == "DELETE":
                        self.delete_handover_note(conn, user, parts[0])
                        return
                if path == "/api/kudos" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    params = parse_qs(query)
                    self.send_json(weekly_kudos_snapshot(conn, params.get("weekStart", [""])[0]))
                    return
                if path == "/api/kudos" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_weekly_kudos(conn, user)
                    return
                if path == "/api/polls" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.send_json(quick_polls_snapshot(conn))
                    return
                if path == "/api/polls" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_quick_poll(conn, user)
                    return
                if path.startswith("/api/polls/"):
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    tail = path.removeprefix("/api/polls/")
                    parts = [unquote(part) for part in tail.split("/") if part]
                    if len(parts) == 2 and method == "POST" and parts[1] == "vote":
                        self.vote_quick_poll(conn, user, parts[0])
                        return
                if path == "/api/chat/groups" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.send_json(chat_groups_snapshot(conn, user))
                    return
                if path == "/api/chat/groups" and method == "POST":
                    actor = self.require_admin(conn)
                    if actor:
                        self.create_chat_group(conn, actor)
                    return
                if path == "/api/chat/messages" and method == "GET":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    params = parse_qs(query)
                    self.list_chat_messages(conn, user, params.get("conversationId", [""])[0])
                    return
                if path == "/api/chat/messages" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.create_chat_message(conn, user)
                    return
                if path == "/api/chat/messages/read" and method == "POST":
                    user = self.current_user(conn)
                    if not user:
                        self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                        return
                    self.mark_chat_messages_read(conn, user)
                    return
                if path.startswith("/api/users/"):
                    tail = path.removeprefix("/api/users/")
                    parts = [unquote(part) for part in tail.split("/") if part]
                    if len(parts) == 2 and parts[1] == "password" and method in ("POST", "PATCH"):
                        user = self.current_user(conn)
                        if not user:
                            self.send_json({"error": "Brak aktywnej sesji."}, HTTPStatus.UNAUTHORIZED)
                            return
                        self.change_user_password(conn, user, normalize_login(parts[0]))
                        return
                    if len(parts) == 1:
                        actor = self.require_admin(conn)
                        if not actor:
                            return
                        login = normalize_login(parts[0])
                        if method == "PATCH":
                            self.update_user(conn, actor, login)
                            return
                        if method == "DELETE":
                            self.delete_user(conn, actor, login)
                            return
            self.send_json({"error": "Nie znaleziono endpointu."}, HTTPStatus.NOT_FOUND)
        except json.JSONDecodeError:
            return
        except sqlite3.Error as exc:
            self.send_json({"error": f"Blad bazy danych: {exc}"}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def login(self, conn: sqlite3.Connection) -> None:
        payload = self.read_json()
        login = normalize_login(str(payload.get("login", "")))
        password = str(payload.get("password", ""))
        user = fetch_user(conn, login)
        if not user or not user["active"]:
            self.send_json({"error": "Nie znaleziono aktywnego konta."}, HTTPStatus.UNAUTHORIZED)
            return
        if user["password_hash"] and not verify_password(password, user["password_hash"]):
            self.send_json({"error": "Nieprawidlowe haslo."}, HTTPStatus.UNAUTHORIZED)
            return
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'LOGIN', 'User logged in through LAN backend.')",
            (user["login"],),
        )
        self.send_json(
            {"user": account_payload(user)},
            extra_headers={
                "Set-Cookie": f"{SESSION_COOKIE}={make_session(user['login'])}; Path=/; Max-Age={SESSION_TTL}; HttpOnly; SameSite=Lax"
            },
        )

    def update_presence(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        payload = self.read_json()
        clocked_in = 1 if bool(payload.get("clockedIn")) else 0
        break_active = 1 if clocked_in and bool(payload.get("breakActive")) else 0
        now = iso_from_dt(utc_now())
        started_at = now if clocked_in else None
        existing = conn.execute(
            "SELECT * FROM user_presence WHERE user_login = ?",
            (user["login"],),
        ).fetchone()
        was_clocked = bool(existing and existing["clocked_in"])
        was_break = bool(existing and existing["break_active"])
        if clocked_in and existing and existing["started_at"]:
            started_at = existing["started_at"]

        session = open_time_session(conn, user["login"])
        schedule_sync = None
        if clocked_in:
            session = start_time_session(conn, user["login"], started_at or now)
            if break_active and not session["break_started_at"]:
                conn.execute(
                    "UPDATE time_sessions SET break_started_at = ?, updated_at = ? WHERE id = ?",
                    (now, now, session["id"]),
                )
            elif was_break and not break_active:
                add_break_seconds(conn, session, now)
        elif was_clocked:
            if not session and existing and existing["started_at"]:
                session = start_time_session(conn, user["login"], existing["started_at"])
            if session:
                if was_break or session["break_started_at"]:
                    add_break_seconds(conn, session, now)
                    session = open_time_session(conn, user["login"])
                if session:
                    conn.execute(
                        """
                        UPDATE time_sessions
                        SET ended_at = ?, break_started_at = NULL, updated_at = ?
                        WHERE id = ?
                        """,
                        (now, now, session["id"]),
                    )
                    schedule_sync = sync_completed_session_to_schedule(conn, user["login"], session["started_at"], now)

        conn.execute(
            """
            INSERT INTO user_presence(user_login, clocked_in, break_active, started_at, updated_at)
            VALUES(?, ?, ?, ?, ?)
            ON CONFLICT(user_login) DO UPDATE SET
              clocked_in = excluded.clocked_in,
              break_active = excluded.break_active,
              started_at = excluded.started_at,
              updated_at = excluded.updated_at
            """,
            (user["login"], clocked_in, break_active, started_at, now),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'UPDATE_PRESENCE', ?)",
            (
                user["login"],
                json.dumps(
                    {
                        "state": "break" if break_active else "work" if clocked_in else "out",
                        "schedule": schedule_sync,
                    },
                    ensure_ascii=False,
                ),
            ),
        )
        self.send_json(snapshot(conn))

    def update_work_schedule(self, conn: sqlite3.Connection, actor: sqlite3.Row) -> None:
        payload = self.read_json()
        user_login = normalize_login(str(payload.get("userLogin", "")))
        day_key = str(payload.get("day", "")).strip().lower()
        week_start = normalize_week_start(str(payload.get("weekStart", "")).strip() or None)
        value = str(payload.get("value", "")).strip()
        if day_key not in WORK_DAY_KEYS:
            self.send_json({"error": "Nieznany dzien grafiku."}, HTTPStatus.BAD_REQUEST)
            return
        target = fetch_user(conn, user_login)
        if not target or target["app_role"] == "root" or not target["active"]:
            self.send_json({"error": "Nie znaleziono aktywnego uzytkownika grafiku."}, HTTPStatus.NOT_FOUND)
            return

        if not value:
            conn.execute(
                "DELETE FROM work_schedule_weeks WHERE user_login = ? AND week_start = ? AND day_key = ?",
                (user_login, week_start, day_key),
            )
            conn.execute(
                "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CLEAR_SCHEDULE', ?)",
                (actor["login"], f"{user_login}:{week_start}:{day_key}"),
            )
            self.send_json(time_summary(conn, actor, week_start))
            return

        normalized_value = value.replace("–", "-").replace("—", "-")
        start_time = end_time = note = ""
        match = re.fullmatch(r"\s*([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)\s*", normalized_value)
        if match:
            start_time = f"{int(match.group(1)):02d}:{match.group(2)}"
            end_time = f"{int(match.group(3)):02d}:{match.group(4)}"
            if parse_schedule_minutes(end_time) <= parse_schedule_minutes(start_time):
                self.send_json({"error": "Godzina konca musi byc pozniejsza niz start."}, HTTPStatus.BAD_REQUEST)
                return
        else:
            allowed_notes = {"wolne", "urlop", "l4", "szkolenie"}
            note = normalized_value[:40]
            if note.lower() not in allowed_notes:
                self.send_json({"error": "Wpisz zakres np. 08:00-16:00 albo: wolne, urlop, L4, szkolenie."}, HTTPStatus.BAD_REQUEST)
                return

        now = now_text()
        conn.execute(
            """
            INSERT INTO work_schedule_weeks(user_login, week_start, day_key, start_time, end_time, note, updated_by, updated_at)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_login, week_start, day_key) DO UPDATE SET
              start_time = excluded.start_time,
              end_time = excluded.end_time,
              note = excluded.note,
              updated_by = excluded.updated_by,
              updated_at = excluded.updated_at
            """,
            (user_login, week_start, day_key, start_time or None, end_time or None, note, actor["login"], now),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'UPDATE_SCHEDULE', ?)",
            (actor["login"], f"{user_login}:{week_start}:{day_key}:{value}"),
        )
        self.send_json(time_summary(conn, actor, week_start))

    def create_user(self, conn: sqlite3.Connection, actor: sqlite3.Row) -> None:
        payload = self.read_json()
        name = str(payload.get("name", "")).strip()
        login = normalize_login(str(payload.get("login", "")) or name)
        role = str(payload.get("role", "employee"))
        app_role = "admin" if role == "admin" else "employee"
        team_role = "Administrator" if app_role == "admin" else str(payload.get("teamRole", "")).strip() or "Pracownik"
        password = str(payload.get("password", ""))
        if not name or not login:
            self.send_json({"error": "Podaj imie i login."}, HTTPStatus.BAD_REQUEST)
            return
        if fetch_user(conn, login):
            self.send_json({"error": "Login jest juz zajety."}, HTTPStatus.CONFLICT)
            return
        conn.execute(
            """
            INSERT INTO users (
              login, display_name, password_hash, app_role, team_role, initials,
              active, can_create_users, can_manage_users, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
            """,
            (
                login,
                name,
                hash_password(password) if password else None,
                app_role,
                team_role,
                make_initials(name),
                1 if app_role == "admin" else 0,
                1 if app_role == "admin" else 0,
                now_text(),
                now_text(),
            ),
        )
        if app_role == "admin":
            for permission in ADMIN_PERMISSIONS:
                conn.execute(
                    "INSERT INTO user_permissions(user_login, permission) VALUES(?, ?) "
                    "ON CONFLICT(user_login, permission) DO NOTHING",
                    (login, permission),
                )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_USER', ?)",
            (actor["login"], login),
        )
        self.send_json(snapshot(conn), HTTPStatus.CREATED)

    def update_user(self, conn: sqlite3.Connection, actor: sqlite3.Row, login: str) -> None:
        if login in ("root", actor["login"]):
            self.send_json({"error": "Nie mozna zmienic tego konta z tego miejsca."}, HTTPStatus.FORBIDDEN)
            return
        user = fetch_user(conn, login)
        if not user:
            self.send_json({"error": "Nie znaleziono konta."}, HTTPStatus.NOT_FOUND)
            return
        payload = self.read_json()
        role = str(payload.get("role", user["app_role"]))
        app_role = "admin" if role == "admin" else "employee"
        active = 1 if bool(payload.get("active", bool(user["active"]))) else 0
        team_role = "Administrator" if app_role == "admin" else user["team_role"]
        password_hash = user["password_hash"]
        conn.execute(
            """
            UPDATE users
            SET app_role = ?, team_role = ?, password_hash = ?, active = ?,
                can_create_users = ?, can_manage_users = ?, updated_at = ?
            WHERE login = ?
            """,
            (
                app_role,
                team_role,
                password_hash,
                active,
                1 if app_role == "admin" else 0,
                1 if app_role == "admin" else 0,
                now_text(),
                login,
            ),
        )
        conn.execute("DELETE FROM user_permissions WHERE user_login = ?", (login,))
        if app_role == "admin":
            for permission in ADMIN_PERMISSIONS:
                conn.execute(
                    "INSERT INTO user_permissions(user_login, permission) VALUES(?, ?)",
                    (login, permission),
                )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'UPDATE_USER', ?)",
            (actor["login"], login),
        )
        self.send_json(snapshot(conn))

    def change_user_password(self, conn: sqlite3.Connection, actor: sqlite3.Row, login: str) -> None:
        payload = self.read_json()
        target_login = normalize_login(login)
        target = fetch_user(conn, target_login)
        if not target:
            self.send_json({"error": "Nie znaleziono konta."}, HTTPStatus.NOT_FOUND)
            return
        is_admin = bool(actor["can_manage_users"] or actor["app_role"] in ("root", "admin"))
        is_own_password = target_login == actor["login"]
        if not is_admin and not is_own_password:
            self.send_json({"error": "Mozesz zmienic tylko wlasne haslo."}, HTTPStatus.FORBIDDEN)
            return

        password = str(payload.get("password", "")).strip()
        current_password = str(payload.get("currentPassword", ""))
        if len(password) < 4:
            self.send_json({"error": "Haslo musi miec co najmniej 4 znaki."}, HTTPStatus.BAD_REQUEST)
            return
        if is_own_password and not is_admin and target["password_hash"] and not verify_password(current_password, target["password_hash"]):
            self.send_json({"error": "Aktualne haslo jest nieprawidlowe."}, HTTPStatus.FORBIDDEN)
            return

        conn.execute(
            """
            UPDATE users
            SET password_hash = ?, updated_at = ?
            WHERE login = ?
            """,
            (hash_password(password), now_text(), target_login),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CHANGE_PASSWORD', ?)",
            (actor["login"], target_login),
        )
        self.send_json(
            {
                "ok": True,
                "changedLogin": target_login,
                "user": account_payload(conn.execute("SELECT * FROM users WHERE login = ?", (target_login,)).fetchone()),
                **snapshot(conn),
            }
        )

    def announcement_row(self, conn: sqlite3.Connection, post_id: str) -> sqlite3.Row | None:
        return conn.execute("SELECT * FROM announcements WHERE id = ?", (str(post_id),)).fetchone()

    def announcement_response(self, conn: sqlite3.Connection, user: sqlite3.Row, post_id: str) -> None:
        post = self.announcement_row(conn, post_id)
        if not post:
            self.send_json({"error": "Nie znaleziono ogloszenia."}, HTTPStatus.NOT_FOUND)
            return
        self.send_json({"post": announcement_payload(conn, post, user), **announcements_snapshot(conn, user)})

    def create_announcement(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        content_type = self.headers.get("Content-Type", "")
        upload = None
        if "multipart/form-data" in content_type:
            parsed = self.read_multipart_form()
            if not parsed:
                return
            fields, files = parsed
            title = str(fields.get("title", "")).strip()
            body = str(fields.get("body", "")).strip()
            priority = str(fields.get("priority", "normal"))
            audience = str(fields.get("audience", "all"))
            selected_raw = str(fields.get("recipientLogins", "[]"))
            try:
                selected_logins = json.loads(selected_raw)
            except json.JSONDecodeError:
                selected_logins = [login.strip() for login in selected_raw.split(",") if login.strip()]
            upload = files.get("attachment")
        else:
            payload = self.read_json()
            title = str(payload.get("title", "")).strip()
            body = str(payload.get("body", "")).strip()
            priority = str(payload.get("priority", "normal"))
            audience = str(payload.get("audience", "all"))
            selected_logins = payload.get("recipientLogins", [])
        if priority not in ("normal", "important", "urgent"):
            priority = "normal"
        if not title or not body:
            self.send_json({"error": "Podaj tytul i tresc ogloszenia."}, HTTPStatus.BAD_REQUEST)
            return

        recipients = active_announcement_recipient_logins(conn)
        if audience == "boss":
            admin_rows = conn.execute(
                """
                SELECT login
                FROM users
                WHERE active = 1 AND app_role = 'admin'
                ORDER BY display_name COLLATE NOCASE
                """
            ).fetchall()
            recipients = [row["login"] for row in admin_rows]
        elif audience == "selected" and isinstance(selected_logins, list):
            selected = {normalize_login(str(login)) for login in selected_logins}
            recipients = [login for login in recipients if login in selected]
        if not recipients:
            recipients = active_announcement_recipient_logins(conn)

        post_id = f"ann-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        time_label = time.strftime("%H:%M")
        file_name = ""
        file_mime = ""
        file_size = 0
        file_storage_name = ""
        if upload:
            file_content = upload.get("content") or b""
            file_name = str(upload.get("filename") or "zalacznik").strip() or "zalacznik"
            file_mime = str(upload.get("mime") or mimetypes.guess_type(file_name)[0] or "application/octet-stream")
            file_size = len(file_content)
            file_storage_name = storage_filename(post_id, file_name)
            ANNOUNCEMENT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            (ANNOUNCEMENT_UPLOAD_DIR / file_storage_name).write_bytes(file_content)
        conn.execute(
            """
            INSERT INTO announcements(
              id, title, body, priority, author_login, time_label,
              file_name, file_mime, file_size, file_storage_name,
              created_at
            )
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                post_id,
                title,
                body,
                priority,
                user["login"],
                time_label,
                file_name,
                file_mime,
                file_size,
                file_storage_name,
                now_text(),
            ),
        )
        for login in recipients:
            conn.execute("INSERT INTO announcement_recipients(post_id, user_login) VALUES(?, ?)", (post_id, login))
        if user["login"] in recipients:
            conn.execute(
                """
                INSERT INTO announcement_reads(post_id, reader_login, time_label, read_at)
                VALUES(?, ?, ?, ?)
                """,
                (post_id, user["login"], time_label, now_text()),
            )
            conn.execute(
                """
                INSERT INTO announcement_reactions(post_id, reaction_id, user_login, created_at)
                VALUES(?, 'done', ?, ?)
                """,
                (post_id, user["login"], now_text()),
            )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_ANNOUNCEMENT', ?)",
            (user["login"], post_id),
        )
        response = announcements_snapshot(conn, user)
        response["post"] = announcement_payload(conn, self.announcement_row(conn, post_id), user)
        self.send_json(response, HTTPStatus.CREATED)

    def serve_announcement_file(self, conn: sqlite3.Connection, user: sqlite3.Row, post_id: str) -> None:
        post = self.announcement_row(conn, post_id)
        if not post:
            self.send_json({"error": "Nie znaleziono ogloszenia."}, HTTPStatus.NOT_FOUND)
            return
        storage_name = post["file_storage_name"] if "file_storage_name" in post.keys() else ""
        if not storage_name:
            self.send_json({"error": "Ogloszenie nie ma zalacznika."}, HTTPStatus.NOT_FOUND)
            return
        target = (ANNOUNCEMENT_UPLOAD_DIR / storage_name).resolve()
        try:
            target.relative_to(ANNOUNCEMENT_UPLOAD_DIR.resolve())
        except ValueError:
            self.send_json({"error": "Nieprawidlowa sciezka zalacznika."}, HTTPStatus.FORBIDDEN)
            return
        if not target.exists() or not target.is_file():
            self.send_json({"error": "Plik zalacznika nie istnieje na serwerze."}, HTTPStatus.NOT_FOUND)
            return
        filename = post["file_name"] or f"{post_id}.bin"
        mime = post["file_mime"] or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        raw = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quote(filename)}")
        self.send_header("Cache-Control", "private, max-age=60")
        self.end_headers()
        self.wfile.write(raw)

    def mark_announcement_read(self, conn: sqlite3.Connection, user: sqlite3.Row, post_id: str) -> None:
        if not self.announcement_row(conn, post_id):
            self.send_json({"error": "Nie znaleziono ogloszenia."}, HTTPStatus.NOT_FOUND)
            return
        conn.execute(
            """
            INSERT INTO announcement_reads(post_id, reader_login, time_label, read_at)
            VALUES(?, ?, ?, ?)
            ON CONFLICT(post_id, reader_login) DO UPDATE
              SET time_label = excluded.time_label, read_at = excluded.read_at
            """,
            (post_id, user["login"], time.strftime("%H:%M"), now_text()),
        )
        self.announcement_response(conn, user, post_id)

    def create_announcement_comment(self, conn: sqlite3.Connection, user: sqlite3.Row, post_id: str) -> None:
        if not self.announcement_row(conn, post_id):
            self.send_json({"error": "Nie znaleziono ogloszenia."}, HTTPStatus.NOT_FOUND)
            return
        payload = self.read_json()
        body = str(payload.get("body", "")).strip()
        if not body:
            self.send_json({"error": "Komentarz nie moze byc pusty."}, HTTPStatus.BAD_REQUEST)
            return
        comment_id = f"comment-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        conn.execute(
            """
            INSERT INTO announcement_comments(id, post_id, author_login, body, time_label, created_at)
            VALUES(?, ?, ?, ?, ?, ?)
            """,
            (comment_id, post_id, user["login"], body, time.strftime("%H:%M"), now_text()),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_ANNOUNCEMENT_COMMENT', ?)",
            (user["login"], post_id),
        )
        self.announcement_response(conn, user, post_id)

    def toggle_announcement_reaction(self, conn: sqlite3.Connection, user: sqlite3.Row, post_id: str) -> None:
        if not self.announcement_row(conn, post_id):
            self.send_json({"error": "Nie znaleziono ogloszenia."}, HTTPStatus.NOT_FOUND)
            return
        payload = self.read_json()
        reaction_id = str(payload.get("reactionId", ""))
        if reaction_id not in ANNOUNCEMENT_REACTIONS:
            self.send_json({"error": "Nieznana reakcja."}, HTTPStatus.BAD_REQUEST)
            return
        existing = conn.execute(
            """
            SELECT 1
            FROM announcement_reactions
            WHERE post_id = ? AND reaction_id = ? AND user_login = ?
            """,
            (post_id, reaction_id, user["login"]),
        ).fetchone()
        if existing:
            conn.execute(
                "DELETE FROM announcement_reactions WHERE post_id = ? AND reaction_id = ? AND user_login = ?",
                (post_id, reaction_id, user["login"]),
            )
        else:
            conn.execute(
                """
                INSERT INTO announcement_reactions(post_id, reaction_id, user_login, created_at)
                VALUES(?, ?, ?, ?)
                """,
                (post_id, reaction_id, user["login"], now_text()),
            )
        self.announcement_response(conn, user, post_id)

    def create_task(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        payload = self.read_json()
        title = str(payload.get("title", "")).strip()
        description = str(payload.get("description", "")).strip() or "Brak dodatkowego opisu."
        owner_login = normalize_login(str(payload.get("ownerLogin", "")))
        due = str(payload.get("due", "")).strip() or "dzi\u015b"
        priority = str(payload.get("priority", "normal"))
        column = str(payload.get("column", "todo"))
        source = str(payload.get("source", "Dodane recznie")).strip() or "Dodane recznie"
        if not title:
            self.send_json({"error": "Podaj tytul zadania."}, HTTPStatus.BAD_REQUEST)
            return
        if priority not in ("normal", "important", "urgent"):
            priority = "normal"
        if column not in TASK_COLUMNS:
            column = "todo"
        owner = fetch_user(conn, owner_login) if owner_login else None
        if not owner or not owner["active"] or owner["app_role"] == "root":
            owner_login = user["login"]
            owner_name = user["display_name"]
        else:
            owner_name = owner["display_name"]
        next_position = conn.execute(
            "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM company_tasks WHERE column_key = ?",
            (column,),
        ).fetchone()["next_position"]
        task_id = f"task-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        conn.execute(
            """
            INSERT INTO company_tasks (
              id, title, description, owner_login, owner_name, due, priority,
              column_key, source, position, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                task_id,
                title,
                description,
                owner_login,
                owner_name,
                due,
                priority,
                column,
                source,
                next_position,
                user["login"],
                now_text(),
                now_text(),
            ),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_TASK', ?)",
            (user["login"], task_id),
        )
        response = tasks_snapshot(conn)
        response["task"] = task_payload(conn.execute("SELECT * FROM company_tasks WHERE id = ?", (task_id,)).fetchone())
        self.send_json(response, HTTPStatus.CREATED)

    def update_task(self, conn: sqlite3.Connection, user: sqlite3.Row, task_id: str) -> None:
        task = conn.execute("SELECT * FROM company_tasks WHERE id = ?", (task_id,)).fetchone()
        if not task:
            self.send_json({"error": "Nie znaleziono zadania."}, HTTPStatus.NOT_FOUND)
            return
        payload = self.read_json()
        next_column = str(payload.get("column", task["column_key"]))
        if next_column not in TASK_COLUMNS:
            next_column = task["column_key"]
        updates = {
            "title": str(payload.get("title", task["title"])).strip() or task["title"],
            "description": str(payload.get("description", task["description"])).strip() or task["description"],
            "due": str(payload.get("due", task["due"])).strip() or task["due"],
            "priority": str(payload.get("priority", task["priority"])),
            "column": next_column,
        }
        if updates["priority"] not in ("normal", "important", "urgent"):
            updates["priority"] = task["priority"]
        owner_login = normalize_login(str(payload.get("ownerLogin", task["owner_login"] or "")))
        owner = fetch_user(conn, owner_login) if owner_login else None
        owner_name = task["owner_name"]
        if owner and owner["active"] and owner["app_role"] != "root":
            owner_name = owner["display_name"]
        else:
            owner_login = task["owner_login"]
        position = task["position"]
        if next_column != task["column_key"]:
            position = conn.execute(
                "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM company_tasks WHERE column_key = ?",
                (next_column,),
            ).fetchone()["next_position"]
        conn.execute(
            """
            UPDATE company_tasks
            SET title = ?, description = ?, owner_login = ?, owner_name = ?, due = ?,
                priority = ?, column_key = ?, position = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                updates["title"],
                updates["description"],
                owner_login,
                owner_name,
                updates["due"],
                updates["priority"],
                next_column,
                position,
                now_text(),
                task_id,
            ),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'UPDATE_TASK', ?)",
            (user["login"], task_id),
        )
        response = tasks_snapshot(conn)
        response["task"] = task_payload(conn.execute("SELECT * FROM company_tasks WHERE id = ?", (task_id,)).fetchone())
        self.send_json(response)

    def delete_task(self, conn: sqlite3.Connection, user: sqlite3.Row, task_id: str) -> None:
        task = conn.execute("SELECT title FROM company_tasks WHERE id = ?", (task_id,)).fetchone()
        if not task:
            self.send_json({"error": "Nie znaleziono zadania."}, HTTPStatus.NOT_FOUND)
            return
        conn.execute("DELETE FROM company_tasks WHERE id = ?", (task_id,))
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'DELETE_TASK', ?)",
            (user["login"], task_id),
        )
        response = tasks_snapshot(conn)
        response["deletedTask"] = {"id": task_id, "title": task["title"]}
        self.send_json(response)

    def create_report(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        content_type = self.headers.get("Content-Type", "")
        upload = None
        if "multipart/form-data" in content_type:
            parsed = self.read_multipart_form()
            if not parsed:
                return
            fields, files = parsed
            category = str(fields.get("category", "")).strip() or "Sprawa organizacyjna"
            detail = str(fields.get("detail", "")).strip()
            title = str(fields.get("title", "")).strip() or category
            upload = files.get("attachment")
        else:
            payload = self.read_json()
            category = str(payload.get("category", "")).strip() or "Sprawa organizacyjna"
            detail = str(payload.get("detail", "")).strip()
            title = str(payload.get("title", "")).strip() or category
        if not detail:
            self.send_json({"error": "Podaj opis zgloszenia."}, HTTPStatus.BAD_REQUEST)
            return
        report_id = f"report-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        file_name = file_mime = file_storage_name = None
        file_size = 0
        if upload and upload.get("content"):
            file_content = upload["content"]
            file_name = clean_upload_filename(str(upload.get("filename") or "zalacznik"))
            file_mime = str(upload.get("mime") or mimetypes.guess_type(file_name)[0] or "application/octet-stream")
            file_size = len(file_content)
            file_storage_name = storage_filename(report_id, file_name)
            REPORT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            (REPORT_UPLOAD_DIR / file_storage_name).write_bytes(file_content)
        conn.execute(
            """
            INSERT INTO internal_reports (
              id, category, title, detail, status, owner_login, owner_name,
              file_name, file_mime, file_size, file_storage_name,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'Nowe', ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                report_id,
                category,
                title,
                detail,
                user["login"],
                user["display_name"],
                file_name,
                file_mime,
                file_size,
                file_storage_name,
                now_text(),
                now_text(),
            ),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_REPORT', ?)",
            (user["login"], report_id),
        )
        response = reports_snapshot(conn)
        response["report"] = report_payload(conn.execute("SELECT * FROM internal_reports WHERE id = ?", (report_id,)).fetchone())
        self.send_json(response, HTTPStatus.CREATED)

    def update_report(self, conn: sqlite3.Connection, user: sqlite3.Row, report_id: str) -> None:
        report = conn.execute("SELECT * FROM internal_reports WHERE id = ?", (report_id,)).fetchone()
        if not report:
            self.send_json({"error": "Nie znaleziono zgloszenia."}, HTTPStatus.NOT_FOUND)
            return
        payload = self.read_json()
        status = normalize_report_status(str(payload.get("status", report["status"])))
        if not status:
            self.send_json({"error": "Nieznany status zgloszenia."}, HTTPStatus.BAD_REQUEST)
            return
        conn.execute(
            """
            UPDATE internal_reports
            SET status = ?, updated_at = ?
            WHERE id = ?
            """,
            (status, now_text(), report_id),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'UPDATE_REPORT', ?)",
            (user["login"], f"{report_id}: {status}"),
        )
        response = reports_snapshot(conn)
        response["report"] = report_payload(conn.execute("SELECT * FROM internal_reports WHERE id = ?", (report_id,)).fetchone())
        self.send_json(response)

    def delete_report(self, conn: sqlite3.Connection, user: sqlite3.Row, report_id: str) -> None:
        report = conn.execute("SELECT * FROM internal_reports WHERE id = ?", (report_id,)).fetchone()
        if not report:
            self.send_json({"error": "Nie znaleziono zgloszenia."}, HTTPStatus.NOT_FOUND)
            return
        storage_name = report["file_storage_name"] if "file_storage_name" in report.keys() else ""
        conn.execute("DELETE FROM internal_reports WHERE id = ?", (report_id,))
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'DELETE_REPORT', ?)",
            (user["login"], report_id),
        )
        if storage_name:
            target = (REPORT_UPLOAD_DIR / storage_name).resolve()
            try:
                target.relative_to(REPORT_UPLOAD_DIR.resolve())
            except ValueError:
                target = None
            if target and target.exists() and target.is_file():
                try:
                    target.unlink()
                except OSError:
                    pass
        response = reports_snapshot(conn)
        response["deletedReport"] = {"id": report_id, "title": report["title"]}
        self.send_json(response)

    def serve_report_file(self, conn: sqlite3.Connection, user: sqlite3.Row, report_id: str) -> None:
        report = conn.execute("SELECT * FROM internal_reports WHERE id = ?", (report_id,)).fetchone()
        if not report:
            self.send_json({"error": "Nie znaleziono zgloszenia."}, HTTPStatus.NOT_FOUND)
            return
        storage_name = report["file_storage_name"] if "file_storage_name" in report.keys() else ""
        if not storage_name:
            self.send_json({"error": "Zgloszenie nie ma zalacznika."}, HTTPStatus.NOT_FOUND)
            return
        target = (REPORT_UPLOAD_DIR / storage_name).resolve()
        try:
            target.relative_to(REPORT_UPLOAD_DIR.resolve())
        except ValueError:
            self.send_json({"error": "Nieprawidlowa sciezka zalacznika."}, HTTPStatus.FORBIDDEN)
            return
        if not target.exists() or not target.is_file():
            self.send_json({"error": "Plik zalacznika nie istnieje na serwerze."}, HTTPStatus.NOT_FOUND)
            return
        filename = report["file_name"] or f"{report_id}.bin"
        mime = report["file_mime"] or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        raw = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quote(filename)}")
        self.send_header("Cache-Control", "private, max-age=60")
        self.end_headers()
        self.wfile.write(raw)

    def create_request(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        payload = self.read_json()
        kind = str(payload.get("kind", "leave"))
        if kind not in REQUEST_KINDS:
            kind = "leave"
        title = str(payload.get("title", "")).strip()
        detail = str(payload.get("detail", "")).strip()
        if not title:
            title = f"{'Urlop' if kind == 'leave' else 'Korekta czasu'}: {user['display_name']}"
        if not detail:
            self.send_json({"error": "Podaj szczegoly wniosku."}, HTTPStatus.BAD_REQUEST)
            return
        status = "Do sprawdzenia" if kind == "correction" else "Oczekuje"
        request_id = f"request-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        conn.execute(
            """
            INSERT INTO employee_requests (
              id, title, detail, status, kind, owner_login, owner_name, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (request_id, title, detail, status, kind, user["login"], user["display_name"], now_text(), now_text()),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_REQUEST', ?)",
            (user["login"], request_id),
        )
        response = requests_snapshot(conn)
        response["request"] = request_payload(
            conn.execute("SELECT * FROM employee_requests WHERE id = ?", (request_id,)).fetchone()
        )
        self.send_json(response, HTTPStatus.CREATED)

    def update_request(self, conn: sqlite3.Connection, user: sqlite3.Row, request_id: str) -> None:
        if user["app_role"] not in ("root", "admin"):
            self.send_json({"error": "Status wniosku moze zmienic tylko administrator."}, HTTPStatus.FORBIDDEN)
            return
        request = conn.execute("SELECT * FROM employee_requests WHERE id = ?", (request_id,)).fetchone()
        if not request:
            self.send_json({"error": "Nie znaleziono wniosku."}, HTTPStatus.NOT_FOUND)
            return
        payload = self.read_json()
        status = str(payload.get("status", request["status"])).strip()
        if status not in REQUEST_STATUSES:
            self.send_json({"error": "Nieznany status wniosku."}, HTTPStatus.BAD_REQUEST)
            return
        conn.execute(
            """
            UPDATE employee_requests
            SET status = ?, updated_at = ?
            WHERE id = ?
            """,
            (status, now_text(), request_id),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'UPDATE_REQUEST', ?)",
            (user["login"], f"{request_id}: {status}"),
        )
        response = requests_snapshot(conn)
        response["request"] = request_payload(
            conn.execute("SELECT * FROM employee_requests WHERE id = ?", (request_id,)).fetchone()
        )
        self.send_json(response)

    def create_calendar_event(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        payload = self.read_json()
        title = str(payload.get("title", "")).strip() or "Wydarzenie"
        try:
            day = int(payload.get("day", 27))
        except (TypeError, ValueError):
            day = 27
        day = min(31, max(1, day))
        date_label = str(payload.get("date", "")).strip() or f"{day:02d}.07"
        time_label = str(payload.get("time", "")).strip() or "10:00"
        event_id = f"event-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        conn.execute(
            """
            INSERT INTO calendar_events(id, day, title, date_label, time_label, created_by, created_at, updated_at)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (event_id, day, title, date_label, time_label, user["login"], now_text(), now_text()),
        )
        conn.execute(
            """
            INSERT INTO calendar_rsvps(event_id, user_login, status, created_at)
            VALUES(?, ?, 'Bede', ?)
            ON CONFLICT(event_id, user_login) DO UPDATE
              SET status = excluded.status, created_at = excluded.created_at
            """,
            (event_id, user["login"], now_text()),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_CALENDAR_EVENT', ?)",
            (user["login"], event_id),
        )
        response = calendar_snapshot(conn, user)
        response["event"] = calendar_event_payload(
            conn,
            conn.execute("SELECT * FROM calendar_events WHERE id = ?", (event_id,)).fetchone(),
            user,
        )
        self.send_json(response, HTTPStatus.CREATED)

    def mark_calendar_rsvp(self, conn: sqlite3.Connection, user: sqlite3.Row, event_id: str) -> None:
        event = conn.execute("SELECT * FROM calendar_events WHERE id = ?", (event_id,)).fetchone()
        if not event:
            self.send_json({"error": "Nie znaleziono wydarzenia."}, HTTPStatus.NOT_FOUND)
            return
        conn.execute(
            """
            INSERT INTO calendar_rsvps(event_id, user_login, status, created_at)
            VALUES(?, ?, 'Bede', ?)
            ON CONFLICT(event_id, user_login) DO UPDATE
              SET status = excluded.status, created_at = excluded.created_at
            """,
            (event_id, user["login"], now_text()),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CALENDAR_RSVP', ?)",
            (user["login"], event_id),
        )
        response = calendar_snapshot(conn, user)
        response["event"] = calendar_event_payload(conn, event, user)
        self.send_json(response)

    def create_knowledge_article(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self.read_json()
            self.send_json({"error": "Dodaj prawdziwy plik dokumentu."}, HTTPStatus.BAD_REQUEST)
            return

        parsed = self.read_multipart_form()
        if not parsed:
            return
        fields, files = parsed
        upload = files.get("document")
        title = str(fields.get("title", "")).strip()
        detail = str(fields.get("detail", "")).strip()
        if not detail:
            self.send_json({"error": "Dodaj opis dokumentu."}, HTTPStatus.BAD_REQUEST)
            return
        if not upload or not upload.get("content"):
            self.send_json({"error": "Wybierz plik dokumentu."}, HTTPStatus.BAD_REQUEST)
            return
        file_content = upload["content"]
        if not isinstance(file_content, bytes):
            self.send_json({"error": "Nieprawidlowy plik dokumentu."}, HTTPStatus.BAD_REQUEST)
            return
        file_name = clean_upload_filename(str(upload.get("filename") or "dokument"))
        file_mime = str(upload.get("mime") or mimetypes.guess_type(file_name)[0] or "application/octet-stream")
        if not title:
            title = Path(file_name).stem or file_name
        article_type = str(fields.get("type", "")).strip().upper()[:12] or knowledge_type_from_file(file_mime, file_name)
        article_id = f"kb-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        stored_name = storage_filename(article_id, file_name)
        KNOWLEDGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        (KNOWLEDGE_UPLOAD_DIR / stored_name).write_bytes(file_content)
        conn.execute(
            """
            INSERT INTO knowledge_articles(
              id, type, title, detail, file_name, file_mime, file_size, file_storage_name, created_by, created_at
            )
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                article_id,
                article_type,
                title,
                detail,
                file_name,
                file_mime,
                len(file_content),
                stored_name,
                user["login"],
                now_text(),
            ),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_KNOWLEDGE_ARTICLE', ?)",
            (user["login"], article_id),
        )
        response = knowledge_snapshot(conn, user)
        response["article"] = knowledge_article_payload(
            conn.execute("SELECT * FROM knowledge_articles WHERE id = ?", (article_id,)).fetchone()
        )
        self.send_json(response, HTTPStatus.CREATED)

    def serve_knowledge_article_file(self, conn: sqlite3.Connection, user: sqlite3.Row, article_id: str) -> None:
        article = conn.execute("SELECT * FROM knowledge_articles WHERE id = ?", (article_id,)).fetchone()
        if not article:
            self.send_json({"error": "Nie znaleziono dokumentu."}, HTTPStatus.NOT_FOUND)
            return
        storage_name = article["file_storage_name"]
        if not storage_name:
            self.send_json({"error": "Ten wpis nie ma przypisanego pliku."}, HTTPStatus.NOT_FOUND)
            return
        target = (KNOWLEDGE_UPLOAD_DIR / storage_name).resolve()
        try:
            target.relative_to(KNOWLEDGE_UPLOAD_DIR.resolve())
        except ValueError:
            self.send_json({"error": "Nieprawidlowy plik dokumentu."}, HTTPStatus.FORBIDDEN)
            return
        if not target.exists() or not target.is_file():
            self.send_json({"error": "Plik dokumentu nie istnieje na serwerze."}, HTTPStatus.NOT_FOUND)
            return
        filename = article["file_name"] or f"{article_id}.bin"
        raw = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", article["file_mime"] or mimetypes.guess_type(filename)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quote(filename)}")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def create_handover_note(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        payload = self.read_json()
        text = str(payload.get("text", "")).strip()
        if not text:
            self.send_json({"error": "Notatka nie moze byc pusta."}, HTTPStatus.BAD_REQUEST)
            return
        note_id = f"handover-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        conn.execute(
            """
            INSERT INTO handover_notes(id, author_login, author_name, text, time_label, created_at)
            VALUES(?, ?, ?, ?, ?, ?)
            """,
            (note_id, user["login"], user["display_name"], text, time.strftime("%H:%M"), now_text()),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_HANDOVER_NOTE', ?)",
            (user["login"], note_id),
        )
        response = knowledge_snapshot(conn, user)
        response["note"] = handover_note_payload(
            conn,
            conn.execute("SELECT * FROM handover_notes WHERE id = ?", (note_id,)).fetchone(),
            user,
        )
        self.send_json(response, HTTPStatus.CREATED)

    def accept_handover_note(self, conn: sqlite3.Connection, user: sqlite3.Row, note_id: str) -> None:
        note = conn.execute("SELECT * FROM handover_notes WHERE id = ?", (note_id,)).fetchone()
        if not note:
            self.send_json({"error": "Nie znaleziono notatki."}, HTTPStatus.NOT_FOUND)
            return
        conn.execute(
            """
            INSERT INTO handover_accepts(note_id, user_login, accepted_at)
            VALUES(?, ?, ?)
            ON CONFLICT(note_id, user_login) DO UPDATE SET accepted_at = excluded.accepted_at
            """,
            (note_id, user["login"], now_text()),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'ACCEPT_HANDOVER_NOTE', ?)",
            (user["login"], note_id),
        )
        response = knowledge_snapshot(conn, user)
        response["note"] = handover_note_payload(conn, note, user)
        self.send_json(response)

    def delete_handover_note(self, conn: sqlite3.Connection, user: sqlite3.Row, note_id: str) -> None:
        note = conn.execute("SELECT * FROM handover_notes WHERE id = ?", (note_id,)).fetchone()
        if not note:
            self.send_json({"error": "Nie znaleziono notatki."}, HTTPStatus.NOT_FOUND)
            return
        is_admin = user["app_role"] in ("root", "admin")
        is_author = note["author_login"] == user["login"]
        if not is_admin and not is_author:
            self.send_json({"error": "Mozesz usunac tylko wlasna notatke."}, HTTPStatus.FORBIDDEN)
            return
        conn.execute("DELETE FROM handover_notes WHERE id = ?", (note_id,))
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'DELETE_HANDOVER_NOTE', ?)",
            (user["login"], note_id),
        )
        self.send_json(knowledge_snapshot(conn, user))

    def create_weekly_kudos(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        payload = self.read_json()
        recipient_login = normalize_login(str(payload.get("recipientLogin", "")).strip())
        reason = str(payload.get("reason", "")).strip()
        week_start = normalize_week_start(str(payload.get("weekStart", "")).strip() or None)
        if not recipient_login:
            self.send_json({"error": "Wybierz osobe do wyroznienia."}, HTTPStatus.BAD_REQUEST)
            return
        if not reason:
            self.send_json({"error": "Dodaj opis wyroznienia."}, HTTPStatus.BAD_REQUEST)
            return
        if len(reason) > 500:
            self.send_json({"error": "Opis wyroznienia jest za dlugi."}, HTTPStatus.BAD_REQUEST)
            return
        recipient = conn.execute(
            """
            SELECT *
            FROM users
            WHERE login = ? AND active = 1 AND app_role != 'root'
            """,
            (recipient_login,),
        ).fetchone()
        if not recipient:
            self.send_json({"error": "Nie znaleziono aktywnego uzytkownika."}, HTTPStatus.NOT_FOUND)
            return
        kudos_id = f"kudos-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        conn.execute(
            """
            INSERT INTO weekly_kudos(id, week_start, recipient_login, recipient_name, reason, created_by, created_at)
            VALUES(?, ?, ?, ?, ?, ?, ?)
            """,
            (kudos_id, week_start, recipient["login"], recipient["display_name"], reason, user["login"], now_text()),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_WEEKLY_KUDOS', ?)",
            (user["login"], kudos_id),
        )
        response = weekly_kudos_snapshot(conn, week_start)
        response["entry"] = next((entry for entry in response["kudos"] if entry["id"] == kudos_id), None)
        self.send_json(response, HTTPStatus.CREATED)

    def create_quick_poll(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        payload = self.read_json()
        question = str(payload.get("question", "")).strip()
        raw_options = payload.get("options", [])
        if not isinstance(raw_options, list):
            raw_options = []
        options = [str(option).strip() for option in raw_options if str(option).strip()][:4]
        normalized_options = {normalize_login(option) for option in options}
        if not question:
            self.send_json({"error": "Podaj pytanie ankiety."}, HTTPStatus.BAD_REQUEST)
            return
        if len(options) < 2 or len(normalized_options) < 2:
            self.send_json({"error": "Ankieta wymaga co najmniej dwoch roznych odpowiedzi."}, HTTPStatus.BAD_REQUEST)
            return
        poll_id = f"poll-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        conn.execute(
            """
            INSERT INTO quick_polls(id, question, options_json, created_by, created_at)
            VALUES(?, ?, ?, ?, ?)
            """,
            (poll_id, question, json.dumps(options, ensure_ascii=False), user["login"], now_text()),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_POLL', ?)",
            (user["login"], poll_id),
        )
        response = quick_polls_snapshot(conn)
        response["poll"] = quick_poll_payload(
            conn,
            conn.execute("SELECT * FROM quick_polls WHERE id = ?", (poll_id,)).fetchone(),
        )
        self.send_json(response, HTTPStatus.CREATED)

    def vote_quick_poll(self, conn: sqlite3.Connection, user: sqlite3.Row, poll_id: str) -> None:
        poll = conn.execute("SELECT * FROM quick_polls WHERE id = ?", (poll_id,)).fetchone()
        if not poll:
            self.send_json({"error": "Nie znaleziono ankiety."}, HTTPStatus.NOT_FOUND)
            return
        payload = self.read_json()
        try:
            option_index = int(payload.get("optionIndex", -1))
        except (TypeError, ValueError):
            option_index = -1
        try:
            options = json.loads(poll["options_json"] or "[]")
        except json.JSONDecodeError:
            options = []
        if not isinstance(options, list):
            options = []
        options = [str(option).strip() for option in options if str(option).strip()]
        if option_index < 0 or option_index >= len(options):
            self.send_json({"error": "Nieprawidlowa odpowiedz ankiety."}, HTTPStatus.BAD_REQUEST)
            return
        conn.execute(
            """
            INSERT INTO quick_poll_votes(poll_id, user_login, option_index, voted_at)
            VALUES(?, ?, ?, ?)
            ON CONFLICT(poll_id, user_login) DO UPDATE SET
              option_index = excluded.option_index,
              voted_at = excluded.voted_at
            """,
            (poll_id, user["login"], option_index, now_text()),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'VOTE_POLL', ?)",
            (user["login"], poll_id),
        )
        response = quick_polls_snapshot(conn)
        response["poll"] = quick_poll_payload(conn, poll)
        self.send_json(response)

    def create_chat_group(self, conn: sqlite3.Connection, actor: sqlite3.Row) -> None:
        payload = self.read_json()
        title = str(payload.get("title", "")).strip()
        member_logins = payload.get("memberLogins", [])
        if not title:
            self.send_json({"error": "Podaj nazwe grupy."}, HTTPStatus.BAD_REQUEST)
            return
        if not isinstance(member_logins, list):
            self.send_json({"error": "Lista czlonkow musi byc tablica loginow."}, HTTPStatus.BAD_REQUEST)
            return
        normalized = []
        for login in member_logins:
            login = normalize_login(str(login))
            if login and login not in normalized:
                normalized.append(login)
        if actor["login"] != "root" and actor["login"] not in normalized:
            normalized.append(actor["login"])
        rows = conn.execute(
            "SELECT login FROM users WHERE active = 1 AND app_role != 'root' AND login IN (%s)"
            % ",".join("?" for _ in normalized),
            normalized,
        ).fetchall() if normalized else []
        valid_logins = [row["login"] for row in rows]
        if not valid_logins:
            self.send_json({"error": "Wybierz co najmniej jednego aktywnego uzytkownika."}, HTTPStatus.BAD_REQUEST)
            return
        group_id = f"group-{int(time.time())}-{secrets.token_hex(4)}"
        conn.execute(
            "INSERT INTO chat_groups(id, title, created_by, created_at) VALUES(?, ?, ?, ?)",
            (group_id, title, actor["login"], now_text()),
        )
        for login in valid_logins:
            conn.execute("INSERT INTO chat_group_members(group_id, user_login) VALUES(?, ?)", (group_id, login))
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_CHAT_GROUP', ?)",
            (actor["login"], f"{group_id}: {title}"),
        )
        created = conn.execute("SELECT * FROM chat_groups WHERE id = ?", (group_id,)).fetchone()
        response = chat_groups_snapshot(conn, actor)
        response["createdGroup"] = chat_group_payload(conn, created)
        self.send_json(response, HTTPStatus.CREATED)

    def list_chat_messages(self, conn: sqlite3.Connection, user: sqlite3.Row, conversation_id: str) -> None:
        conversation_id = str(conversation_id or "").strip()
        if not can_access_conversation(conn, user, conversation_id):
            self.send_json({"error": "Brak dostepu do tej rozmowy."}, HTTPStatus.FORBIDDEN)
            return
        rows = conn.execute(
            """
            SELECT *
            FROM chat_messages
            WHERE conversation_id = ?
            ORDER BY created_at, id
            """,
            (conversation_id,),
        ).fetchall()
        message_ids = [row["id"] for row in rows]
        receipts_by_message = {message_id: [] for message_id in message_ids}
        if message_ids:
            placeholders = ",".join("?" for _ in message_ids)
            receipt_rows = conn.execute(
                f"""
                SELECT message_id, reader_login, read_at
                FROM chat_message_reads
                WHERE message_id IN ({placeholders})
                ORDER BY read_at, reader_login COLLATE NOCASE
                """,
                message_ids,
            ).fetchall()
            for receipt in receipt_rows:
                receipts_by_message.setdefault(receipt["message_id"], []).append(
                    {"login": receipt["reader_login"], "readAt": receipt["read_at"]}
                )
        self.send_json({"messages": [chat_message_payload(row, receipts_by_message.get(row["id"], [])) for row in rows]})

    def create_chat_message(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        payload = self.read_json()
        conversation_id = str(payload.get("conversationId", "")).strip()
        body = str(payload.get("body", "")).strip() or "Wyslano zalacznik."
        attachments = payload.get("attachments", [])
        if not can_access_conversation(conn, user, conversation_id):
            self.send_json({"error": "Brak dostepu do tej rozmowy."}, HTTPStatus.FORBIDDEN)
            return
        if not isinstance(attachments, list):
            attachments = []
        clean_attachments = []
        for attachment in attachments[:8]:
            if not isinstance(attachment, dict):
                continue
            clean_attachments.append(
                {
                    "name": str(attachment.get("name", ""))[:180],
                    "sizeLabel": str(attachment.get("sizeLabel", ""))[:40],
                    "type": str(attachment.get("type", ""))[:120],
                    "icon": str(attachment.get("icon", "PLIK"))[:16],
                    "isImage": bool(attachment.get("isImage")),
                }
            )
        message_id = f"msg-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
        conn.execute(
            """
            INSERT INTO chat_messages (
              id, conversation_id, author_login, body, attachments_json, time_label, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                message_id,
                conversation_id,
                user["login"],
                body,
                json.dumps(clean_attachments, ensure_ascii=False),
                time.strftime("%H:%M"),
                now_text(),
            ),
        )
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'CREATE_CHAT_MESSAGE', ?)",
            (user["login"], conversation_id),
        )
        row = conn.execute("SELECT * FROM chat_messages WHERE id = ?", (message_id,)).fetchone()
        self.send_json({"message": chat_message_payload(row)}, HTTPStatus.CREATED)

    def mark_chat_messages_read(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        payload = self.read_json()
        conversation_id = str(payload.get("conversationId", "")).strip()
        if not can_access_conversation(conn, user, conversation_id):
            self.send_json({"error": "Brak dostepu do tej rozmowy."}, HTTPStatus.FORBIDDEN)
            return
        rows = conn.execute(
            """
            SELECT id
            FROM chat_messages
            WHERE conversation_id = ? AND author_login <> ?
            """,
            (conversation_id, user["login"]),
        ).fetchall()
        read_at = now_text()
        read_ids = []
        for row in rows:
            conn.execute(
                """
                INSERT INTO chat_message_reads(message_id, reader_login, read_at)
                VALUES(?, ?, ?)
                ON CONFLICT(message_id, reader_login) DO UPDATE SET read_at = excluded.read_at
                """,
                (row["id"], user["login"], read_at),
            )
            read_ids.append(row["id"])
        self.send_json({"ok": True, "readMessageIds": read_ids})

    def delete_user(self, conn: sqlite3.Connection, actor: sqlite3.Row, login: str) -> None:
        if login in ("root", actor["login"]):
            self.send_json({"error": "To konto jest chronione przed usunieciem."}, HTTPStatus.FORBIDDEN)
            return
        if not fetch_user(conn, login):
            self.send_json({"error": "Nie znaleziono konta."}, HTTPStatus.NOT_FOUND)
            return
        conn.execute("DELETE FROM users WHERE login = ?", (login,))
        conn.execute(
            "INSERT INTO audit_log(actor_login, action, details) VALUES(?, 'DELETE_USER', ?)",
            (actor["login"], login),
        )
        self.send_json(snapshot(conn))

    def serve_static(self, path: str) -> None:
        requested = "index.html" if path in ("", "/") else unquote(path).lstrip("/")
        if requested.startswith("backend/"):
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        target = (APP_DIR / requested).resolve()
        try:
            target.relative_to(APP_DIR)
        except ValueError:
            self.send_error(HTTPStatus.FORBIDDEN)
            return
        if not target.exists() or not target.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        raw = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-cache" if target.name in {"index.html", "sw.js"} else "public, max-age=60")
        self.end_headers()
        self.wfile.write(raw)


def main() -> None:
    parser = argparse.ArgumentParser(description="Backend LAN dla Panelu Firmowego PRO-KOM.")
    parser.add_argument("--host", default=os.environ.get("PROKOM_HOST", "0.0.0.0"))
    parser.add_argument("--port", default=int(os.environ.get("PORT") or os.environ.get("PROKOM_PORT", "4173")), type=int)
    args = parser.parse_args()
    initialize_database()
    server = ThreadingHTTPServer((args.host, args.port), ProkomHandler)
    print(f"PRO-KOM backend: http://{args.host}:{args.port}")
    print(f"Baza danych: {DB_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nZatrzymano backend.")


if __name__ == "__main__":
    main()
