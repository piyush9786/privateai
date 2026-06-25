from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user, require_admin
from clients import get_collection, get_memory_collection
from db import (
    db_list_users,
    db_get_user_by_id,
    db_delete_user,
    db_list_conversations,
    db_list_documents,
    db_list_agent_presets,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
async def list_users(admin: dict = Depends(require_admin)):
    return {"users": db_list_users()}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="You can't delete your own account from the admin panel.")
    target = db_get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    db_delete_user(user_id)
    return {"status": "deleted", "user_id": user_id}


@router.get("/users/{user_id}/overview")
async def user_overview(user_id: str, admin: dict = Depends(require_admin)):
    """A read-only summary of one user's data — counts only, not full
    content, to keep this useful for moderation/support without being a
    free pass to casually browse everyone's private documents and chats.
    """
    target = db_get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    conversations = db_list_conversations(user_id)
    documents = db_list_documents(user_id)
    agents = db_list_agent_presets(user_id)

    doc_chunks = 0
    memory_count = 0
    try:
        doc_chunks = get_collection(user_id).count()
    except Exception:
        pass
    try:
        memory_count = get_memory_collection(user_id).count()
    except Exception:
        pass

    return {
        "user": {
            "id": target["id"],
            "email": target["email"],
            "display_name": target["display_name"],
            "role": target["role"],
            "created_at": target["created_at"],
        },
        "conversation_count": len(conversations),
        "document_count": len(documents),
        "agent_count": len(agents),
        "indexed_chunks": doc_chunks,
        "memory_count": memory_count,
    }
