"""Authentication API routes."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.schemas import LoginRequest, TokenResponse, RefreshRequest, UserOut, MessageResponse
from app.services.auth_service import login, refresh_access_token
from app.core.security import get_current_user_payload
from app.models.models import User

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=TokenResponse)
def login_route(data: LoginRequest, db: Session = Depends(get_db)):
    return login(db, data)


@router.post("/refresh", response_model=TokenResponse)
def refresh_route(data: RefreshRequest):
    return refresh_access_token(data.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout_route(payload: dict = Depends(get_current_user_payload)):
    # Stateless JWT — client discards the token
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserOut)
def me_route(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return user
