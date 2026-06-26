from fastapi import APIRouter, Depends

from auth import get_current_user, require_admin
from db import db_list_audit_log, db_count_failed_logins_since

router = APIRouter(prefix="/api/security", tags=["security"])


@router.get("/audit-log")
async def my_audit_log(user: dict = Depends(get_current_user)):
    """A user's own login/logout history."""
    return {"events": db_list_audit_log(user_id=user["id"])}


@router.get("/audit-log/all")
async def all_audit_log(admin: dict = Depends(require_admin)):
    """Admin-only: every account's login/logout/register activity."""
    return {"events": db_list_audit_log(user_id=None)}


@router.get("/status")
async def security_status(user: dict = Depends(get_current_user)):
    """An honest summary of what's actually protecting this deployment —
    no invented score, no claims about MFA/encryption/air-gapping that
    aren't true. What you see here is genuinely true of this app today.
    """
    failed_logins_24h = db_count_failed_logins_since(hours=24)

    return {
        "protections": [
            {
                "name": "Password authentication",
                "active": True,
                "detail": "Passwords hashed with bcrypt, never stored in plaintext.",
            },
            {
                "name": "Per-user data isolation",
                "active": True,
                "detail": "Each account has its own documents, conversations, and memories — not shared across users.",
            },
            {
                "name": "Session cookies",
                "active": True,
                "detail": "httpOnly, SameSite=Lax — not readable by page JavaScript.",
            },
            {
                "name": "Multi-factor authentication",
                "active": False,
                "detail": "Not implemented. Password alone is sufficient to sign in.",
            },
            {
                "name": "Transport encryption (HTTPS)",
                "active": False,
                "detail": "This deployment serves plain HTTP by default. Add a TLS-terminating reverse proxy if exposing beyond localhost.",
            },
            {
                "name": "Air-gapped / no internet access",
                "active": False,
                "detail": "Inference and storage are local, but this machine still has normal internet access (e.g. to pull new models).",
            },
        ],
        "failed_logins_24h": failed_logins_24h,
    }
