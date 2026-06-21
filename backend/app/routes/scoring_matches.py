import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timezone

from app.database import get_db
from app.models import (
    Match, Innings, PlayingXI, Team, PlayerProfile,
    BattingScore, BowlingFigure, MatchStatus, User
)
from app.schemas.schemas import (
    MatchCreate, MatchUpdate, MatchOut, TossInput,
    PlayingXIInput, InningsOut, ScorecardOut, MessageResponse,
    BattingScoreOut, BowlingFigureOut, FallOfWicketOut
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/scoring/matches", tags=["Matches"])


@router.post("", status_code=201)
async def create_match(
    data: MatchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.team1_id and data.team2_id and data.team1_id == data.team2_id:
        raise HTTPException(400, "Teams must be different")
    match = Match(**data.model_dump())
    db.add(match)
    await db.commit()
    await db.refresh(match)
    m = await _get_match_with_teams(match.id, db)
    return _match_to_dict(m)


@router.get("")
async def list_matches(
    status: Optional[str] = None,
    team_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = select(Match).options(selectinload(Match.team1), selectinload(Match.team2))
    if status:
        q = q.where(Match.status == status)
    if team_id:
        try:
            tid = uuid.UUID(team_id)
            q = q.where((Match.team1_id == tid) | (Match.team2_id == tid))
        except ValueError:
            pass
    q = q.order_by(Match.match_date.desc().nullslast()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return [_match_to_dict(m) for m in result.scalars().all()]


@router.get("/live")
async def live_matches(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Match)
        .options(selectinload(Match.team1), selectinload(Match.team2))
        .where(Match.status == MatchStatus.live)
    )
    return [_match_to_dict(m) for m in result.scalars().all()]


@router.get("/{match_id}")
async def get_match(match_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    match = await _get_match_with_teams(match_id, db)
    if not match:
        raise HTTPException(404, "Match not found")
    return _match_to_dict(match)


@router.patch("/{match_id}")
async def update_match(
    match_id: uuid.UUID,
    data: MatchUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(match, k, v)
    await db.commit()
    return _match_to_dict(await _get_match_with_teams(match_id, db))


@router.post("/{match_id}/toss")
async def record_toss(
    match_id: uuid.UUID,
    data: TossInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")
    # Allow toss if match is scheduled, upcoming, or not yet set
    allowed = (MatchStatus.scheduled, MatchStatus.upcoming, MatchStatus.toss)
    if match.status not in allowed:
        raise HTTPException(400, f"Cannot record toss for a match with status '{match.status.value}'")
    if data.toss_winner_id not in (match.team1_id, match.team2_id):
        raise HTTPException(400, "Toss winner must be one of the playing teams")

    match.toss_winner_id = data.toss_winner_id
    match.toss_decision = data.toss_decision
    match.status = MatchStatus.toss
    await db.commit()
    return _match_to_dict(await _get_match_with_teams(match_id, db))


@router.post("/{match_id}/playing-xi", response_model=MessageResponse)
async def set_playing_xi(
    match_id: uuid.UUID,
    data: PlayingXIInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")
    if data.team_id not in (match.team1_id, match.team2_id):
        raise HTTPException(400, "Team not in this match")
    if len(data.player_ids) != 11:
        raise HTTPException(400, "Playing XI must have exactly 11 players")

    # Verify all players belong to the specified team
    players_result = await db.execute(
        select(PlayerProfile).where(
            PlayerProfile.id.in_(data.player_ids),
            PlayerProfile.team_id == data.team_id,
        )
    )
    found_players = players_result.scalars().all()
    if len(found_players) != 11:
        found_ids = {p.id for p in found_players}
        missing = [pid for pid in data.player_ids if pid not in found_ids]
        raise HTTPException(400, f"Players {missing} not found in the selected team")

    # Remove existing XI for this team in this match
    existing = await db.execute(
        select(PlayingXI).where(
            PlayingXI.match_id == match_id,
            PlayingXI.team_id == data.team_id,
        )
    )
    for p in existing.scalars().all():
        await db.delete(p)

    for i, player_id in enumerate(data.player_ids, 1):
        xi = PlayingXI(
            match_id=match_id,
            team_id=data.team_id,
            player_id=player_id,
            batting_order=i,
        )
        db.add(xi)

    await db.commit()
    return MessageResponse(message="Playing XI set")


@router.post("/{match_id}/start-innings")
async def start_innings(
    match_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")
    if not match.toss_winner_id:
        raise HTTPException(400, "Toss not recorded yet")

    innings_count_result = await db.execute(
        select(func.count()).where(Innings.match_id == match_id)
    )
    innings_count = innings_count_result.scalar()
    if innings_count >= 2:
        raise HTTPException(400, "Both innings already played")

    innings_number = innings_count + 1

    if innings_number == 1:
        # Batting team decided by toss
        toss_decision_val = match.toss_decision.value if hasattr(match.toss_decision, 'value') else match.toss_decision
        if toss_decision_val == "bat":
            batting_team_id = match.toss_winner_id
        else:
            batting_team_id = match.team1_id if match.toss_winner_id == match.team2_id else match.team2_id
        bowling_team_id = match.team2_id if batting_team_id == match.team1_id else match.team1_id

        innings = Innings(
            match_id=match_id,
            innings_number=1,
            batting_team_id=batting_team_id,
            bowling_team_id=bowling_team_id,
        )
        db.add(innings)
        match.status = MatchStatus.live
        match.started_at = match.started_at or datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(innings)
        return _innings_to_dict(innings)
    else:
        # Second innings: teams switch, set target
        prev_innings_result = await db.execute(
            select(Innings).where(
                Innings.match_id == match_id,
                Innings.innings_number == 1,
            )
        )
        first = prev_innings_result.scalar_one()
        batting_team_id = first.bowling_team_id
        bowling_team_id = first.batting_team_id
        target = first.total_runs + 1

        innings = Innings(
            match_id=match_id,
            innings_number=2,
            batting_team_id=batting_team_id,
            bowling_team_id=bowling_team_id,
            target=target,
        )
        db.add(innings)
        match.status = MatchStatus.live
        match.current_innings = 2
        await db.commit()
        await db.refresh(innings)
        return _innings_to_dict(innings)


@router.get("/{match_id}/scorecard")
async def get_scorecard(match_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from app.models import FallOfWicket

    result = await db.execute(
        select(Innings)
        .options(
            selectinload(Innings.batting_scores)
                .selectinload(BattingScore.batsman)
                .selectinload(PlayerProfile.user),
            selectinload(Innings.batting_scores)
                .selectinload(BattingScore.bowler)
                .selectinload(PlayerProfile.user),
            selectinload(Innings.bowling_figures)
                .selectinload(BowlingFigure.bowler)
                .selectinload(PlayerProfile.user),
            selectinload(Innings.fall_of_wickets)
                .selectinload(FallOfWicket.batsman)
                .selectinload(PlayerProfile.user),
            selectinload(Innings.batting_team),
            selectinload(Innings.bowling_team),
        )
        .where(Innings.match_id == match_id)
        .order_by(Innings.innings_number)
    )
    innings_list = result.scalars().all()
    if not innings_list:
        raise HTTPException(404, "No innings found")

    def _resolve_name(profile) -> str:
        """Return best display name for a PlayerProfile."""
        if not profile:
            return "Unknown"
        if profile.user:
            name = (profile.user.full_name or "").strip()
            if name:
                return name
            return profile.user.username or f"Player {profile.id}"
        return f"Player {profile.id}"

    scorecards = []
    for inn in innings_list:
        batting = [
            {
                "id": b.id,
                "batsman_id": b.batsman_id,
                "batsman_name": _resolve_name(b.batsman),
                "bowler_name": _resolve_name(b.bowler) if b.bowler_id else None,
                "runs": b.runs,
                "balls_faced": b.balls_faced,
                "fours": b.fours,
                "sixes": b.sixes,
                "is_out": b.is_out,
                "dismissal_type": b.dismissal_type.value if b.dismissal_type and hasattr(b.dismissal_type, 'value') else b.dismissal_type,
                "batting_position": b.batting_position,
            }
            for b in sorted(inn.batting_scores, key=lambda x: x.batting_position or 99)
        ]
        bowling = [
            {
                "id": b.id,
                "bowler_id": b.bowler_id,
                "bowler_name": _resolve_name(b.bowler),
                "overs": b.overs,
                "maidens": b.maidens,
                "runs": b.runs,
                "wickets": b.wickets,
                "wides": b.wides,
                "no_balls": b.no_balls,
                "economy_rate": round(b.economy_rate, 2) if b.economy_rate else 0.0,
            }
            for b in inn.bowling_figures
        ]
        fow = [
            {
                "wicket_number": f.wicket_number,
                "runs_at_fall": f.runs_at_fall,
                "overs_at_fall": f.overs_at_fall,
                "batsman_name": _resolve_name(f.batsman) if f.batsman else None,
            }
            for f in sorted(inn.fall_of_wickets, key=lambda x: x.wicket_number)
        ]
        scorecards.append({
            "innings": {
                "id": inn.id,
                "innings_number": inn.innings_number,
                "batting_team_id": str(inn.batting_team_id),
                "bowling_team_id": str(inn.bowling_team_id),
                "batting_team": {"name": inn.batting_team.name, "short": inn.batting_team.short} if inn.batting_team else None,
                "bowling_team": {"name": inn.bowling_team.name, "short": inn.bowling_team.short} if inn.bowling_team else None,
                "total_runs": inn.total_runs,
                "total_wickets": inn.total_wickets,
                "total_overs": inn.total_overs,
                "extras_wide": inn.extras_wide,
                "extras_no_ball": inn.extras_no_ball,
                "extras_bye": inn.extras_bye,
                "extras_leg_bye": inn.extras_leg_bye,
                "target": inn.target,
                "is_completed": inn.is_completed,
            },
            "batting": batting,
            "bowling": bowling,
            "fall_of_wickets": fow,
        })
    return scorecards


async def _get_match_with_teams(match_id: uuid.UUID, db: AsyncSession):
    result = await db.execute(
        select(Match)
        .options(selectinload(Match.team1), selectinload(Match.team2))
        .where(Match.id == match_id)
    )
    return result.scalar_one_or_none()


def _match_to_dict(m):
    if not m:
        return None
    return {
        "id": str(m.id),
        "slot": m.slot,
        "status": m.status.value if hasattr(m.status, 'value') else m.status,
        "match_type": m.match_type,
        "overs": m.overs,
        "venue": m.venue,
        "match_date": m.match_date.isoformat() if m.match_date else None,
        "match_number": m.match_number,
        "tournament_id": m.tournament_id,
        "current_innings": m.current_innings,
        "toss_winner_id": str(m.toss_winner_id) if m.toss_winner_id else None,
        "toss_decision": m.toss_decision.value if m.toss_decision and hasattr(m.toss_decision, 'value') else m.toss_decision,
        "winner_id": str(m.winner_id) if m.winner_id else None,
        "result_summary": m.result_summary,
        "result": m.result,
        "is_revealed": m.is_revealed,
        "started_at": m.started_at.isoformat() if m.started_at else None,
        "completed_at": m.completed_at.isoformat() if m.completed_at else None,
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "updated_at": m.updated_at.isoformat() if m.updated_at else None,
        "team1_id": str(m.team1_id) if m.team1_id else None,
        "team2_id": str(m.team2_id) if m.team2_id else None,
        "team1": {"id": str(m.team1.id), "name": m.team1.name, "short": m.team1.short} if m.team1 else None,
        "team2": {"id": str(m.team2.id), "name": m.team2.name, "short": m.team2.short} if m.team2 else None,
    }


def _innings_to_dict(inn) -> dict:
    """Serialize an Innings ORM object to a plain dict — no lazy loads triggered."""
    return {
        "id": inn.id,
        "match_id": str(inn.match_id),
        "innings_number": inn.innings_number,
        "batting_team_id": str(inn.batting_team_id),
        "bowling_team_id": str(inn.bowling_team_id),
        "total_runs": inn.total_runs,
        "total_wickets": inn.total_wickets,
        "total_overs": inn.total_overs,
        "extras_wide": inn.extras_wide,
        "extras_no_ball": inn.extras_no_ball,
        "extras_bye": inn.extras_bye,
        "extras_leg_bye": inn.extras_leg_bye,
        "extras_penalty": inn.extras_penalty,
        "target": inn.target,
        "is_completed": inn.is_completed,
        "declared": inn.declared,
        "started_at": inn.started_at.isoformat() if inn.started_at else None,
        "completed_at": inn.completed_at.isoformat() if inn.completed_at else None,
        "batting_team": None,
        "bowling_team": None,
    }
