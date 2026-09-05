from fastapi import APIRouter, HTTPException, status, Response
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from lib.db import db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

@router.post("/signup")
async def signup(user_data: SignupRequest, response: Response):
    try:
        # Check if email exists
        existing_user = await db.users.find_one({"email": user_data.email.lower()})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este e-mail já está cadastrado"
            )

        # Hash password securely
        hashed_password = pwd_context.hash(user_data.password)

        new_user = {
            "name": user_data.name,
            "email": user_data.email.lower(),
            "password_hash": hashed_password
        }

        result = await db.users.insert_one(new_user)
        return {"message": "Usuário criado com sucesso", "id": str(result.inserted_id)}

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Erro no signup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao criar conta: {str(e)}"
        )
