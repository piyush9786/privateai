import os
import uuid
import logging
import time
from pathlib import Path
from typing import Optional, AsyncGenerator

import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import chromadb
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma

OLLAMA_URL    = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
CHROMA_HOST   = os.getenv("CHROMADB_HOST", "chromadb")
CHROMA_PORT   = int(os.getenv("CHROMADB_PORT", "8000"))
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3.2")
EMBED_MODEL   = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHUNK_SIZE    = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))
UPLOAD_DIR    = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("privateai")

CHROMA_URL = f"http://{CHROMA_HOST}:{CHROMA_PORT}"

# BUG FIX 4: Wait for ChromaDB before creating client — prevents startup crash
def wait_for_chroma(retries=30, delay=3):
    for i in range(retries):
        try:
            r = httpx.get(f"{CHROMA_URL}/api/v1/heartbeat", timeout=3)
            if r.status_code == 200:
                logger.info("✅ ChromaDB is ready!")
                return
        except Exception:
            pass
        logger.info(f"Waiting for ChromaDB... ({i+1}/{retries})")
        time.sleep(delay)
    raise RuntimeError("ChromaDB did not become ready in time.")

wait_for_chroma()

chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)

app = FastAPI(title="PrivateAI API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def get_vectorstore(collection: str = "documents") -> Chroma:
    embeddings = OllamaEmbeddings(model=EMBED_MODEL, base_url=OLLAMA_URL)
    return Chroma(client=chroma_client, collection_name=collection, embedding_function=embeddings)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: Optional[str] = None
    use_rag: bool = False
    collection: Optional[str] = "documents"
    stream: bool = True
    temperature: Optional[float] = 0.7

# BUG FIX 5: health() is now fully async HTTP — no blocking calls that deadlock the event loop
@app.get("/health")
async def health():
    status = {"api": "ok", "ollama": "unknown", "chromadb": "unknown"}
    async with httpx.AsyncClient(timeout=5) as client:
        try:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            status["ollama"] = "ok" if r.status_code == 200 else "error"
        except Exception:
            status["ollama"] = "unreachable"
        try:
            r = await client.get(f"{CHROMA_URL}/api/v1/heartbeat")
            status["chromadb"] = "ok" if r.status_code == 200 else "error"
        except Exception:
            status["chromadb"] = "unreachable"
    return status

@app.get("/api/models")
async def list_models():
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{OLLAMA_URL}/api/tags")
        r.raise_for_status()
        return r.json()

@app.post("/api/models/pull")
async def pull_model(body: dict):
    name = body.get("name")
    if not name:
        raise HTTPException(400, "model name required")
    async def _stream():
        async with httpx.AsyncClient(timeout=600) as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/pull", json={"name": name}) as r:
                async for chunk in r.aiter_text():
                    yield chunk
    return StreamingResponse(_stream(), media_type="application/x-ndjson")

@app.delete("/api/models/{name}")
async def delete_model(name: str):
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.delete(f"{OLLAMA_URL}/api/delete", json={"name": name})
        r.raise_for_status()
        return {"deleted": name}

@app.post("/api/chat")
async def chat(req: ChatRequest):
    model = req.model or DEFAULT_MODEL
    messages = [m.model_dump() for m in req.messages]

    # BUG FIX 6: Build rag_sources BEFORE the stream closure — prevents scope crash
    rag_sources: list[str] = []

    if req.use_rag and req.messages:
        query = req.messages[-1].content
        try:
            vs = get_vectorstore(req.collection or "documents")
            docs = vs.similarity_search(query, k=4)
            if docs:
                context = "\n\n---\n\n".join(d.page_content for d in docs)
                rag_sources = list({d.metadata.get("source", "unknown") for d in docs})
                system_prompt = (
                    "You are a helpful private AI assistant. "
                    "Answer ONLY using the context below. "
                    "If the answer is not in the context, say so clearly.\n\n"
                    f"CONTEXT:\n{context}"
                )
                messages = [{"role": "system", "content": system_prompt}] + messages
        except Exception as e:
            logger.warning(f"RAG retrieval failed: {e}")

    payload = {
        "model": model,
        "messages": messages,
        "stream": req.stream,
        "options": {"temperature": req.temperature},
    }

    if req.stream:
        captured_sources = rag_sources[:]  # capture copy before async closure

        async def _stream() -> AsyncGenerator[str, None]:
            async with httpx.AsyncClient(timeout=600) as client:
                async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as r:
                    async for line in r.aiter_lines():
                        if line.strip():
                            yield f"data: {line}\n\n"
            if captured_sources:
                import json
                sources_str = ", ".join(captured_sources)
                citation = json.dumps({"message": {"content": f"\n\n---\n📎 **Sources:** {sources_str}"}})
                yield f"data: {citation}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(_stream(), media_type="text/event-stream")
    else:
        async with httpx.AsyncClient(timeout=600) as client:
            r = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            r.raise_for_status()
            return r.json()

SUPPORTED = {".pdf", ".docx", ".txt", ".md"}

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    collection: str = "documents",
    background_tasks: BackgroundTasks = None,
):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in SUPPORTED:
        raise HTTPException(400, f"Unsupported type. Supported: {SUPPORTED}")
    doc_id = str(uuid.uuid4())
    save_path = UPLOAD_DIR / f"{doc_id}{suffix}"
    save_path.write_bytes(await file.read())
    background_tasks.add_task(_ingest, save_path, file.filename, collection, doc_id)
    return {"doc_id": doc_id, "filename": file.filename, "status": "processing"}

async def _ingest(path: Path, original_name: str, collection: str, doc_id: str):
    try:
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            loader = PyPDFLoader(str(path))
        elif suffix == ".docx":
            loader = Docx2txtLoader(str(path))
        else:
            loader = TextLoader(str(path))
        docs = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
        chunks = splitter.split_documents(docs)
        for chunk in chunks:
            chunk.metadata["source"] = original_name
            chunk.metadata["doc_id"] = doc_id
        vs = get_vectorstore(collection)
        vs.add_documents(chunks)
        logger.info(f"Ingested {len(chunks)} chunks from {original_name}")
    except Exception as e:
        logger.error(f"Ingestion failed for {original_name}: {e}")

@app.get("/api/documents")
async def list_documents(collection: str = "documents"):
    try:
        col = chroma_client.get_or_create_collection(collection)
        results = col.get(include=["metadatas"])
        seen = {}
        for meta in results["metadatas"]:
            did = meta.get("doc_id", "unknown")
            if did not in seen:
                seen[did] = {"doc_id": did, "source": meta.get("source", "unknown")}
        return {"documents": list(seen.values()), "collection": collection}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, collection: str = "documents"):
    try:
        col = chroma_client.get_or_create_collection(collection)
        results = col.get(where={"doc_id": {"$eq": doc_id}})
        if results["ids"]:
            col.delete(ids=results["ids"])
        return {"deleted": doc_id, "chunks_removed": len(results["ids"])}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/collections")
async def list_collections():
    cols = chroma_client.list_collections()
    return {"collections": [c.name for c in cols]}

@app.post("/api/collections")
async def create_collection(body: dict):
    name = body.get("name")
    if not name:
        raise HTTPException(400, "name required")
    chroma_client.get_or_create_collection(name)
    return {"created": name}

@app.delete("/api/collections/{name}")
async def delete_collection(name: str):
    chroma_client.delete_collection(name)
    return {"deleted": name}
