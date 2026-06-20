import os, io, json, uuid, base64, tempfile, sqlite3
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

import httpx
import pandas as pd
import openpyxl
from openpyxl import Workbook
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.express as px
from PIL import Image
import chromadb
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings

app = FastAPI(title="PrivateAI Enhanced")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
CHROMA_HOST = os.getenv("CHROMADB_HOST", "chromadb")
CHROMA_PORT = int(os.getenv("CHROMADB_PORT", "8000"))
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3.2")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
EXPORT_DIR = Path("/app/exports")
EXPORT_DIR.mkdir(exist_ok=True)
DATA_DIR = Path("/app/data")
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "conversations.db"

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
    conn.commit()
    conn.close()

init_db()

app.mount("/exports", StaticFiles(directory=str(EXPORT_DIR)), name="exports")

chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
embeddings = OllamaEmbeddings(model=EMBED_MODEL, base_url=OLLAMA_URL)

def get_collection():
    return chroma_client.get_or_create_collection("privateai_docs")

def get_memory_collection():
    return chroma_client.get_or_create_collection("privateai_memories")

# In-memory store for pending (unconfirmed) memory proposals. Keyed by a
# short-lived proposal id; cleared on confirm/reject or app restart. This is
# intentionally not persisted — an unconfirmed proposal isn't a memory yet.
PENDING_MEMORY_PROPOSALS = {}

def embed_text(text: str):
    return embeddings.embed_query(text)

# ── HEALTH ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}

# ── MODELS ───────────────────────────────────────────────────────────────────
@app.get("/api/models")
async def list_models():
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.get(f"{OLLAMA_URL}/api/tags")
        return r.json()

@app.get("/api/system/status")
async def system_status():
    """Real, derived status for the dashboard — no fabricated metrics.

    Surfaces what's actually knowable: which models are currently loaded
    into Ollama and how much of each sits in VRAM vs falls back to CPU
    (the same signal `ollama ps` reports), plus simple up/down checks for
    the other services. No GPU/CPU percentage is invented when Ollama
    doesn't provide one.
    """
    result = {
        "ollama": {"reachable": False, "running_models": []},
        "chromadb": {"reachable": False},
        "backend": {"reachable": True},
    }

    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"{OLLAMA_URL}/api/ps")
            r.raise_for_status()
            data = r.json()
            result["ollama"]["reachable"] = True
            running = []
            for m in data.get("models", []):
                size = m.get("size", 0)
                size_vram = m.get("size_vram", 0)
                vram_fraction = round((size_vram / size) * 100) if size else None
                running.append({
                    "name": m.get("name"),
                    "size_bytes": size,
                    "size_vram_bytes": size_vram,
                    "vram_percent": vram_fraction,
                    "expires_at": m.get("expires_at"),
                })
            result["ollama"]["running_models"] = running
    except Exception:
        pass

    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"http://{CHROMA_HOST}:{CHROMA_PORT}/api/v1/heartbeat")
            result["chromadb"]["reachable"] = r.status_code == 200
    except Exception:
        pass

    return result

