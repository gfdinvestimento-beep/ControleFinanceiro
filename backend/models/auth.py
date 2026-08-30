from pydantic import BaseModel, EmailStr, Field


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
