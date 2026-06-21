import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
import json
from datetime import datetime

from app.database import get_db
from app.db.redis import redis_publisher
from app.models import (
    Match, Innings, Ball, BattingScore, BowlingFigure, FallOfWicket,
    Partnership, PointsTableEntry, PlayerCareerStats, PlayerProfile,
    MatchStatus, BallType, DismissalType, User, TournamentStatus
)
from app.schemas.schemas import BallInput, BallOut, LiveScoreOut, MatchOut, MessageResponse
from app.auth.dependencies import get_current_user
from app.services import scoring_logic

router = APIRouter(prefix="/scoring", tags=["Scoring"])


def _calculate_overs(legal_balls: int) -> float:
    return scoring_logic.calculate_overs(legal_balls)


def _is_legal_ball(ball_type: BallType) -> bool:
    """Legal deliveries advance the over counter and batsman's balls-faced.

    Delegates to scoring_logic.is_legal_ball (normal / bye / leg_bye).
    """
    value = ball_type.value if hasattr(ball_type, "value") else str(ball_type)
    return scoring_logic.is_legal_ball(value)


def _generate_commentary(data, batter_name: str, bowler_name: str,
                         fielder_name: str | None, fielder2_name: str | None,
                         keeper_name: str | None, is_captain: bool,
                         is_vc: bool, is_non_striker: bool) -> str:
    """Generate rich ball commentary including captain markers and wicket attribution.

    Thin adapter over scoring_logic.build_commentary (which is pure/testable).
    """
    dt = data.dismissal_type
    dt_value = dt.value if hasattr(dt, "value") else (str(dt) if dt else None)
    bt = data.ball_type
    bt_value = bt.value if hasattr(bt, "value") else str(bt)
    return scoring_logic.build_commentary(
        is_wicket=data.is_wicket,
        ball_type=bt_value,
        dismissal_type=dt_value,
        runs_off_bat=data.runs_off_bat,
        extra_runs=data.extra_runs,
        batter_name=batter_name,
        bowler_name=bowler_name,
        fielder_name=fielder_name,
        fielder2_name=fielder2_name,
        keeper_name=keeper_name,
        is_captain=is_captain,
        is_vice_captain=is_vc,
        is_non_striker=is_non_striker,
    )


async def _get_or_create_batting_score(
    db, innings_id: int, batsman_id: int
) -> BattingScore:
    result = await db.execute(
        select(BattingScore).where(
            BattingScore.innings_id == innings_id,
            BattingScore.batsman_id == batsman_id,
        )
    )
    bs = result.scalar_one_or_none()
    if not bs:
        result2 = await db.execute(
            select(func.count()).where(BattingScore.innings_id == innings_id)
        )
        position = result2.scalar() + 1
        bs = BattingScore(
            innings_id=innings_id,
            batsman_id=batsman_id,
            batting_position=position,
        )
        db.add(bs)
        await db.flush()
    return bs


async def _get_or_create_bowling_figure(
    db, innings_id: int, bowler_id: int
) -> BowlingFigure:
    result = await db.execute(
        select(BowlingFigure).where(
            BowlingFigure.innings_id == innings_id,
            BowlingFigure.bowler_id == bowler_id,
        )
    )
    bf = result.scalar_one_or_none()
    if not bf:
        bf = BowlingFigure(innings_id=innings_id, bowler_id=bowler_id)
        db.add(bf)
        await db.flush()
    return bf


