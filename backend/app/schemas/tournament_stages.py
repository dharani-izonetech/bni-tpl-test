"""
Pydantic schemas for tournament stage endpoints.
"""
import uuid
from datetime import date, time, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


# ── Common ──────────────────────────────────────────────────────────────────

class TeamRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    short: Optional[str] = None
    logo_url: Optional[str] = None


# ── Super 12 ─────────────────────────────────────────────────────────────────

class Super12GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    created_at: datetime


class Super12GroupTeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    group_id: uuid.UUID
    team_id: uuid.UUID
    slot_label: Optional[str] = None
    is_wildcard: bool = False


class Super12PointsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    group_id: uuid.UUID
    team_id: uuid.UUID
    played: int
    won: int
    lost: int
    points: int
    runs_for: int
    runs_against: int
    nrr: float
    overs_faced: float
    overs_bowled: float
    updated_at: datetime


class Super12MatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    group_id: uuid.UUID
    team1_id: uuid.UUID
    team2_id: uuid.UUID
    winner_id: Optional[uuid.UUID] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None
    team1_wickets: Optional[int] = None
    team2_wickets: Optional[int] = None
    team1_overs: Optional[float] = None
    team2_overs: Optional[float] = None
    toss_winner_id: Optional[uuid.UUID] = None
    batting_first_id: Optional[uuid.UUID] = None
    status: str
    match_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    match_type: Optional[str] = None
    ground: Optional[str] = None
    overs: int
    schedule_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class Super12ResultUpdate(BaseModel):
    toss_winner_id: Optional[uuid.UUID] = None
    batting_first_id: Optional[uuid.UUID] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None
    team1_wickets: Optional[int] = None
    team2_wickets: Optional[int] = None
    team1_overs: Optional[float] = None
    team2_overs: Optional[float] = None
    winner_id: Optional[uuid.UUID] = None
    status: Optional[str] = None


class Super12MatchScheduleUpdate(BaseModel):
    match_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    match_type: Optional[str] = None
    ground: Optional[str] = None
    overs: Optional[int] = None
    status: Optional[str] = None
    schedule_status: Optional[str] = None
    reason: Optional[str] = None


# ── Quarter Finals ────────────────────────────────────────────────────────────

class QFMatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    match_number: int
    slot_label: Optional[str] = None
    team1_id: Optional[uuid.UUID] = None
    team2_id: Optional[uuid.UUID] = None
    winner_id: Optional[uuid.UUID] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None
    team1_wickets: Optional[int] = None
    team2_wickets: Optional[int] = None
    team1_overs: Optional[float] = None
    team2_overs: Optional[float] = None
    toss_winner_id: Optional[uuid.UUID] = None
    batting_first_id: Optional[uuid.UUID] = None
    status: str
    match_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    match_type: Optional[str] = None
    ground: Optional[str] = None
    overs: int
    schedule_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class KOResultUpdate(BaseModel):
    toss_winner_id: Optional[uuid.UUID] = None
    batting_first_id: Optional[uuid.UUID] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None
    team1_wickets: Optional[int] = None
    team2_wickets: Optional[int] = None
    team1_overs: Optional[float] = None
    team2_overs: Optional[float] = None
    winner_id: Optional[uuid.UUID] = None
    status: Optional[str] = None


class KOTeamOverride(BaseModel):
    team1_id: Optional[uuid.UUID] = None
    team2_id: Optional[uuid.UUID] = None
    reason: Optional[str] = None


class KOScheduleUpdate(BaseModel):
    match_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    match_type: Optional[str] = None
    ground: Optional[str] = None
    overs: Optional[int] = None
    status: Optional[str] = None
    schedule_status: Optional[str] = None
    reason: Optional[str] = None


# ── Semi Finals ───────────────────────────────────────────────────────────────

class SFMatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    match_number: int
    qf1_id: Optional[uuid.UUID] = None
    qf2_id: Optional[uuid.UUID] = None
    team1_id: Optional[uuid.UUID] = None
    team2_id: Optional[uuid.UUID] = None
    winner_id: Optional[uuid.UUID] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None
    team1_wickets: Optional[int] = None
    team2_wickets: Optional[int] = None
    team1_overs: Optional[float] = None
    team2_overs: Optional[float] = None
    toss_winner_id: Optional[uuid.UUID] = None
    batting_first_id: Optional[uuid.UUID] = None
    status: str
    match_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    match_type: Optional[str] = None
    ground: Optional[str] = None
    overs: int
    schedule_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Final ──────────────────────────────────────────────────────────────────────

class FinalMatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    sf1_id: Optional[uuid.UUID] = None
    sf2_id: Optional[uuid.UUID] = None
    team1_id: Optional[uuid.UUID] = None
    team2_id: Optional[uuid.UUID] = None
    winner_id: Optional[uuid.UUID] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None
    team1_wickets: Optional[int] = None
    team2_wickets: Optional[int] = None
    team1_overs: Optional[float] = None
    team2_overs: Optional[float] = None
    toss_winner_id: Optional[uuid.UUID] = None
    batting_first_id: Optional[uuid.UUID] = None
    status: str
    match_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    match_type: Optional[str] = None
    ground: Optional[str] = None
    overs: int
    schedule_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Champion ──────────────────────────────────────────────────────────────────

class TournamentChampionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    champion_team_id: Optional[uuid.UUID] = None
    runner_up_team_id: Optional[uuid.UUID] = None
    tournament_year: Optional[int] = None
    summary: Optional[str] = None
    created_at: datetime


# ── Schedule Generate Request ─────────────────────────────────────────────────

class ScheduleGenerateRequest(BaseModel):
    start_date: date
    prefer_floodlight: bool = False


# ── Audit Logs ────────────────────────────────────────────────────────────────

class TeamOverrideLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    stage: str
    action: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    admin_user: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime


class MatchScheduleLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    stage: str
    match_id: str
    field_changed: Optional[str] = None
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    admin_user: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime


# ── Bracket / Tournament Overview ─────────────────────────────────────────────

class BracketOut(BaseModel):
    super12_groups: List[Any] = []
    quarter_finals: List[Any] = []
    semi_finals: List[Any] = []
    final: Optional[Any] = None
    champion: Optional[Any] = None
