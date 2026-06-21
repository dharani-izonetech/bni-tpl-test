/**
 * Match schedule storage — backend API.
 */
import { apiFetch } from "@/lib/api";

export type StoredMatchSlot = { slot: number; team1: number; team2: number };
export type MatchScheduleSnapshot = {
  slotToTeamName: (string | null)[];
  schedulePlan: StoredMatchSlot[];
  revealedCount: number;
  id?: string;
};

let _cachedSnapshot: MatchScheduleSnapshot | null = null;
let _snapshotId: string | null = null;

// ── Save ───────────────────────────────────────────────────────────────────
export const saveMatchScheduleSnapshot = async (snapshot: MatchScheduleSnapshot): Promise<string> => {
  const res = await apiFetch<{ data: { id: string; revealed_count: number } }>("/schedule-snapshot", {
    method: "POST",
    body: JSON.stringify({
      slot_to_team_name: snapshot.slotToTeamName,
      schedule_plan:     snapshot.schedulePlan,
      revealed_count:    snapshot.revealedCount,
    }),
  });
  const id = res.data?.id;
  if (!id) throw new Error("Backend did not return a snapshot ID.");
  _snapshotId = id;
  _cachedSnapshot = { ...snapshot, id };
  return id;
};

// ── Update reveal count ────────────────────────────────────────────────────
export const updateRevealCount = async (count: number, snapId?: string): Promise<void> => {
  // Use provided id, or cached, or re-fetch
  let id = snapId ?? _snapshotId;
  if (!id) {
    const snap = await loadMatchScheduleSnapshotAsync();
    id = snap?.id ?? null;
  }
  if (!id) throw new Error("No snapshot ID — save the schedule first.");

  await apiFetch(`/schedule-snapshot/${id}/reveal-count?revealed_count=${count}`, {
    method: "PATCH",
  });
  if (_cachedSnapshot) _cachedSnapshot.revealedCount = count;
  _snapshotId = id; // ensure cached for next call
};

// ── Load (sync cache) ──────────────────────────────────────────────────────
export const loadMatchScheduleSnapshot = (): MatchScheduleSnapshot | null => _cachedSnapshot;

// ── Load (async from backend) ──────────────────────────────────────────────
export const loadMatchScheduleSnapshotAsync = async (): Promise<MatchScheduleSnapshot | null> => {
  const res = await apiFetch<{ data: {
    id?: string;
    slot_to_team_name?: (string | null)[];
    schedule_plan?: StoredMatchSlot[];
    revealed_count?: number;
  } | null }>("/schedule-snapshot");

  const d = res.data;
  if (!d || !d.schedule_plan) return null;

  _snapshotId = d.id ?? null;
  _cachedSnapshot = {
    slotToTeamName: d.slot_to_team_name ?? [],
    schedulePlan:   d.schedule_plan,
    revealedCount:  d.revealed_count ?? 0,
    id:             d.id,
  };
  return _cachedSnapshot;
};
