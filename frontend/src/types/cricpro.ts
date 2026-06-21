// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'organizer' | 'player' | 'scorer'
export type TournamentFormat = 'league' | 'knockout' | 'league_knockout' | 'round_robin'
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
export type MatchStatus = 'scheduled' | 'toss' | 'live' | 'innings_break' | 'completed' | 'abandoned' | 'cancelled'
export type BallType = 'normal' | 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty'
export type DismissalType = 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'handled_ball' | 'obstructing_field' | 'timed_out' | 'retired_hurt'
export type TossDecision = 'bat' | 'bowl'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  profile_photo: string | null
  phone: string | null
  bio: string | null
  batting_style: string | null
  bowling_style: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export interface PlayerProfile {
  id: number
  user_id: number
  team_id: number | null
  jersey_number: number | null
  batting_order: number | null
  is_captain: boolean
  is_wicket_keeper: boolean
  is_active: boolean
  user?: User
}

export interface Team {
  id: number
  name: string
  short_name: string | null
  logo: string | null
  city: string | null
  description: string | null
  owner_id: number
  captain_id: number | null
  is_active: boolean
  created_at: string
  player_count?: number
  players?: PlayerProfile[]
  owner?: User
}

// ─── Tournaments ──────────────────────────────────────────────────────────────

export interface Tournament {
  id: number
  name: string
  description: string | null
  banner: string | null
  format: TournamentFormat
  status: TournamentStatus
  organizer_id: number
  start_date: string
  end_date: string | null
  venue: string | null
  city: string | null
  overs_per_innings: number
  max_teams: number
  is_public: boolean
  team_count?: number
  created_at: string
  organizer?: User
  teams?: Team[]
}

export interface PointsTableEntry {
  team: Team
  played: number
  won: number
  lost: number
  tied: number
  no_result: number
  points: number
  nrr: number
  runs_scored: number
  overs_faced: number
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export interface Match {
  id: string
  tournament_id: number | null
  match_number: number | null
  match_type: string
  team1_id: number
  team2_id: number
  team1?: Team
  team2?: Team
  venue: string | null
  match_date: string | null      // backend field name
  scheduled_at?: string | null   // alias kept for compatibility
  status: MatchStatus
  overs: number
  toss_winner_id: number | null
  toss_decision: TossDecision | null
  winner_id: number | null
  win_margin: number | null
  win_by: string | null
  result_summary: string | null
  current_innings: number
  started_at: string | null
  completed_at: string | null
  created_at: string
}

// ─── Innings & Scoring ────────────────────────────────────────────────────────

export interface Innings {
  id: number
  match_id: number
  innings_number: number
  batting_team_id: number
  bowling_team_id: number
  total_runs: number
  total_wickets: number
  total_overs: number
  extras_wide: number
  extras_no_ball: number
  extras_bye: number
  extras_leg_bye: number
  extras_penalty: number
  target: number | null
  is_completed: boolean
  batting_team?: Team
  bowling_team?: Team
}

export interface Ball {
  id: number
  innings_id: number
  over_number: number
  ball_number: number
  batsman_id: number
  bowler_id: number
  non_striker_id: number | null
  runs_off_bat: number
  extra_runs: number
  ball_type: BallType
  is_wicket: boolean
  dismissal_type: DismissalType | null
  dismissed_player_id: number | null
  is_free_hit: boolean
  is_boundary: boolean
  is_six: boolean
  total_runs: number
  innings_runs_after: number
  innings_wickets_after: number
  commentary: string | null
  created_at: string
}

export interface BattingScore {
  id: number
  batsman_id: number
  runs: number
  balls_faced: number
  fours: number
  sixes: number
  is_out: boolean
  dismissal_type: DismissalType | null
  batting_position: number | null
  batsman?: PlayerProfile
  bowler?: PlayerProfile
  fielder?: PlayerProfile
}

export interface BowlingFigure {
  id: number
  bowler_id: number
  overs: number
  maidens: number
  runs: number
  wickets: number
  wides: number
  no_balls: number
  economy_rate: number
  bowler?: PlayerProfile
}

export interface FallOfWicket {
  wicket_number: number
  runs_at_fall: number
  overs_at_fall: number
  batsman?: PlayerProfile
}

export interface ScorecardData {
  innings: Innings
  batting: BattingScore[]
  bowling: BowlingFigure[]
  fall_of_wickets: FallOfWicket[]
}

export interface LiveScore {
  match: Match
  current_innings: Innings | null
  striker: BattingScore | null
  non_striker: BattingScore | null
  current_bowler: BowlingFigure | null
  required_runs: number | null
  required_run_rate: number | null
  current_run_rate: number | null
  balls_remaining: number | null
  partnership_runs: number | null
  partnership_balls: number | null
  last_five_balls: Ball[]
  innings_history: Innings[]
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface BattingLeaderboard {
  player_id: number
  player_name: string
  username: string
  photo: string | null
  total_runs: number
  highest_score: number
  innings: number
  fours: number
  sixes: number
  average: number
}

export interface BowlingLeaderboard {
  player_id: number
  player_name: string
  username: string
  photo: string | null
  total_wickets: number
  total_runs_conceded: number
  overs_bowled: number
  innings: number
  economy: number
  average: number
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: number
  title: string
  message: string
  notification_type: string
  reference_id: number | null
  reference_type: string | null
  is_read: boolean
  created_at: string
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { msg: string; loc: string[] }[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
