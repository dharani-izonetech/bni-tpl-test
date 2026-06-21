"""
ORM models for Super12, Knockout stages, scheduling & audit tables.
Extends the existing models.py without modifying it.
"""
import uuid
from datetime import date, time, datetime
from enum import Enum as PyEnum
from typing import Optional, List

from sqlalchemy import (
    String, Integer, Boolean, Date, Time, DateTime, Text, Float,
    ForeignKey, UniqueConstraint, Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base

SCHEMA = "bni"


def utcnow():
    from datetime import timezone
    return datetime.now(timezone.utc)


class MatchTypeEnum(str, PyEnum):
    day = "day"
    floodlight = "floodlight"


class StageTypeEnum(str, PyEnum):
    league = "league"
    super12 = "super12"
    quarterfinal = "quarterfinal"
    semifinal = "semifinal"
    final = "final"


class SchedStatusEnum(str, PyEnum):
    scheduled = "scheduled"
    rescheduled = "rescheduled"
    postponed = "postponed"
    completed = "completed"
    cancelled = "cancelled"


def _ev(e):
    return [x.value for x in e]


# ── Super 12 ───────────────────────────────────────────────────────────────────

class Super12Group(Base):
    __tablename__ = "super12_groups"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    group_teams: Mapped[List["Super12GroupTeam"]] = relationship("Super12GroupTeam", back_populates="group", cascade="all, delete-orphan")
    points: Mapped[List["Super12Points"]] = relationship("Super12Points", back_populates="group", cascade="all, delete-orphan")
    matches: Mapped[List["Super12Match"]] = relationship("Super12Match", back_populates="group", cascade="all, delete-orphan")


class Super12GroupTeam(Base):
    __tablename__ = "super12_group_teams"
    __table_args__ = (UniqueConstraint("group_id", "team_id", name="uq_s12_group_team"), {"schema": SCHEMA})

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.super12_groups.id", ondelete="CASCADE"), nullable=False)
    team_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"), nullable=False)
    slot_label: Mapped[Optional[str]] = mapped_column(String(32))
    is_wildcard: Mapped[bool] = mapped_column(Boolean, default=False)

    group: Mapped["Super12Group"] = relationship("Super12Group", back_populates="group_teams")


class Super12Points(Base):
    __tablename__ = "super12_points"
    __table_args__ = (UniqueConstraint("group_id", "team_id", name="uq_s12_points"), {"schema": SCHEMA})

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.super12_groups.id", ondelete="CASCADE"), nullable=False)
    team_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"), nullable=False)
    played: Mapped[int] = mapped_column(Integer, default=0)
    won: Mapped[int] = mapped_column(Integer, default=0)
    lost: Mapped[int] = mapped_column(Integer, default=0)
    points: Mapped[int] = mapped_column(Integer, default=0)
    runs_for: Mapped[int] = mapped_column(Integer, default=0)
    runs_against: Mapped[int] = mapped_column(Integer, default=0)
    nrr: Mapped[float] = mapped_column(Float, default=0.0)
    overs_faced: Mapped[float] = mapped_column(Float, default=0.0)
    overs_bowled: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    group: Mapped["Super12Group"] = relationship("Super12Group", back_populates="points")


class Super12Match(Base):
    __tablename__ = "super12_matches"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.super12_groups.id", ondelete="CASCADE"), nullable=False)
    team1_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"), nullable=False)
    team2_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="CASCADE"), nullable=False)
    winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    team1_score: Mapped[Optional[int]] = mapped_column(Integer)
    team2_score: Mapped[Optional[int]] = mapped_column(Integer)
    team1_wickets: Mapped[Optional[int]] = mapped_column(Integer)
    team2_wickets: Mapped[Optional[int]] = mapped_column(Integer)
    team1_overs: Mapped[Optional[float]] = mapped_column(Float)
    team2_overs: Mapped[Optional[float]] = mapped_column(Float)
    toss_winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    batting_first_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(20), default="upcoming")
    match_date: Mapped[Optional[date]] = mapped_column(Date)
    start_time: Mapped[Optional[time]] = mapped_column(Time)
    end_time: Mapped[Optional[time]] = mapped_column(Time)
    match_type: Mapped[Optional[str]] = mapped_column(SAEnum(MatchTypeEnum, values_callable=_ev, name="matchtype", schema=SCHEMA))
    ground: Mapped[Optional[str]] = mapped_column(String(128))
    overs: Mapped[int] = mapped_column(Integer, default=6)
    schedule_status: Mapped[Optional[str]] = mapped_column(SAEnum(SchedStatusEnum, values_callable=_ev, name="schedstatus", schema=SCHEMA))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    group: Mapped["Super12Group"] = relationship("Super12Group", back_populates="matches")


# ── Quarter Finals ─────────────────────────────────────────────────────────────

