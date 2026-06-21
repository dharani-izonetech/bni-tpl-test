"""
Player registration (public) and admin management routes.
Photo is stored as a base64 data URI directly in the database (MinIO disabled).
"""
import base64
import io
import logging
import uuid
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.database import get_db
from app.models import RegisteredPlayer
from app.schemas.schemas import (
    PaginatedMeta,
    PaginatedResponse,
    PlayerOut,
    PlayerSquadOut,
    PlayerUpdateRequest,
    ResponseEnvelope,
)

router = APIRouter(prefix="/players", tags=["Players"])
logger = logging.getLogger(__name__)

TEAM_SHORT_MAP: dict[str, str] = {
    "bni azpire": "AZP",      "azpire": "AZP",
    "bni benchmark": "BMK",   "benchmark": "BMK",
    "bni champions": "CHP",   "champions": "CHP",
    "bni dynamic": "DYN",     "dynamic": "DYN",
    "bni emperor": "EMP",     "emperor": "EMP",
    "bni fortune": "FOR",     "fortune": "FOR",
    "bni gladiators": "GLD",  "gladiators": "GLD",
    "bni harmony": "HMY",     "harmony": "HMY",
    "bni icons": "ICN",       "icons": "ICN",
    "bni jaaguar": "JAG",     "jaaguar": "JAG",
    "bni kings": "KNG",       "kings": "KNG",
    "bni legends": "LGD",     "legends": "LGD",
    "bni millionaire": "MLN", "millionaire": "MLN",
    "bni nest": "NST",        "nest": "NST",
    "bni prince": "PRC",      "prince": "PRC",
    "bni spark": "SPK",       "spark": "SPK",
    "bni royals": "ROY",      "royals": "ROY",
    "bni warriors": "WAR",    "warriors": "WAR",
    "bni oscar": "OSC",       "oscar": "OSC",
    "bni tycoon": "TYC",      "tycoon": "TYC",
}

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB


def _resolve_team_short(team_name: str) -> str:
    return TEAM_SHORT_MAP.get(team_name.strip().lower(), team_name[:3].upper())


# ── Public: Register player ────────────────────────────────────────────────

@router.post("", response_model=ResponseEnvelope, status_code=status.HTTP_201_CREATED,
             summary="Register a new player (public)")
async def register_player(
    name: str = Form(...),
    business: str = Form(...),
    category: str = Form(...),
    phone_no: str = Form(...),
    team_name: str = Form(...),
    role: str = Form(default="Player"),
    membership_years: Optional[int] = Form(default=None),
    jersey_number: Optional[str] = Form(default=None),
    jersey_size: Optional[str] = Form(default=None),
    track_pant_size: Optional[str] = Form(default=None),
    photo: Optional[UploadFile] = File(default=None),
    db: AsyncSession = Depends(get_db),
):
    import re
    # Phone validation — must be exactly 10 digits after stripping +91
    digits = re.sub(r"\D", "", phone_no.replace("+91", ""))
    if not re.match(r"^\d{10}$", digits):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Phone number must be exactly 10 digits (Indian mobile number).",
        )
    normalized_phone = f"+91{digits}"

    # Unique phone check
    dup = await db.execute(select(RegisteredPlayer).where(RegisteredPlayer.phone_no == normalized_phone))
    if dup.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A player with this phone number is already registered.",
        )

    # Photo → base64 data URI stored in DB
    photo_data: Optional[str] = None
    if photo and photo.filename:
        if photo.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Photo must be JPEG, PNG or WEBP.",
            )
        content = await photo.read()
        if len(content) > MAX_PHOTO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Photo must be under 5 MB.",
            )
        b64 = base64.b64encode(content).decode("utf-8")
        photo_data = f"data:{photo.content_type};base64,{b64}"

    player = RegisteredPlayer(
        name=name.strip(),
        business=business.strip(),
        category=category.strip(),
        phone_no=normalized_phone,
        team_name=team_name.strip(),
        team_short=_resolve_team_short(team_name),
        role=role or "Player",
        membership_years=membership_years,
        jersey_number=(jersey_number or "").strip() or None,
        jersey_size=jersey_size or None,
        track_pant_size=track_pant_size or None,
        photo_data=photo_data,
    )
    db.add(player)
    await db.commit()
    await db.refresh(player)

    return ResponseEnvelope(message="Player registered successfully.", data=PlayerOut.model_validate(player))


