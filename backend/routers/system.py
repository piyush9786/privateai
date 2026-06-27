import httpx
from fastapi import APIRouter, Depends

from config import OLLAMA_URL, CHROMA_HOST, CHROMA_PORT
from auth import get_current_user

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/status")
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


@router.get("/chromadb")
async def chromadb_stats(user: dict = Depends(get_current_user)):
    """Real ChromaDB internals — actual collection counts and a live-measured
    query latency, not invented numbers. No per-department breakdown exists
    since there's only one document vault and one memory store per user;
    this surfaces what's genuinely there instead of pretending otherwise.
    """
    import time
    from clients import get_collection, get_memory_collection, embed_text
    from config import EMBED_MODEL

    collections = []
    for label, getter in [("Document vault", get_collection), ("Memory store", get_memory_collection)]:
        entry = {"name": label, "count": 0, "query_ms": None, "reachable": False, "error": None}
        try:
            col = getter(user["id"])
            entry["count"] = col.count()
            entry["reachable"] = True
            if entry["count"] > 0:
                probe_embedding = embed_text("status check")
                start = time.perf_counter()
                col.query(query_embeddings=[probe_embedding], n_results=min(4, entry["count"]))
                entry["query_ms"] = round((time.perf_counter() - start) * 1000, 1)
        except Exception as e:
            entry["error"] = str(e)
        collections.append(entry)

    return {"embedding_model": EMBED_MODEL, "collections": collections}


@router.get("/deployment")
async def deployment_info(user: dict = Depends(get_current_user)):
    """An honest deployment summary: real service reachability and real,
    non-secret configuration — no fabricated uptime, restart counts, or
    container CPU/memory, since getting those for real would require
    mounting the Docker socket into the backend (a real privilege
    escalation risk this deployment has deliberately chosen not to take).
    """
    from config import DEFAULT_MODEL, EMBED_MODEL

    services = []

    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"{OLLAMA_URL}/api/tags")
            services.append({"name": "Ollama", "reachable": r.status_code == 200, "detail": OLLAMA_URL})
    except Exception:
        services.append({"name": "Ollama", "reachable": False, "detail": OLLAMA_URL})

    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"http://{CHROMA_HOST}:{CHROMA_PORT}/api/v1/heartbeat")
            services.append({
                "name": "ChromaDB",
                "reachable": r.status_code == 200,
                "detail": f"{CHROMA_HOST}:{CHROMA_PORT}",
            })
    except Exception:
        services.append({"name": "ChromaDB", "reachable": False, "detail": f"{CHROMA_HOST}:{CHROMA_PORT}"})

    # The backend answering this request at all is itself the reachability
    # proof — no network call needed to check on itself.
    services.append({"name": "Backend (FastAPI)", "reachable": True, "detail": "this process"})

    return {
        "services": services,
        "configuration": {
            "default_chat_model": DEFAULT_MODEL,
            "embedding_model": EMBED_MODEL,
        },
        "note": (
            "Container uptime, restart counts, and per-container CPU/memory aren't "
            "shown here — getting them for real requires mounting the Docker socket "
            "into the backend, which grants broad control over the Docker host. This "
            "deployment doesn't take that tradeoff for a status page."
        ),
    }