class QuarterFinalMatch(Base):
    __tablename__ = "quarterfinal_matches"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_number: Mapped[int] = mapped_column(Integer, nullable=False)
    slot_label: Mapped[Optional[str]] = mapped_column(String(16))
    team1_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    team2_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    team1_score: Mapped[Optional[int]] = mapped_column(Integer)
    team2_score: Mapped[Optional[int]] = mapped_column(Integer)
    team1_wickets: Mapped[Optional[int]] = mapped_column(Integer)
    team2_wickets: Mapped[Optional[int]] = mapped_column(Integer)
    team1_overs: Mapped[Optional[float]] = mapped_column(Float)
    team2_overs: Mapped[Optional[float]] = mapped_column(Float)
    toss_winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    batting_first_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(20), default="upcoming")
    match_date: Mapped[Optional[date]] = mapped_column(Date)
    start_time: Mapped[Optional[time]] = mapped_column(Time)
    end_time: Mapped[Optional[time]] = mapped_column(Time)
    match_type: Mapped[Optional[str]] = mapped_column(SAEnum(MatchTypeEnum, values_callable=_ev, name="matchtype", schema=SCHEMA))
    ground: Mapped[Optional[str]] = mapped_column(String(128))
    overs: Mapped[int] = mapped_column(Integer, default=8)
    schedule_status: Mapped[Optional[str]] = mapped_column(SAEnum(SchedStatusEnum, values_callable=_ev, name="schedstatus", schema=SCHEMA))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ── Semi Finals ────────────────────────────────────────────────────────────────

class SemiFinalMatch(Base):
    __tablename__ = "semifinal_matches"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_number: Mapped[int] = mapped_column(Integer, nullable=False)
    qf1_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.quarterfinal_matches.id", ondelete="SET NULL"))
    qf2_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.quarterfinal_matches.id", ondelete="SET NULL"))
    team1_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    team2_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    team1_score: Mapped[Optional[int]] = mapped_column(Integer)
    team2_score: Mapped[Optional[int]] = mapped_column(Integer)
    team1_wickets: Mapped[Optional[int]] = mapped_column(Integer)
    team2_wickets: Mapped[Optional[int]] = mapped_column(Integer)
    team1_overs: Mapped[Optional[float]] = mapped_column(Float)
    team2_overs: Mapped[Optional[float]] = mapped_column(Float)
    toss_winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    batting_first_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(20), default="upcoming")
    match_date: Mapped[Optional[date]] = mapped_column(Date)
    start_time: Mapped[Optional[time]] = mapped_column(Time)
    end_time: Mapped[Optional[time]] = mapped_column(Time)
    match_type: Mapped[Optional[str]] = mapped_column(SAEnum(MatchTypeEnum, values_callable=_ev, name="matchtype", schema=SCHEMA))
    ground: Mapped[Optional[str]] = mapped_column(String(128))
    overs: Mapped[int] = mapped_column(Integer, default=8)
    schedule_status: Mapped[Optional[str]] = mapped_column(SAEnum(SchedStatusEnum, values_callable=_ev, name="schedstatus", schema=SCHEMA))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ── Final ──────────────────────────────────────────────────────────────────────

class FinalMatch(Base):
    __tablename__ = "final_match"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sf1_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.semifinal_matches.id", ondelete="SET NULL"))
    sf2_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.semifinal_matches.id", ondelete="SET NULL"))
    team1_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    team2_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    team1_score: Mapped[Optional[int]] = mapped_column(Integer)
    team2_score: Mapped[Optional[int]] = mapped_column(Integer)
    team1_wickets: Mapped[Optional[int]] = mapped_column(Integer)
    team2_wickets: Mapped[Optional[int]] = mapped_column(Integer)
    team1_overs: Mapped[Optional[float]] = mapped_column(Float)
    team2_overs: Mapped[Optional[float]] = mapped_column(Float)
    toss_winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    batting_first_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(20), default="upcoming")
    match_date: Mapped[Optional[date]] = mapped_column(Date)
    start_time: Mapped[Optional[time]] = mapped_column(Time)
    end_time: Mapped[Optional[time]] = mapped_column(Time)
    match_type: Mapped[Optional[str]] = mapped_column(SAEnum(MatchTypeEnum, values_callable=_ev, name="matchtype", schema=SCHEMA))
    ground: Mapped[Optional[str]] = mapped_column(String(128))
    overs: Mapped[int] = mapped_column(Integer, default=8)
    schedule_status: Mapped[Optional[str]] = mapped_column(SAEnum(SchedStatusEnum, values_callable=_ev, name="schedstatus", schema=SCHEMA))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ── Champion ───────────────────────────────────────────────────────────────────

class TournamentChampion(Base):
    __tablename__ = "tournament_champion"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    champion_team_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    runner_up_team_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey(f"{SCHEMA}.teams.id", ondelete="SET NULL"))
    tournament_year: Mapped[Optional[int]] = mapped_column(Integer)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# ── Audit Logs ─────────────────────────────────────────────────────────────────

class TeamOverrideLog(Base):
    __tablename__ = "team_override_logs"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stage: Mapped[str] = mapped_column(SAEnum(StageTypeEnum, values_callable=_ev, name="stagetype", schema=SCHEMA), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    previous_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    admin_user: Mapped[Optional[str]] = mapped_column(String(128))
    reason: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MatchScheduleLog(Base):
    __tablename__ = "match_schedule_logs"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stage: Mapped[str] = mapped_column(SAEnum(StageTypeEnum, values_callable=_ev, name="stagetype", schema=SCHEMA), nullable=False)
    match_id: Mapped[str] = mapped_column(String(64), nullable=False)
    field_changed: Mapped[Optional[str]] = mapped_column(String(64))
    previous_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    admin_user: Mapped[Optional[str]] = mapped_column(String(128))
    reason: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
