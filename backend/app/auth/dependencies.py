"""
Unified FastAPI dependency helpers for JWT auth and role-based access.
Supports both BNI (admin/user) and CricPro (organizer/player/scorer) roles.
"""
import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import decode_token
from app.database import get_db
from app.models import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


async def _get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise exc

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise exc

    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise exc

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise exc

    result = await db.execute(select(User).where(User.id == user_id))
    user: Optional[User] = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise exc

    return user


async def get_current_user(user: User = Depends(_get_current_user)) -> User:
    return user


# BNI admin check
async def require_admin(user: User = Depends(_get_current_user)) -> User:
    if user.role not in (UserRole.admin,):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return user


# CricPro: admin or organizer
async def require_organizer(user: User = Depends(_get_current_user)) -> User:
    if user.role not in (UserRole.admin, UserRole.organizer):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organizer access required.")
    return user


# CricPro: scorer or admin
async def require_scorer(user: User = Depends(_get_current_user)) -> User:
    if user.role not in (UserRole.admin, UserRole.organizer, UserRole.scorer):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Scorer access required.")
    return user


# Optional auth (returns None if not authenticated)
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        return await _get_current_user(credentials, db)
    except HTTPException:
        return None
