"""Password hashing, JWT issuance/verification, and the FastAPI dependencies
every other router uses to find out who's making a request.

Uses bcrypt directly rather than passlib — passlib is unmaintained and its
CryptContext has broken compatibility with recent bcrypt releases (see
https://github.com/fastapi/fastapi/discussions/11773). Plain bcrypt has no
such issue and is the currently-recommended approach.
"""
import datetime

import bcrypt
from fastapi import Cookie, Depends, HTTPException, status
from jose import jwt, JWTError

from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS
from db import db_get_user_by_id

COOKIE_NAME = "privateai_session"


def hash_password(password: str) -> str:
    # bcrypt has a hard 72-byte input limit; truncate defensively rather
    # than let it raise on unusually long input.
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


async def get_current_user(privateai_session: str | None = Cookie(default=None)) -> dict:
    """Resolves the session cookie into a real user row. Raises 401 if
    there's no valid session — callers that need an authenticated user
    should depend on this directly."""
    if not privateai_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_access_token(privateai_session)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    user = db_get_user_by_id(payload.get("sub", ""))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """A FastAPI dependency: resolves the current user (raising 401 if not
    authenticated, via get_current_user), then additionally requires
    role == 'admin' (raising 403 otherwise). Use this directly in a route's
    parameters wherever admin-only access is required."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
