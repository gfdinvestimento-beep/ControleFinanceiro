import os
import logging
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import APIRouter, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from lib.db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
COOKIE_NAME = "cashcontrol_session"

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

def create_token(user_id: str) -> str:
    secret = os.environ.get("JWT_SECRET", "fallback-secret-key-change-it")
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, secret, algorithm=ALGORITHM)

def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        partitioned=True,
        max_age=7 * 24 * 3600
    )

@router.post("/signup")
async def signup(user_data: SignupRequest, response: Response):
    try:
        existing_user = await db.users.find_one({"email": user_data.email.lower()})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este e-mail já está cadastrado"
            )

        hashed_password = pwd_context.hash(user_data.password)
        new_user = {
            "id": str(db.users.inline_id if hasattr(db.users, 'inline_id') else os.urandom(8).hex()),
            "name": user_data.name,
            "email": user_data.email.lower(),
            "password_hash": hashed_password
        }

        result = await db.users.insert_one(new_user)
        user_id = new_user["id"]
        
        token = create_token(user_id)
        set_session_cookie(response, token)

        return {"message": "Usuário criado com sucesso", "id": user_id, "name": new_user["name"], "email": new_user["email"]}

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Erro no signup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao criar conta: {str(e)}"
        )

@router.post("/login")
async def login(credentials: LoginRequest, response: Response):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not pwd_context.verify(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )

    user_id = user.get("id", str(user.get("_id")))
    token = create_token(user_id)
    set_session_cookie(response, token)

    return {"id": user_id, "name": user.get("name"), "email": user.get("email")}

@router.get("/session")
async def get_session(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        secret = os.environ.get("JWT_SECRET", "fallback-secret-key-change-it")
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        user_id = str(payload["sub"])
    except (jwt.PyJWTError, KeyError):
        return None

    user = await db.users.find_one({"id": user_id})
    if not user:
        user = await db.users.find_one({"_id": user_id})
    if not user:
        return None

    return {"id": str(user.get("id", user.get("_id"))), "name": user.get("name"), "email": user.get("email")}

@router.post("/logout", status_code=204)
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, samesite="none", secure=True)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
