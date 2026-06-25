"""SQLite persistence: users, conversations, messages, documents, agent
presets, and message events — all scoped per user.

This is a separate store from ChromaDB — ChromaDB only holds vector
embeddings (documents + memories, also per-user via separate collections);
this holds the structured, relational data (who said what, when, which
files were uploaded, who owns what).
"""
import sqlite3
import uuid
import datetime
import json

from config import DB_PATH


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT 'New chat',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            chunk_count INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'indexed',
            error_message TEXT,
            uploaded_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS agent_presets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            system_prompt TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS message_events (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            conversation_id TEXT,
            model TEXT NOT NULL,
            latency_ms INTEGER NOT NULL,
            tool_calls TEXT NOT NULL DEFAULT '[]',
            agent_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# ── Users ────────────────────────────────────────────────────────────────────
def db_count_users() -> int:
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
    conn.close()
    return count


def db_create_user(email: str, password_hash: str, display_name: str, role: str) -> str:
    user_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO users (id, email, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, email.lower().strip(), password_hash, display_name, role, now_iso()),
    )
    conn.commit()
    conn.close()
    return user_id


def db_get_user_by_email(email: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
    conn.close()
    return dict(row) if row else None


def db_get_user_by_id(user_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def db_list_users():
    """Admin-only: list every user (without password hashes)."""
    conn = get_db()
    rows = conn.execute(
        "SELECT id, email, display_name, role, created_at FROM users ORDER BY created_at ASC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def db_delete_user(user_id: str):
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()


# ── Conversations ────────────────────────────────────────────────────────────
def db_create_conversation(user_id: str, title: str = "New chat") -> str:
    conv_id = str(uuid.uuid4())
    conn = get_db()
    ts = now_iso()
    conn.execute(
        "INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (conv_id, user_id, title, ts, ts),
    )
    conn.commit()
    conn.close()
    return conv_id


def db_list_conversations(user_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100",
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def db_get_conversation(user_id: str, conversation_id: str):
    """Returns None both when the conversation doesn't exist AND when it
    belongs to a different user — callers can't distinguish "not found"
    from "not yours," which is intentional: don't leak existence."""
    conn = get_db()
    conv = conn.execute(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ? AND user_id = ?",
        (conversation_id, user_id),
    ).fetchone()
    if not conv:
        conn.close()
        return None
    msgs = conn.execute(
        "SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
        (conversation_id,),
    ).fetchall()
    conn.close()
    return {"id": conv["id"], "title": conv["title"], "messages": [dict(m) for m in msgs]}


def db_delete_conversation(user_id: str, conversation_id: str):
    conn = get_db()
    owned = conn.execute(
        "SELECT id FROM conversations WHERE id = ? AND user_id = ?", (conversation_id, user_id)
    ).fetchone()
    if owned:
        conn.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
        conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        conn.commit()
    conn.close()
    return bool(owned)


def db_save_message(conversation_id: str, role: str, content: str):
    conn = get_db()
    conn.execute(
        "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), conversation_id, role, content, now_iso()),
    )
    conn.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now_iso(), conversation_id))
    conn.commit()
    conn.close()


def db_maybe_set_title(conversation_id: str, first_user_message: str):
    conn = get_db()
    row = conn.execute("SELECT title FROM conversations WHERE id = ?", (conversation_id,)).fetchone()
    if row and row["title"] == "New chat":
        title = first_user_message.strip().replace("\n", " ")[:60]
        if title:
            conn.execute("UPDATE conversations SET title = ? WHERE id = ?", (title, conversation_id))
            conn.commit()
    conn.close()


def db_conversation_belongs_to(conversation_id: str, user_id: str) -> bool:
    """Used by chat_stream to confirm a conversation_id the client sent
    actually belongs to the authenticated user before writing messages
    into it."""
    conn = get_db()
    row = conn.execute(
        "SELECT id FROM conversations WHERE id = ? AND user_id = ?", (conversation_id, user_id)
    ).fetchone()
    conn.close()
    return row is not None


# ── Documents ────────────────────────────────────────────────────────────────
def db_save_document(user_id: str, filename: str, file_type: str, size_bytes: int, chunk_count: int, status: str, error_message: str = None) -> str:
    doc_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO documents (id, user_id, filename, file_type, size_bytes, chunk_count, status, error_message, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (doc_id, user_id, filename, file_type, size_bytes, chunk_count, status, error_message, now_iso()),
    )
    conn.commit()
    conn.close()
    return doc_id


def db_list_documents(user_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def db_get_document(user_id: str, document_id: str):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM documents WHERE id = ? AND user_id = ?", (document_id, user_id)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def db_delete_document_row(user_id: str, document_id: str):
    conn = get_db()
    conn.execute("DELETE FROM documents WHERE id = ? AND user_id = ?", (document_id, user_id))
    conn.commit()
    conn.close()


# ── Agent presets ────────────────────────────────────────────────────────────
def db_create_agent_preset(user_id: str, name: str, description: str, system_prompt: str) -> str:
    preset_id = str(uuid.uuid4())
    conn = get_db()
    ts = now_iso()
    conn.execute(
        "INSERT INTO agent_presets (id, user_id, name, description, system_prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (preset_id, user_id, name, description, system_prompt, ts, ts),
    )
    conn.commit()
    conn.close()
    return preset_id


def db_list_agent_presets(user_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM agent_presets WHERE user_id = ? ORDER BY created_at ASC", (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def db_get_agent_preset(user_id: str, preset_id: str):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM agent_presets WHERE id = ? AND user_id = ?", (preset_id, user_id)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def db_update_agent_preset(user_id: str, preset_id: str, name: str, description: str, system_prompt: str) -> bool:
    conn = get_db()
    cur = conn.execute(
        "UPDATE agent_presets SET name = ?, description = ?, system_prompt = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        (name, description, system_prompt, now_iso(), preset_id, user_id),
    )
    conn.commit()
    updated = cur.rowcount > 0
    conn.close()
    return updated


def db_delete_agent_preset(user_id: str, preset_id: str):
    conn = get_db()
    conn.execute("DELETE FROM agent_presets WHERE id = ? AND user_id = ?", (preset_id, user_id))
    conn.commit()
    conn.close()


# ── Message events (analytics) ──────────────────────────────────────────────
def db_record_message_event(user_id: str, conversation_id: str, model: str, latency_ms: int, tool_calls: list, agent_id: str = None):
    conn = get_db()
    conn.execute(
        "INSERT INTO message_events (id, user_id, conversation_id, model, latency_ms, tool_calls, agent_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), user_id, conversation_id, model, latency_ms, json.dumps(tool_calls), agent_id, now_iso()),
    )
    conn.commit()
    conn.close()


def db_get_analytics_summary(user_id: str, days: int = 7):
    """Aggregate real message_events data for the Analytics page, scoped to
    one user. Everything here is computed from rows that were actually
    recorded — no estimates, no filled-in placeholder numbers.
    """
    conn = get_db()
    cutoff = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)).isoformat()

    rows = conn.execute(
        "SELECT model, latency_ms, tool_calls, created_at FROM message_events WHERE user_id = ? AND created_at >= ? ORDER BY created_at ASC",
        (user_id, cutoff),
    ).fetchall()
    conn.close()

    return [dict(r) for r in rows]
