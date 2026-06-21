"""
Admin user management routes (hidden, admin-only).
"""
import uuid
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models import User, UserRole
from app.schemas.schemas import ResponseEnvelope, PaginatedMeta, PaginatedResponse, UserOut

router = APIRouter(prefix="/admin/users", tags=["Admin — Users"])


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: str
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.user


class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


@router.get("", response_model=PaginatedResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    total = (await db.execute(select(func.count(User.id)))).scalar_one()
    rows = (
        await db.execute(
            select(User).order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
    ).scalars().all()
    return PaginatedResponse(
        data=[UserOut.model_validate(u) for u in rows],
        meta=PaginatedMeta(total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size)),
    )


@router.post("", response_model=ResponseEnvelope, status_code=201)
async def create_user(body: CreateUserRequest, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    dup = (await db.execute(select(User).where(User.username == body.username))).scalar_one_or_none()
    if dup:
        raise HTTPException(status_code=409, detail="Username already taken.")
    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return ResponseEnvelope(message="User created.", data=UserOut.model_validate(user))


@router.put("/{user_id}", response_model=ResponseEnvelope)
async def update_user(user_id: uuid.UUID, body: UpdateUserRequest, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    user: Optional[User] = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if body.email:
        user.email = body.email
    if body.password:
        user.hashed_password = hash_password(body.password)
    if body.role:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    await db.commit()
    await db.refresh(user)
    return ResponseEnvelope(message="User updated.", data=UserOut.model_validate(user))


@router.delete("/{user_id}", response_model=ResponseEnvelope)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself.")
    user: Optional[User] = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    await db.delete(user)
    await db.commit()
    return ResponseEnvelope(message="User deleted.")
