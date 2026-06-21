"""
Unified SQLAlchemy ORM models — BNI Cricket + CricPro integration.
"""
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Optional, List

from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, Float,
    ForeignKey, UniqueConstraint, Index, Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

SCHEMA = "bni"

def _enum_values(enum_cls):
    return [e.value for e in enum_cls]

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

# ── Enums ─────────────────────────────────────────────────────────────────
class UserRole(str, PyEnum):
    admin = "admin"; organizer = "organizer"
    player = "player"; scorer = "scorer"; user = "user"

class MatchStatus(str, PyEnum):
    live = "LIVE"; completed = "COMPLETED"; upcoming = "UPCOMING"
    scheduled = "scheduled"; toss = "toss"; innings_break = "innings_break"
    abandoned = "abandoned"; cancelled = "cancelled"

class MediaType(str, PyEnum):
    video_file = "video_file"; video_link = "video_link"; image = "image"

class TournamentFormat(str, PyEnum):
    league = "league"; knockout = "knockout"
    league_knockout = "league_knockout"; round_robin = "round_robin"

class TournamentStatus(str, PyEnum):
    upcoming = "upcoming"; ongoing = "ongoing"
    completed = "completed"; cancelled = "cancelled"

class BallType(str, PyEnum):
    normal = "normal"; wide = "wide"; no_ball = "no_ball"
    bye = "bye"; leg_bye = "leg_bye"; penalty = "penalty"

class DismissalType(str, PyEnum):
    bowled = "bowled"; caught = "caught"; lbw = "lbw"; run_out = "run_out"
    stumped = "stumped"; hit_wicket = "hit_wicket"; handled_ball = "handled_ball"
    obstructing_field = "obstructing_field"; timed_out = "timed_out"; retired_hurt = "retired_hurt"

class TossDecision(str, PyEnum):
    bat = "bat"; bowl = "bowl"

# ── Users ─────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, values_callable=_enum_values, name="userrole"), default=UserRole.user, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(128))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    profile_photo: Mapped[Optional[str]] = mapped_column(String(500))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    batting_style: Mapped[Optional[str]] = mapped_column(String(50))
    bowling_style: Mapped[Optional[str]] = mapped_column(String(50))
    date_of_birth: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    refresh_tokens: Mapped[List["RefreshToken"]] = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    player_profiles: Mapped[List["PlayerProfile"]] = relationship("PlayerProfile", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.users.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")


# ── Registered Players (BNI public form) ─────────────────────────────────
class RegisteredPlayer(Base):
    __tablename__ = "registered_players"
    __table_args__ = (UniqueConstraint("phone_no", name="uq_player_phone"), {"schema": SCHEMA})

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    business: Mapped[str] = mapped_column(String(256), nullable=False)
    category: Mapped[str] = mapped_column(String(128), nullable=False)
    phone_no: Mapped[str] = mapped_column(String(13), nullable=False)
    team_name: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    team_short: Mapped[Optional[str]] = mapped_column(String(8))
    role: Mapped[str] = mapped_column(String(32), default="Player")
    membership_years: Mapped[Optional[int]] = mapped_column(Integer)
    jersey_number: Mapped[Optional[str]] = mapped_column(String(4))
    jersey_size: Mapped[Optional[str]] = mapped_column(String(4))
    track_pant_size: Mapped[Optional[str]] = mapped_column(String(4))
    photo_data: Mapped[Optional[str]] = mapped_column(Text)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ── Teams ─────────────────────────────────────────────────────────────────
class Team(Base):
    __tablename__ = "teams"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    short: Mapped[Optional[str]] = mapped_column(String(10), unique=True)
    logo_url: Mapped[Optional[str]] = mapped_column(Text)
    logo_key: Mapped[Optional[str]] = mapped_column(Text)
    captain: Mapped[Optional[str]] = mapped_column(String(128))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.users.id", ondelete="SET NULL"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    matches_as_team1: Mapped[List["Match"]] = relationship("Match", foreign_keys="Match.team1_id", back_populates="team1")
    matches_as_team2: Mapped[List["Match"]] = relationship("Match", foreign_keys="Match.team2_id", back_populates="team2")
    group_memberships: Mapped[List["GroupTeam"]] = relationship("GroupTeam", back_populates="team")
    points_entries: Mapped[List["PointsTableEntry"]] = relationship("PointsTableEntry", back_populates="team")
    players: Mapped[List["PlayerProfile"]] = relationship("PlayerProfile", back_populates="team", foreign_keys="PlayerProfile.team_id")
    tournament_teams: Mapped[List["TournamentTeam"]] = relationship("TournamentTeam", back_populates="team")


# ── Player Profiles (CricPro scoring entity; future import target) ────────
class PlayerProfile(Base):
    __tablename__ = "player_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", "team_id", name="uq_player_team"),
        Index("idx_player_team", "team_id", "is_active"),
        {"schema": SCHEMA},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.users.id", ondelete="CASCADE"), nullable=False)
    team_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    photo_path: Mapped[Optional[str]] = mapped_column(String(500))   # /uploads/players/player_101.jpg
    batting_style: Mapped[Optional[str]] = mapped_column(String(50))
    bowling_style: Mapped[Optional[str]] = mapped_column(String(50))
    player_role: Mapped[Optional[str]] = mapped_column(String(50))
    jersey_number: Mapped[Optional[int]] = mapped_column(Integer)
    batting_order: Mapped[Optional[int]] = mapped_column(Integer)
    is_captain: Mapped[bool] = mapped_column(Boolean, default=False)
    is_vice_captain: Mapped[bool] = mapped_column(Boolean, default=False)
    is_wicket_keeper: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="player_profiles")
    team: Mapped[Optional["Team"]] = relationship("Team", back_populates="players", foreign_keys=[team_id])
    career_stats: Mapped[Optional["PlayerCareerStats"]] = relationship("PlayerCareerStats", back_populates="player", uselist=False)


