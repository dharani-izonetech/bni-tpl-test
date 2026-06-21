"""
CricPro player endpoints — list all profiles, individual performance, CRUD.
"""
import uuid as _uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import PlayerProfile, User, BattingScore, BowlingFigure, Innings, Match, Team
from app.auth.dependencies import get_current_user
from app.auth import require_admin

router = APIRouter(prefix="/cricpro", tags=["CricPro Players"])


# ── Schemas ────────────────────────────────────────────────────────────────

class PlayerProfileCreate(BaseModel):
    user_id: _uuid.UUID
    team_id: Optional[_uuid.UUID] = None
    player_role: Optional[str] = None
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    jersey_number: Optional[int] = None
    is_captain: bool = False
    is_vice_captain: bool = False
    is_wicket_keeper: bool = False
    is_active: bool = True


class PlayerProfileUpdate(BaseModel):
    team_id: Optional[_uuid.UUID] = None
    player_role: Optional[str] = None
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    jersey_number: Optional[int] = None
    is_captain: Optional[bool] = None
    is_vice_captain: Optional[bool] = None
    is_wicket_keeper: Optional[bool] = None
    is_active: Optional[bool] = None


# ── Helpers ────────────────────────────────────────────────────────────────

def _player_display_name(p: "PlayerProfile") -> str:
    if p.user:
        name = (p.user.full_name or "").strip()
        if name:
            return name
        return p.user.username or f"Player #{p.id}"
    return f"Player #{p.id}"


def _profile_to_dict(p: "PlayerProfile") -> dict:
    return {
        "id": p.id,
        "user_id": str(p.user_id),
        "full_name": _player_display_name(p),
        "username": p.user.username if p.user else None,
        "batting_style": (p.user.batting_style if p.user else None) or p.batting_style,
        "bowling_style": (p.user.bowling_style if p.user else None) or p.bowling_style,
        "player_role": p.player_role,
        "jersey_number": p.jersey_number,
        "team": p.team.name if p.team else None,
        "team_id": str(p.team_id) if p.team_id else None,
        "is_captain": p.is_captain,
        "is_vice_captain": getattr(p, "is_vice_captain", False),
        "is_wicket_keeper": p.is_wicket_keeper,
        "is_active": p.is_active,
    }


# ── Team players (used by match wizard) ───────────────────────────────────

