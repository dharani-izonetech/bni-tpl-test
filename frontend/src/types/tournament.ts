// ── Tournament Types ────────────────────────────────────────────────────────

export type GroupId = "A" | "B" | "C" | "D" | "E";

export interface Team {
  id: string;        // e.g. "A1", "B3"
  name: string;      // display name
  groupId: GroupId;
  slotIndex: number; // 0-4 within the group
}

export interface GroupData {
  id: GroupId;
  label: string;     // "Group A"
  teams: Team[];
}

export interface Match {
  matchNumber: number;
  groupId: GroupId;
  team1: Team;
  team2: Team;
}

export type SpinPhase = "idle" | "spinning" | "stopping" | "done";
export type RevealPhase = "idle" | "loading" | "team1" | "versus" | "team2" | "done";

export interface GroupState {
  groupId: GroupId;
  selectedTeam: Team | null;       // manually selected team
  generatedMatches: Match[];       // 2 matches from remaining 4 teams
  spinPhase: SpinPhase;
  revealPhase: RevealPhase;
  isRevealed: boolean;
}
