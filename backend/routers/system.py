import httpx
from fastapi import APIRouter

from config import OLLAMA_URL, CHROMA_HOST, CHROMA_PORT

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