@router.get("/teams/{team_id}/players", summary="List players for a specific team")
async def list_team_players(team_id: str, db: AsyncSession = Depends(get_db)):
    try:
        tid = _uuid.UUID(team_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid team_id format")

    q = (
        select(PlayerProfile)
        .options(selectinload(PlayerProfile.user), selectinload(PlayerProfile.team))
        .where(PlayerProfile.team_id == tid, PlayerProfile.is_active == True)
        .order_by(PlayerProfile.jersey_number.asc().nullslast(), PlayerProfile.id)
    )
    result = await db.execute(q)
    return [_profile_to_dict(p) for p in result.scalars().all()]


# ── CRUD: List all players ─────────────────────────────────────────────────

@router.get("/players", summary="List all player profiles")
async def list_players(
    search: Optional[str] = None,
    team_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(PlayerProfile)
        .options(selectinload(PlayerProfile.user), selectinload(PlayerProfile.team))
        .order_by(PlayerProfile.id)
    )
    if team_id:
        try:
            q = q.where(PlayerProfile.team_id == _uuid.UUID(team_id))
        except ValueError:
            pass

    result = await db.execute(q)
    profiles = result.scalars().all()

    if search:
        s = search.lower()
        profiles = [
            p for p in profiles
            if p.user and (
                (p.user.full_name or "").lower().find(s) >= 0
                or p.user.username.lower().find(s) >= 0
            )
        ]

    return [_profile_to_dict(p) for p in profiles]


# ── Individual player performance — MUST be before /players/{player_id} ───

@router.get("/players/me", summary="My performance stats")
async def my_performance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profiles_result = await db.execute(
        select(PlayerProfile)
        .options(selectinload(PlayerProfile.team))
        .where(PlayerProfile.user_id == current_user.id)
    )
    profiles = profiles_result.scalars().all()

    if not profiles:
        return {
            "user": {
                "id": str(current_user.id), "username": current_user.username,
                "full_name": current_user.full_name, "role": current_user.role.value,
                "batting_style": current_user.batting_style,
                "bowling_style": current_user.bowling_style,
            },
            "profiles": [],
            "batting": {"innings": 0, "runs": 0, "highest": 0, "average": 0,
                        "strike_rate": 0, "fours": 0, "sixes": 0, "not_outs": 0},
            "bowling": {"innings": 0, "wickets": 0, "runs": 0, "overs": 0,
                        "economy": 0, "average": 0, "maidens": 0},
            "recent_batting": [], "recent_bowling": [],
        }

    player_ids = [p.id for p in profiles]

    bat = (await db.execute(
        select(
            func.count(BattingScore.id).label("innings"),
            func.coalesce(func.sum(BattingScore.runs), 0).label("runs"),
            func.coalesce(func.max(BattingScore.runs), 0).label("highest"),
            func.coalesce(func.sum(BattingScore.fours), 0).label("fours"),
            func.coalesce(func.sum(BattingScore.sixes), 0).label("sixes"),
            func.coalesce(func.sum(BattingScore.balls_faced), 0).label("balls_faced"),
            func.count(BattingScore.id).filter(BattingScore.is_out == False).label("not_outs"),
        ).where(BattingScore.batsman_id.in_(player_ids))
    )).first()

    innings = bat.innings or 0; runs = int(bat.runs or 0); highest = int(bat.highest or 0)
    fours = int(bat.fours or 0); sixes = int(bat.sixes or 0); balls_faced = int(bat.balls_faced or 0)
    not_outs = bat.not_outs or 0; dismissals = innings - not_outs
    avg = round(runs / dismissals, 2) if dismissals > 0 else (runs if innings > 0 else 0)
    sr = round((runs / balls_faced) * 100, 2) if balls_faced > 0 else 0

    bowl = (await db.execute(
        select(
            func.count(BowlingFigure.id).label("innings"),
            func.coalesce(func.sum(BowlingFigure.wickets), 0).label("wickets"),
            func.coalesce(func.sum(BowlingFigure.runs), 0).label("runs"),
            func.coalesce(func.sum(BowlingFigure.overs), 0).label("overs"),
            func.coalesce(func.sum(BowlingFigure.maidens), 0).label("maidens"),
        ).where(BowlingFigure.bowler_id.in_(player_ids))
    )).first()

    b_innings = bowl.innings or 0; b_wickets = int(bowl.wickets or 0)
    b_runs = int(bowl.runs or 0); b_overs = float(bowl.overs or 0); b_maidens = int(bowl.maidens or 0)
    b_econ = round(b_runs / b_overs, 2) if b_overs > 0 else 0
    b_avg = round(b_runs / b_wickets, 2) if b_wickets > 0 else 0

    def fmt_match(inn):
        if not inn or not inn.match: return "Unknown match"
        m = inn.match
        return f"{m.team1.name if m.team1 else '?'} vs {m.team2.name if m.team2 else '?'}"

    recent_bat = (await db.execute(
        select(BattingScore)
        .options(
            selectinload(BattingScore.innings).selectinload(Innings.match).selectinload(Match.team1),
            selectinload(BattingScore.innings).selectinload(Innings.match).selectinload(Match.team2),
        )
        .where(BattingScore.batsman_id.in_(player_ids))
        .order_by(BattingScore.id.desc()).limit(10)
    )).scalars().all()

    recent_bowl = (await db.execute(
        select(BowlingFigure)
        .options(
            selectinload(BowlingFigure.innings).selectinload(Innings.match).selectinload(Match.team1),
            selectinload(BowlingFigure.innings).selectinload(Innings.match).selectinload(Match.team2),
        )
        .where(BowlingFigure.bowler_id.in_(player_ids))
        .order_by(BowlingFigure.id.desc()).limit(10)
    )).scalars().all()

    return {
        "user": {
            "id": str(current_user.id), "username": current_user.username,
            "full_name": current_user.full_name, "role": current_user.role.value,
            "batting_style": current_user.batting_style, "bowling_style": current_user.bowling_style,
        },
        "profiles": [
            {"id": p.id, "team": p.team.name if p.team else None,
             "jersey_number": p.jersey_number, "player_role": p.player_role,
             "is_captain": p.is_captain, "is_vice_captain": getattr(p, "is_vice_captain", False)}
            for p in profiles
        ],
        "batting": {"innings": innings, "runs": runs, "highest": highest, "average": avg,
                    "strike_rate": sr, "fours": fours, "sixes": sixes, "not_outs": not_outs},
        "bowling": {"innings": b_innings, "wickets": b_wickets, "runs": b_runs,
                    "overs": b_overs, "economy": b_econ, "average": b_avg, "maidens": b_maidens},
        "recent_batting": [
            {"match": fmt_match(b.innings), "runs": b.runs, "balls": b.balls_faced,
             "fours": b.fours, "sixes": b.sixes,
             "dismissal": b.dismissal_type.value if b.dismissal_type else "not out",
             "sr": round((b.runs / b.balls_faced) * 100, 1) if b.balls_faced else 0}
            for b in recent_bat
        ],
        "recent_bowling": [
            {"match": fmt_match(b.innings), "overs": b.overs, "wickets": b.wickets,
             "runs": b.runs, "maidens": b.maidens, "economy": b.economy_rate}
            for b in recent_bowl
        ],
    }


# ── CRUD: Get single player ────────────────────────────────────────────────

@router.get("/players/{player_id}", summary="Get a player profile")
async def get_player(player_id: int, db: AsyncSession = Depends(get_db)):
    p = (await db.execute(
        select(PlayerProfile)
        .options(selectinload(PlayerProfile.user), selectinload(PlayerProfile.team))
        .where(PlayerProfile.id == player_id)
    )).scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Player not found")
    return _profile_to_dict(p)


# ── CRUD: Create player ────────────────────────────────────────────────────

@router.post("/players", status_code=201, summary="Create a player profile (admin)")
async def create_player(
    data: PlayerProfileCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    # Ensure the user exists
    user = (await db.execute(select(User).where(User.id == data.user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, f"User {data.user_id} not found")

    # Prevent duplicate (user_id, team_id)
    existing = (await db.execute(
        select(PlayerProfile).where(
            PlayerProfile.user_id == data.user_id,
            PlayerProfile.team_id == data.team_id,
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "Player profile already exists for this user/team combination")

    profile = PlayerProfile(
        user_id=data.user_id,
        team_id=data.team_id,
        player_role=data.player_role,
        batting_style=data.batting_style,
        bowling_style=data.bowling_style,
        jersey_number=data.jersey_number,
        is_captain=data.is_captain,
        is_vice_captain=data.is_vice_captain,
        is_wicket_keeper=data.is_wicket_keeper,
        is_active=data.is_active,
    )
    db.add(profile)
    await db.commit()

    result = (await db.execute(
        select(PlayerProfile)
        .options(selectinload(PlayerProfile.user), selectinload(PlayerProfile.team))
        .where(PlayerProfile.id == profile.id)
    )).scalar_one()
    return _profile_to_dict(result)


# ── CRUD: Update player ────────────────────────────────────────────────────

@router.patch("/players/{player_id}", summary="Update a player profile (admin/scorer)")
async def update_player(
    player_id: int,
    data: PlayerProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value not in ("admin", "organizer", "scorer"):
        raise HTTPException(403, "Insufficient permissions")

    p = (await db.execute(
        select(PlayerProfile).where(PlayerProfile.id == player_id)
    )).scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Player not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(p, field, value)

    # If setting captain, unset other captains on same team
    if data.is_captain is True and p.team_id:
        others = (await db.execute(
            select(PlayerProfile).where(
                PlayerProfile.team_id == p.team_id,
                PlayerProfile.id != player_id,
                PlayerProfile.is_captain == True,
            )
        )).scalars().all()
        for o in others:
            o.is_captain = False

    # If setting vice captain, unset other VCs on same team
    if data.is_vice_captain is True and p.team_id:
        others = (await db.execute(
            select(PlayerProfile).where(
                PlayerProfile.team_id == p.team_id,
                PlayerProfile.id != player_id,
                PlayerProfile.is_vice_captain == True,
            )
        )).scalars().all()
        for o in others:
            o.is_vice_captain = False

    await db.commit()

    result = (await db.execute(
        select(PlayerProfile)
        .options(selectinload(PlayerProfile.user), selectinload(PlayerProfile.team))
        .where(PlayerProfile.id == player_id)
    )).scalar_one()
    return _profile_to_dict(result)


# ── CRUD: Delete player ────────────────────────────────────────────────────

@router.delete("/players/{player_id}", summary="Delete a player profile (admin)")
async def delete_player(
    player_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    p = (await db.execute(
        select(PlayerProfile).where(PlayerProfile.id == player_id)
    )).scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Player not found")

    # Check if player has any scoring records — soft-delete instead of hard-delete
    has_balls = (await db.execute(
        select(func.count()).where(BattingScore.batsman_id == player_id)
    )).scalar()
    if has_balls and has_balls > 0:
        # Soft delete — preserve historical data
        p.is_active = False
        await db.commit()
        return {"message": "Player deactivated (has scoring history — cannot be fully deleted)"}

    await db.delete(p)
    await db.commit()
    return {"message": "Player deleted successfully"}


# ── List teams (for player CRUD dropdowns) ─────────────────────────────────

@router.get("/teams", summary="List all teams (for player management)")
async def list_teams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Team).where(Team.is_active == True).order_by(Team.name))
    return [{"id": str(t.id), "name": t.name, "short": t.short} for t in result.scalars().all()]


# ── List users (for player CRUD — assign user to profile) ─────────────────

@router.get("/users", summary="List users for player profile assignment (admin)")
async def list_users_for_players(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = select(User).order_by(User.full_name.asc().nullslast(), User.username)
    if search:
        s = f"%{search}%"
        q = q.where(
            User.full_name.ilike(s) | User.username.ilike(s) | User.email.ilike(s)
        )
    result = await db.execute(q.limit(100))
    return [
        {"id": str(u.id), "full_name": u.full_name, "username": u.username, "email": u.email}
        for u in result.scalars().all()
    ]


# ── Individual player performance ──────────────────────────────────────────

# NOTE: /players/me is defined earlier in this file (before /players/{player_id})
# to prevent FastAPI from trying to cast "me" as an integer.