# ── Tournaments ───────────────────────────────────────────────────────────
class Tournament(Base):
    __tablename__ = "tournaments"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    banner: Mapped[Optional[str]] = mapped_column(String(500))
    format: Mapped[TournamentFormat] = mapped_column(SAEnum(TournamentFormat, values_callable=_enum_values, name="tournamentformat"), nullable=False)
    status: Mapped[TournamentStatus] = mapped_column(SAEnum(TournamentStatus, values_callable=_enum_values, name="tournamentstatus"), default=TournamentStatus.upcoming)
    organizer_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.users.id", ondelete="SET NULL"))
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    venue: Mapped[Optional[str]] = mapped_column(String(200))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    overs_per_innings: Mapped[int] = mapped_column(Integer, default=20)
    max_teams: Mapped[int] = mapped_column(Integer, default=20)
    entry_fee: Mapped[Optional[float]] = mapped_column(Float)
    prize_money: Mapped[Optional[float]] = mapped_column(Float)
    rules: Mapped[Optional[str]] = mapped_column(Text)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    teams: Mapped[List["TournamentTeam"]] = relationship("TournamentTeam", back_populates="tournament", cascade="all, delete-orphan")
    matches: Mapped[List["Match"]] = relationship("Match", back_populates="tournament", cascade="all, delete-orphan")
    points_table: Mapped[List["PointsTableEntry"]] = relationship("PointsTableEntry", back_populates="tournament", cascade="all, delete-orphan")


class TournamentTeam(Base):
    __tablename__ = "tournament_teams"
    __table_args__ = (UniqueConstraint("tournament_id", "team_id", name="uq_tournament_team"), {"schema": SCHEMA})

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tournament_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.tournaments.id", ondelete="CASCADE"), nullable=False)
    team_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"), nullable=False)
    group_name: Mapped[Optional[str]] = mapped_column(String(10))
    seed: Mapped[Optional[int]] = mapped_column(Integer)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    tournament: Mapped["Tournament"] = relationship("Tournament", back_populates="teams")
    team: Mapped["Team"] = relationship("Team", back_populates="tournament_teams")


