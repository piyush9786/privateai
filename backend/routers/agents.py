from fastapi import APIRouter, HTTPException

from db import (
    db_create_agent_preset,
    db_list_agent_presets,
    db_get_agent_preset,
    db_update_agent_preset,
    db_delete_agent_preset,
)

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.post("")
async def create_agent(request: dict):
    name = request.get("name", "").strip()
    description = request.get("description", "").strip()
    system_prompt = request.get("system_prompt", "").strip()
    if not name or not system_prompt:
        raise HTTPException(status_code=400, detail="name and system_prompt are required")
    preset_id = db_create_agent_preset(name, description, system_prompt)
    return {"id": preset_id}


@router.get("")
async def list_agents():
    return {"agents": db_list_agent_presets()}


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    preset = db_get_agent_preset(agent_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Agent preset not found")
    return preset


@router.put("/{agent_id}")
async def update_agent(agent_id: str, request: dict):
    name = request.get("name", "").strip()
    description = request.get("description", "").strip()
    system_prompt = request.get("system_prompt", "").strip()
    if not name or not system_prompt:
        raise HTTPException(status_code=400, detail="name and system_prompt are required")
    updated = db_update_agent_preset(agent_id, name, description, system_prompt)
    if not updated:
        raise HTTPException(status_code=404, detail="Agent preset not found")
    return {"status": "updated", "id": agent_id}


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    db_delete_agent_preset(agent_id)
    return {"status": "deleted", "id": agent_id}
