import apiClient from './client'
import type {
  User, TokenResponse, Team, Tournament, Match, Innings,
  ScorecardData, LiveScore, BattingLeaderboard, BowlingLeaderboard,
  PointsTableEntry, Notification, Ball,
} from '@/types'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; username: string; full_name: string; password: string; phone?: string }) =>
    apiClient.post<User>('/auth/register', data).then(r => r.data),

  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>('/auth/login', { email, password }).then(r => r.data),

  logout: (refresh_token: string) =>
    apiClient.post('/auth/logout', { refresh_token }),

  me: () => apiClient.get<User>('/auth/me').then(r => r.data),

  updateProfile: (data: Partial<User>) =>
    apiClient.patch<User>('/auth/me', data).then(r => r.data),

  uploadPhoto: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiClient.post<User>('/auth/me/photo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export const teamsApi = {
  // BNI teams route returns {success, data:[...]} — unwrap .data
  list: (params?: { search?: string; city?: string; page?: number }) =>
    apiClient.get<{ data: Team[] }>('/teams', { params }).then(r =>
      Array.isArray(r.data) ? r.data : (r.data as any).data ?? []
    ),

  get: (id: number) => apiClient.get<Team>(`/teams/${id}`).then(r => r.data),

  create: (data: { name: string; short_name?: string; city?: string; description?: string }) =>
    apiClient.post<Team>('/teams', data).then(r => r.data),

  update: (id: number, data: Partial<Team>) =>
    apiClient.patch<Team>(`/teams/${id}`, data).then(r => r.data),

  delete: (id: number) => apiClient.delete(`/teams/${id}`),

  uploadLogo: (id: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiClient.post<Team>(`/teams/${id}/logo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  addPlayer: (teamId: number, data: { user_id: number; jersey_number?: number; is_wicket_keeper?: boolean }) =>
    apiClient.post(`/teams/${teamId}/players`, data).then(r => r.data),

  getPlayers: (teamId: string | number) =>
    apiClient.get<any[]>(`/cricpro/teams/${teamId}/players`).then(r => r.data),

  removePlayer: (teamId: number, playerId: number) =>
    apiClient.delete(`/teams/${teamId}/players/${playerId}`),

  setCaptain: (teamId: number, playerId: number) =>
    apiClient.patch<Team>(`/teams/${teamId}/captain/${playerId}`).then(r => r.data),
}

// ─── Tournaments ──────────────────────────────────────────────────────────────

export const tournamentsApi = {
  list: (params?: { search?: string; status?: string; city?: string; page?: number }) =>
    apiClient.get<Tournament[]>('/tournaments', { params }).then(r => r.data),

  get: (id: number) => apiClient.get<Tournament>(`/tournaments/${id}`).then(r => r.data),

  create: (data: Partial<Tournament>) =>
    apiClient.post<Tournament>('/tournaments', data).then(r => r.data),

  update: (id: number, data: Partial<Tournament>) =>
    apiClient.patch<Tournament>(`/tournaments/${id}`, data).then(r => r.data),

  addTeam: (tournamentId: number, teamId: number) =>
    apiClient.post(`/tournaments/${tournamentId}/teams/${teamId}`),

  generateFixtures: (tournamentId: number) =>
    apiClient.post(`/tournaments/${tournamentId}/generate-fixtures`),

  getPointsTable: (tournamentId: number) =>
    apiClient.get<PointsTableEntry[]>(`/tournaments/${tournamentId}/points-table`).then(r => r.data),

  getMatches: (tournamentId: number, status?: string) =>
    apiClient.get<Match[]>(`/tournaments/${tournamentId}/matches`, { params: { status } }).then(r => r.data),

  uploadBanner: (id: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiClient.post<Tournament>(`/tournaments/${id}/banner`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}

// ─── BNI schedule matches (the `matches` table — League fixtures) ────────────
// Separate from the CricPro scoring engine below. Used by the admin Schedule
// page to list every match and edit its date/time manually.
export const scheduleMatchesApi = {
  adminAll: (params?: { page?: number; page_size?: number }) =>
    apiClient.get<{ data: any[]; meta: any }>('/matches/admin/all', {
      params: { page_size: 100, ...params },
    }).then(r => r.data),

  update: (id: string, data: { match_date?: string | null; status?: string; venue?: string }) =>
    apiClient.put(`/matches/${id}`, data).then(r => r.data),
}

// ─── Matches (CricPro scoring engine) ────────────────────────────────────────

export const matchesApi = {
  list: (params?: { status?: string; team_id?: string; page?: number; page_size?: number }) =>
    apiClient.get<any[]>('/scoring/matches', { params }).then(r => r.data),

  live: () => apiClient.get<any[]>('/scoring/matches/live').then(r => r.data),

  get: (id: string | number) => apiClient.get<any>(`/scoring/matches/${id}`).then(r => r.data),

  create: (data: Partial<any>) =>
    apiClient.post<any>('/scoring/matches', data).then(r => r.data),

  update: (id: string | number, data: Partial<any>) =>
    apiClient.patch<any>(`/scoring/matches/${id}`, data).then(r => r.data),

  recordToss: (id: string | number, data: { toss_winner_id: string; toss_decision: string }) =>
    apiClient.post<any>(`/scoring/matches/${id}/toss`, data).then(r => r.data),

  setPlayingXI: (id: string | number, data: { team_id: string; player_ids: number[] }) =>
    apiClient.post(`/scoring/matches/${id}/playing-xi`, data),

  startInnings: (id: string | number) =>
    apiClient.post<any>(`/scoring/matches/${id}/start-innings`).then(r => r.data),

  getScorecard: (id: string | number) =>
    apiClient.get<any[]>(`/scoring/matches/${id}/scorecard`).then(r => r.data),

  reset: (id: string | number, to: 'toss' | 'upcoming' = 'toss') =>
    apiClient.post<any>(`/scoring/matches/${id}/reset`, null, { params: { to } }).then(r => r.data),
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export const scoringApi = {
  recordBall: (inningsId: number, data: {
    batsman_id: number
    bowler_id: number
    non_striker_id: number
    runs_off_bat?: number
    extra_runs?: number
    ball_type?: string
    is_wicket?: boolean
    dismissal_type?: string
    dismissed_player_id?: number
    dismissed_is_non_striker?: boolean   // Feature 1: non-striker wicket
    fielder_id?: number
    fielder2_id?: number                 // Feature 7: relay throw / 2nd fielder
    wicket_keeper_id?: number            // Feature 7: stumping / caught behind
    is_free_hit?: boolean
    is_bounce?: boolean                  // Feature 2: over bounce rule
    commentary?: string
  }) => apiClient.post<Ball>(`/scoring/innings/${inningsId}/ball`, data).then(r => r.data),

  undoLastBall: (inningsId: number) =>
    apiClient.post(`/scoring/innings/${inningsId}/undo`),

  getLiveScore: (matchId: string | number) =>
    apiClient.get<LiveScore>(`/scoring/matches/${matchId}/live`).then(r => r.data),
}

// ─── Players (CricPro) ───────────────────────────────────────────────────────

export const playersApi = {
  list: (params?: { search?: string; team_id?: string }) =>
    apiClient.get<any[]>('/cricpro/players', { params }).then(r => r.data),

  get: (playerId: number) =>
    apiClient.get(`/cricpro/players/${playerId}`).then(r => r.data),

  create: (data: {
    user_id: string; team_id?: string | null; player_role?: string;
    batting_style?: string; bowling_style?: string; jersey_number?: number;
    is_captain?: boolean; is_vice_captain?: boolean; is_wicket_keeper?: boolean;
    is_active?: boolean;
  }) => apiClient.post('/cricpro/players', data).then(r => r.data),

  updateProfile: (playerId: number, data: {
    team_id?: string | null; player_role?: string; batting_style?: string;
    bowling_style?: string; jersey_number?: number; is_captain?: boolean;
    is_vice_captain?: boolean; is_wicket_keeper?: boolean; is_active?: boolean;
  }) => apiClient.patch(`/cricpro/players/${playerId}`, data).then(r => r.data),

  remove: (playerId: number) =>
    apiClient.delete(`/cricpro/players/${playerId}`).then(r => r.data),

  // Lookup helpers for the create/edit forms
  teams: () =>
    apiClient.get<{ id: string; name: string; short?: string }[]>('/cricpro/teams').then(r => r.data),

  users: (search?: string) =>
    apiClient.get<{ id: string; full_name?: string; username: string; email: string }[]>(
      '/cricpro/users', { params: search ? { search } : undefined },
    ).then(r => r.data),

  myPerformance: () =>
    apiClient.get('/cricpro/players/me').then(r => r.data),
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statsApi = {
  battingLeaderboard: (params?: { tournament_id?: number; limit?: number }) =>
    apiClient.get<BattingLeaderboard[]>('/stats/leaderboard/batting', { params }).then(r => r.data),

  bowlingLeaderboard: (params?: { tournament_id?: number; limit?: number }) =>
    apiClient.get<BowlingLeaderboard[]>('/stats/leaderboard/bowling', { params }).then(r => r.data),

  playerStats: (playerId: number) =>
    apiClient.get(`/stats/player/${playerId}`).then(r => r.data),
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  dashboard: () => apiClient.get('/admin/dashboard').then(r => r.data),

  listUsers: (params?: { search?: string; role?: string; page?: number }) =>
    apiClient.get<User[]>('/admin/users', { params }).then(r => r.data),

  updateRole: (userId: number, role: string) =>
    apiClient.patch(`/admin/users/${userId}/role`, null, { params: { role } }),

  toggleActive: (userId: number) =>
    apiClient.patch(`/admin/users/${userId}/toggle-active`),
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { unread_only?: boolean }) =>
    apiClient.get<Notification[]>('/notifications', { params }).then(r => r.data),

  markRead: (id: number) => apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () => apiClient.patch('/notifications/read-all'),
}