# ── Matches ───────────────────────────────────────────────────────────────
class Match(Base):
    __tablename__ = "matches"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot: Mapped[Optional[int]] = mapped_column(Integer, unique=True)
    is_revealed: Mapped[bool] = mapped_column(Boolean, default=False)
    tournament_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.tournaments.id", ondelete="CASCADE"))
    match_number: Mapped[Optional[int]] = mapped_column(Integer)
    match_type: Mapped[str] = mapped_column(String(50), default="league")
    team1_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    team2_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    venue: Mapped[Optional[str]] = mapped_column(String(256))
    match_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    status: Mapped[MatchStatus] = mapped_column(SAEnum(MatchStatus, values_callable=_enum_values, name="matchstatus"), default=MatchStatus.upcoming)
    overs: Mapped[int] = mapped_column(Integer, default=20)
    toss_winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    toss_decision: Mapped[Optional[TossDecision]] = mapped_column(SAEnum(TossDecision, values_callable=_enum_values, name="tossdecision"))
    winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    win_margin: Mapped[Optional[int]] = mapped_column(Integer)
    win_by: Mapped[Optional[str]] = mapped_column(String(20))
    result: Mapped[Optional[str]] = mapped_column(Text)
    result_summary: Mapped[Optional[str]] = mapped_column(String(500))
    current_innings: Mapped[int] = mapped_column(Integer, default=1)
    player_of_match_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id", ondelete="SET NULL"))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    team1: Mapped[Optional["Team"]] = relationship("Team", foreign_keys=[team1_id], back_populates="matches_as_team1")
    team2: Mapped[Optional["Team"]] = relationship("Team", foreign_keys=[team2_id], back_populates="matches_as_team2")
    toss_winner: Mapped[Optional["Team"]] = relationship("Team", foreign_keys=[toss_winner_id])
    winner: Mapped[Optional["Team"]] = relationship("Team", foreign_keys=[winner_id])
    tournament: Mapped[Optional["Tournament"]] = relationship("Tournament", back_populates="matches")
    player_of_match: Mapped[Optional["PlayerProfile"]] = relationship("PlayerProfile", foreign_keys=[player_of_match_id])
    innings: Mapped[List["Innings"]] = relationship("Innings", back_populates="match", cascade="all, delete-orphan")
    playing_xi: Mapped[List["PlayingXI"]] = relationship("PlayingXI", back_populates="match", cascade="all, delete-orphan")
    live_score: Mapped[Optional["LiveScore"]] = relationship("LiveScore", back_populates="match", uselist=False)


class PlayingXI(Base):
    __tablename__ = "playing_xi"
    __table_args__ = (UniqueConstraint("match_id", "team_id", "player_id", name="uq_playing_xi"), {"schema": SCHEMA})

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.matches.id", ondelete="CASCADE"), nullable=False)
    team_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"), nullable=False)
    player_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id", ondelete="CASCADE"), nullable=False)
    batting_order: Mapped[Optional[int]] = mapped_column(Integer)
    is_captain: Mapped[bool] = mapped_column(Boolean, default=False)
    is_vice_captain: Mapped[bool] = mapped_column(Boolean, default=False)
    is_wicket_keeper: Mapped[bool] = mapped_column(Boolean, default=False)

    match: Mapped["Match"] = relationship("Match", back_populates="playing_xi")
    team: Mapped["Team"] = relationship("Team")
    player: Mapped["PlayerProfile"] = relationship("PlayerProfile")


# ── Live Scores (BNI widget) ──────────────────────────────────────────────
class LiveScore(Base):
    __tablename__ = "live_scores"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.matches.id", ondelete="SET NULL"))
    team1_name: Mapped[str] = mapped_column(String(64), nullable=False)
    team1_short: Mapped[str] = mapped_column(String(8), nullable=False)
    team1_score: Mapped[Optional[str]] = mapped_column(String(16))
    team1_overs: Mapped[Optional[str]] = mapped_column(String(8))
    team2_name: Mapped[str] = mapped_column(String(64), nullable=False)
    team2_short: Mapped[str] = mapped_column(String(8), nullable=False)
    team2_score: Mapped[Optional[str]] = mapped_column(String(16))
    team2_overs: Mapped[Optional[str]] = mapped_column(String(8))
    status: Mapped[MatchStatus] = mapped_column(SAEnum(MatchStatus, values_callable=_enum_values, name="matchstatus"), default=MatchStatus.live)
    venue: Mapped[Optional[str]] = mapped_column(String(256))
    result: Mapped[Optional[str]] = mapped_column(Text)
    video_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.media_files.id", ondelete="SET NULL"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    match: Mapped[Optional["Match"]] = relationship("Match", back_populates="live_score")
    video: Mapped[Optional["MediaFile"]] = relationship("MediaFile")


