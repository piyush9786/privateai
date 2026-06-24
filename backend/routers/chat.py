import json
import uuid

import httpx
import pandas as pd
import matplotlib.pyplot as plt
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from config import OLLAMA_URL, DEFAULT_MODEL, UPLOAD_DIR, EXPORT_DIR
from clients import get_collection, get_memory_collection, embed_text
from db import db_save_message, db_maybe_set_title

router = APIRouter(prefix="/api", tags=["chat"])

# ── SIMPLE (NON-AGENTIC) CHAT ────────────────────────────────────────────────
@router.post("/chat")
async def chat(request: dict):
    messages = request.get("messages", [])
    model = request.get("model", DEFAULT_MODEL)
    use_rag = request.get("use_rag", False)

    user_msg = messages[-1]["content"] if messages else ""

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
# one of them.

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


# In-memory store for pending (unconfirmed) memory proposals. Keyed by a
# short-lived proposal id; cleared on confirm/reject or app restart. This is
# intentionally not persisted — an unconfirmed proposal isn't a memory yet.
# Shared with routers/memory.py, which resolves proposals from this same dict.
PENDING_MEMORY_PROPOSALS = {}

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


def build_system_prompt(custom_preset: dict | None) -> str:
    """Combine the base tool-use rules with an optional custom agent preset.

    The preset's instructions are layered on top of (not instead of) the
    base prompt, so switching to a custom persona doesn't silently disable
    reliable tool-calling behavior (e.g. always searching documents before
    answering about them).
    """
    if not custom_preset:
        return AGENT_SYSTEM_PROMPT
    return (
        f"{AGENT_SYSTEM_PROMPT}\n\n"
        f"In addition, follow this persona/instructions for how you respond:\n"
        f"{custom_preset['system_prompt']}"
    )


# ── AGENT CHAT (STREAMING, TOOL-CALLING) ──────────────────────────────────────
@router.post("/chat/stream")
async def chat_stream(request: dict):
    import time
    from db import db_get_agent_preset, db_record_message_event

    messages = list(request.get("messages", []))
    agent_id = request.get("agent_id")
    custom_preset = db_get_agent_preset(agent_id) if agent_id else None

    if not messages or messages[0].get("role") != "system":
        messages = [{"role": "system", "content": build_system_prompt(custom_preset)}] + messages
    model = request.get("model", DEFAULT_MODEL)
    conversation_id = request.get("conversation_id")

    if conversation_id and messages and messages[-1].get("role") == "user":
        db_save_message(conversation_id, "user", messages[-1].get("content", ""))
        db_maybe_set_title(conversation_id, messages[-1].get("content", ""))

    async def event_gen():
        def sse(event: str, data: dict):
            return f"event: {event}\ndata: {json.dumps(data)}\n\n"

        turn_start = time.perf_counter()
        tools_used_this_turn = []

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
                latency_ms = int((time.perf_counter() - turn_start) * 1000)
                db_record_message_event(conversation_id, model, latency_ms, tools_used_this_turn, agent_id)
                yield sse("done", {})
                return

            messages.append(msg)
            for call in tool_calls:
                fn = call.get("function", {})
                name = fn.get("name", "")
                args = fn.get("arguments", {}) or {}
                tools_used_this_turn.append(name)

                if name == "propose_memory":
                    memory_text = args.get("memory_text", "").strip()
                    if not memory_text:
                        messages.append({"role": "tool", "tool_name": name, "content": "No memory text provided."})
                        continue
                    proposal_id = str(uuid.uuid4())
                    PENDING_MEMORY_PROPOSALS[proposal_id] = {"memory_text": memory_text, "messages": messages}
                    yield sse("memory_proposal", {"proposal_id": proposal_id, "memory_text": memory_text})
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

        latency_ms = int((time.perf_counter() - turn_start) * 1000)
        db_record_message_event(conversation_id, model, latency_ms, tools_used_this_turn, agent_id)
        yield sse("token", {"text": "Reached the maximum number of tool calls for this turn."})
        yield sse("done", {})

    return StreamingResponse(event_gen(), media_type="text/event-stream")