@router.post("/innings/{innings_id}/ball", response_model=BallOut)
async def record_ball(
    innings_id: int,
    data: BallInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # ── Load and validate ────────────────────────────────────────────────
    innings = (await db.execute(select(Innings).where(Innings.id == innings_id))).scalar_one_or_none()
    if not innings:
        raise HTTPException(404, "Innings not found")
    if innings.is_completed:
        raise HTTPException(400, "Innings already completed")

    match = (await db.execute(select(Match).where(Match.id == innings.match_id))).scalar_one()
    if match.status != MatchStatus.live:
        raise HTTPException(400, "Match is not live")

    # ── Ball type normalisation ──────────────────────────────────────────
    try:
        ball_type = BallType(data.ball_type)
    except ValueError:
        raise HTTPException(422, f"Invalid ball_type: {data.ball_type}")

    try:
        dismissal_type = DismissalType(data.dismissal_type) if data.dismissal_type else None
    except ValueError:
        dismissal_type = None

    # ── Bounce rule (Feature 2) ──────────────────────────────────────────
    # Count bounce deliveries in the current over (same over_number)
    legal_result = await db.execute(
        select(func.count()).where(
            Ball.innings_id == innings_id,
            Ball.ball_type.in_([BallType.normal, BallType.bye, BallType.leg_bye]),
        )
    )
    legal_balls = legal_result.scalar()
    current_over_number = legal_balls // 6 + 1  # 1-based current over

    bounce_warning = None
    if data.is_bounce:
        bounce_count_result = await db.execute(
            select(func.count()).where(
                Ball.innings_id == innings_id,
                Ball.over_number == current_over_number,
                Ball.commentary.like("%bounce%"),
            )
        )
        prior_bounces = bounce_count_result.scalar()
        outcome = scoring_logic.apply_bounce_rule(prior_bounces, data.extra_runs)
        if outcome.converted_to_no_ball:
            ball_type = BallType.no_ball
        if outcome.extra_runs != data.extra_runs:
            data = data.model_copy(update={"extra_runs": outcome.extra_runs})
        bounce_warning = outcome.warning

    # ── Over/ball position ───────────────────────────────────────────────
    over_number = legal_balls // 6
    ball_in_over = legal_balls % 6

    if over_number >= match.overs and _is_legal_ball(ball_type):
        raise HTTPException(400, "Over limit reached")

    # ── Dismissed player resolution (Feature 1: non-striker wicket) ─────
    actual_dismissed_id = scoring_logic.resolve_dismissed_player(
        is_wicket=data.is_wicket,
        dismissed_is_non_striker=data.dismissed_is_non_striker,
        non_striker_id=data.non_striker_id,
        dismissed_player_id=data.dismissed_player_id,
        batsman_id=data.batsman_id,
    )

    # ── Runs breakdown (Feature 3: leg-bye scoring) ─────────────────────
    _bt_value = ball_type.value if hasattr(ball_type, "value") else str(ball_type)
    breakdown = scoring_logic.compute_runs_breakdown(_bt_value, data.runs_off_bat, data.extra_runs)
    batter_runs = breakdown.batter_runs
    extra_total = breakdown.extra_runs
    total_runs = breakdown.total_runs
    is_boundary = breakdown.is_boundary
    is_six = breakdown.is_six

    # ── Fetch names for commentary ───────────────────────────────────────
    async def _resolve(pid):
        if not pid:
            return None, False, False
        pp = (await db.execute(
            select(PlayerProfile)
            .options(selectinload(PlayerProfile.user))
            .where(PlayerProfile.id == pid)
        )).scalar_one_or_none()
        if not pp:
            return f"Player #{pid}", False, False
        name = ""
        if pp.user:
            name = (pp.user.full_name or "").strip() or pp.user.username or f"Player #{pid}"
        else:
            name = f"Player #{pid}"
        return name, getattr(pp, "is_captain", False), getattr(pp, "is_vice_captain", False)

    batter_name, bat_cap, bat_vc = await _resolve(data.batsman_id)
    bowler_name, _, _ = await _resolve(data.bowler_id)
    fielder_name, _, _ = await _resolve(data.fielder_id)
    fielder2_name, _, _ = await _resolve(data.fielder2_id)
    keeper_name, _, _ = await _resolve(data.wicket_keeper_id)

    # For non-striker dismissal, get their name for commentary
    if data.dismissed_is_non_striker and data.non_striker_id:
        dismissed_name, bat_cap, bat_vc = await _resolve(data.non_striker_id)
    else:
        dismissed_name = batter_name

    # ── Build commentary ─────────────────────────────────────────────────
    auto_commentary = _generate_commentary(
        data=data,
        batter_name=dismissed_name if data.is_wicket else batter_name,
        bowler_name=bowler_name or "Bowler",
        fielder_name=fielder_name,
        fielder2_name=fielder2_name,
        keeper_name=keeper_name,
        is_captain=bat_cap,
        is_vc=bat_vc,
        is_non_striker=data.dismissed_is_non_striker and data.is_wicket,
    )
    if bounce_warning:
        auto_commentary = f"{bounce_warning} {auto_commentary}"
    final_commentary = data.commentary or auto_commentary

    # ── Create Ball record ───────────────────────────────────────────────
    ball = Ball(
        innings_id=innings_id,
        over_number=over_number + 1,
        ball_number=ball_in_over + 1,
        batsman_id=data.batsman_id,
        bowler_id=data.bowler_id,
        non_striker_id=data.non_striker_id,
        runs_off_bat=batter_runs,
        extra_runs=extra_total,
        ball_type=ball_type,
        is_wicket=data.is_wicket,
        dismissal_type=dismissal_type,
        dismissed_player_id=actual_dismissed_id,
        fielder_id=data.fielder_id,
        fielder2_id=data.fielder2_id,
        wicket_keeper_id=data.wicket_keeper_id,
        is_free_hit=data.is_free_hit,
        is_boundary=is_boundary,
        is_six=is_six,
        total_runs=total_runs,
        commentary=final_commentary,
    )

    # ── Innings totals ───────────────────────────────────────────────────
    innings.total_runs += total_runs

    _dt_value = dismissal_type.value if hasattr(dismissal_type, "value") else (str(dismissal_type) if dismissal_type else None)
    if scoring_logic.counts_against_wickets(data.is_wicket, _bt_value, _dt_value):
        innings.total_wickets += 1

    if ball_type == BallType.wide:
        innings.extras_wide += extra_total
    elif ball_type == BallType.no_ball:
        innings.extras_no_ball += extra_total
    elif ball_type == BallType.bye:
        innings.extras_bye += extra_total
    elif ball_type == BallType.leg_bye:
        innings.extras_leg_bye += extra_total  # Feature 3: leg bye fix

    if _is_legal_ball(ball_type):
        new_legal = legal_balls + 1
        innings.total_overs = _calculate_overs(new_legal)

    ball.innings_runs_after = innings.total_runs
    ball.innings_wickets_after = innings.total_wickets
    db.add(ball)

    # ── Batting score: STRIKER ───────────────────────────────────────────
    bs = await _get_or_create_batting_score(db, innings_id, data.batsman_id)
    # Balls faced: normal, no_ball, leg_bye (batter was on strike)
    if ball_type in (BallType.normal, BallType.no_ball, BallType.leg_bye):
        bs.balls_faced += 1
    # Runs: only credited on normal + no_ball (batter actually hit/ran)
    bs.runs += batter_runs
    if is_boundary:
        bs.fours += 1
    if is_six:
        bs.sixes += 1
    # Mark out — only if striker is the one dismissed
    if data.is_wicket and actual_dismissed_id == data.batsman_id:
        bs.is_out = True
        bs.dismissal_type = dismissal_type
        bs.bowler_id = data.bowler_id if dismissal_type not in (
            DismissalType.run_out, DismissalType.obstructing_field
        ) else None
        bs.fielder_id = data.fielder_id

    # ── Batting score: NON-STRIKER (Feature 1) ───────────────────────────
    if data.is_wicket and actual_dismissed_id == data.non_striker_id and data.non_striker_id:
        ns_bs = await _get_or_create_batting_score(db, innings_id, data.non_striker_id)
        ns_bs.is_out = True
        ns_bs.dismissal_type = dismissal_type
        # No bowler credit for run-out of non-striker
        ns_bs.bowler_id = None
        ns_bs.fielder_id = data.fielder_id

    # ── Bowling figure ───────────────────────────────────────────────────
    bf = await _get_or_create_bowling_figure(db, innings_id, data.bowler_id)
    bf.runs += batter_runs + (extra_total if ball_type in (BallType.wide, BallType.no_ball) else 0)

    if _is_legal_ball(ball_type):
        bowler_balls = round(bf.overs) * 6 + round(bf.overs * 10 % 10)
        bf.overs = _calculate_overs(bowler_balls + 1)
    if ball_type == BallType.wide:
        bf.wides += 1
    elif ball_type == BallType.no_ball:
        bf.no_balls += 1

    # Wicket credited to bowler (not wide/no_ball, not run_out/retired/obstructing)
    if scoring_logic.bowler_credited_with_wicket(data.is_wicket, _bt_value, _dt_value):
        bf.wickets += 1

    # Recalculate economy correctly (convert decimal overs to real overs)
    if bf.overs > 0:
        full = int(bf.overs)
        extra_b = round((bf.overs - full) * 10)
        real_overs = full + extra_b / 6
        bf.economy_rate = round(bf.runs / real_overs, 2) if real_overs > 0 else 0.0

    # ── Fall of wicket ───────────────────────────────────────────────────
    if data.is_wicket and ball_type != BallType.no_ball and dismissal_type != DismissalType.retired_hurt:
        fow = FallOfWicket(
            innings_id=innings_id,
            wicket_number=innings.total_wickets,
            runs_at_fall=innings.total_runs,
            overs_at_fall=innings.total_overs,
            batsman_id=actual_dismissed_id,
        )
        db.add(fow)

    # ── Innings completion ───────────────────────────────────────────────
    max_overs_reached = _is_legal_ball(ball_type) and (legal_balls + 1) >= match.overs * 6
    all_out = innings.total_wickets >= 10
    target_achieved = innings.target and innings.total_runs >= innings.target

    if max_overs_reached or all_out or target_achieved:
        innings.is_completed = True
        innings.completed_at = datetime.utcnow()
        if innings.innings_number == 1:
            match.status = MatchStatus.innings_break
            match.current_innings = 2
        else:
            await _complete_match(match, innings, db)

    await db.commit()
    await db.refresh(ball)

    # ── WebSocket broadcast ──────────────────────────────────────────────
    score_data = {
        "match_id": str(match.id),
        "innings_id": innings_id,
        "innings_number": innings.innings_number,
        "total_runs": innings.total_runs,
        "total_wickets": innings.total_wickets,
        "total_overs": innings.total_overs,
        "ball": {
            "over": ball.over_number,
            "ball": ball.ball_number,
            "runs": ball.runs_off_bat,
            "extras": ball.extra_runs,
            "type": ball.ball_type.value if hasattr(ball.ball_type, "value") else ball.ball_type,
            "is_wicket": ball.is_wicket,
            "commentary": ball.commentary,
        },
        "target": innings.target,
    }
    try:
        await redis_publisher.publish(
            f"match:{match.id}:live", json.dumps(score_data)
        )
        await redis_publisher.set_match_score(match.id, json.dumps(score_data))
    except Exception:
        pass

    return ball


@router.post("/innings/{innings_id}/undo", response_model=MessageResponse)
async def undo_last_ball(
    innings_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ball)
        .where(Ball.innings_id == innings_id)
        .order_by(Ball.id.desc())
        .limit(1)
    )
    last_ball = result.scalar_one_or_none()
    if not last_ball:
        raise HTTPException(404, "No balls to undo")

    result = await db.execute(select(Innings).where(Innings.id == innings_id))
    innings = result.scalar_one()

    # Reverse innings stats
    innings.total_runs -= last_ball.total_runs
    if last_ball.is_wicket and last_ball.ball_type != BallType.no_ball:
        innings.total_wickets -= 1
    if last_ball.ball_type == BallType.wide:
        innings.extras_wide -= last_ball.extra_runs
    elif last_ball.ball_type == BallType.no_ball:
        innings.extras_no_ball -= last_ball.extra_runs
    elif last_ball.ball_type == BallType.bye:
        innings.extras_bye -= last_ball.extra_runs
    elif last_ball.ball_type == BallType.leg_bye:
        innings.extras_leg_bye -= last_ball.extra_runs  # Feature 3: keep leg-bye undo consistent
    if _is_legal_ball(last_ball.ball_type):
        legal_count_result = await db.execute(
            select(func.count()).where(
                Ball.innings_id == innings_id,
                Ball.ball_type.in_([BallType.normal, BallType.bye, BallType.leg_bye]),
            )
        )
        innings.total_overs = _calculate_overs(legal_count_result.scalar() - 1)

    # Update batting score
    bs_result = await db.execute(
        select(BattingScore).where(
            BattingScore.innings_id == innings_id,
            BattingScore.batsman_id == last_ball.batsman_id,
        )
    )
    bs = bs_result.scalar_one_or_none()
    if bs:
        bs.runs -= last_ball.runs_off_bat
        if last_ball.ball_type in (BallType.normal, BallType.no_ball, BallType.leg_bye):
            bs.balls_faced = max(0, bs.balls_faced - 1)
        if last_ball.is_boundary:
            bs.fours = max(0, bs.fours - 1)
        if last_ball.is_six:
            bs.sixes = max(0, bs.sixes - 1)
        if last_ball.is_wicket:
            bs.is_out = False
            bs.dismissal_type = None

    # Delete the ball and related FOW
    if last_ball.is_wicket:
        fow_result = await db.execute(
            select(FallOfWicket).where(
                FallOfWicket.innings_id == innings_id,
                FallOfWicket.wicket_number == innings.total_wickets + 1,
            )
        )
        fow = fow_result.scalar_one_or_none()
        if fow:
            await db.delete(fow)

    await db.delete(last_ball)
    await db.commit()
    return MessageResponse(message="Last ball undone")


