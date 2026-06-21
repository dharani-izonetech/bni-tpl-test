"""
Auth routes: login, refresh, logout, current user.
"""
from datetime import datetime, timezone, timedelta
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, RefreshToken, UserRole
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings
from app.schemas.schemas import AdminLoginRequest, TokenResponse, RefreshRequest, ResponseEnvelope, UserOut
from app.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)


@router.post("/login", response_model=TokenResponse, summary="Admin / User login")
async def login(body: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.username == body.username))
        user: User | None = result.scalar_one_or_none()
    except Exception as e:
        logger.exception("DB query failed during login: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")

    if not user or not verify_password(body.password, user.hashed_password) or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    access = create_access_token(str(user.id), role=user.role.value)
    refresh = create_refresh_token(str(user.id), role=user.role.value)

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(user_id=user.id, token=refresh, expires_at=expires_at))
    await db.commit()

    return TokenResponse(access_token=access, refresh_token=refresh, role=user.role.value)


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token == body.refresh_token,
            RefreshToken.revoked == False,  # noqa: E712
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    stored: RefreshToken | None = result.scalar_one_or_none()
    if not stored:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked.")

    # Rotate
    stored.revoked = True
    user_result = await db.execute(select(User).where(User.id == stored.user_id))
    user: User = user_result.scalar_one()

    access = create_access_token(str(user.id), role=user.role.value)
    new_refresh = create_refresh_token(str(user.id), role=user.role.value)

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(user_id=user.id, token=new_refresh, expires_at=expires_at))
    await db.commit()

    return TokenResponse(access_token=access, refresh_token=new_refresh, role=user.role.value)


@router.post("/logout", response_model=ResponseEnvelope, summary="Logout — revoke refresh token")
async def logout(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RefreshToken).where(RefreshToken.token == body.refresh_token))
    stored: RefreshToken | None = result.scalar_one_or_none()
    if stored:
        stored.revoked = True
        await db.commit()
    return ResponseEnvelope(message="Logged out successfully.")


@router.get("/me", response_model=UserOut, summary="Current user info")
async def me(user: User = Depends(get_current_user)):
    return user