# ── Innings & Ball-by-Ball Scoring ────────────────────────────────────────
class Innings(Base):
    __tablename__ = "innings"
    __table_args__ = (UniqueConstraint("match_id", "innings_number", name="uq_match_innings"), {"schema": SCHEMA})

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    match_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.matches.id", ondelete="CASCADE"), nullable=False)
    innings_number: Mapped[int] = mapped_column(Integer, nullable=False)
    batting_team_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"), nullable=False)
    bowling_team_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"), nullable=False)
    total_runs: Mapped[int] = mapped_column(Integer, default=0)
    total_wickets: Mapped[int] = mapped_column(Integer, default=0)
    total_overs: Mapped[float] = mapped_column(Float, default=0.0)
    extras_wide: Mapped[int] = mapped_column(Integer, default=0)
    extras_no_ball: Mapped[int] = mapped_column(Integer, default=0)
    extras_bye: Mapped[int] = mapped_column(Integer, default=0)
    extras_leg_bye: Mapped[int] = mapped_column(Integer, default=0)
    extras_penalty: Mapped[int] = mapped_column(Integer, default=0)
    target: Mapped[Optional[int]] = mapped_column(Integer)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    declared: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    match: Mapped["Match"] = relationship("Match", back_populates="innings")
    batting_team: Mapped["Team"] = relationship("Team", foreign_keys=[batting_team_id])
    bowling_team: Mapped["Team"] = relationship("Team", foreign_keys=[bowling_team_id])
    balls: Mapped[List["Ball"]] = relationship("Ball", back_populates="innings", cascade="all, delete-orphan", order_by="Ball.id")
    batting_scores: Mapped[List["BattingScore"]] = relationship("BattingScore", back_populates="innings", cascade="all, delete-orphan")
    bowling_figures: Mapped[List["BowlingFigure"]] = relationship("BowlingFigure", back_populates="innings", cascade="all, delete-orphan")
    fall_of_wickets: Mapped[List["FallOfWicket"]] = relationship("FallOfWicket", back_populates="innings", cascade="all, delete-orphan")


class Ball(Base):
    __tablename__ = "balls"
    __table_args__ = (Index("idx_ball_innings_over", "innings_id", "over_number", "ball_number"), {"schema": SCHEMA})

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    innings_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.innings.id", ondelete="CASCADE"), nullable=False)
    over_number: Mapped[int] = mapped_column(Integer, nullable=False)
    ball_number: Mapped[int] = mapped_column(Integer, nullable=False)
    batsman_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"), nullable=False)
    bowler_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"), nullable=False)
    non_striker_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"))
    runs_off_bat: Mapped[int] = mapped_column(Integer, default=0)
    extra_runs: Mapped[int] = mapped_column(Integer, default=0)
    ball_type: Mapped[BallType] = mapped_column(SAEnum(BallType, values_callable=_enum_values, name="balltype"), default=BallType.normal)
    is_wicket: Mapped[bool] = mapped_column(Boolean, default=False)
    dismissal_type: Mapped[Optional[DismissalType]] = mapped_column(SAEnum(DismissalType, values_callable=_enum_values, name="dismissaltype"))
    dismissed_player_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"))
    fielder_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"))
    fielder2_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"))
    wicket_keeper_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"))
    is_free_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    is_boundary: Mapped[bool] = mapped_column(Boolean, default=False)
    is_six: Mapped[bool] = mapped_column(Boolean, default=False)
    commentary: Mapped[Optional[str]] = mapped_column(Text)
    total_runs: Mapped[int] = mapped_column(Integer, default=0)
    innings_runs_after: Mapped[int] = mapped_column(Integer, default=0)
    innings_wickets_after: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    innings: Mapped["Innings"] = relationship("Innings", back_populates="balls")
    batsman: Mapped["PlayerProfile"] = relationship("PlayerProfile", foreign_keys=[batsman_id])
    bowler: Mapped["PlayerProfile"] = relationship("PlayerProfile", foreign_keys=[bowler_id])
    non_striker: Mapped[Optional["PlayerProfile"]] = relationship("PlayerProfile", foreign_keys=[non_striker_id])
    dismissed_player: Mapped[Optional["PlayerProfile"]] = relationship("PlayerProfile", foreign_keys=[dismissed_player_id])
    fielder: Mapped[Optional["PlayerProfile"]] = relationship("PlayerProfile", foreign_keys=[fielder_id])
    fielder2: Mapped[Optional["PlayerProfile"]] = relationship("PlayerProfile", foreign_keys=[fielder2_id])
    wicket_keeper: Mapped[Optional["PlayerProfile"]] = relationship("PlayerProfile", foreign_keys=[wicket_keeper_id])