# ── CHAT ─────────────────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(request: dict):
    messages = request.get("messages", [])
    model = request.get("model", DEFAULT_MODEL)
    use_rag = request.get("use_rag", False)
    
    user_msg = messages[-1]["content"] if messages else ""
    context = ""

    if use_rag and user_msg:
        try:
            col = get_collection()
            qe = embed_text(user_msg)
            results = col.query(query_embeddings=[qe], n_results=4)
            docs = results.get("documents", [[]])[0]
            if docs:
                context = "\n\n".join(docs)
                sys_msg = {"role": "system", "content": f"Use this context:\n{context}\n\nAnswer the user's question."}
                messages = [sys_msg] + messages
        except Exception as e:
            print(f"RAG error: {e}")

    payload = {"model": model, "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.post(f"{OLLAMA_URL}/api/chat", json=payload)
        return r.json()

# ── AGENT TOOLS ───────────────────────────────────────────────────────────────
# JSON-schema tool definitions handed to Ollama's `tools` parameter, plus the
# Python implementations the agent loop dispatches to when the model requests
# one of them. Each tool function returns a small dict: a `status_label` (the
# human-readable line streamed to the UI as a status event) and a `result`
# (compact text fed back to the model as the tool's output).

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_documents",
            "description": "Search the user's uploaded/indexed documents (the vault) for relevant passages. Use this whenever the user asks about content from files they've uploaded, or asks something that might be answered by previously indexed material.",
            "parameters": {
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {"type": "string", "description": "What to search for in the indexed documents"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_chart",
            "description": "Render a bar, line, pie, scatter, area, or histogram chart as a PNG image from labels and numeric values, and return a downloadable link.",
            "parameters": {
                "type": "object",
                "required": ["chart_type", "labels", "values", "title"],
                "properties": {
                    "chart_type": {"type": "string", "enum": ["bar", "line", "pie", "scatter", "area", "histogram"]},
                    "labels": {"type": "array", "items": {"type": "string"}, "description": "Category labels for the x-axis or pie slices"},
                    "values": {"type": "array", "items": {"type": "number"}, "description": "Numeric values, one per label"},
                    "title": {"type": "string", "description": "Chart title"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_spreadsheet",
            "description": "Read a previously uploaded Excel/CSV file by filename and return its row/column structure and summary stats. Only works for files already present in the uploads folder.",
            "parameters": {
                "type": "object",
                "required": ["filename"],
                "properties": {
                    "filename": {"type": "string", "description": "Name of the previously uploaded spreadsheet file"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_spreadsheet",
            "description": "Generate a new Excel spreadsheet from a list of row objects (each a dict of column-name to value) and save it for download.",
            "parameters": {
                "type": "object",
                "required": ["rows", "filename"],
                "properties": {
                    "rows": {
                        "type": "array",
                        "items": {"type": "object"},
                        "description": "Array of row objects, e.g. [{\"Month\":\"Jan\",\"Revenue\":1000}, ...]"
                    },
                    "filename": {"type": "string", "description": "Output filename, e.g. report.xlsx"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_flowchart",
            "description": "Generate a step-by-step flowchart PNG from an ordered list of step descriptions.",
            "parameters": {
                "type": "object",
                "required": ["steps", "title"],
                "properties": {
                    "steps": {"type": "array", "items": {"type": "string"}, "description": "Ordered list of step labels"},
                    "title": {"type": "string", "description": "Flowchart title"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_image",
            "description": "Generate an abstract/geometric/minimal AI-palette-guided image from a text description and return a downloadable link.",
            "parameters": {
                "type": "object",
                "required": ["prompt"],
                "properties": {
                    "prompt": {"type": "string", "description": "Description of the image to generate"},
                    "style": {"type": "string", "enum": ["abstract", "geometric", "minimal"]}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "transcribe_voice_note",
            "description": "Transcribe a previously uploaded audio file by filename into text.",
            "parameters": {
                "type": "object",
                "required": ["filename"],
                "properties": {
                    "filename": {"type": "string", "description": "Name of the previously uploaded audio file"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "propose_memory",
            "description": "Propose saving a durable fact about the user or their preferences for future conversations (e.g. their name, a stated preference, an ongoing project they mentioned). This does NOT save anything immediately — it asks the user for confirmation first. Only propose genuinely useful, durable facts, not one-off details about the current message.",
            "parameters": {
                "type": "object",
                "required": ["memory_text"],
                "properties": {
                    "memory_text": {"type": "string", "description": "A short, self-contained statement of the fact to remember, written in third person, e.g. 'Prefers Python over JavaScript for backend work.'"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recall_memories",
            "description": "Search previously confirmed memories about the user for anything relevant to the current topic. Use this at the start of a conversation or whenever a past preference/fact might be relevant.",
            "parameters": {
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {"type": "string", "description": "What to search for in stored memories"}
                }
            }
        }
    },
]

TOOL_STATUS_LABELS = {
    "search_documents": "Searching the vault…",
    "create_chart": "Building chart…",
    "read_spreadsheet": "Reading spreadsheet…",
    "create_spreadsheet": "Generating spreadsheet…",
    "create_flowchart": "Drawing flowchart…",
    "generate_image": "Generating image…",
    "transcribe_voice_note": "Transcribing audio…",
    "propose_memory": "Considering what to remember…",
    "recall_memories": "Recalling what I know…",
}

async def tool_search_documents(query: str):
    try:
        col = get_collection()
        qe = embed_text(query)
        results = col.query(query_embeddings=[qe], n_results=4)
        docs = results.get("documents", [[]])[0]
        if not docs:
            return "No relevant passages found in the vault."
        return "\n\n---\n\n".join(docs)
    except Exception as e:
        return f"Search failed: {e}"

async def tool_create_chart(chart_type: str, labels: list, values: list, title: str):
    fig, ax = plt.subplots(figsize=(10, 6))
    fig.patch.set_facecolor('#1C1914')
    ax.set_facecolor('#23201A')
    ax.tick_params(colors='#EDE7D9')
    ax.title.set_color('#E0B567')
    for spine in ax.spines.values():
        spine.set_edgecolor('#352F25')

    x, y = labels, values
    if chart_type == "bar":
        ax.bar(x, y, color='#C99A4B')
    elif chart_type == "line":
        ax.plot(x, y, color='#7C9473', linewidth=2, marker='o')
    elif chart_type == "pie":
        ax.pie(y, labels=x, autopct='%1.1f%%', colors=plt.cm.Set3.colors)
    elif chart_type == "scatter":
        ax.scatter(x, y, color='#C99A4B', s=80)
    elif chart_type == "area":
        ax.fill_between(range(len(y)), y, alpha=0.6, color='#C99A4B')
        ax.plot(range(len(y)), y, color='#C99A4B', linewidth=2)
        ax.set_xticks(range(len(x))); ax.set_xticklabels(x)
    elif chart_type == "histogram":
        ax.hist(y, bins=20, color='#B2543C', edgecolor='white')

    ax.set_title(title, fontsize=14, pad=12)
    plt.tight_layout()
    filename = f"chart_{uuid.uuid4().hex[:8]}.png"
    out_path = EXPORT_DIR / filename
    plt.savefig(str(out_path), dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    url = f"/exports/{filename}"
    return f"Chart created: {url}", url

async def tool_read_spreadsheet(filename: str):
    matches = list(UPLOAD_DIR.glob(f"*{filename}")) + [UPLOAD_DIR / filename]
    path = next((p for p in matches if p.exists()), None)
    if not path:
        return f"Could not find an uploaded file named '{filename}'.", None
    try:
        df = pd.read_csv(path) if path.suffix.lower() == ".csv" else pd.read_excel(path)
        summary = f"{len(df)} rows, columns: {', '.join(df.columns)}\n\n{df.head(10).to_string()}"
        return summary, None
    except Exception as e:
        return f"Failed to read spreadsheet: {e}", None

async def tool_create_spreadsheet(rows: list, filename: str):
    df = pd.DataFrame(rows)
    if not filename.endswith(".xlsx"):
        filename += ".xlsx"
    out_path = EXPORT_DIR / filename
    df.to_excel(out_path, index=False)
    url = f"/exports/{filename}"
    return f"Spreadsheet created with {len(df)} rows: {url}", url

async def tool_create_flowchart(steps: list, title: str):
    fig, ax = plt.subplots(figsize=(8, max(6, len(steps) * 1.5)))
    fig.patch.set_facecolor('#1C1914')
    ax.set_facecolor('#1C1914')
    ax.axis('off')
    box_w, box_h, gap = 5, 0.6, 0.4
    total_h = len(steps) * (box_h + gap)
    y = total_h
    colors = ['#C99A4B', '#7C9473', '#8D7BB0', '#B2543C', '#6E97A8']
    for i, step in enumerate(steps):
        color = colors[i % len(colors)]
        rect = plt.Rectangle((1, y - box_h), box_w, box_h, linewidth=1.5, edgecolor='#EDE7D9', facecolor=color, alpha=0.85)
        ax.add_patch(rect)
        ax.text(3.5, y - box_h / 2, step, ha='center', va='center', fontsize=9, color='#15130F', wrap=True)
        if i < len(steps) - 1:
            ax.annotate('', xy=(3.5, y - box_h - gap + 0.05), xytext=(3.5, y - box_h), arrowprops=dict(arrowstyle='->', color='#EDE7D9', lw=1.5))
        y -= box_h + gap
    ax.set_xlim(0, 7); ax.set_ylim(-0.5, total_h + 0.5)
    ax.set_title(title, color='#E0B567', fontsize=12, pad=10)
    filename = f"flowchart_{uuid.uuid4().hex[:8]}.png"
    out_path = EXPORT_DIR / filename
    plt.tight_layout()
    plt.savefig(str(out_path), dpi=150, bbox_inches='tight', facecolor='#1C1914')
    plt.close()
    url = f"/exports/{filename}"
    return f"Flowchart created: {url}", url

async def tool_generate_image(prompt: str, style: str = "abstract"):
    import numpy as np
    colors = ['#C99A4B', '#7C9473', '#8D7BB0', '#B2543C', '#6E97A8']
    fig, ax = plt.subplots(figsize=(8, 8))
    fig.patch.set_facecolor('#0F0D0A')
    ax.set_facecolor('#0F0D0A')
    ax.axis('off')
    np.random.seed(hash(prompt) % 2**31)
    for i in range(200):
        x, y = np.random.rand(2)
        color = colors[i % len(colors)]
        alpha = np.random.uniform(0.2, 0.8)
        if np.random.choice(['circle', 'rect']) == 'circle':
            ax.add_patch(plt.Circle((x, y), np.random.uniform(0.02, 0.08), color=color, alpha=alpha))
        else:
            w, h = np.random.uniform(0.05, 0.2, 2)
            ax.add_patch(plt.Rectangle((x, y), w, h, color=color, alpha=alpha, angle=np.random.randint(0, 90)))
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    filename = f"image_{uuid.uuid4().hex[:8]}.png"
    out_path = EXPORT_DIR / filename
    plt.tight_layout()
    plt.savefig(str(out_path), dpi=200, bbox_inches='tight', facecolor='#0F0D0A')
    plt.close()
    url = f"/exports/{filename}"
    return f"Image created: {url}", url

async def tool_transcribe_voice_note(filename: str):
    import speech_recognition as sr
    matches = list(UPLOAD_DIR.glob(f"*{filename}")) + [UPLOAD_DIR / filename]
    path = next((p for p in matches if p.exists()), None)
    if not path:
        return f"Could not find an uploaded audio file named '{filename}'."
    r = sr.Recognizer()
    try:
        with sr.AudioFile(str(path)) as source:
            audio = r.record(source)
        return r.recognize_google(audio)
    except Exception as e:
        return f"Transcription failed: {e}"

async def tool_recall_memories(query: str):
    try:
        mem_col = get_memory_collection()
        if mem_col.count() == 0:
            return "No memories stored yet."
        qe = embed_text(query)
        results = mem_col.query(query_embeddings=[qe], n_results=5)
        docs = results.get("documents", [[]])[0]
        if not docs:
            return "No relevant memories found."
        return "\n".join(f"- {d}" for d in docs)
    except Exception as e:
        return f"Memory recall failed: {e}"

def save_confirmed_memory(memory_text: str):
    """Actually writes a memory to the vector store. Only called after user confirmation."""
    mem_col = get_memory_collection()
    emb = embed_text(memory_text)
    mem_id = str(uuid.uuid4())
    mem_col.add(documents=[memory_text], embeddings=[emb], ids=[mem_id], metadatas=[{"created": str(uuid.uuid1().time)}])
    return mem_id

async def execute_tool(name: str, args: dict):
    """Dispatch a tool call by name. Returns (text_result, optional_media_url)."""
    if name == "search_documents":
        return await tool_search_documents(args.get("query", "")), None
    if name == "create_chart":
        return await tool_create_chart(args.get("chart_type", "bar"), args.get("labels", []), args.get("values", []), args.get("title", "Chart"))
    if name == "read_spreadsheet":
        return await tool_read_spreadsheet(args.get("filename", ""))
    if name == "create_spreadsheet":
        return await tool_create_spreadsheet(args.get("rows", []), args.get("filename", "output.xlsx"))
    if name == "create_flowchart":
        return await tool_create_flowchart(args.get("steps", []), args.get("title", "Flowchart"))
    if name == "generate_image":
        return await tool_generate_image(args.get("prompt", ""), args.get("style", "abstract"))
    if name == "transcribe_voice_note":
        return await tool_transcribe_voice_note(args.get("filename", "")), None
    if name == "recall_memories":
        return await tool_recall_memories(args.get("query", "")), None
    return f"Unknown tool: {name}", None

# ── CONVERSATION PERSISTENCE ───────────────────────────────────────────────────
import datetime

def now_iso():
    return datetime.datetime.utcnow().isoformat()

def db_create_conversation(title: str = "New chat") -> str:
    conv_id = str(uuid.uuid4())
    conn = get_db()
    ts = now_iso()
    conn.execute("INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)", (conv_id, title, ts, ts))
    conn.commit()
    conn.close()
    return conv_id

def db_save_message(conversation_id: str, role: str, content: str):
    conn = get_db()
    conn.execute(
        "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), conversation_id, role, content, now_iso())
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

def db_save_document(filename: str, file_type: str, size_bytes: int, chunk_count: int, status: str, error_message: str = None) -> str:
    doc_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO documents (id, filename, file_type, size_bytes, chunk_count, status, error_message, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (doc_id, filename, file_type, size_bytes, chunk_count, status, error_message, now_iso())
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

@app.post("/api/conversations")
async def create_conversation():
    conv_id = db_create_conversation()
    return {"id": conv_id, "title": "New chat"}

@app.get("/api/conversations")
async def list_conversations():
    conn = get_db()
    rows = conn.execute("SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC LIMIT 100").fetchall()
    conn.close()
    return {"conversations": [dict(r) for r in rows]}

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    conn = get_db()
    conv = conn.execute("SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?", (conversation_id,)).fetchone()
    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = conn.execute("SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", (conversation_id,)).fetchall()
    conn.close()
    return {"id": conv["id"], "title": conv["title"], "messages": [dict(m) for m in msgs]}

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    conn = get_db()
    conn.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": conversation_id}
AGENT_SYSTEM_PROMPT = (
    "You are PrivateAI, a fully local AI assistant. You have tools available "
    "for searching the user's uploaded documents, recalling saved memories, "
    "building charts and spreadsheets, drawing flowcharts, generating images, "
    "and transcribing audio.\n\n"
    "IMPORTANT: If the user asks anything about their uploaded files, documents, "
    "or previously shared content — including vague questions like 'what is this "
    "file about' or 'summarize my document' — you MUST call search_documents "
    "first before answering. Never guess the contents of a file from its name "
    "alone. If search_documents returns nothing relevant, say so plainly instead "
    "of speculating."
)

# ── AGENT CHAT (STREAMING, TOOL-CALLING) ──────────────────────────────────────
@app.post("/api/chat/stream")
async def chat_stream(request: dict):
    messages = list(request.get("messages", []))
    if not messages or messages[0].get("role") != "system":
        messages = [{"role": "system", "content": AGENT_SYSTEM_PROMPT}] + messages
    model = request.get("model", DEFAULT_MODEL)
    conversation_id = request.get("conversation_id")

    if conversation_id and messages and messages[-1].get("role") == "user":
        db_save_message(conversation_id, "user", messages[-1].get("content", ""))
        db_maybe_set_title(conversation_id, messages[-1].get("content", ""))

    async def event_gen():
        def sse(event: str, data: dict):
            return f"event: {event}\ndata: {json.dumps(data)}\n\n"

        max_rounds = 6
        for _ in range(max_rounds):
            payload = {"model": model, "messages": messages, "tools": AGENT_TOOLS, "stream": False}
            try:
                async with httpx.AsyncClient(timeout=180) as c:
                    r = await c.post(f"{OLLAMA_URL}/api/chat", json=payload)
                    result = r.json()
            except Exception as e:
                yield sse("error", {"message": str(e)})
                return

            msg = result.get("message", {})
            tool_calls = msg.get("tool_calls") or []

            if not tool_calls:
                content = msg.get("content", "") or result.get("error", "No response")
                yield sse("token", {"text": content})
                if conversation_id and content.strip():
                    db_save_message(conversation_id, "assistant", content)
                yield sse("done", {})
                return

            messages.append(msg)
            for call in tool_calls:
                fn = call.get("function", {})
                name = fn.get("name", "")
                args = fn.get("arguments", {}) or {}

                if name == "propose_memory":
                    memory_text = args.get("memory_text", "").strip()
                    if not memory_text:
                        messages.append({"role": "tool", "tool_name": name, "content": "No memory text provided."})
                        continue
                    proposal_id = str(uuid.uuid4())
                    PENDING_MEMORY_PROPOSALS[proposal_id] = {"memory_text": memory_text, "messages": messages}
                    yield sse("memory_proposal", {"proposal_id": proposal_id, "memory_text": memory_text})
                    # Tell the model the proposal is pending so it doesn't repeat the call
                    # if the conversation continues before the user responds.
                    messages.append({"role": "tool", "tool_name": name, "content": "Proposal sent to the user for confirmation. Do not propose this again in this turn."})
                    yield sse("done", {})
                    return

                label = TOOL_STATUS_LABELS.get(name, f"Running {name}…")
                yield sse("status", {"label": label, "tool": name})

                tool_result = await execute_tool(name, args)
                if isinstance(tool_result, tuple):
                    text_result, media_url = tool_result
                else:
                    text_result, media_url = tool_result, None

                if media_url:
                    yield sse("media", {"url": media_url, "tool": name})

                messages.append({"role": "tool", "tool_name": name, "content": str(text_result)})

        yield sse("token", {"text": "Reached the maximum number of tool calls for this turn."})
        yield sse("done", {})

    return StreamingResponse(event_gen(), media_type="text/event-stream")

@app.post("/api/memory/confirm")
async def confirm_memory(request: dict):
    """Called when the user approves or rejects a pending memory proposal."""
    proposal_id = request.get("proposal_id", "")
    approved = bool(request.get("approved", False))

    proposal = PENDING_MEMORY_PROPOSALS.pop(proposal_id, None)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or already resolved.")

    if not approved:
        return {"status": "rejected"}

    mem_id = save_confirmed_memory(proposal["memory_text"])
    return {"status": "saved", "memory_id": mem_id, "memory_text": proposal["memory_text"]}

@app.get("/api/memory/list")
async def list_memories():
    mem_col = get_memory_collection()
    if mem_col.count() == 0:
        return {"memories": []}
    results = mem_col.get()
    memories = [
        {"id": _id, "text": doc}
        for _id, doc in zip(results.get("ids", []), results.get("documents", []))
    ]
    return {"memories": memories}

@app.delete("/api/memory/{memory_id}")
async def delete_memory(memory_id: str):
    mem_col = get_memory_collection()
    mem_col.delete(ids=[memory_id])
    return {"status": "deleted", "memory_id": memory_id}

# ── FILE UPLOAD + RAG INGEST ──────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix.lower()
    tmp_path = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"
    
    content = await file.read()
    tmp_path.write_bytes(content)
    size_bytes = len(content)
    
    text = ""
    try:
        if suffix == ".pdf":
            loader = PyPDFLoader(str(tmp_path))
            pages = loader.load()
            text = "\n".join(p.page_content for p in pages)
        elif suffix in [".docx", ".doc"]:
            loader = Docx2txtLoader(str(tmp_path))
            docs = loader.load()
            text = "\n".join(d.page_content for d in docs)
        elif suffix in [".txt", ".md"]:
            text = content.decode("utf-8", errors="ignore")
        elif suffix in [".xlsx", ".xls", ".csv"]:
            if suffix == ".csv":
                df = pd.read_csv(tmp_path)
            else:
                df = pd.read_excel(tmp_path)
            text = df.to_string()
        else:
            db_save_document(file.filename, suffix, size_bytes, 0, "unsupported", f"File type {suffix} not supported for RAG")
            return {"status": "unsupported", "message": f"File type {suffix} not supported for RAG"}
        
        chunks = []
        if text and text.strip():
            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.split_text(text)
            if chunks:
                col = get_collection()
                embeddings_list = [embed_text(c) for c in chunks]
                ids = [str(uuid.uuid4()) for _ in chunks]
                metadatas = [{"source": file.filename, "chunk": i} for i in range(len(chunks))]
                col.add(documents=chunks, embeddings=embeddings_list, ids=ids, metadatas=metadatas)
        
        doc_id = db_save_document(file.filename, suffix, size_bytes, len(chunks), "indexed" if chunks else "empty")
        return {"status": "ok", "filename": file.filename, "chunks": len(chunks), "preview": text[:500], "document_id": doc_id}
    except Exception as e:
        db_save_document(file.filename, suffix, size_bytes, 0, "failed", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents")
async def list_documents():
    return {"documents": db_list_documents()}

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    doc = db_get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        col = get_collection()
        col.delete(where={"source": doc["filename"]})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove indexed chunks: {e}")
    db_delete_document_row(document_id)
    return {"status": "deleted", "document_id": document_id}



# ── PDF READ & SUMMARISE ──────────────────────────────────────────────────────
@app.post("/api/pdf/read")
async def pdf_read(file: UploadFile = File(...)):
    tmp = UPLOAD_DIR / f"{uuid.uuid4()}.pdf"
    tmp.write_bytes(await file.read())
    loader = PyPDFLoader(str(tmp))
    pages = loader.load()
    text = "\n\n".join(f"[Page {i+1}]\n{p.page_content}" for i, p in enumerate(pages))
    return {"pages": len(pages), "text": text, "preview": text[:1000]}

# ── EXCEL READ ────────────────────────────────────────────────────────────────
@app.post("/api/excel/read")
async def excel_read(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix.lower()
    tmp = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"
    tmp.write_bytes(await file.read())
    if suffix == ".csv":
        df = pd.read_csv(tmp)
    else:
        df = pd.read_excel(tmp)
    return {
        "rows": len(df),
        "columns": list(df.columns),
        "preview": df.head(20).to_dict(orient="records"),
        "stats": df.describe(include="all").fillna("").to_dict()
    }

# ── EXCEL MAKER ───────────────────────────────────────────────────────────────
@app.post("/api/excel/create")
async def excel_create(request: dict):
    prompt = request.get("prompt", "")
    data = request.get("data", None)
    filename = request.get("filename", "output.xlsx")
    
    if data:
        df = pd.DataFrame(data)
    else:
        # Ask AI to generate sample data JSON
        ai_payload = {
            "model": DEFAULT_MODEL,
            "messages": [{"role": "user", "content": f"Generate a JSON array of objects for an Excel sheet about: {prompt}. Return ONLY valid JSON array, no explanation."}],
            "stream": False
        }
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(f"{OLLAMA_URL}/api/chat", json=ai_payload)
            result = r.json()
            ai_text = result.get("message", {}).get("content", "[]")
            try:
                start = ai_text.index("[")
                end = ai_text.rindex("]") + 1
                json_data = json.loads(ai_text[start:end])
                df = pd.DataFrame(json_data)
            except Exception:
                df = pd.DataFrame({"Result": [ai_text]})
    
    out_path = EXPORT_DIR / filename
    df.to_excel(out_path, index=False)
    return {"status": "ok", "download_url": f"/exports/{filename}", "rows": len(df), "columns": list(df.columns)}

# ── CHARTS ────────────────────────────────────────────────────────────────────
@app.post("/api/chart/create")
async def create_chart(request: dict):
    chart_type = request.get("type", "bar")  # bar, line, pie, scatter, flowchart
    data = request.get("data", {})
    title = request.get("title", "Chart")
    filename = f"chart_{uuid.uuid4().hex[:8]}.png"
    out_path = EXPORT_DIR / filename

    labels = data.get("labels", [])
    values = data.get("values", [])
    x = data.get("x", labels)
    y = data.get("y", values)

    fig, ax = plt.subplots(figsize=(10, 6))
    fig.patch.set_facecolor('#1e2327')
    ax.set_facecolor('#2a2f35')
    ax.tick_params(colors='white')
    ax.title.set_color('white')
    ax.xaxis.label.set_color('white')
    ax.yaxis.label.set_color('white')
    for spine in ax.spines.values():
        spine.set_edgecolor('#444')

    if chart_type == "bar":
        ax.bar(x, y, color='#6c8ebf')
    elif chart_type == "line":
        ax.plot(x, y, color='#82b366', linewidth=2, marker='o')
        ax.fill_between(range(len(y)), y, alpha=0.2, color='#82b366')
    elif chart_type == "pie":
        ax.pie(y, labels=x, autopct='%1.1f%%', colors=plt.cm.Set3.colors)
    elif chart_type == "scatter":
        ax.scatter(x, y, color='#d6ae4f', s=80)
    elif chart_type == "area":
        ax.fill_between(range(len(y)), y, alpha=0.6, color='#6c8ebf')
        ax.plot(range(len(y)), y, color='#6c8ebf', linewidth=2)
        ax.set_xticks(range(len(x)))
        ax.set_xticklabels(x)
    elif chart_type == "histogram":
        ax.hist(y, bins=20, color='#ae4132', edgecolor='white')

    ax.set_title(title, fontsize=14, pad=12)
    plt.tight_layout()
    plt.savefig(str(out_path), dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()

    return {"status": "ok", "download_url": f"/exports/{filename}"}

# ── FLOWCHART ─────────────────────────────────────────────────────────────────
@app.post("/api/flowchart/create")
async def create_flowchart(request: dict):
    prompt = request.get("prompt", "")
    steps = request.get("steps", [])
    
    if not steps and prompt:
        ai_payload = {
            "model": DEFAULT_MODEL,
            "messages": [{"role": "user", "content": f"List the steps for this process as a JSON array of strings: {prompt}. Return ONLY JSON array."}],
            "stream": False
        }
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(f"{OLLAMA_URL}/api/chat", json=ai_payload)
            result = r.json()
            ai_text = result.get("message", {}).get("content", "[]")
            try:
                start = ai_text.index("[")
                end = ai_text.rindex("]") + 1
                steps = json.loads(ai_text[start:end])
            except Exception:
                steps = [prompt]

    fig, ax = plt.subplots(figsize=(8, max(6, len(steps) * 1.5)))
    fig.patch.set_facecolor('#1e2327')
    ax.set_facecolor('#1e2327')
    ax.axis('off')

    box_w, box_h, gap = 5, 0.6, 0.4
    total_h = len(steps) * (box_h + gap)
    y = total_h

    colors = ['#6c8ebf', '#82b366', '#d6ae4f', '#ae4132', '#9e6bbf']

    for i, step in enumerate(steps):
        color = colors[i % len(colors)]
        rect = plt.Rectangle((1, y - box_h), box_w, box_h, linewidth=1.5,
                              edgecolor='white', facecolor=color, alpha=0.85)
        ax.add_patch(rect)
        ax.text(3.5, y - box_h / 2, step, ha='center', va='center',
                fontsize=9, color='white', wrap=True,
                bbox=dict(boxstyle='round', alpha=0))
        if i < len(steps) - 1:
            ax.annotate('', xy=(3.5, y - box_h - gap + 0.05),
                        xytext=(3.5, y - box_h),
                        arrowprops=dict(arrowstyle='->', color='white', lw=1.5))
        y -= box_h + gap

    ax.set_xlim(0, 7)
    ax.set_ylim(-0.5, total_h + 0.5)
    ax.set_title(prompt or "Flowchart", color='white', fontsize=12, pad=10)

    filename = f"flowchart_{uuid.uuid4().hex[:8]}.png"
    out_path = EXPORT_DIR / filename
    plt.tight_layout()
    plt.savefig(str(out_path), dpi=150, bbox_inches='tight', facecolor='#1e2327')
    plt.close()
    return {"status": "ok", "download_url": f"/exports/{filename}", "steps": steps}

# ── IMAGE GENERATOR (via AI description → placeholder art) ───────────────────
@app.post("/api/image/generate")
async def generate_image(request: dict):
    prompt = request.get("prompt", "")
    style = request.get("style", "abstract")
    
    # Generate a creative artistic image using matplotlib + AI-guided palette
    ai_payload = {
        "model": DEFAULT_MODEL,
        "messages": [{"role": "user", "content": f"Describe 5 colors as hex codes for an image about: '{prompt}'. Return ONLY a JSON array of hex strings like [\"#ff5733\", ...]."}],
        "stream": False
    }
    colors = ['#6c8ebf', '#82b366', '#d6ae4f', '#ae4132', '#9e6bbf']
    async with httpx.AsyncClient(timeout=60) as c:
        try:
            r = await c.post(f"{OLLAMA_URL}/api/chat", json=ai_payload)
            ai_text = r.json().get("message", {}).get("content", "")
            start = ai_text.index("[")
            end = ai_text.rindex("]") + 1
            colors = json.loads(ai_text[start:end])[:5]
        except Exception:
            pass

    import numpy as np
    fig, ax = plt.subplots(figsize=(8, 8))
    fig.patch.set_facecolor('#0d1117')
    ax.set_facecolor('#0d1117')
    ax.axis('off')

    np.random.seed(hash(prompt) % 2**31)
    for i in range(200):
        x, y = np.random.rand(2)
        size = np.random.randint(20, 300)
        color = colors[i % len(colors)]
        alpha = np.random.uniform(0.2, 0.8)
        shape = np.random.choice(['circle', 'rect'])
        if shape == 'circle':
            circ = plt.Circle((x, y), np.random.uniform(0.02, 0.08), color=color, alpha=alpha)
            ax.add_patch(circ)
        else:
            w, h = np.random.uniform(0.05, 0.2, 2)
            rect = plt.Rectangle((x, y), w, h, color=color, alpha=alpha, angle=np.random.randint(0,90))
            ax.add_patch(rect)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_title(f'"{prompt}"', color='white', fontsize=11, style='italic', pad=10)

    filename = f"image_{uuid.uuid4().hex[:8]}.png"
    out_path = EXPORT_DIR / filename
    plt.tight_layout()
    plt.savefig(str(out_path), dpi=200, bbox_inches='tight', facecolor='#0d1117')
    plt.close()
    return {"status": "ok", "download_url": f"/exports/{filename}", "prompt": prompt}

# ── VOICE TRANSCRIBE (base64 audio → text via AI) ────────────────────────────
@app.post("/api/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...)):
    import speech_recognition as sr
    from pydub import AudioSegment
    import io

    suffix = Path(file.filename).suffix.lower()
    content = await file.read()
    tmp = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"
    tmp.write_bytes(content)

    r = sr.Recognizer()
    try:
        # speech_recognition's AudioFile only reads WAV/AIFF/FLAC. Browsers
        # record via MediaRecorder as WebM/Opus (or sometimes ogg), so we
        # transcode through pydub/ffmpeg first rather than handing it raw
        # container/codec bytes that AudioFile can't parse.
        if suffix in (".wav", ".aiff", ".aif", ".flac"):
            audio_source = str(tmp)
        else:
            fmt = suffix.lstrip(".") or "webm"
            sound = AudioSegment.from_file(str(tmp), format=fmt)
            wav_io = io.BytesIO()
            sound.export(wav_io, format="wav")
            wav_io.seek(0)
            audio_source = wav_io

        with sr.AudioFile(audio_source) as source:
            audio = r.record(source)
        text = r.recognize_google(audio)
        return {"status": "ok", "text": text}
    except Exception as e:
        return {"status": "error", "text": "", "error": str(e)}

# ── RAG COLLECTION INFO ───────────────────────────────────────────────────────
@app.get("/api/rag/info")
async def rag_info():
    try:
        col = get_collection()
        count = col.count()
        return {"status": "ok", "documents": count}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.delete("/api/rag/clear")
async def rag_clear():
    try:
        chroma_client.delete_collection("privateai_docs")
        get_collection()
        return {"status": "ok", "message": "RAG cleared"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

