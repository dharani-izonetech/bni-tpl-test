"""
News / blogs routes.
"""
import uuid
import logging
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.database import get_db
from app.models import NewsItem
from app.schemas.schemas import (
    NewsCreate, NewsUpdate, NewsOut, ResponseEnvelope, PaginatedMeta, PaginatedResponse,
)

router = APIRouter(prefix="/news", tags=["News"])
logger = logging.getLogger(__name__)


def _apply_create(item: NewsItem, body: NewsCreate) -> None:
    item.news_title_en = body.news_title.en
    item.news_title_ta = body.news_title.ta
    item.news_description_en = body.news_description.en if body.news_description else None
    item.news_description_ta = body.news_description.ta if body.news_description else None
    item.venue_en = body.venue.en if body.venue else None
    item.venue_ta = body.venue.ta if body.venue else None
    item.match_time_en = body.match_time.en if body.match_time else None
    item.match_time_ta = body.match_time.ta if body.match_time else None
    item.status_en = body.status.en if body.status else None
    item.status_ta = body.status.ta if body.status else None
    item.audience = body.audience
    item.media_embed_url = body.media_embed_url
    item.match_story_title_en = body.match_story_title.en if body.match_story_title else None
    item.match_story_title_ta = body.match_story_title.ta if body.match_story_title else None
    item.match_story_description_en = body.match_story_description.en if body.match_story_description else None
    item.match_story_description_ta = body.match_story_description.ta if body.match_story_description else None
    item.match_story_image_url = body.match_story_image_url
    item.is_published = body.is_published


# ── Public ─────────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse, summary="List published news (public)")
async def list_news(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = select(NewsItem).where(NewsItem.is_published == True)  # noqa: E712
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q = q.order_by(NewsItem.published_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    return PaginatedResponse(
        data=[NewsOut.model_validate(r) for r in rows],
        meta=PaginatedMeta(total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size)),
    )


# ── Admin ──────────────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=PaginatedResponse, summary="List all news including drafts (admin)")
async def admin_list_news(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = select(NewsItem)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q = q.order_by(NewsItem.published_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    return PaginatedResponse(
        data=[NewsOut.model_validate(r) for r in rows],
        meta=PaginatedMeta(total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size)),
    )


@router.get("/{news_id}", response_model=ResponseEnvelope, summary="Get news item (public)")
async def get_news(news_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    item = await db.get(NewsItem, news_id)
    if not item or not item.is_published:
        raise HTTPException(status_code=404, detail="News item not found.")
    return ResponseEnvelope(data=NewsOut.model_validate(item))


@router.post("", response_model=ResponseEnvelope, status_code=201, summary="Create news item (admin)")
async def create_news(body: NewsCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    item = NewsItem()
    _apply_create(item, body)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return ResponseEnvelope(message="News created.", data=NewsOut.model_validate(item))


@router.put("/{news_id}", response_model=ResponseEnvelope, summary="Update news item (admin)")
async def update_news(news_id: uuid.UUID, body: NewsUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    item: Optional[NewsItem] = await db.get(NewsItem, news_id)
    if not item:
        raise HTTPException(status_code=404, detail="News item not found.")

    if body.news_title:
        item.news_title_en = body.news_title.en
        item.news_title_ta = body.news_title.ta
    if body.news_description:
        item.news_description_en = body.news_description.en
        item.news_description_ta = body.news_description.ta
    if body.venue:
        item.venue_en = body.venue.en
        item.venue_ta = body.venue.ta
    if body.match_time:
        item.match_time_en = body.match_time.en
        item.match_time_ta = body.match_time.ta
    if body.status:
        item.status_en = body.status.en
        item.status_ta = body.status.ta
    if body.audience is not None:
        item.audience = body.audience
    if body.media_embed_url is not None:
        item.media_embed_url = body.media_embed_url
    if body.match_story_title:
        item.match_story_title_en = body.match_story_title.en
        item.match_story_title_ta = body.match_story_title.ta
    if body.match_story_description:
        item.match_story_description_en = body.match_story_description.en
        item.match_story_description_ta = body.match_story_description.ta
    if body.match_story_image_url is not None:
        item.match_story_image_url = body.match_story_image_url
    if body.is_published is not None:
        item.is_published = body.is_published

    await db.commit()
    await db.refresh(item)
    return ResponseEnvelope(message="News updated.", data=NewsOut.model_validate(item))


@router.delete("/{news_id}", response_model=ResponseEnvelope, summary="Delete news item (admin)")
async def delete_news(news_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    item: Optional[NewsItem] = await db.get(NewsItem, news_id)
    if not item:
        raise HTTPException(status_code=404, detail="News item not found.")
    await db.delete(item)
    await db.commit()
    return ResponseEnvelope(message="News deleted.")