class BattingScore(Base):
    __tablename__ = "batting_scores"
    __table_args__ = (UniqueConstraint("innings_id", "batsman_id", name="uq_innings_batsman"), {"schema": SCHEMA})

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    innings_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.innings.id", ondelete="CASCADE"), nullable=False)
    batsman_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"), nullable=False)
    runs: Mapped[int] = mapped_column(Integer, default=0)
    balls_faced: Mapped[int] = mapped_column(Integer, default=0)
    fours: Mapped[int] = mapped_column(Integer, default=0)
    sixes: Mapped[int] = mapped_column(Integer, default=0)
    is_out: Mapped[bool] = mapped_column(Boolean, default=False)
    dismissal_type: Mapped[Optional[DismissalType]] = mapped_column(SAEnum(DismissalType, values_callable=_enum_values, name="dismissaltype"))
    bowler_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"))
    fielder_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"))
    batting_position: Mapped[Optional[int]] = mapped_column(Integer)
    came_in_at_over: Mapped[Optional[float]] = mapped_column(Float)
    out_at_over: Mapped[Optional[float]] = mapped_column(Float)

    innings: Mapped["Innings"] = relationship("Innings", back_populates="batting_scores")
    batsman: Mapped["PlayerProfile"] = relationship("PlayerProfile", foreign_keys=[batsman_id])
    bowler: Mapped[Optional["PlayerProfile"]] = relationship("PlayerProfile", foreign_keys=[bowler_id])
    fielder: Mapped[Optional["PlayerProfile"]] = relationship("PlayerProfile", foreign_keys=[fielder_id])


class BowlingFigure(Base):
    __tablename__ = "bowling_figures"
    __table_args__ = (UniqueConstraint("innings_id", "bowler_id", name="uq_innings_bowler"), {"schema": SCHEMA})

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    innings_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.innings.id", ondelete="CASCADE"), nullable=False)
    bowler_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"), nullable=False)
    overs: Mapped[float] = mapped_column(Float, default=0.0)
    maidens: Mapped[int] = mapped_column(Integer, default=0)
    runs: Mapped[int] = mapped_column(Integer, default=0)
    wickets: Mapped[int] = mapped_column(Integer, default=0)
    wides: Mapped[int] = mapped_column(Integer, default=0)
    no_balls: Mapped[int] = mapped_column(Integer, default=0)
    economy_rate: Mapped[float] = mapped_column(Float, default=0.0)

    innings: Mapped["Innings"] = relationship("Innings", back_populates="bowling_figures")
    bowler: Mapped["PlayerProfile"] = relationship("PlayerProfile", foreign_keys=[bowler_id])


class FallOfWicket(Base):
    __tablename__ = "fall_of_wickets"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    innings_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.innings.id", ondelete="CASCADE"), nullable=False)
    wicket_number: Mapped[int] = mapped_column(Integer, nullable=False)
    runs_at_fall: Mapped[int] = mapped_column(Integer, nullable=False)
    overs_at_fall: Mapped[float] = mapped_column(Float, nullable=False)
    batsman_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"), nullable=False)

    innings: Mapped["Innings"] = relationship("Innings", back_populates="fall_of_wickets")
    batsman: Mapped["PlayerProfile"] = relationship("PlayerProfile")


