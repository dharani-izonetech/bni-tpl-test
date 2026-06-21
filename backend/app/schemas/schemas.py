"""
Pydantic schemas for request/response validation.
"""
import re
import uuid
from datetime import datetime
from typing import Optional, List, Any

from pydantic import BaseModel, Field, field_validator, model_validator, EmailStr, ConfigDict

from app.models import UserRole, MatchStatus, MediaType


# ── Common ─────────────────────────────────────────────────────────────────

class ResponseEnvelope(BaseModel):
    success: bool = True
    message: str = "OK"
    data: Any = None


class PaginatedMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedResponse(BaseModel):
    success: bool = True
    message: str = "OK"
    data: List[Any] = []
    meta: PaginatedMeta


# ── Auth ───────────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    email: str
    role: UserRole
    is_active: bool
    full_name: Optional[str] = None
    is_verified: bool = False
    profile_photo: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    created_at: datetime


# ── Registered Players ─────────────────────────────────────────────────────

INDIAN_PHONE_RE = re.compile(r"^\d{10}$")


class PlayerRegisterRequest(BaseModel):
    """Submitted as multipart/form-data; photo is a separate UploadFile."""
    name: str = Field(..., min_length=1, max_length=128)
    business: str = Field(..., min_length=1, max_length=256)
    category: str = Field(..., min_length=1, max_length=128)
    phone_no: str = Field(..., description="10-digit Indian mobile number (without +91 prefix)")
    team_name: str = Field(..., min_length=1, max_length=64)
    role: Optional[str] = Field(default="Player", max_length=32)
    membership_years: Optional[int] = Field(default=None, ge=1, le=50)
    jersey_number: Optional[str] = Field(default=None, max_length=4)
    jersey_size: Optional[str] = Field(default=None, max_length=4)
    track_pant_size: Optional[str] = Field(default=None, max_length=4)

    @field_validator("phone_no")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v.replace("+91", ""))
        if not INDIAN_PHONE_RE.match(digits):
            raise ValueError("Phone number must be exactly 10 digits (Indian mobile number).")
        return f"+91{digits}"


class PlayerUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    business: Optional[str] = Field(default=None, max_length=256)
    category: Optional[str] = Field(default=None, max_length=128)
    team_name: Optional[str] = Field(default=None, max_length=64)
    role: Optional[str] = Field(default=None, max_length=32)
    membership_years: Optional[int] = Field(default=None, ge=1, le=50)
    jersey_number: Optional[str] = Field(default=None, max_length=4)
    jersey_size: Optional[str] = Field(default=None, max_length=4)
    track_pant_size: Optional[str] = Field(default=None, max_length=4)


# Public-safe squad view — no phone, no business details
class PlayerSquadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    team_name: str
    team_short: Optional[str]
    role: str
    membership_years: Optional[int]
    jersey_number: Optional[str]
    photo_data: Optional[str]   # base64 data URI


class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    business: str
    category: str
    phone_no: str
    team_name: str
    team_short: Optional[str]
    role: str
    membership_years: Optional[int]
    jersey_number: Optional[str]
    jersey_size: Optional[str]
    track_pant_size: Optional[str]
    photo_data: Optional[str]   # base64 data URI
    registered_at: datetime
    updated_at: datetime


# ── Teams ──────────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    short: str = Field(..., min_length=1, max_length=8)
    captain: Optional[str] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    short: Optional[str] = None
    captain: Optional[str] = None


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    short: str
    logo_url: Optional[str]
    captain: Optional[str]
    created_at: datetime


# ── Matches ────────────────────────────────────────────────────────────────

class MatchCreate(BaseModel):
    slot: Optional[int] = None
    team1_id: Optional[uuid.UUID] = None
    team2_id: Optional[uuid.UUID] = None
    status: MatchStatus = MatchStatus.upcoming
    match_date: Optional[datetime] = None
    venue: Optional[str] = None
    is_revealed: bool = False
    # CricPro fields
    tournament_id: Optional[int] = None
    match_number: Optional[int] = None
    match_type: str = "league"
    overs: int = 20


class MatchUpdate(BaseModel):
    team1_id: Optional[uuid.UUID] = None
    team2_id: Optional[uuid.UUID] = None
    status: Optional[MatchStatus] = None
    match_date: Optional[datetime] = None
    venue: Optional[str] = None
    result: Optional[str] = None
    result_summary: Optional[str] = None
    winner_id: Optional[uuid.UUID] = None
    win_margin: Optional[int] = None
    win_by: Optional[str] = None
    is_revealed: Optional[bool] = None


class MatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slot: Optional[int] = None
    team1: Optional[TeamOut] = None
    team2: Optional[TeamOut] = None
    status: MatchStatus
    match_date: Optional[datetime] = None
    venue: Optional[str] = None
    result: Optional[str] = None
    is_revealed: bool = False
    # CricPro fields
    tournament_id: Optional[int] = None
    match_number: Optional[int] = None
    match_type: str = "league"
    overs: int = 20
    toss_winner_id: Optional[uuid.UUID] = None
    toss_decision: Optional[str] = None
    winner_id: Optional[uuid.UUID] = None
    win_margin: Optional[int] = None
    win_by: Optional[str] = None
    result_summary: Optional[str] = None
    current_innings: int = 1
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ── Live Scores ────────────────────────────────────────────────────────────

class LiveScoreCreate(BaseModel):
    match_id: Optional[uuid.UUID] = None
    team1_name: str = Field(..., min_length=1, max_length=64)
    team1_short: str = Field(..., min_length=1, max_length=8)
    team1_score: Optional[str] = None
    team1_overs: Optional[str] = None
    team2_name: str = Field(..., min_length=1, max_length=64)
    team2_short: str = Field(..., min_length=1, max_length=8)
    team2_score: Optional[str] = None
    team2_overs: Optional[str] = None
    status: MatchStatus = MatchStatus.live
    venue: Optional[str] = None
    result: Optional[str] = None
    video_id: Optional[uuid.UUID] = None
    is_active: bool = True


class LiveScoreUpdate(BaseModel):
    team1_score: Optional[str] = None
    team1_overs: Optional[str] = None
    team2_score: Optional[str] = None
    team2_overs: Optional[str] = None
    status: Optional[MatchStatus] = None
    result: Optional[str] = None
    video_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class MediaFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    original_filename: str
    media_type: MediaType
    public_url: Optional[str]
    embed_url: Optional[str]
    size_bytes: Optional[int]
    mime_type: Optional[str]
    created_at: datetime


class BNILiveScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    match_id: Optional[uuid.UUID]
    team1_name: str
    team1_short: str
    team1_score: Optional[str]
    team1_overs: Optional[str]
    team2_name: str
    team2_short: str
    team2_score: Optional[str]
    team2_overs: Optional[str]
    status: MatchStatus
    venue: Optional[str]
    result: Optional[str]
    video: Optional[MediaFileOut]
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ── News ───────────────────────────────────────────────────────────────────

class LocalizedText(BaseModel):
    en: str = ""
    ta: str = ""


class NewsCreate(BaseModel):
    news_title: LocalizedText
    news_description: Optional[LocalizedText] = None
    venue: Optional[LocalizedText] = None
    match_time: Optional[LocalizedText] = None
    status: Optional[LocalizedText] = None
    audience: int = 0
    media_embed_url: Optional[str] = None
    match_story_title: Optional[LocalizedText] = None
    match_story_description: Optional[LocalizedText] = None
    match_story_image_url: Optional[str] = None
    is_published: bool = True


class NewsUpdate(BaseModel):
    news_title: Optional[LocalizedText] = None
    news_description: Optional[LocalizedText] = None
    venue: Optional[LocalizedText] = None
    match_time: Optional[LocalizedText] = None
    status: Optional[LocalizedText] = None
    audience: Optional[int] = None
    media_embed_url: Optional[str] = None
    match_story_title: Optional[LocalizedText] = None
    match_story_description: Optional[LocalizedText] = None
    match_story_image_url: Optional[str] = None
    is_published: Optional[bool] = None


class NewsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    news_title_en: str
    news_title_ta: Optional[str]
    news_description_en: Optional[str]
    news_description_ta: Optional[str]
    venue_en: Optional[str]
    venue_ta: Optional[str]
    match_time_en: Optional[str]
    match_time_ta: Optional[str]
    status_en: Optional[str]
    status_ta: Optional[str]
    audience: int
    media_embed_url: Optional[str]
    match_story_title_en: Optional[str]
    match_story_title_ta: Optional[str]
    match_story_description_en: Optional[str]
    match_story_description_ta: Optional[str]
    match_story_image_url: Optional[str]
    published_at: datetime
    updated_at: datetime
    is_published: bool


# ── Groups ─────────────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    slug: str = Field(..., min_length=1, max_length=64)
    team_ids: List[uuid.UUID] = []


class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    teams: List[TeamOut] = []
    created_at: datetime


# ── Points Table ───────────────────────────────────────────────────────────

