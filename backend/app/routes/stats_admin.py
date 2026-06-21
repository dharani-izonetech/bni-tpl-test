from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import Optional, List

from app.database import get_db
from app.models import (
    PlayerCareerStats, PlayerProfile, BattingScore, BowlingFigure,
    User, Team, Tournament, Match, Innings, Notification, UserRole
)
from app.schemas.schemas import PlayerCareerStatsOut, NotificationOut, UserOut, MessageResponse
from app.auth.dependencies import get_current_user, require_admin

stats_router = APIRouter(prefix="/stats", tags=["Statistics"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ─── Stats ────────────────────────────────────────────────────────────────────

@stats_router.get("/leaderboard/batting")
async def batting_leaderboard(
    tournament_id: Optional[int] = None,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(
            PlayerProfile,
            func.sum(BattingScore.runs).label("total_runs"),
            func.max(BattingScore.runs).label("highest"),
            func.count(BattingScore.id).label("innings"),
            func.sum(BattingScore.fours).label("fours"),
            func.sum(BattingScore.sixes).label("sixes"),
        )
        .join(BattingScore, BattingScore.batsman_id == PlayerProfile.id)
    )
    if tournament_id:
        q = q.join(Innings, BattingScore.innings_id == Innings.id).join(
            Match, Innings.match_id == Match.id
        ).where(Match.tournament_id == tournament_id)
    q = q.group_by(PlayerProfile.id).order_by(desc("total_runs")).limit(limit)
    result = await db.execute(q)
    rows = result.all()
    leaderboard = []
    for row in rows:
        player, total_runs, highest, innings, fours, sixes = row
        user_result = await db.execute(select(User).where(User.id == player.user_id))
        user = user_result.scalar_one_or_none()
        leaderboard.append({
            "player_id": player.id,
            "player_name": user.full_name if user else "Unknown",
            "username": user.username if user else "",
            "photo": user.profile_photo if user else None,
            "total_runs": total_runs or 0,
            "highest_score": highest or 0,
            "innings": innings or 0,
            "fours": fours or 0,
            "sixes": sixes or 0,
            "average": round((total_runs or 0) / innings, 2) if innings else 0,
        })
    return leaderboard


@stats_router.get("/leaderboard/bowling")
async def bowling_leaderboard(
    tournament_id: Optional[int] = None,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(
            PlayerProfile,
            func.sum(BowlingFigure.wickets).label("total_wickets"),
            func.sum(BowlingFigure.runs).label("total_runs"),
            func.sum(BowlingFigure.overs).label("total_overs"),
            func.count(BowlingFigure.id).label("innings"),
        )
        .join(BowlingFigure, BowlingFigure.bowler_id == PlayerProfile.id)
    )
    if tournament_id:
        q = q.join(Innings, BowlingFigure.innings_id == Innings.id).join(
            Match, Innings.match_id == Match.id
        ).where(Match.tournament_id == tournament_id)
    q = q.group_by(PlayerProfile.id).order_by(desc("total_wickets")).limit(limit)
    result = await db.execute(q)
    rows = result.all()
    leaderboard = []
    for row in rows:
        player, total_wickets, total_runs, total_overs, innings = row
        user_result = await db.execute(select(User).where(User.id == player.user_id))
        user = user_result.scalar_one_or_none()
        leaderboard.append({
            "player_id": player.id,
            "player_name": user.full_name if user else "Unknown",
            "username": user.username if user else "",
            "photo": user.profile_photo if user else None,
            "total_wickets": total_wickets or 0,
            "total_runs_conceded": total_runs or 0,
            "overs_bowled": total_overs or 0,
            "innings": innings or 0,
            "economy": round((total_runs or 0) / (total_overs or 1), 2),
            "average": round((total_runs or 0) / (total_wickets or 1), 2) if total_wickets else 0,
        })
    return leaderboard


@stats_router.get("/player/{player_id}")
async def player_stats(player_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PlayerProfile)
        .options(selectinload(PlayerProfile.user))
        .where(PlayerProfile.id == player_id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(404, "Player not found")

    bat_result = await db.execute(
        select(
            func.sum(BattingScore.runs),
            func.count(BattingScore.id),
            func.max(BattingScore.runs),
            func.sum(BattingScore.fours),
            func.sum(BattingScore.sixes),
            func.sum(BattingScore.balls_faced),
            func.count(BattingScore.id).filter(BattingScore.is_out == False),
        ).where(BattingScore.batsman_id == player_id)
    )
    bat = bat_result.first()

    bowl_result = await db.execute(
        select(
            func.sum(BowlingFigure.wickets),
            func.sum(BowlingFigure.runs),
            func.sum(BowlingFigure.overs),
            func.sum(BowlingFigure.maidens),
        ).where(BowlingFigure.bowler_id == player_id)
    )
    bowl = bowl_result.first()

    total_runs, innings, highest, fours, sixes, balls_faced, not_outs = bat
    wickets, runs_conceded, overs, maidens = bowl

    return {
        "player": {
            "id": player.id,
            "name": player.user.full_name,
            "username": player.user.username,
            "photo": player.user.profile_photo,
            "batting_style": player.user.batting_style,
            "bowling_style": player.user.bowling_style,
        },
        "batting": {
            "innings": innings or 0,
            "runs": total_runs or 0,
            "highest": highest or 0,
            "fours": fours or 0,
            "sixes": sixes or 0,
            "balls_faced": balls_faced or 0,
            "not_outs": not_outs or 0,
            "average": round((total_runs or 0) / max((innings or 1) - (not_outs or 0), 1), 2),
            "strike_rate": round((total_runs or 0) * 100 / (balls_faced or 1), 2),
        },
        "bowling": {
            "wickets": wickets or 0,
            "runs": runs_conceded or 0,
            "overs": overs or 0,
            "maidens": maidens or 0,
            "economy": round((runs_conceded or 0) / (overs or 1), 2),
            "average": round((runs_conceded or 0) / (wickets or 1), 2) if wickets else 0,
        },
    }


# ─── Admin ────────────────────────────────────────────────────────────────────

@admin_router.get("/dashboard")
async def admin_dashboard(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    users = await db.execute(select(func.count()).select_from(User))
    teams = await db.execute(select(func.count()).select_from(Team))
    tournaments = await db.execute(select(func.count()).select_from(Tournament))
    matches = await db.execute(select(func.count()).select_from(Match))
    live_matches = await db.execute(
        select(func.count()).select_from(Match).where(Match.status == "live")
    )
    return {
        "total_users": users.scalar(),
        "total_teams": teams.scalar(),
        "total_tournaments": tournaments.scalar(),
        "total_matches": matches.scalar(),
        "live_matches": live_matches.scalar(),
    }


@admin_router.get("/users", response_model=List[UserOut])
async def list_users(
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    q = select(User)
    if search:
        q = q.where(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role:
        q = q.where(User.role == role)
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all()


@admin_router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: UserRole,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = role
    await db.commit()
    return MessageResponse(message=f"Role updated to {role.value}")


@admin_router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = not user.is_active
    await db.commit()
    return {"is_active": user.is_active}


# ─── Notifications ────────────────────────────────────────────────────────────

@notifications_router.get("", response_model=List[NotificationOut])
async def get_notifications(
    unread_only: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        q = q.where(Notification.is_read == False)
    q = q.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all()


@notifications_router.patch("/{notification_id}/read", response_model=MessageResponse)
async def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    n = result.scalar_one_or_none()
    if not n:
        raise HTTPException(404, "Notification not found")
    n.is_read = True
    await db.commit()
    return MessageResponse(message="Marked as read")


@notifications_router.patch("/read-all", response_model=MessageResponse)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    for n in result.scalars().all():
        n.is_read = True
    await db.commit()
    return MessageResponse(message="All notifications marked as read")
