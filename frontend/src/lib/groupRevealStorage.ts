/**
 * Group Reveal Storage — syncs the live reveal ceremony state to the backend.
 *
 * API endpoints:
 *   GET  /api/v1/group-reveal          → all active snapshots for A-D
 *   POST /api/v1/group-reveal          → save/replace one group's reveal
 *   DELETE /api/v1/group-reveal/:gid   → admin reset
 */
import { apiFetch } from "@/lib/api";
import type { GroupId, Match } from "@/types/tournament";

// ── Types ────────────────────────────────────────────────────────────────────

export interface GroupRevealMatchItem {
  match_number: number;
  team1_name: string;
  team2_name: string;
}

export interface GroupRevealRecord {
  id: string;
  group_id: GroupId;
  selected_team_name: string;
  matches: GroupRevealMatchItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AllGroupReveals = Partial<Record<GroupId, GroupRevealRecord>>;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert frontend Match[] → API payload matches[] */
export function matchesToPayload(matches: Match[]): GroupRevealMatchItem[] {
  return matches.map(m => ({
    match_number: m.matchNumber,
    team1_name: m.team1.name,
    team2_name: m.team2.name,
  }));
}

// ── API calls ────────────────────────────────────────────────────────────────

/**
 * Load all active group reveal snapshots from the backend.
 * Returns a map of groupId → record (only groups that have been revealed).
 */
export async function loadAllGroupReveals(): Promise<AllGroupReveals> {
  try {
    const res = await apiFetch<{ data: Record<string, GroupRevealRecord> | null }>(
      "/group-reveal",
    );
    if (!res.data) return {};
    return res.data as AllGroupReveals;
  } catch (err) {
    console.warn("[groupReveal] load failed:", err);
    return {};
  }
}

/**
 * Save a group's reveal result to the backend.
 * Called immediately after the spinner lands and matches are generated.
 * No auth required — this is a public ceremony endpoint.
 */
export async function saveGroupReveal(
  groupId: GroupId,
  selectedTeamName: string,
  matches: Match[],
): Promise<GroupRevealRecord | null> {
  try {
    const res = await apiFetch<{ data: GroupRevealRecord }>("/group-reveal", {
      method: "POST",
      body: JSON.stringify({
        group_id: groupId,
        selected_team_name: selectedTeamName,
        matches: matchesToPayload(matches),
      }),
    });
    return res.data ?? null;
  } catch (err) {
    console.warn("[groupReveal] save failed:", err);
    return null;
  }
}

/**
 * Admin: reset a group's reveal (deactivates all snapshots for that group).
 */
export async function resetGroupReveal(groupId: GroupId): Promise<void> {
  await apiFetch(`/group-reveal/${groupId}`, { method: "DELETE" });
}