@router.get("/matches/{match_id}/live")
async def get_live_score(match_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload

    def _resolve_name(profile) -> str:
        if not profile:
            return None
        if profile.user:
            name = (profile.user.full_name or "").strip()
            if name:
                return name
            return profile.user.username or f"Player #{profile.id}"
        return f"Player #{profile.id}"

    match_result = await db.execute(
        select(Match)
        .options(selectinload(Match.team1), selectinload(Match.team2))
        .where(Match.id == match_id)
    )
    match = match_result.scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")

    innings_result = await db.execute(
        select(Innings)
        .options(selectinload(Innings.batting_team), selectinload(Innings.bowling_team))
        .where(Innings.match_id == match_id)
        .order_by(Innings.innings_number)
    )
    all_innings = innings_result.scalars().all()
    current_innings = next((i for i in reversed(all_innings) if not i.is_completed), None)
    if not current_innings and all_innings:
        current_innings = all_innings[-1]

    striker = None
    non_striker = None
    current_bowler = None
    last_five = []
    required_runs = None
    required_rr = None
    current_rr = None
    balls_remaining = None

    if current_innings:
        last_balls_result = await db.execute(
            select(Ball)
            .where(Ball.innings_id == current_innings.id)
            .order_by(Ball.id.desc())
            .limit(5)
        )
        last_five = list(reversed(last_balls_result.scalars().all()))

        if last_five:
            last_ball = last_five[-1]

            striker_bs = await db.execute(
                select(BattingScore)
                .options(selectinload(BattingScore.batsman).selectinload(PlayerProfile.user))
                .where(BattingScore.innings_id == current_innings.id,
                       BattingScore.batsman_id == last_ball.batsman_id)
            )
            s = striker_bs.scalar_one_or_none()
            if s:
                striker = {
                    "batsman_id": s.batsman_id,
                    "batsman_name": _resolve_name(s.batsman),
                    "runs": s.runs, "balls_faced": s.balls_faced,
                    "fours": s.fours, "sixes": s.sixes, "is_out": s.is_out,
                }

            if last_ball.non_striker_id:
                ns_result = await db.execute(
                    select(BattingScore)
                    .options(selectinload(BattingScore.batsman).selectinload(PlayerProfile.user))
                    .where(BattingScore.innings_id == current_innings.id,
                           BattingScore.batsman_id == last_ball.non_striker_id)
                )
                ns = ns_result.scalar_one_or_none()
                if ns:
                    non_striker = {
                        "batsman_id": ns.batsman_id,
                        "batsman_name": _resolve_name(ns.batsman),
                        "runs": ns.runs, "balls_faced": ns.balls_faced,
                        "fours": ns.fours, "sixes": ns.sixes, "is_out": ns.is_out,
                    }

            cb_result = await db.execute(
                select(BowlingFigure)
                .options(selectinload(BowlingFigure.bowler).selectinload(PlayerProfile.user))
                .where(BowlingFigure.innings_id == current_innings.id,
                       BowlingFigure.bowler_id == last_ball.bowler_id)
            )
            cb = cb_result.scalar_one_or_none()
            if cb:
                current_bowler = {
                    "bowler_id": cb.bowler_id,
                    "bowler_name": _resolve_name(cb.bowler),
                    "overs": cb.overs, "maidens": cb.maidens,
                    "runs": cb.runs, "wickets": cb.wickets,
                    "wides": cb.wides, "no_balls": cb.no_balls,
                    "economy_rate": round(cb.economy_rate, 2) if cb.economy_rate else 0.0,
                }

        if current_innings.target:
            runs_needed = current_innings.target - current_innings.total_runs
            legal_balls_used_result = await db.execute(
                select(func.count()).where(
                    Ball.innings_id == current_innings.id,
                    Ball.ball_type.in_([BallType.normal, BallType.bye]),
                )
            )
            legal_balls_used = legal_balls_used_result.scalar()
            balls_rem = match.overs * 6 - legal_balls_used
            required_runs = max(0, runs_needed)
            balls_remaining = balls_rem
            required_rr = round(runs_needed / (balls_rem / 6), 2) if balls_rem > 0 else 0

        if current_innings.total_overs > 0:
            current_rr = round(current_innings.total_runs / current_innings.total_overs, 2)

    def _inn_dict(inn):
        if not inn:
            return None
        return {
            "id": inn.id, "innings_number": inn.innings_number,
            "batting_team_id": str(inn.batting_team_id),
            "bowling_team_id": str(inn.bowling_team_id),
            "batting_team": {"name": inn.batting_team.name} if inn.batting_team else None,
            "bowling_team": {"name": inn.bowling_team.name} if inn.bowling_team else None,
            "total_runs": inn.total_runs, "total_wickets": inn.total_wickets,
            "total_overs": inn.total_overs, "target": inn.target,
            "is_completed": inn.is_completed,
            "extras_wide": inn.extras_wide, "extras_no_ball": inn.extras_no_ball,
            "extras_bye": inn.extras_bye, "extras_leg_bye": inn.extras_leg_bye,
        }

    return {
        "match": {
            "id": str(match.id), "overs": match.overs, "status": match.status.value,
            "team1": {"id": str(match.team1.id), "name": match.team1.name} if match.team1 else None,
            "team2": {"id": str(match.team2.id), "name": match.team2.name} if match.team2 else None,
        },
        "current_innings": _inn_dict(current_innings),
        "striker": striker,
        "non_striker": non_striker,
        "current_bowler": current_bowler,
        "required_runs": required_runs,
        "required_run_rate": required_rr,
        "current_run_rate": current_rr,
        "balls_remaining": balls_remaining,
        "last_five_balls": [
            {
                "id": b.id, "over_number": b.over_number, "ball_number": b.ball_number,
                "ball_type": b.ball_type.value if hasattr(b.ball_type, 'value') else b.ball_type,
                "runs_off_bat": b.runs_off_bat, "extra_runs": b.extra_runs,
                "total_runs": b.total_runs, "is_wicket": b.is_wicket,
                "is_boundary": b.is_boundary, "is_six": b.is_six,
            }
            for b in last_five
        ],
        "innings_history": [_inn_dict(i) for i in all_innings if i.is_completed],
    }


async def _complete_match(match: Match, last_innings: Innings, db: AsyncSession):
    from app.models import PointsTableEntry

    if last_innings.target and last_innings.total_runs >= last_innings.target:
        match.winner_id = last_innings.batting_team_id
        match.win_by = "wickets"
        match.win_margin = 10 - last_innings.total_wickets
        match.result_summary = (
            f"{last_innings.batting_team_id} won by {match.win_margin} wickets"
        )
    else:
        # First innings team wins
        first_result = await db.execute(
            select(Innings).where(Innings.match_id == match.id, Innings.innings_number == 1)
        )
        first_innings = first_result.scalar_one()
        match.winner_id = first_innings.batting_team_id
        run_diff = first_innings.total_runs - last_innings.total_runs
        match.win_by = "runs"
        match.win_margin = run_diff
        match.result_summary = f"won by {run_diff} runs"

    match.status = MatchStatus.completed
    match.completed_at = datetime.utcnow()

    # Update points table if tournament match
    if match.tournament_id:
        await _update_points_table(match, last_innings, db)


async def _update_points_table(match: Match, last_innings: Innings, db: AsyncSession):
    first_result = await db.execute(
        select(Innings).where(Innings.match_id == match.id, Innings.innings_number == 1)
    )
    first_innings = first_result.scalar_one_or_none()
    if not first_innings:
        return

    for team_id, batting_inn, bowling_inn in [
        (match.team1_id,
         first_innings if first_innings.batting_team_id == match.team1_id else last_innings,
         last_innings if first_innings.batting_team_id == match.team1_id else first_innings),
        (match.team2_id,
         last_innings if last_innings.batting_team_id == match.team2_id else first_innings,
         first_innings if last_innings.batting_team_id == match.team2_id else last_innings),
    ]:
        pt_result = await db.execute(
            select(PointsTableEntry).where(
                PointsTableEntry.tournament_id == match.tournament_id,
                PointsTableEntry.team_id == team_id,
            )
        )
        pt = pt_result.scalar_one_or_none()
        if not pt:
            pt = PointsTableEntry(tournament_id=match.tournament_id, team_id=team_id)
            db.add(pt)

        pt.played += 1
        pt.runs_scored += batting_inn.total_runs
        pt.overs_faced += batting_inn.total_overs
        pt.runs_conceded += bowling_inn.total_runs
        pt.overs_bowled += bowling_inn.total_overs

        if match.winner_id == team_id:
            pt.won += 1
            pt.points += 2
        elif match.winner_id:
            pt.lost += 1
        else:
            pt.tied += 1
            pt.points += 1

        # NRR
        if pt.overs_faced > 0 and pt.overs_bowled > 0:
            pt.nrr = round(
                (pt.runs_scored / pt.overs_faced) - (pt.runs_conceded / pt.overs_bowled), 3
            )


# ── Admin: Manual score correction endpoints ──────────────────────────────────

from pydantic import BaseModel
from typing import Optional as Opt

class BattingScoreUpdate(BaseModel):
    runs: Opt[int] = None
    balls_faced: Opt[int] = None
    fours: Opt[int] = None
    sixes: Opt[int] = None
    is_out: Opt[bool] = None
    dismissal_type: Opt[str] = None

class BowlingFigureUpdate(BaseModel):
    overs: Opt[float] = None
    maidens: Opt[int] = None
    runs: Opt[int] = None
    wickets: Opt[int] = None
    wides: Opt[int] = None
    no_balls: Opt[int] = None


@router.patch("/batting/{batting_id}", tags=["Scoring"], summary="Admin: update batting score")
async def update_batting_score(
    batting_id: int,
    data: BattingScoreUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually correct a batting score record. Requires admin/organizer/scorer role."""
    if current_user.role.value not in ("admin", "organizer", "scorer"):
        raise HTTPException(403, "Insufficient permissions")

    result = await db.execute(select(BattingScore).where(BattingScore.id == batting_id))
    bs = result.scalar_one_or_none()
    if not bs:
        raise HTTPException(404, "Batting score not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(bs, field, value)

    await db.commit()
    await db.refresh(bs)
    return {"id": bs.id, "runs": bs.runs, "balls_faced": bs.balls_faced,
            "fours": bs.fours, "sixes": bs.sixes, "is_out": bs.is_out,
            "dismissal_type": bs.dismissal_type}


@router.patch("/bowling/{bowling_id}", tags=["Scoring"], summary="Admin: update bowling figure")
async def update_bowling_figure(
    bowling_id: int,
    data: BowlingFigureUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually correct a bowling figure record. Requires admin/organizer/scorer role."""
    if current_user.role.value not in ("admin", "organizer", "scorer"):
        raise HTTPException(403, "Insufficient permissions")

    result = await db.execute(select(BowlingFigure).where(BowlingFigure.id == bowling_id))
    bf = result.scalar_one_or_none()
    if not bf:
        raise HTTPException(404, "Bowling figure not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(bf, field, value)

    # Recalculate economy
    if bf.overs and bf.overs > 0:
        bf.economy_rate = round(bf.runs / bf.overs, 2)

    await db.commit()
    await db.refresh(bf)
    return {"id": bf.id, "overs": bf.overs, "maidens": bf.maidens,
            "runs": bf.runs, "wickets": bf.wickets, "wides": bf.wides,
            "no_balls": bf.no_balls, "economy_rate": bf.economy_rate}


# ── Player: own performance dashboard ────────────────────────────────────────

@router.get("/player/me", tags=["Scoring"], summary="My performance stats")
async def my_performance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the logged-in player's complete performance stats."""
    from sqlalchemy.orm import selectinload

    # Get player profile(s) for this user
    profiles_result = await db.execute(
        select(PlayerProfile)
        .options(selectinload(PlayerProfile.team))
        .where(PlayerProfile.user_id == current_user.id)
    )
    profiles = profiles_result.scalars().all()

    if not profiles:
        return {
            "user": {"id": str(current_user.id), "username": current_user.username,
                     "full_name": current_user.full_name, "role": current_user.role.value},
            "profiles": [],
            "batting": {"innings": 0, "runs": 0, "highest": 0, "average": 0,
                        "strike_rate": 0, "fours": 0, "sixes": 0, "not_outs": 0},
            "bowling": {"innings": 0, "wickets": 0, "runs": 0, "overs": 0,
                        "economy": 0, "average": 0, "maidens": 0},
            "recent_batting": [],
            "recent_bowling": [],
        }

    player_ids = [p.id for p in profiles]

    # Aggregate batting
    bat_result = await db.execute(
        select(
            func.count(BattingScore.id).label("innings"),
            func.sum(BattingScore.runs).label("runs"),
            func.max(BattingScore.runs).label("highest"),
            func.sum(BattingScore.fours).label("fours"),
            func.sum(BattingScore.sixes).label("sixes"),
            func.sum(BattingScore.balls_faced).label("balls_faced"),
            func.count(BattingScore.id).filter(BattingScore.is_out == False).label("not_outs"),
        ).where(BattingScore.batsman_id.in_(player_ids))
    )
    bat = bat_result.first()

    innings = bat.innings or 0
    runs = bat.runs or 0
    highest = bat.highest or 0
    fours = bat.fours or 0
    sixes = bat.sixes or 0
    balls_faced = bat.balls_faced or 0
    not_outs = bat.not_outs or 0
    dismissals = innings - not_outs
    avg = round(runs / dismissals, 2) if dismissals > 0 else (runs if innings > 0 else 0)
    sr = round((runs / balls_faced) * 100, 2) if balls_faced > 0 else 0

    # Aggregate bowling
    bowl_result = await db.execute(
        select(
            func.count(BowlingFigure.id).label("innings"),
            func.sum(BowlingFigure.wickets).label("wickets"),
            func.sum(BowlingFigure.runs).label("runs"),
            func.sum(BowlingFigure.overs).label("overs"),
            func.sum(BowlingFigure.maidens).label("maidens"),
        ).where(BowlingFigure.bowler_id.in_(player_ids))
    )
    bowl = bowl_result.first()

    b_innings = bowl.innings or 0
    b_wickets = bowl.wickets or 0
    b_runs = bowl.runs or 0
    b_overs = bowl.overs or 0
    b_maidens = bowl.maidens or 0
    b_econ = round(b_runs / b_overs, 2) if b_overs > 0 else 0
    b_avg = round(b_runs / b_wickets, 2) if b_wickets > 0 else 0

    # Recent batting (last 10)
    recent_bat_result = await db.execute(
        select(BattingScore)
        .options(
            selectinload(BattingScore.innings).selectinload(Innings.match)
            .selectinload(Match.team1),
            selectinload(BattingScore.innings).selectinload(Innings.match)
            .selectinload(Match.team2),
        )
        .where(BattingScore.batsman_id.in_(player_ids))
        .order_by(BattingScore.id.desc())
        .limit(10)
    )
    recent_bat = recent_bat_result.scalars().all()

    # Recent bowling (last 10)
    recent_bowl_result = await db.execute(
        select(BowlingFigure)
        .options(
            selectinload(BowlingFigure.innings).selectinload(Innings.match)
            .selectinload(Match.team1),
            selectinload(BowlingFigure.innings).selectinload(Innings.match)
            .selectinload(Match.team2),
        )
        .where(BowlingFigure.bowler_id.in_(player_ids))
        .order_by(BowlingFigure.id.desc())
        .limit(10)
    )
    recent_bowl = recent_bowl_result.scalars().all()

    def fmt_match(innings_obj):
        if not innings_obj or not innings_obj.match:
            return "Unknown match"
        m = innings_obj.match
        t1 = m.team1.name if m.team1 else f"Team {m.team1_id}"
        t2 = m.team2.name if m.team2 else f"Team {m.team2_id}"
        return f"{t1} vs {t2}"

    return {
        "user": {
            "id": str(current_user.id),
            "username": current_user.username,
            "full_name": current_user.full_name,
            "role": current_user.role.value,
            "batting_style": current_user.batting_style,
            "bowling_style": current_user.bowling_style,
        },
        "profiles": [
            {
                "id": p.id,
                "team": p.team.name if p.team else None,
                "jersey_number": p.jersey_number,
                "player_role": p.player_role,
                "is_captain": p.is_captain,
            }
            for p in profiles
        ],
        "batting": {
            "innings": innings, "runs": runs, "highest": highest,
            "average": avg, "strike_rate": sr,
            "fours": fours, "sixes": sixes, "not_outs": not_outs,
        },
        "bowling": {
            "innings": b_innings, "wickets": b_wickets, "runs": b_runs,
            "overs": b_overs, "economy": b_econ, "average": b_avg, "maidens": b_maidens,
        },
        "recent_batting": [
            {
                "match": fmt_match(b.innings),
                "runs": b.runs, "balls": b.balls_faced,
                "fours": b.fours, "sixes": b.sixes,
                "dismissal": b.dismissal_type.value if b.dismissal_type else "not out",
                "sr": round((b.runs / b.balls_faced) * 100, 1) if b.balls_faced else 0,
            }
            for b in recent_bat
        ],
        "recent_bowling": [
            {
                "match": fmt_match(b.innings),
                "overs": b.overs, "wickets": b.wickets,
                "runs": b.runs, "maidens": b.maidens,
                "economy": b.economy_rate,
            }
            for b in recent_bowl
        ],
    }


# ── Admin: list all player profiles ──────────────────────────────────────────

@router.get("/players", tags=["Scoring"], summary="List all player profiles")
async def list_players(
    search: Optional[str] = None,
    team_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Returns all player profiles with user info. No auth required (public)."""
    from sqlalchemy.orm import selectinload

    q = (
        select(PlayerProfile)
        .options(
            selectinload(PlayerProfile.user),
            selectinload(PlayerProfile.team),
        )
    )
    if team_id:
        q = q.where(PlayerProfile.team_id == team_id)

    result = await db.execute(q)
    profiles = result.scalars().all()

    # Filter by search on user full_name or username
    if search:
        search_lower = search.lower()
        profiles = [
            p for p in profiles
            if p.user and (
                (p.user.full_name or "").lower().find(search_lower) >= 0
                or p.user.username.lower().find(search_lower) >= 0
            )
        ]

    return [
        {
            "id": p.id,
            "user_id": str(p.user_id),
            "full_name": p.user.full_name if p.user else None,
            "username": p.user.username if p.user else None,
            "batting_style": p.user.batting_style if p.user else p.batting_style,
            "bowling_style": p.user.bowling_style if p.user else p.bowling_style,
            "player_role": p.player_role,
            "jersey_number": p.jersey_number,
            "team": p.team.name if p.team else None,
            "team_id": str(p.team_id) if p.team_id else None,
            "is_captain": p.is_captain,
            "is_wicket_keeper": p.is_wicket_keeper,
        }
        for p in profiles
    ]
