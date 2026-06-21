"""
Media routes — video links saved to DB; video/image files stored as base64 (MinIO disabled).
"""
import base64
import uuid
import logging
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.database import get_db
from app.models import MediaFile, MediaType, User
from app.schemas.schemas import (
    MediaFileOut, ResponseEnvelope, PaginatedMeta, PaginatedResponse, VideoLinkCreate,
)

router = APIRouter(prefix="/media", tags=["Media"])
logger = logging.getLogger(__name__)

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/avi", "video/mov", "video/mkv", "video/quicktime"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_VIDEO_BYTES = 100 * 1024 * 1024   # 100 MB (stored as base64 in DB)
MAX_IMAGE_BYTES = 10 * 1024 * 1024    # 10 MB


# ── Upload video file (base64 stored in DB) ────────────────────────────────

@router.post("/upload/video", response_model=ResponseEnvelope, status_code=201,
             summary="Upload a video file — stored as base64 in DB (admin)")
async def upload_video(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=422, detail="Unsupported video format.")

    content = await file.read()
    if len(content) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=422, detail="Video must be under 100 MB.")

    b64 = base64.b64encode(content).decode("utf-8")
    data_uri = f"data:{file.content_type};base64,{b64}"

    media = MediaFile(
        filename=f"{uuid.uuid4().hex}_{file.filename}",
        original_filename=file.filename or "video",
        media_type=MediaType.video_file,
        bucket="",           # no MinIO
        object_key="",       # no MinIO
        public_url=data_uri, # base64 data URI served directly
        size_bytes=len(content),
        mime_type=file.content_type,
        uploaded_by=admin.id,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return ResponseEnvelope(message="Video uploaded.", data=MediaFileOut.model_validate(media))


# ── Add video link (YouTube / external) ───────────────────────────────────

@router.post("/links/video", response_model=ResponseEnvelope, status_code=201,
             summary="Save a YouTube / video embed link (admin)")
async def add_video_link(
    body: VideoLinkCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    media = MediaFile(
        filename=body.title,
        original_filename=body.title,
        media_type=MediaType.video_link,
        bucket="",
        object_key="",
        embed_url=body.embed_url,
        uploaded_by=admin.id,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return ResponseEnvelope(message="Video link saved.", data=MediaFileOut.model_validate(media))


# ── Upload image (base64 stored in DB) ────────────────────────────────────

@router.post("/upload/image", response_model=ResponseEnvelope, status_code=201,
             summary="Upload an image — stored as base64 in DB (admin)")
async def upload_image(
    file: UploadFile = File(...),
    prefix: str = Form(default="images"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=422, detail="Unsupported image format.")
    content = await file.read()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=422, detail="Image must be under 10 MB.")

    b64 = base64.b64encode(content).decode("utf-8")
    data_uri = f"data:{file.content_type};base64,{b64}"

    media = MediaFile(
        filename=f"{uuid.uuid4().hex}_{file.filename}",
        original_filename=file.filename or "image",
        media_type=MediaType.image,
        bucket="",
        object_key="",
        public_url=data_uri,
        size_bytes=len(content),
        mime_type=file.content_type,
        uploaded_by=admin.id,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return ResponseEnvelope(message="Image uploaded.", data=MediaFileOut.model_validate(media))


# ── List media ─────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse, summary="List uploaded media (admin)")
async def list_media(
    media_type: Optional[MediaType] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = select(MediaFile)
    if media_type:
        q = q.where(MediaFile.media_type == media_type)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q = q.order_by(MediaFile.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    return PaginatedResponse(
        data=[MediaFileOut.model_validate(r) for r in rows],
        meta=PaginatedMeta(total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size)),
    )


@router.get("/{media_id}", response_model=ResponseEnvelope, summary="Get media item (admin)")
async def get_media(media_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    m: Optional[MediaFile] = await db.get(MediaFile, media_id)
    if not m:
        raise HTTPException(status_code=404, detail="Media not found.")
    return ResponseEnvelope(data=MediaFileOut.model_validate(m))


@router.delete("/{media_id}", response_model=ResponseEnvelope, summary="Delete media item (admin)")
async def delete_media(media_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    m: Optional[MediaFile] = await db.get(MediaFile, media_id)
    if not m:
        raise HTTPException(status_code=404, detail="Media not found.")
    # No MinIO cleanup needed — data stored in DB
    await db.delete(m)
    await db.commit()
    return ResponseEnvelope(message="Media deleted.")