class PointsEntryUpsert(BaseModel):
    team_id: uuid.UUID
    group_id: Optional[uuid.UUID] = None
    played: int = 0
    won: int = 0
    lost: int = 0
    tied: int = 0
    no_result: int = 0
    points: int = 0
    nrr: float = 0.0
    runs_scored: int = 0
    runs_conceded: int = 0
    overs_faced: float = 0.0
    overs_bowled: float = 0.0


class PointsEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    team_id: uuid.UUID
    team: TeamOut
    group_id: Optional[uuid.UUID]
    played: int
    won: int
    lost: int
    tied: int
    no_result: int
    points: int
    nrr: float
    runs_scored: int
    runs_conceded: int
    overs_faced: float
    overs_bowled: float
    updated_at: datetime


# ── Media Upload (video link) ──────────────────────────────────────────────

class VideoLinkCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)
    embed_url: str = Field(..., min_length=1)


# ── Banners ────────────────────────────────────────────────────────────────

class BannerCreate(BaseModel):
    title: Optional[str] = None
    link_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class BannerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: Optional[str]
    image_url: str
    link_url: Optional[str]
    sort_order: int
    is_active: bool
    created_at: datetime


# ── Match Schedule Snapshot ────────────────────────────────────────────────

class MatchScheduleSnapshotIn(BaseModel):
    slot_to_team_name: List[Optional[str]]
    schedule_plan: List[dict]
    revealed_count: int = 0


class MatchScheduleSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slot_to_team_name: Optional[str]   # raw JSON string
    schedule_plan: Optional[str]        # raw JSON string
    revealed_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ── Group Reveal Snapshot ──────────────────────────────────────────────────

class GroupRevealMatchItem(BaseModel):
    match_number: int
    team1_name: str
    team2_name: str


class GroupRevealSnapshotIn(BaseModel):
    group_id: str = Field(..., pattern="^[A-D]$")
    selected_team_name: str = Field(..., min_length=1, max_length=128)
    matches: List[GroupRevealMatchItem]


class GroupRevealSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    group_id: str
    selected_team_name: str
    matches: str          # raw JSON — frontend parses
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AllGroupRevealOut(BaseModel):
    """All 4 groups' active reveal snapshots in one response."""
    A: Optional[GroupRevealSnapshotOut] = None
    B: Optional[GroupRevealSnapshotOut] = None
    C: Optional[GroupRevealSnapshotOut] = None
    D: Optional[GroupRevealSnapshotOut] = None


# ── General ────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


# ── Tournaments ────────────────────────────────────────────────────────────

class TournamentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    format: str  # TournamentFormat value
    start_date: datetime
    end_date: Optional[datetime] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    overs_per_innings: int = 20
    max_teams: int = 20
    entry_fee: Optional[float] = None
    prize_money: Optional[float] = None
    rules: Optional[str] = None
    is_public: bool = True


class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    end_date: Optional[datetime] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    rules: Optional[str] = None
    is_public: Optional[bool] = None


class TournamentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    banner: Optional[str]
    format: str
    status: str
    organizer_id: Optional[uuid.UUID]
    start_date: datetime
    end_date: Optional[datetime]
    venue: Optional[str]
    city: Optional[str]
    overs_per_innings: int
    max_teams: int
    entry_fee: Optional[float]
    prize_money: Optional[float]
    is_public: bool
    created_at: datetime


class TournamentDetailOut(TournamentOut):
    teams: List[Any] = []
    matches: List[Any] = []


# ── Points Table (CricPro tournaments) ────────────────────────────────────

class PointsTableOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    team: TeamOut
    tournament_id: Optional[int]
    group_id: Optional[uuid.UUID]
    played: int
    won: int
    lost: int
    tied: int = 0
    no_result: int = 0
    nrr: float
    points: int
    runs_scored: int = 0
    overs_faced: float = 0
    runs_conceded: int = 0
    overs_bowled: float = 0
    updated_at: datetime


# ── Scoring Inputs ─────────────────────────────────────────────────────────

class TossInput(BaseModel):
    toss_winner_id: uuid.UUID
    toss_decision: str  # "bat" or "bowl"


class PlayingXIInput(BaseModel):
    team_id: uuid.UUID
    player_ids: List[int] = Field(..., min_length=11, max_length=11)


