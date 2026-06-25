from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from clients import get_memory_collection
from routers.chat import PENDING_MEMORY_PROPOSALS, save_confirmed_memory

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.post("/confirm")
async def confirm_memory(request: dict, user: dict = Depends(get_current_user)):
    """Called when the user approves or rejects a pending memory proposal."""
    proposal_id = request.get("proposal_id", "")
    approved = bool(request.get("approved", False))

    proposal = PENDING_MEMORY_PROPOSALS.get(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or already resolved.")
    if proposal["user_id"] != user["id"]:
        # Don't reveal that the proposal exists for someone else — same
        # 404 as "not found" rather than a 403 that confirms its existence.
        raise HTTPException(status_code=404, detail="Proposal not found or already resolved.")

    PENDING_MEMORY_PROPOSALS.pop(proposal_id, None)

    if not approved:
        return {"status": "rejected"}

    mem_id = save_confirmed_memory(user["id"], proposal["memory_text"])
    return {"status": "saved", "memory_id": mem_id, "memory_text": proposal["memory_text"]}


@router.get("/list")
async def list_memories(user: dict = Depends(get_current_user)):
    mem_col = get_memory_collection(user["id"])
    if mem_col.count() == 0:
        return {"memories": []}
    results = mem_col.get()
    memories = [
        {"id": _id, "text": doc}
        for _id, doc in zip(results.get("ids", []), results.get("documents", []))
    ]
    return {"memories": memories}


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, user: dict = Depends(get_current_user)):
    mem_col = get_memory_collection(user["id"])
    mem_col.delete(ids=[memory_id])
    return {"status": "deleted", "memory_id": memory_id}
