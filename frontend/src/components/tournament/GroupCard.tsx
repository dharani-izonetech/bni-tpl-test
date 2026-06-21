import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { GroupData, Match, RevealPhase, Team } from "@/types/tournament";
import SpinnerWheel from "./SpinnerWheel";
import MatchReveal from "./MatchReveal";
import { generatePairings } from "@/utils/matchGenerator";
import { startRevealSound, playRevealHit, playButtonClick } from "@/utils/audioEngine";
import type { RevealHandle } from "@/utils/audioEngine";

interface Props {
  group: GroupData;
  globalMatchOffset: number; // so match numbers are globally unique
}

const GroupCard = ({ group, globalMatchOffset }: Props) => {
  const [teamInput, setTeamInput] = useState("");
  const [assignedTeams, setAssignedTeams] = useState<(string | null)[]>(
    Array(group.teams.length).fill(null),
  );
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [spinTarget, setSpinTarget] = useState<Team | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [generatedMatches, setGeneratedMatches] = useState<Match[]>([]);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("idle");
  const [activeMatchIndex, setActiveMatchIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAssignedInfo, setLastAssignedInfo] = useState<string | null>(null);

  const timersRef = useRef<number[]>([]);
  const revealHandleRef = useRef<RevealHandle | null>(null);

  const queue = (id: number) => timersRef.current.push(id);

  // Assigned count
  const assignedCount = assignedTeams.filter(Boolean).length;
  const allAssigned = assignedCount === group.teams.length;

  // ── Assign slot via spinner ────────────────────────────────────────────────
  const handleAssign = useCallback(() => {
    const name = teamInput.trim();
    if (!name) { setError("Type a team name before assigning."); return; }
    if (allAssigned) { setError("All slots in this group are filled."); return; }
    if (isSpinning) return;

    const normalized = name.toLowerCase();
    const duplicate = assignedTeams.some(n => n?.toLowerCase() === normalized);
    if (duplicate) { setError("Team already assigned in this group."); return; }

    setError(null);
    playButtonClick();

    // Pick a random unfilled slot
    const unfilled = group.teams
      .map((_, i) => i)
      .filter(i => !assignedTeams[i]);
    const pickedIdx = unfilled[Math.floor(Math.random() * unfilled.length)];
    const pickedTeam = group.teams[pickedIdx];

    setSpinTarget(pickedTeam);
    setIsSpinning(true);
  }, [teamInput, allAssigned, isSpinning, assignedTeams, group.teams]);

  // Called by SpinnerWheel when animation finishes
  const handleSpinComplete = useCallback(
    (team: Team) => {
      const name = teamInput.trim() || `Team ${team.id}`;
      setAssignedTeams(prev => {
        const next = [...prev];
        next[team.slotIndex] = name;
        return next;
      });
      setLastAssignedInfo(`${name} → Slot ${team.slotIndex + 1}`);
      setTeamInput("");
      setIsSpinning(false);
      setSpinTarget(null);
    },
    [teamInput],
  );

  // ── Select team manually ──────────────────────────────────────────────────
  const handleSelectTeam = useCallback(
    (team: Team) => {
      if (isSpinning || selectedTeam) return;
      playButtonClick();
      setSelectedTeam(team);
      setError(null);

      // Remaining 4 teams
      const remaining = group.teams.filter(t => t.id !== team.id);
      const matches = generatePairings(remaining, globalMatchOffset + 1);
      setGeneratedMatches(matches);

      // Animate reveal of each match card
      revealHandleRef.current = startRevealSound();
      setRevealPhase("loading");
      setActiveMatchIndex(0);

      const t1 = window.setTimeout(() => setRevealPhase("team1"), 400);
      const t2 = window.setTimeout(() => setRevealPhase("versus"), 900);
      const t3 = window.setTimeout(() => {
        setRevealPhase("team2");
        playRevealHit();
        revealHandleRef.current?.stop();
        revealHandleRef.current = null;
      }, 1400);
      const t4 = window.setTimeout(() => {
        setRevealPhase("done");
        setActiveMatchIndex(null);
      }, 1900);

      queue(t1); queue(t2); queue(t3); queue(t4);
    },
    [isSpinning, selectedTeam, group.teams, globalMatchOffset],
  );

  // ── Re-spin (reshuffle matches) ───────────────────────────────────────────
  const handleRespin = useCallback(() => {
    if (!selectedTeam) return;
    playButtonClick();
    timersRef.current.forEach(id => { window.clearTimeout(id); window.clearInterval(id); });
    timersRef.current = [];
    revealHandleRef.current?.stop();
    revealHandleRef.current = null;

    const remaining = group.teams.filter(t => t.id !== selectedTeam.id);
    const matches = generatePairings(remaining, globalMatchOffset + 1);
    setGeneratedMatches(matches);
    setRevealPhase("loading");
    setActiveMatchIndex(0);

    revealHandleRef.current = startRevealSound();
    const t1 = window.setTimeout(() => setRevealPhase("team1"), 400);
    const t2 = window.setTimeout(() => setRevealPhase("versus"), 900);
    const t3 = window.setTimeout(() => {
      setRevealPhase("team2");
      playRevealHit();
      revealHandleRef.current?.stop();
      revealHandleRef.current = null;
    }, 1400);
    const t4 = window.setTimeout(() => {
      setRevealPhase("done");
      setActiveMatchIndex(null);
    }, 1900);
    queue(t1); queue(t2); queue(t3); queue(t4);
  }, [selectedTeam, group.teams, globalMatchOffset]);

  // ── Reset group ───────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    timersRef.current.forEach(id => { window.clearTimeout(id); window.clearInterval(id); });
    timersRef.current = [];
    revealHandleRef.current?.stop();
    revealHandleRef.current = null;
    setTeamInput("");
    setAssignedTeams(Array(group.teams.length).fill(null));
    setSelectedTeam(null);
    setSpinTarget(null);
    setIsSpinning(false);
    setGeneratedMatches([]);
    setRevealPhase("idle");
    setActiveMatchIndex(null);
    setError(null);
    setLastAssignedInfo(null);
  }, [group.teams.length]);

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      {/* ── LEFT: Spinner Panel ── */}
      <div
        className={cn(
          "rounded-2xl border p-4 md:p-5",
          "border-[rgba(166,124,0,0.4)]",
          "bg-[linear-gradient(160deg,#F0E8D0_0%,#F0C040_52%,#A67C00_100%)]",
          "shadow-[0_30px_64px_rgba(28,22,0,0.42),0_0_58px_rgba(166,124,0,0.4),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-22px_40px_rgba(28,22,0,0.22)]",
          "ring-1 ring-[rgba(166,124,0,0.4)]",
        )}
      >
        <h3 className="mb-3 font-heading text-lg font-bold text-[#1A1200]">
          {group.label} — Team Assignment Spinner
        </h3>

        <div className="space-y-3 rounded-xl border border-[rgba(166,124,0,0.3)] bg-[rgba(255,253,245,0.55)] p-4">
          {/* Slot counter */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#1A1200]">
              Assigned Slots: {assignedCount}/{group.teams.length}
            </p>
            <p className="text-xs text-[#5C4A10]">
              Remaining: {group.teams.length - assignedCount}
            </p>
          </div>

          {/* Input */}
          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#5C4A10]">
              Team Name
            </span>
            <input
              value={teamInput}
              onChange={e => setTeamInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAssign(); }}
              placeholder="Type team name and press Enter"
              disabled={allAssigned || isSpinning}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-sm outline-none transition",
                "border-[rgba(166,124,0,0.35)] bg-[rgba(255,253,245,0.8)] text-[#1A1200]",
                "placeholder:text-[#5C4A10]/50",
                "focus:border-[#A67C00] focus:ring-1 focus:ring-[rgba(166,124,0,0.3)]",
                (allAssigned || isSpinning) && "cursor-not-allowed opacity-60",
              )}
            />
          </label>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAssign}
              disabled={allAssigned || isSpinning}
              className={cn(
                "rounded-md px-5 py-2 text-sm font-bold uppercase tracking-[0.14em] transition",
                allAssigned || isSpinning
                  ? "cursor-not-allowed bg-[rgba(166,124,0,0.3)] text-[#5C4A10]"
                  : [
                      "border border-[rgba(166,124,0,0.45)]",
                      "bg-[linear-gradient(135deg,rgba(166,124,0,0.96),rgba(200,150,12,0.94))]",
                      "text-white shadow-[0_10px_20px_rgba(28,22,0,0.24),0_0_18px_rgba(166,124,0,0.18),inset_0_1px_0_rgba(255,255,255,0.24)]",
                      "hover:-translate-y-0.5 hover:brightness-110",
                    ],
              )}
            >
              {isSpinning ? "Spinning…" : "Assign Slot"}
            </button>
            <button
              onClick={handleReset}
              className="rounded-md border border-[rgba(166,124,0,0.35)] bg-[rgba(255,253,245,0.7)] px-4 py-2 text-sm font-semibold text-[#1A1200] transition hover:bg-[rgba(240,192,64,0.2)]"
            >
              Reset
            </button>
          </div>

          {/* Spinner reel */}
          <div
            className={cn(
              "rounded-xl border p-3",
              "border-[rgba(166,124,0,0.45)]",
              "bg-[linear-gradient(155deg,rgba(240,232,208,0.96)_0%,rgba(240,192,64,0.52)_46%,rgba(166,124,0,0.36)_100%)]",
              "shadow-[0_14px_30px_rgba(28,22,0,0.26),inset_0_1px_0_rgba(255,255,255,0.38),inset_0_-12px_22px_rgba(28,22,0,0.14)]",
            )}
          >
            {lastAssignedInfo && (
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#5C4A10]">
                Assigned: {lastAssignedInfo}
              </p>
            )}
            <SpinnerWheel
              teams={group.teams}
              isSpinning={isSpinning}
              targetTeam={spinTarget}
              onSpinComplete={handleSpinComplete}
            />
          </div>

          {lastAssignedInfo && (
            <p className="text-sm font-semibold text-[#A67C00]">
              Assigned: {lastAssignedInfo}
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Team selection buttons */}
        {!selectedTeam && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#5C4A10]">
              Select your team manually:
            </p>
            <div className="flex flex-wrap gap-2">
              {group.teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  disabled={isSpinning}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                    "border-[rgba(166,124,0,0.4)] bg-[rgba(255,253,245,0.7)] text-[#1A1200]",
                    "hover:bg-[rgba(240,192,64,0.3)] hover:border-[#A67C00]",
                    isSpinning && "cursor-not-allowed opacity-50",
                  )}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTeam && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-[rgba(166,124,0,0.4)] bg-[rgba(240,192,64,0.2)] px-3 py-1.5">
              <span className="text-xs font-semibold text-[#5C4A10]">Selected: </span>
              <span className="text-sm font-bold text-[#1A1200]">{selectedTeam.name}</span>
            </div>
            <button
              onClick={handleRespin}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] transition",
                "border-[rgba(166,124,0,0.45)] bg-[rgba(166,124,0,0.15)] text-[#A67C00]",
                "hover:bg-[rgba(166,124,0,0.25)]",
              )}
            >
              Re-spin
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Match Reveal Panel ── */}
      <MatchReveal
        matches={generatedMatches}
        revealPhase={revealPhase}
        activeMatchIndex={activeMatchIndex}
        selectedTeamName={selectedTeam?.name ?? null}
        groupLabel={group.label}
      />
    </div>
  );
};

export default GroupCard;
