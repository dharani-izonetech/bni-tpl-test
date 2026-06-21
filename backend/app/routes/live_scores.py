"""
Live score routes — public read + admin CRUD.
"""
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.database import get_db
from app.models import LiveScore
from app.schemas.schemas import (
    LiveScoreCreate, LiveScoreUpdate, BNILiveScoreOut, ResponseEnvelope,
)

router = APIRouter(prefix="/live-scores", tags=["Live Scores"])
logger = logging.getLogger(__name__)


def _with_video(q):
    return q.options(selectinload(LiveScore.video))


@router.get("", response_model=ResponseEnvelope, summary="Get all live scores (public)")
async def get_live_scores(db: AsyncSession = Depends(get_db)):
    q = _with_video(select(LiveScore).order_by(LiveScore.created_at.desc()))
    rows = (await db.execute(q)).scalars().all()
    return ResponseEnvelope(data=[BNILiveScoreOut.model_validate(r) for r in rows])


@router.get("/by-match/{match_id}", response_model=ResponseEnvelope, summary="Get video for a scoring match (public)")
async def get_video_for_match(match_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Returns the BNI live score entry (with video) linked to a scoring engine match_id."""
    result = await db.execute(
        _with_video(select(LiveScore).where(LiveScore.match_id == match_id))
    )
    row = result.scalars().first()
    if not row:
        return ResponseEnvelope(data=None)
    return ResponseEnvelope(data=BNILiveScoreOut.model_validate(row))


@router.get("/all", response_model=ResponseEnvelope, summary="Get all live scores (admin)")
async def get_all_live_scores(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    rows = (await db.execute(_with_video(select(LiveScore).order_by(LiveScore.created_at.desc())))).scalars().all()
    return ResponseEnvelope(data=[BNILiveScoreOut.model_validate(r) for r in rows])


@router.post("", response_model=ResponseEnvelope, status_code=201, summary="Create live score (admin)")
async def create_live_score(body: LiveScoreCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    ls = LiveScore(**body.model_dump())
    db.add(ls)
    await db.commit()
    await db.refresh(ls)
    # reload with video
    result = await db.execute(_with_video(select(LiveScore).where(LiveScore.id == ls.id)))
    return ResponseEnvelope(message="Live score created.", data=BNILiveScoreOut.model_validate(result.scalar_one()))


@router.put("/{score_id}", response_model=ResponseEnvelope, summary="Update live score (admin)")
async def update_live_score(
    score_id: uuid.UUID,
    body: LiveScoreUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    ls: Optional[LiveScore] = await db.get(LiveScore, score_id)
    if not ls:
        raise HTTPException(status_code=404, detail="Live score not found.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(ls, field, value)
    await db.commit()
    result = await db.execute(_with_video(select(LiveScore).where(LiveScore.id == score_id)))
    return ResponseEnvelope(message="Live score updated.", data=BNILiveScoreOut.model_validate(result.scalar_one()))


@router.delete("/{score_id}", response_model=ResponseEnvelope, summary="Delete live score (admin)")
async def delete_live_score(score_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    ls: Optional[LiveScore] = await db.get(LiveScore, score_id)
    if not ls:
        raise HTTPException(status_code=404, detail="Live score not found.")
    await db.delete(ls)
    await db.commit()
    return ResponseEnvelope(message="Live score deleted.")
