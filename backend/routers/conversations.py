from fastapi import APIRouter, HTTPException

from db import (
    db_create_conversation,
    db_list_conversations,
    db_get_conversation,
    db_delete_conversation,
)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.post("")
async def create_conversation():
    conv_id = db_create_conversation()
    return {"id": conv_id, "title": "New chat"}


@router.get("")
async def list_conversations():
    return {"conversations": db_list_conversations()}


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str):
    conv = db_get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    db_delete_conversation(conversation_id)
    return {"status": "deleted", "id": conversation_id}