class Partnership(Base):
    __tablename__ = "partnerships"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    innings_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.innings.id", ondelete="CASCADE"), nullable=False)
    batsman1_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"), nullable=False)
    batsman2_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id"), nullable=False)
    runs: Mapped[int] = mapped_column(Integer, default=0)
    balls: Mapped[int] = mapped_column(Integer, default=0)
    wicket_number: Mapped[int] = mapped_column(Integer, nullable=False)

    innings: Mapped["Innings"] = relationship("Innings")
    batsman1: Mapped["PlayerProfile"] = relationship("PlayerProfile", foreign_keys=[batsman1_id])
    batsman2: Mapped["PlayerProfile"] = relationship("PlayerProfile", foreign_keys=[batsman2_id])


# ── Player Career Statistics ──────────────────────────────────────────────
class PlayerCareerStats(Base):
    __tablename__ = "player_career_stats"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    player_id: Mapped[int] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.player_profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    matches_played: Mapped[int] = mapped_column(Integer, default=0)
    innings_batted: Mapped[int] = mapped_column(Integer, default=0)
    runs_scored: Mapped[int] = mapped_column(Integer, default=0)
    balls_faced: Mapped[int] = mapped_column(Integer, default=0)
    highest_score: Mapped[int] = mapped_column(Integer, default=0)
    fours: Mapped[int] = mapped_column(Integer, default=0)
    sixes: Mapped[int] = mapped_column(Integer, default=0)
    fifties: Mapped[int] = mapped_column(Integer, default=0)
    hundreds: Mapped[int] = mapped_column(Integer, default=0)
    not_outs: Mapped[int] = mapped_column(Integer, default=0)
    batting_average: Mapped[float] = mapped_column(Float, default=0.0)
    strike_rate: Mapped[float] = mapped_column(Float, default=0.0)
    innings_bowled: Mapped[int] = mapped_column(Integer, default=0)
    overs_bowled: Mapped[float] = mapped_column(Float, default=0.0)
    runs_conceded: Mapped[int] = mapped_column(Integer, default=0)
    wickets: Mapped[int] = mapped_column(Integer, default=0)
    best_bowling_runs: Mapped[int] = mapped_column(Integer, default=0)
    best_bowling_wickets: Mapped[int] = mapped_column(Integer, default=0)
    economy_rate: Mapped[float] = mapped_column(Float, default=0.0)
    bowling_average: Mapped[float] = mapped_column(Float, default=0.0)
    bowling_strike_rate: Mapped[float] = mapped_column(Float, default=0.0)
    five_wicket_hauls: Mapped[int] = mapped_column(Integer, default=0)
    catches: Mapped[int] = mapped_column(Integer, default=0)
    run_outs: Mapped[int] = mapped_column(Integer, default=0)
    stumpings: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    player: Mapped["PlayerProfile"] = relationship("PlayerProfile", back_populates="career_stats")


# ── Groups & Points Table ─────────────────────────────────────────────────
class Group(Base):
    __tablename__ = "groups"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    teams: Mapped[List["GroupTeam"]] = relationship("GroupTeam", back_populates="group", cascade="all, delete-orphan")
    points_entries: Mapped[List["PointsTableEntry"]] = relationship("PointsTableEntry", back_populates="group")


class GroupTeam(Base):
    __tablename__ = "group_teams"
    __table_args__ = (UniqueConstraint("group_id", "team_id", name="uq_group_team"), {"schema": SCHEMA})

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.groups.id", ondelete="CASCADE"))
    team_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"))

    group: Mapped["Group"] = relationship("Group", back_populates="teams")
    team: Mapped["Team"] = relationship("Team", back_populates="group_memberships")


