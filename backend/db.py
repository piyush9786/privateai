"""SQLite persistence: conversations, messages, and document metadata.

This is a separate store from ChromaDB — ChromaDB only holds vector
embeddings (documents + memories); this holds the structured, relational
data (who said what, when, which files were uploaded).
"""
import sqlite3
import uuid
import datetime

from config import DB_PATH


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL DEFAULT 'New chat',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
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
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            chunk_count INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'indexed',
            error_message TEXT,
            uploaded_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS agent_presets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            system_prompt TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def now_iso():
    return datetime.datetime.utcnow().isoformat()


# ── Conversations ────────────────────────────────────────────────────────────
def db_create_conversation(title: str = "New chat") -> str:
    conv_id = str(uuid.uuid4())
    conn = get_db()
    ts = now_iso()
    conn.execute(
        "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
        (conv_id, title, ts, ts),
    )
    conn.commit()
    conn.close()
    return conv_id


def db_list_conversations():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC LIMIT 100"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def db_get_conversation(conversation_id: str):
    conn = get_db()
    conv = conn.execute(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?",
        (conversation_id,),
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


def db_delete_conversation(conversation_id: str):
    conn = get_db()
    conn.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    conn.commit()
    conn.close()


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


# ── Documents ────────────────────────────────────────────────────────────────
def db_save_document(filename: str, file_type: str, size_bytes: int, chunk_count: int, status: str, error_message: str = None) -> str:
    doc_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO documents (id, filename, file_type, size_bytes, chunk_count, status, error_message, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (doc_id, filename, file_type, size_bytes, chunk_count, status, error_message, now_iso()),
    )
    conn.commit()
    conn.close()
    return doc_id


def db_list_documents():
    conn = get_db()
    rows = conn.execute("SELECT * FROM documents ORDER BY uploaded_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def db_get_document(document_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (document_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def db_delete_document_row(document_id: str):
    conn = get_db()
    conn.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    conn.commit()
    conn.close()


# ── Agent presets ────────────────────────────────────────────────────────────
def db_create_agent_preset(name: str, description: str, system_prompt: str) -> str:
    preset_id = str(uuid.uuid4())
    conn = get_db()
    ts = now_iso()
    conn.execute(
        "INSERT INTO agent_presets (id, name, description, system_prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        (preset_id, name, description, system_prompt, ts, ts),
    )
    conn.commit()
    conn.close()
    return preset_id


def db_list_agent_presets():
    conn = get_db()
    rows = conn.execute("SELECT * FROM agent_presets ORDER BY created_at ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def db_get_agent_preset(preset_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM agent_presets WHERE id = ?", (preset_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def db_update_agent_preset(preset_id: str, name: str, description: str, system_prompt: str) -> bool:
    conn = get_db()
    cur = conn.execute(
        "UPDATE agent_presets SET name = ?, description = ?, system_prompt = ?, updated_at = ? WHERE id = ?",
        (name, description, system_prompt, now_iso(), preset_id),
    )
    conn.commit()
    updated = cur.rowcount > 0
    conn.close()
    return updated


def db_delete_agent_preset(preset_id: str):
    conn = get_db()
    conn.execute("DELETE FROM agent_presets WHERE id = ?", (preset_id,))
    conn.commit()
    conn.close()

