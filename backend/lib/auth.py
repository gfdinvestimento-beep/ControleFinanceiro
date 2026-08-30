import os
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request, status
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


async def current_user(request: Request) -> UserPublic:
    token = request.cookies.get("cashcontrol_session")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão necessária")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[ALGORITHM])
        user_id = str(payload["sub"])
    except (jwt.PyJWTError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida")
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")
    return UserPublic(id=user["id"], name=user["name"], email=user["email"])


def new_user_id() -> str:
    return str(uuid.uuid4())
