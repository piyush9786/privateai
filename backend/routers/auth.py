from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from auth import hash_password, verify_password, create_access_token, get_current_user, COOKIE_NAME
from db import db_count_users, db_create_user, db_get_user_by_email, db_record_audit_event

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _client_ip(request: Request) -> str:
    # Behind nginx, the real client IP is in X-Real-IP (set in nginx.conf);
    # fall back to the direct connection IP if that header isn't present.
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")


@router.post("/register")
async def register(request: dict, http_request: Request, response: Response):
    email = request.get("email", "").strip().lower()
    password = request.get("password", "")
    display_name = request.get("display_name", "").strip() or email.split("@")[0]

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email is required")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    if db_get_user_by_email(email):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    # The very first account ever created becomes the admin; everyone
    # after that is a regular user.
    role = "admin" if db_count_users() == 0 else "user"

    user_id = db_create_user(email, hash_password(password), display_name, role)
    token = create_access_token(user_id, role)
    db_record_audit_event(email, "register", _client_ip(http_request), user_id)

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )
    return {"id": user_id, "email": email, "display_name": display_name, "role": role}


@router.post("/login")
async def login(request: dict, http_request: Request, response: Response):
    email = request.get("email", "").strip().lower()
    password = request.get("password", "")
    ip = _client_ip(http_request)

    user = db_get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        # Deliberately the same error for "no such user" and "wrong
        # password" — don't leak which emails are registered. The audit
        # log still records the attempted email either way, for real
        # security monitoring, without claiming it belongs to a real user
        # when it doesn't (user_id stays None in that case).
        db_record_audit_event(email, "login_failed", ip, user["id"] if user else None)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token(user["id"], user["role"])
    db_record_audit_event(email, "login_success", ip, user["id"])

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )
    return {
        "id": user["id"],
        "email": user["email"],
        "display_name": user["display_name"],
        "role": user["role"],
    }


@router.post("/logout")
async def logout(http_request: Request, response: Response, user: dict = Depends(get_current_user)):
    db_record_audit_event(user["email"], "logout", _client_ip(http_request), user["id"])
    response.delete_cookie(COOKIE_NAME)
    return {"status": "logged_out"}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "display_name": user["display_name"],
        "role": user["role"],
    }
