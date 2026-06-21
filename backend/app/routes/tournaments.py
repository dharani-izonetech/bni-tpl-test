from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
import os, uuid, aiofiles, itertools, random
from datetime import datetime, timedelta

from app.database import get_db
from app.models import (
    Tournament, TournamentTeam, Team, Match, PointsTableEntry,
    TournamentStatus, MatchStatus, User
)
from app.schemas.schemas import (
    TournamentCreate, TournamentUpdate, TournamentOut, TournamentDetailOut,
    PointsTableOut, MessageResponse
)
from app.auth.dependencies import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/tournaments", tags=["Tournaments"])


@router.post("", response_model=TournamentOut, status_code=201)
async def create_tournament(
    data: TournamentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tournament = Tournament(**data.model_dump(), organizer_id=current_user.id)
    db.add(tournament)
    await db.commit()
    await db.refresh(tournament)
    return tournament


@router.get("", response_model=List[TournamentOut])
async def list_tournaments(
    search: Optional[str] = None,
    status: Optional[TournamentStatus] = None,
    city: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = select(Tournament).where(Tournament.is_public == True)
    if search:
        q = q.where(Tournament.name.ilike(f"%{search}%"))
    if status:
        q = q.where(Tournament.status == status)
    if city:
        q = q.where(Tournament.city.ilike(f"%{city}%"))
    q = q.order_by(Tournament.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{tournament_id}", response_model=TournamentDetailOut)
async def get_tournament(tournament_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Tournament)
        .options(
            selectinload(Tournament.organizer),
            selectinload(Tournament.teams).selectinload(TournamentTeam.team),
        )
        .where(Tournament.id == tournament_id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Tournament not found")
    # Flatten teams
    t_dict = {c.key: getattr(t, c.key) for c in t.__table__.columns}
    t_dict["organizer"] = t.organizer
    t_dict["teams"] = [tt.team for tt in t.teams]
    t_dict["team_count"] = len(t_dict["teams"])
    return TournamentDetailOut(**t_dict)


@router.patch("/{tournament_id}", response_model=TournamentOut)
async def update_tournament(
    tournament_id: int,
    data: TournamentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tournament).where(Tournament.id == tournament_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Not found")
    if t.organizer_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(403, "Not authorized")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(t, k, v)
    await db.commit()
    await db.refresh(t)
    return t


@router.post("/{tournament_id}/teams/{team_id}", response_model=MessageResponse)
async def add_team_to_tournament(
    tournament_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tournament).where(Tournament.id == tournament_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Tournament not found")
    if t.organizer_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(403, "Not authorized")

    result = await db.execute(select(Team).where(Team.id == team_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Team not found")

    result = await db.execute(
        select(TournamentTeam).where(
            TournamentTeam.tournament_id == tournament_id,
            TournamentTeam.team_id == team_id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Team already in tournament")

    count_result = await db.execute(
        select(func.count()).where(TournamentTeam.tournament_id == tournament_id)
    )
    if count_result.scalar() >= t.max_teams:
        raise HTTPException(400, "Tournament is full")

    tt = TournamentTeam(tournament_id=tournament_id, team_id=team_id)
    db.add(tt)

    # Add to points table
    pt = PointsTableEntry(tournament_id=tournament_id, team_id=team_id)
    db.add(pt)
    await db.commit()
    return MessageResponse(message="Team added to tournament")


@router.post("/{tournament_id}/generate-fixtures", response_model=MessageResponse)
async def generate_fixtures(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tournament)
        .options(selectinload(Tournament.teams))
        .where(Tournament.id == tournament_id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Tournament not found")
    if t.organizer_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(403, "Not authorized")

    teams = [tt.team_id for tt in t.teams]
    if len(teams) < 2:
        raise HTTPException(400, "Need at least 2 teams")

    # Delete existing matches
    existing = await db.execute(select(Match).where(Match.tournament_id == tournament_id))
    for m in existing.scalars().all():
        await db.delete(m)

    matches = []
    match_number = 1
    base_date = t.start_date or datetime.utcnow()

    if t.format.value in ("league", "round_robin"):
        pairs = list(itertools.combinations(teams, 2))
        random.shuffle(pairs)
        for i, (t1, t2) in enumerate(pairs):
            scheduled = base_date + timedelta(days=i)
            m = Match(
                tournament_id=tournament_id,
                match_number=match_number,
                match_type="league",
                team1_id=t1,
                team2_id=t2,
                overs=t.overs_per_innings,
                scheduled_at=scheduled,
            )
            db.add(m)
            match_number += 1
    elif t.format.value == "knockout":
        random.shuffle(teams)
        round_teams = teams
        round_name = "quarter_final" if len(teams) >= 8 else "semi_final"
        day_offset = 0
        while len(round_teams) > 1:
            next_round = []
            for i in range(0, len(round_teams) - 1, 2):
                t1, t2 = round_teams[i], round_teams[i + 1]
                m = Match(
                    tournament_id=tournament_id,
                    match_number=match_number,
                    match_type=round_name,
                    team1_id=t1,
                    team2_id=t2,
                    overs=t.overs_per_innings,
                    scheduled_at=base_date + timedelta(days=day_offset),
                )
                db.add(m)
                match_number += 1
                day_offset += 1
                next_round.append(t1)  # placeholder
            round_teams = next_round
            round_name = "final" if len(next_round) == 1 else "semi_final"

    t.status = TournamentStatus.ONGOING
    await db.commit()
    return MessageResponse(message=f"Fixtures generated: {match_number - 1} matches")


@router.get("/{tournament_id}/points-table", response_model=List[PointsTableOut])
async def get_points_table(tournament_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PointsTableEntry)
        .options(selectinload(PointsTableEntry.team))
        .where(PointsTableEntry.tournament_id == tournament_id)
        .order_by(PointsTableEntry.points.desc(), PointsTableEntry.nrr.desc())
    )
    return result.scalars().all()


@router.get("/{tournament_id}/matches", response_model=List)
async def get_tournament_matches(
    tournament_id: int,
    status: Optional[MatchStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    from app.schemas.schemas import MatchOut
    q = (
        select(Match)
        .options(selectinload(Match.team1), selectinload(Match.team2))
        .where(Match.tournament_id == tournament_id)
    )
    if status:
        q = q.where(Match.status == status)
    q = q.order_by(Match.match_number)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/{tournament_id}/banner", response_model=TournamentOut)
async def upload_banner(
    tournament_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tournament).where(Tournament.id == tournament_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Not found")
    if t.organizer_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(403, "Not authorized")
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    upload_dir = os.path.join(settings.MEDIA_ROOT, "banners")
    os.makedirs(upload_dir, exist_ok=True)
    async with aiofiles.open(os.path.join(upload_dir, filename), "wb") as f:
        await f.write(await file.read())
    t.banner = f"/media/banners/{filename}"
    await db.commit()
    await db.refresh(t)
    return t