class PointsTableEntry(Base):
    __tablename__ = "points_table"
    __table_args__ = (UniqueConstraint("group_id", "team_id", name="uq_points_group_team"), {"schema": SCHEMA})

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.groups.id", ondelete="SET NULL"))
    tournament_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey(f"{SCHEMA}.tournaments.id", ondelete="CASCADE"))
    team_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"))
    played: Mapped[int] = mapped_column(Integer, default=0)
    won: Mapped[int] = mapped_column(Integer, default=0)
    lost: Mapped[int] = mapped_column(Integer, default=0)
    tied: Mapped[int] = mapped_column(Integer, default=0)
    no_result: Mapped[int] = mapped_column(Integer, default=0)
    points: Mapped[int] = mapped_column(Integer, default=0)
    nrr: Mapped[float] = mapped_column(Float, default=0.0)
    runs_scored: Mapped[int] = mapped_column(Integer, default=0)
    overs_faced: Mapped[float] = mapped_column(Float, default=0.0)
    runs_conceded: Mapped[int] = mapped_column(Integer, default=0)
    overs_bowled: Mapped[float] = mapped_column(Float, default=0.0)
    group_name: Mapped[Optional[str]] = mapped_column(String(10))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    team: Mapped["Team"] = relationship("Team", back_populates="points_entries")
    group: Mapped[Optional["Group"]] = relationship("Group", back_populates="points_entries")
    tournament: Mapped[Optional["Tournament"]] = relationship("Tournament", back_populates="points_table")


# ── News, Media, Banners ──────────────────────────────────────────────────
class NewsItem(Base):
    __tablename__ = "news_items"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    news_title_en: Mapped[str] = mapped_column(String(256), nullable=False)
    news_title_ta: Mapped[Optional[str]] = mapped_column(String(256))
    news_description_en: Mapped[Optional[str]] = mapped_column(Text)
    news_description_ta: Mapped[Optional[str]] = mapped_column(Text)
    venue_en: Mapped[Optional[str]] = mapped_column(String(256))
    venue_ta: Mapped[Optional[str]] = mapped_column(String(256))
    match_time_en: Mapped[Optional[str]] = mapped_column(String(128))
    match_time_ta: Mapped[Optional[str]] = mapped_column(String(128))
    status_en: Mapped[Optional[str]] = mapped_column(String(128))
    status_ta: Mapped[Optional[str]] = mapped_column(String(128))
    audience: Mapped[int] = mapped_column(Integer, default=0)
    media_embed_url: Mapped[Optional[str]] = mapped_column(Text)
    match_story_title_en: Mapped[Optional[str]] = mapped_column(String(256))
    match_story_title_ta: Mapped[Optional[str]] = mapped_column(String(256))
    match_story_description_en: Mapped[Optional[str]] = mapped_column(Text)
    match_story_description_ta: Mapped[Optional[str]] = mapped_column(Text)
    match_story_image_url: Mapped[Optional[str]] = mapped_column(Text)   # base64 data URI or external URL
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)


class MediaFile(Base):
    __tablename__ = "media_files"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename: Mapped[str] = mapped_column(String(256), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(256), nullable=False)
    media_type: Mapped[MediaType] = mapped_column(SAEnum(MediaType, values_callable=_enum_values, name="mediatype"), nullable=False)
    bucket: Mapped[str] = mapped_column(String(64), nullable=False)
    object_key: Mapped[str] = mapped_column(Text, nullable=False)
    public_url: Mapped[Optional[str]] = mapped_column(Text)
    embed_url: Mapped[Optional[str]] = mapped_column(Text)
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    mime_type: Mapped[Optional[str]] = mapped_column(String(64))
    uploaded_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Banner(Base):
    __tablename__ = "banners"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[Optional[str]] = mapped_column(String(256))
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    image_key: Mapped[Optional[str]] = mapped_column(Text)
    link_url: Mapped[Optional[str]] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# ── Spinner & Schedule Snapshots ──────────────────────────────────────────
class MatchScheduleSnapshot(Base):
    __tablename__ = "match_schedule_snapshots"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot_to_team_name: Mapped[Optional[str]] = mapped_column(Text)
    schedule_plan: Mapped[Optional[str]] = mapped_column(Text)
    revealed_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class GroupRevealSnapshot(Base):
    __tablename__ = "group_reveal_snapshots"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[str] = mapped_column(String(4), nullable=False, index=True)
    selected_team_name: Mapped[str] = mapped_column(String(128), nullable=False)
    matches: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ── Notifications ─────────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)
    reference_id: Mapped[Optional[int]] = mapped_column(Integer)
    reference_type: Mapped[Optional[str]] = mapped_column(String(50))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="notifications")