# ── Public: Squad view (no sensitive data) ────────────────────────────────

@router.get("/squad", response_model=ResponseEnvelope, summary="Get all players for squad display (public)")
async def get_squad(
    team: Optional[str] = Query(None, description="Filter by team_short or team_name"),
    db: AsyncSession = Depends(get_db),
):
    """Returns name, team, role, photo and membership years only — safe for public display."""
    q = select(RegisteredPlayer)
    if team:
        q = q.where(
            RegisteredPlayer.team_short.ilike(team) |
            RegisteredPlayer.team_name.ilike(f"%{team}%")
        )
    q = q.order_by(RegisteredPlayer.registered_at.asc())
    rows = (await db.execute(q)).scalars().all()
    return ResponseEnvelope(data=[PlayerSquadOut.model_validate(r) for r in rows])


# ── Admin: List players ────────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse, summary="List all players (admin)")
async def list_players(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None),
    team: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin),
):
    q = select(RegisteredPlayer)
    if search:
        like = f"%{search}%"
        q = q.where(
            RegisteredPlayer.name.ilike(like) | RegisteredPlayer.team_name.ilike(like)
        )
    if team:
        q = q.where(RegisteredPlayer.team_name.ilike(f"%{team}%"))

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    q = q.order_by(RegisteredPlayer.registered_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()

    return PaginatedResponse(
        data=[PlayerOut.model_validate(r) for r in rows],
        meta=PaginatedMeta(total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size)),
    )


@router.get("/{player_id}", response_model=ResponseEnvelope, summary="Get single player (admin)")
async def get_player(player_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    p = await db.get(RegisteredPlayer, player_id)
    if not p:
        raise HTTPException(status_code=404, detail="Player not found.")
    return ResponseEnvelope(data=PlayerOut.model_validate(p))


# ── Admin: Export CSV — must be before /{player_id} ───────────────────────

@router.get("/export/csv", summary="Export players as CSV (admin)")
async def export_players_csv(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    rows = (await db.execute(
        select(RegisteredPlayer).order_by(RegisteredPlayer.registered_at.desc())
    )).scalars().all()

    headers = [
        "Name", "Team", "Short", "Role", "Jersey #", "Jersey Size",
        "Track Pant", "Phone", "Business", "Category", "Membership Years", "Registered At",
    ]
    lines = [",".join(headers)]
    for p in rows:
        lines.append(",".join([
            f'"{p.name}"', f'"{p.team_name}"', f'"{p.team_short or ""}"',
            f'"{p.role}"', f'"{p.jersey_number or ""}"', f'"{p.jersey_size or ""}"',
            f'"{p.track_pant_size or ""}"', f'"{p.phone_no}"', f'"{p.business}"',
            f'"{p.category}"', f'"{p.membership_years or ""}"',
            f'"{p.registered_at.isoformat()}"',
        ]))

    csv_bytes = "\n".join(lines).encode("utf-8-sig")
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=players.csv"},
    )


@router.put("/{player_id}", response_model=ResponseEnvelope, summary="Update player (admin)")
async def update_player(
    player_id: uuid.UUID,
    body: PlayerUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    p: Optional[RegisteredPlayer] = await db.get(RegisteredPlayer, player_id)
    if not p:
        raise HTTPException(status_code=404, detail="Player not found.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(p, field, value)

    if body.team_name:
        p.team_short = _resolve_team_short(body.team_name)

    await db.commit()
    await db.refresh(p)
    return ResponseEnvelope(message="Player updated.", data=PlayerOut.model_validate(p))


@router.delete("/{player_id}", response_model=ResponseEnvelope, summary="Delete player (admin)")
async def delete_player(player_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    p: Optional[RegisteredPlayer] = await db.get(RegisteredPlayer, player_id)
    if not p:
        raise HTTPException(status_code=404, detail="Player not found.")
    await db.delete(p)
    await db.commit()
    return ResponseEnvelope(message="Player deleted.")
