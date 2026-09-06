import os
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request, Response, status
from passlib.context import CryptContext

from lib.db import db
from models.auth import UserPublic

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=ALGORITHM)


def set_session_cookie(response: Response, token: str) -> None:
    """Define o cookie HttpOnly preparado para comunicação Vercel -> Render (Cross-Site)"""
    response.set_cookie(
        key="cashcontrol_session",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    """Remove o cookie de sessão na resposta da rota de logout"""
    response.delete_cookie(
        key="cashcontrol_session",
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )


async def optional_user(request: Request) -> UserPublic | None:
    token = request.cookies.get("cashcontrol_session")
    if not token:
        return None
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[ALGORITHM])
        user_id = str(payload["sub"])
    except (jwt.PyJWTError, KeyError):
        return None
        
    user = await db.users.find_one({"id": user_id})
    if not user:
        return None
    return UserPublic(id=user["id"], name=user["name"], email=user["email"])


async def current_user(request: Request) -> UserPublic:
    user = await optional_user(request)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão necessária")
    return user


def new_user_id() -> str:
    return str(uuid.uuid4())
