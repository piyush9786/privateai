from fastapi import APIRouter, Depends, HTTPException, Response, status

from auth import hash_password, verify_password, create_access_token, get_current_user, COOKIE_NAME
from db import db_count_users, db_create_user, db_get_user_by_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
async def register(request: dict, response: Response):
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

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )
    return {"id": user_id, "email": email, "display_name": display_name, "role": role}


@router.post("/login")
async def login(request: dict, response: Response):
    email = request.get("email", "").strip().lower()
    password = request.get("password", "")

    user = db_get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        # Deliberately the same error for "no such user" and "wrong
        # password" — don't leak which emails are registered.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token(user["id"], user["role"])
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
async def logout(response: Response):
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
