from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from lib.auth import create_token, current_user, hash_password, new_user_id, optional_user, verify_password
from lib.db import db
from models.auth import LoginRequest, SignupRequest, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


def secure_cookie(request: Request) -> bool:
    return request.headers.get("x-forwarded-proto", request.url.scheme) == "https"


def set_session_cookie(response: Response, request: Request, token: str) -> None:
    if secure_cookie(request):
        response.headers.append(
            "set-cookie",
            f"cashcontrol_session={token}; Path=/; Max-Age={60 * 60 * 24 * 7}; HttpOnly; Secure; SameSite=None; Partitioned",
        )
        return
    response.set_cookie("cashcontrol_session", token, httponly=True, secure=False, samesite="lax", max_age=60 * 60 * 24 * 7)


def clear_session_cookie(response: Response, request: Request) -> None:
    if secure_cookie(request):
        response.headers.append(
            "set-cookie",
            "cashcontrol_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None; Partitioned",
        )
        return
    response.delete_cookie("cashcontrol_session", httponly=True, secure=False, samesite="lax")


@router.post("/signup", response_model=UserPublic)
async def signup(input: SignupRequest, response: Response, request: Request):
    email = str(input.email).lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado")
    user = {"id": new_user_id(), "name": input.name.strip(), "email": email, "password_hash": hash_password(input.password)}
    await db.users.insert_one(user)
    set_session_cookie(response, request, create_token(user["id"]))
    return UserPublic(id=user["id"], name=user["name"], email=user["email"])


@router.post("/login", response_model=UserPublic)
async def login(input: LoginRequest, response: Response, request: Request):
    user = await db.users.find_one({"email": str(input.email).lower()})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha incorretos")
    set_session_cookie(response, request, create_token(user["id"]))
    return UserPublic(id=user["id"], name=user["name"], email=user["email"])


@router.get("/me", response_model=UserPublic)
async def me(user: UserPublic = Depends(current_user)):
    return user


@router.get("/session", response_model=UserPublic | None)
async def session(user: UserPublic | None = Depends(optional_user)):
    return user


@router.post("/logout", status_code=204)
async def logout(response: Response, request: Request):
    clear_session_cookie(response, request)
