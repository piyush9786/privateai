from fastapi import APIRouter, HTTPException

from clients import get_memory_collection
from routers.chat import PENDING_MEMORY_PROPOSALS, save_confirmed_memory

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.post("/confirm")
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


@router.get("/list")
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


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    mem_col = get_memory_collection()
    mem_col.delete(ids=[memory_id])
    return {"status": "deleted", "memory_id": memory_id}
