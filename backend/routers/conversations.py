from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from db import (
    db_create_conversation,
    db_list_conversations,
    db_get_conversation,
    db_delete_conversation,
)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.post("")
async def create_conversation(user: dict = Depends(get_current_user)):
    conv_id = db_create_conversation(user["id"])
    return {"id": conv_id, "title": "New chat"}


@router.get("")
async def list_conversations(user: dict = Depends(get_current_user)):
    return {"conversations": db_list_conversations(user["id"])}


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    conv = db_get_conversation(user["id"], conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    deleted = db_delete_conversation(user["id"], conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted", "id": conversation_id}
