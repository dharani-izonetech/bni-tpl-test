/**
 * Tournament Stages API client — wraps all /tournament-stages/* endpoints.
 */
import { apiClient } from "./client";

const BASE = "/tournament-stages";

export const tournamentStagesApi = {
  // ── Super 12 ──────────────────────────────────────────────────────────────
  generateSuper12: () => apiClient.post(`${BASE}/super12/generate`),
  getSuper12Groups: () => apiClient.get(`${BASE}/super12/groups`),
  getSuper12Matches: () => apiClient.get(`${BASE}/super12/matches`),
  updateSuper12Result: (matchId: string, payload: object) =>
    apiClient.put(`${BASE}/super12/matches/${matchId}/result`, payload),
  updateSuper12Schedule: (matchId: string, payload: object) =>
    apiClient.put(`${BASE}/super12/matches/${matchId}/schedule`, payload),

  // ── Quarter Finals ────────────────────────────────────────────────────────
  generateQF: () => apiClient.post(`${BASE}/quarterfinals/generate`),
  getQFMatches: () => apiClient.get(`${BASE}/quarterfinals`),
  updateQFResult: (matchId: string, payload: object) =>
    apiClient.put(`${BASE}/quarterfinals/${matchId}/result`, payload),
  updateQFTeams: (matchId: string, payload: object) =>
    apiClient.put(`${BASE}/quarterfinals/${matchId}/teams`, payload),
  updateQFSchedule: (matchId: string, payload: object) =>
    apiClient.put(`${BASE}/quarterfinals/${matchId}/schedule`, payload),

  // ── Semi Finals ───────────────────────────────────────────────────────────
  generateSF: () => apiClient.post(`${BASE}/semifinals/generate`),
  getSFMatches: () => apiClient.get(`${BASE}/semifinals`),
  updateSFResult: (matchId: string, payload: object) =>
    apiClient.put(`${BASE}/semifinals/${matchId}/result`, payload),
  updateSFTeams: (matchId: string, payload: object) =>
    apiClient.put(`${BASE}/semifinals/${matchId}/teams`, payload),
  updateSFSchedule: (matchId: string, payload: object) =>
    apiClient.put(`${BASE}/semifinals/${matchId}/schedule`, payload),

  // ── Final ─────────────────────────────────────────────────────────────────
  generateFinal: () => apiClient.post(`${BASE}/final/generate`),
  getFinal: () => apiClient.get(`${BASE}/final`),
  updateFinalResult: (payload: object) =>
    apiClient.put(`${BASE}/final/result`, payload),
  updateFinalTeams: (payload: object) =>
    apiClient.put(`${BASE}/final/teams`, payload),
  updateFinalSchedule: (payload: object) =>
    apiClient.put(`${BASE}/final/schedule`, payload),

  // ── Champion ──────────────────────────────────────────────────────────────
  getChampion: () => apiClient.get(`${BASE}/champion`),

  // ── Schedule ──────────────────────────────────────────────────────────────
  generateSchedule: (payload: { start_date: string; prefer_floodlight?: boolean }) =>
    apiClient.post(`${BASE}/schedule/generate`, payload),

  // ── Bracket ───────────────────────────────────────────────────────────────
  getBracket: () => apiClient.get(`${BASE}/bracket`),

  // ── Audit ─────────────────────────────────────────────────────────────────
  getOverrideLogs: (stage?: string) =>
    apiClient.get(`${BASE}/audit/overrides${stage ? `?stage=${stage}` : ""}`),
  getScheduleLogs: (stage?: string) =>
    apiClient.get(`${BASE}/audit/schedules${stage ? `?stage=${stage}` : ""}`),
};
