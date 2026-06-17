import os, io, json, uuid, base64, tempfile
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

app.mount("/exports", StaticFiles(directory=str(EXPORT_DIR)), name="exports")

chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
embeddings = OllamaEmbeddings(model=EMBED_MODEL, base_url=OLLAMA_URL)

def get_collection():
    return chroma_client.get_or_create_collection("privateai_docs")

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

# ── FILE UPLOAD + RAG INGEST ──────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix.lower()
    tmp_path = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"
    
    content = await file.read()
    tmp_path.write_bytes(content)
    
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
            return {"status": "unsupported", "message": f"File type {suffix} not supported for RAG"}
        
        if text:
            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.split_text(text)
            col = get_collection()
            embeddings_list = [embed_text(c) for c in chunks]
            ids = [str(uuid.uuid4()) for _ in chunks]
            metadatas = [{"source": file.filename, "chunk": i} for i in range(len(chunks))]
            col.add(documents=chunks, embeddings=embeddings_list, ids=ids, metadatas=metadatas)
        
        return {"status": "ok", "filename": file.filename, "chunks": len(chunks) if text else 0, "preview": text[:500]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    suffix = Path(file.filename).suffix.lower()
    tmp = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"
    tmp.write_bytes(await file.read())
    
    r = sr.Recognizer()
    try:
        with sr.AudioFile(str(tmp)) as source:
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

