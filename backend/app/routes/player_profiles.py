"""
Player statistics endpoints for recording batting and bowling performance.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.models import (
    PlayerProfile, BattingScore, BowlingFigure, PlayerCareerStats, User, UserRole
)
from app.schemas.schemas import (
    BattingScoreSchema, BowlingFigureSchema, PlayerCareerStatsSchema
)
from app.auth.dependencies import get_current_user

router = APIRouter()


@router.post("/batting-score", response_model=BattingScoreSchema, status_code=status.HTTP_201_CREATED)
async def record_batting_score(
    batting_data: BattingScoreSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a player's batting performance in an innings."""
    
    # Check if user has permission (admin, organizer, or scorer)
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.SCORER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins, organizers, or scorers can record scores"
        )

    # Verify batsman exists
    result = await db.execute(
        select(PlayerProfile).where(PlayerProfile.id == batting_data.batsman_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batsman not found"
        )

    # Check if score already exists for this batsman in this innings
    result = await db.execute(
        select(BattingScore).where(
            (BattingScore.innings_id == batting_data.innings_id) &
            (BattingScore.batsman_id == batting_data.batsman_id)
        )
    )
    existing_score = result.scalar_one_or_none()

    if existing_score:
        # Update existing score
        for field, value in batting_data.dict(exclude_unset=True).items():
            setattr(existing_score, field, value)
        db.add(existing_score)
    else:
        # Create new score
        db.add(batting_data)

    await db.commit()
    await db.refresh(batting_data if not existing_score else existing_score)
    return batting_data if not existing_score else existing_score


@router.post("/bowling-figure", response_model=BowlingFigureSchema, status_code=status.HTTP_201_CREATED)
async def record_bowling_figure(
    bowling_data: BowlingFigureSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a player's bowling performance in an innings."""
    
    # Check if user has permission
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.SCORER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins, organizers, or scorers can record scores"
        )

    # Verify bowler exists
    result = await db.execute(
        select(PlayerProfile).where(PlayerProfile.id == bowling_data.bowler_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bowler not found"
        )

    # Check if figure already exists
    result = await db.execute(
        select(BowlingFigure).where(
            (BowlingFigure.innings_id == bowling_data.innings_id) &
            (BowlingFigure.bowler_id == bowling_data.bowler_id)
        )
    )
    existing_figure = result.scalar_one_or_none()

    if existing_figure:
        # Update existing figure
        for field, value in bowling_data.dict(exclude_unset=True).items():
            setattr(existing_figure, field, value)
        db.add(existing_figure)
    else:
        # Create new figure
        db.add(bowling_data)

    await db.commit()
    await db.refresh(bowling_data if not existing_figure else existing_figure)
    return bowling_data if not existing_figure else existing_figure


@router.get("/career-stats/{player_id}", response_model=PlayerCareerStatsSchema)
async def get_player_career_stats(
    player_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a player's career statistics."""
    
    # Verify player exists
    result = await db.execute(
        select(PlayerProfile).where(PlayerProfile.id == player_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    # Get or create career stats
    result = await db.execute(
        select(PlayerCareerStats).where(PlayerCareerStats.player_id == player_id)
    )
    stats = result.scalar_one_or_none()

    if not stats:
        # Create new career stats record
        stats = PlayerCareerStats(player_id=player_id)
        db.add(stats)
        await db.commit()
        await db.refresh(stats)

    return stats


@router.put("/career-stats/{player_id}", response_model=PlayerCareerStatsSchema)
async def update_player_career_stats(
    player_id: int,
    stats_data: PlayerCareerStatsSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a player's career statistics."""
    
    # Check if user has permission
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.SCORER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins, organizers, or scorers can update stats"
        )

    # Verify player exists
    result = await db.execute(
        select(PlayerProfile).where(PlayerProfile.id == player_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    # Get or create career stats
    result = await db.execute(
        select(PlayerCareerStats).where(PlayerCareerStats.player_id == player_id)
    )
    stats = result.scalar_one_or_none()

    if not stats:
        stats = PlayerCareerStats(player_id=player_id)
        db.add(stats)
    else:
        # Update existing stats
        for field, value in stats_data.dict(exclude_unset=True).items():
            if value is not None:
                setattr(stats, field, value)

    db.add(stats)
    await db.commit()
    await db.refresh(stats)
    return stats


@router.get("/player/{player_id}/stats", response_model=dict)
async def get_player_full_stats(
    player_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get complete statistics for a player including career and recent performance."""
    
    # Verify player exists
    result = await db.execute(
        select(PlayerProfile).where(PlayerProfile.id == player_id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    # Get career stats
    result = await db.execute(
        select(PlayerCareerStats).where(PlayerCareerStats.player_id == player_id)
    )
    career_stats = result.scalar_one_or_none()

    # Get recent batting scores (last 5 innings)
    result = await db.execute(
        select(BattingScore)
        .where(BattingScore.batsman_id == player_id)
        .order_by(BattingScore.id.desc())
        .limit(5)
    )
    recent_batting = result.scalars().all()

    # Get recent bowling figures (last 5 innings)
    result = await db.execute(
        select(BowlingFigure)
        .where(BowlingFigure.bowler_id == player_id)
        .order_by(BowlingFigure.id.desc())
        .limit(5)
    )
    recent_bowling = result.scalars().all()

    return {
        "player_id": player_id,
        "player_name": player.user.full_name,
        "jersey_number": player.jersey_number,
        "team_id": player.team_id,
        "career_stats": career_stats,
        "recent_batting": recent_batting,
        "recent_bowling": recent_bowling,
    }
