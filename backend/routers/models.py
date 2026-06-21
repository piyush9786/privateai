import json

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from config import OLLAMA_URL, CURATED_MODEL_CATALOG

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("")
async def list_models():
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.get(f"{OLLAMA_URL}/api/tags")
        return r.json()


@router.get("/catalog")
async def model_catalog():
    return {"catalog": CURATED_MODEL_CATALOG}


@router.post("/pull")
async def pull_model(request: dict):
    model_name = request.get("name", "").strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name is required")

    async def event_gen():
        def sse(event: str, data: dict):
            return f"event: {event}\ndata: {json.dumps(data)}\n\n"
        try:
            async with httpx.AsyncClient(timeout=None) as c:
                async with c.stream("POST", f"{OLLAMA_URL}/api/pull", json={"name": model_name}) as resp:
                    async for line in resp.aiter_lines():
                        if not line.strip():
                            continue
                        try:
                            payload = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        yield sse("progress", payload)
                        if payload.get("status") == "success":
                            yield sse("done", {"name": model_name})
        except Exception as e:
            yield sse("error", {"message": str(e)})

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@router.delete("/{model_name}")
async def delete_model(model_name: str):
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.request("DELETE", f"{OLLAMA_URL}/api/delete", json={"name": model_name})
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=f"Failed to delete {model_name}")
        return {"status": "deleted", "name": model_name}