class BallInput(BaseModel):
    batsman_id: int
    bowler_id: int
    non_striker_id: Optional[int] = None
    runs_off_bat: int = Field(0, ge=0, le=6)
    extra_runs: int = Field(0, ge=0)
    ball_type: Any  # BallType enum
    is_wicket: bool = False
    dismissal_type: Optional[Any] = None  # DismissalType enum
    dismissed_player_id: Optional[int] = None
    # dismissed_is_non_striker: if True, the non-striker is the dismissed player
    dismissed_is_non_striker: bool = False
    fielder_id: Optional[int] = None
    fielder2_id: Optional[int] = None      # relay throw / second fielder
    wicket_keeper_id: Optional[int] = None  # stumping / caught behind
    is_free_hit: bool = False
    # bounce: True if this delivery bounced (for bounce rule tracking)
    is_bounce: bool = False
    commentary: Optional[str] = None


# ── Scoring Outputs ────────────────────────────────────────────────────────

class PlayerProfileMiniOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    jersey_number: Optional[int]
    batting_style: Optional[str]
    bowling_style: Optional[str]
    player_role: Optional[str]


class BallOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    innings_id: int
    over_number: int
    ball_number: int
    batsman_id: int
    bowler_id: int
    non_striker_id: Optional[int]
    runs_off_bat: int
    extra_runs: int
    ball_type: Any
    is_wicket: bool
    dismissal_type: Optional[Any]
    dismissed_player_id: Optional[int]
    fielder_id: Optional[int]
    is_free_hit: bool
    is_boundary: bool
    is_six: bool
    total_runs: int
    innings_runs_after: int
    innings_wickets_after: int
    commentary: Optional[str]
    created_at: datetime


class InningsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    match_id: uuid.UUID
    innings_number: int
    batting_team_id: uuid.UUID
    bowling_team_id: uuid.UUID
    total_runs: int
    total_wickets: int
    total_overs: float
    extras_wide: int
    extras_no_ball: int
    extras_bye: int
    extras_leg_bye: int
    extras_penalty: int
    target: Optional[int]
    is_completed: bool
    declared: bool
    started_at: datetime
    completed_at: Optional[datetime]
    batting_team: Optional[TeamOut] = None
    bowling_team: Optional[TeamOut] = None


class BattingScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    innings_id: int
    batsman_id: int
    runs: int
    balls_faced: int
    fours: int
    sixes: int
    is_out: bool
    dismissal_type: Optional[Any]
    bowler_id: Optional[int]
    fielder_id: Optional[int]
    batting_position: Optional[int]


class BowlingFigureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    innings_id: int
    bowler_id: int
    overs: float
    maidens: int
    runs: int
    wickets: int
    wides: int
    no_balls: int
    economy_rate: float


class FallOfWicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    innings_id: int
    wicket_number: int
    runs_at_fall: int
    overs_at_fall: float
    batsman_id: int


class ScorecardOut(BaseModel):
    innings: InningsOut
    batting: List[BattingScoreOut] = []
    bowling: List[BowlingFigureOut] = []
    fall_of_wickets: List[FallOfWicketOut] = []


class LiveScoreOut(BaseModel):
    """CricPro live score response."""
    model_config = ConfigDict(from_attributes=True)

    match: MatchOut
    current_innings: Optional[InningsOut]
    striker: Optional[BattingScoreOut]
    non_striker: Optional[BattingScoreOut]
    current_bowler: Optional[BowlingFigureOut]
    required_runs: Optional[int]
    required_run_rate: Optional[float]
    current_run_rate: Optional[float]
    balls_remaining: Optional[int]
    last_five_balls: List[BallOut] = []
    innings_history: List[InningsOut] = []


# ── Player Career Stats Schemas ────────────────────────────────────────────

class PlayerCareerStatsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    player_id: int
    matches_played: int
    innings_batted: int
    runs_scored: int
    balls_faced: int
    highest_score: int
    fours: int
    sixes: int
    fifties: int
    hundreds: int
    not_outs: int
    batting_average: float
    strike_rate: float
    innings_bowled: int
    overs_bowled: float
    runs_conceded: int
    wickets: int
    best_bowling_runs: int
    best_bowling_wickets: int
    economy_rate: float
    bowling_average: float
    bowling_strike_rate: float
    five_wicket_hauls: int
    catches: int
    run_outs: int
    stumpings: int
    updated_at: Optional[datetime]


# Aliases used by player_profiles.py
class BattingScoreSchema(BattingScoreOut):
    pass


class BowlingFigureSchema(BowlingFigureOut):
    pass


class PlayerCareerStatsSchema(PlayerCareerStatsOut):
    pass


# ── Notifications ──────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: uuid.UUID
    title: str
    message: str
    notification_type: str
    reference_id: Optional[int]
    reference_type: Optional[str]
    is_read: bool
    created_at: datetime
