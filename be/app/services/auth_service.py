"""Authentication service."""
from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import User, UserRole
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token, decode_token
)
from app.core.config import get_settings
from app.schemas.schemas import LoginRequest, TokenResponse

settings = get_settings()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    from sqlalchemy import func
    clean_user = username.strip().lower()
    user = db.query(User).filter(func.lower(User.username) == clean_user).first()
    if not user or not user.is_active:
        return None
    if verify_password(password, user.hashed_password):
        return user
    return None


def login(db: Session, data: LoginRequest) -> TokenResponse:
    user = authenticate_user(db, data.username, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role.value}
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


def refresh_access_token(refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_access = create_access_token(
        data={
            "sub": payload["sub"],
            "username": payload.get("username"),
            "role": payload.get("role"),
        }
    )
    new_refresh = create_refresh_token(
        data={
            "sub": payload["sub"],
            "username": payload.get("username"),
            "role": payload.get("role"),
        }
    )
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


def create_admin_user(db: Session, username: str, password: str, email: Optional[str] = None) -> User:
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise ValueError(f"User '{username}' already exists")

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        role=UserRole.admin,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def require_admin(payload: dict) -> dict:
    if payload.get("role") != UserRole.admin.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return payload


def get_user_id_from_payload(payload: dict) -> int:
    return int(payload["sub"])
