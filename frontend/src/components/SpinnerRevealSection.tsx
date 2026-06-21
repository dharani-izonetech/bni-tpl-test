/**
 * SpinnerRevealSection — Group Match Reveal
 * ─────────────────────────────────────────────────────────────────────────────
 * LOGIC (5 teams per group → 10 matches):
 *  • ONE spin per group reveals ALL 6 round-robin matches at once.
 *  • Spinner lands on a random team from the group.
 *  • ALL 6 MATCHES (every pair) are revealed sequentially with animation.
 *  • No duplicates — C(4,2) = 6 unique pairs.
 *  • State synced to backend after reveal.
 */

import { useEffect, useState, useRef, useCallback, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { GROUPS } from "@/data/tournamentData";
import type { GroupId, Match, RevealPhase, Team } from "@/types/tournament";
import { generateRoundRobin, shuffle } from "@/utils/matchGenerator";
import { startSpinSound, startRevealSound, playRevealHit } from "@/utils/audioEngine";
import type { SpinHandle, RevealHandle } from "@/utils/audioEngine";
import { loadAllGroupReveals, saveGroupReveal } from "@/lib/groupRevealStorage";

// ── Constants ────────────────────────────────────────────────────────────────
const CELL_H = 72;
const LANE_LEN = 160;
// 10 matches per group, 4 groups → offsets 1,11,21,31
const GROUP_MATCH_OFFSETS: Record<GroupId, number> = { A: 1, B: 11, C: 21, D: 31, E: 41 };

// ── Per-group state ──────────────────────────────────────────────────────────
interface GroupState {
  spunTeam: Team | null;           // the team the spinner landed on
  allMatches: Match[];             // all 6 round-robin matches
  revealedMatches: Match[];        // matches revealed so far (grows during animation)
  revealPhase: RevealPhase;
  activeMatchIndex: number | null;
  isSpinning: boolean;
  isRevealed: boolean;             // true once all 6 are shown
  spinStep: number;
  spinTransitionMs: number;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  syncError: string | null;
}

const makeInitial = (): GroupState => ({
  spunTeam: null,
  allMatches: [],
  revealedMatches: [],
  revealPhase: "idle",
  activeMatchIndex: null,
  isSpinning: false,
  isRevealed: false,
  spinStep: 0,
  spinTransitionMs: 90,
  syncStatus: "idle",
  syncError: null,
});

// ── Spinner Reel ─────────────────────────────────────────────────────────────
const SpinnerReel = ({
  teams, step, transitionMs, highlightTeam,
}: {
  teams: Team[]; step: number; transitionMs: number; highlightTeam: Team | null;
}) => {
  const lane = Array.from({ length: LANE_LEN }, (_, i) => teams[i % teams.length]);
  return (
    <div className="relative h-[72px] overflow-hidden rounded-xl border border-[rgba(166,124,0,0.35)] bg-[linear-gradient(120deg,rgba(240,232,208,0.96)_0%,rgba(240,192,64,0.62)_48%,rgba(166,124,0,0.42)_100%)] shadow-[inset_0_2px_5px_rgba(255,255,255,0.34),inset_0_-12px_22px_rgba(28,22,0,0.2)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-[#FFFDF5] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-[#FFFDF5] to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-10 rounded-xl ring-1 ring-[rgba(166,124,0,0.2)]" />
      <div
        className="will-change-transform"
        style={{ transform: `translateY(-${step * CELL_H}px)`, transition: `transform ${transitionMs}ms linear` } as CSSProperties}
      >
        {lane.map((team, idx) => (
          <div key={`${team.id}-${idx}`}
            className={cn(
              "flex h-[72px] items-center justify-center px-2 text-center text-base font-black tracking-tight drop-shadow-[0_2px_4px_rgba(28,22,0,0.3)] sm:text-lg",
              highlightTeam?.id === team.id ? "text-white" : "text-[#A67C00]",
            )}
          >
            {team.name}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Match Reveal Card ─────────────────────────────────────────────────────────
const MatchCard = ({
  match, isActive, revealPhase, index,
}: {
  match: Match; isActive: boolean; revealPhase: RevealPhase; index: number;
}) => {
  const done = !isActive || revealPhase === "done";
  const showT1 = done || ["team1", "versus", "team2"].includes(revealPhase);
  const showVs = done || ["versus", "team2"].includes(revealPhase);
  const showT2 = done || revealPhase === "team2";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-3 py-3 transition-all duration-300 sm:px-4",
        "border-[rgba(166,124,0,0.4)] bg-[linear-gradient(135deg,rgba(240,232,208,0.92)_0%,rgba(240,192,64,0.55)_100%)]",
        "shadow-[0_4px_16px_rgba(28,22,0,0.18),inset_0_1px_0_rgba(255,255,255,0.5)]",
        isActive && "ring-2 ring-[#A67C00] shadow-[0_0_24px_rgba(166,124,0,0.5)]",
      )}
    >
      {isActive && revealPhase === "loading" && (
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1s_ease-in-out_infinite]"
            style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.45) 50%,transparent 100%)" }} />
        </div>
      )}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="shrink-0 rounded-md border border-[rgba(166,124,0,0.35)] bg-[rgba(166,124,0,0.12)] px-1.5 py-0.5 font-heading text-xs font-bold uppercase tracking-[0.1em] text-[#5C4A10]">
          M{match.matchNumber}
        </span>
        <div className="flex flex-1 items-center justify-center gap-1.5 overflow-hidden sm:gap-2">
          <span className={cn("min-w-0 flex-1 truncate font-heading text-xs font-bold text-[#1A1200] transition-all duration-300 sm:text-sm", showT1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5")}>
            {match.team1.name}
          </span>
          <span className={cn("shrink-0 rounded bg-[rgba(166,124,0,0.15)] px-1.5 py-0.5 font-heading text-xs font-black uppercase tracking-[0.12em] text-[#A67C00] transition-all duration-200", showVs ? "opacity-100 scale-100" : "opacity-0 scale-50")}>
            VS
          </span>
          <span className={cn("min-w-0 flex-1 truncate text-right font-heading text-xs font-bold text-[#1A1200] transition-all duration-300 sm:text-sm", showT2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5")}>
            {match.team2.name}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Group colors ──────────────────────────────────────────────────────────────
const GROUP_COLORS: Record<GroupId, { pill: string; pillActive: string; badge: string; dot: string; headerBg: string; headerBorder: string }> = {
  A: { pill: "border-red-200 text-red-700 hover:bg-red-50",       pillActive: "bg-red-500 border-red-500 text-white",       badge: "bg-red-500 text-white",     dot: "bg-red-400",    headerBg: "bg-red-50",    headerBorder: "border-red-200"    },
  B: { pill: "border-blue-200 text-blue-700 hover:bg-blue-50",    pillActive: "bg-blue-500 border-blue-500 text-white",     badge: "bg-blue-500 text-white",    dot: "bg-blue-400",   headerBg: "bg-blue-50",   headerBorder: "border-blue-200"   },
  C: { pill: "border-green-200 text-green-700 hover:bg-green-50", pillActive: "bg-green-500 border-green-500 text-white",   badge: "bg-green-500 text-white",   dot: "bg-green-400",  headerBg: "bg-green-50",  headerBorder: "border-green-200"  },
  D: { pill: "border-purple-200 text-purple-700 hover:bg-purple-50", pillActive: "bg-purple-500 border-purple-500 text-white", badge: "bg-purple-500 text-white", dot: "bg-purple-400", headerBg: "bg-purple-50", headerBorder: "border-purple-200" },
  E: { pill: "border-orange-200 text-orange-700 hover:bg-orange-50", pillActive: "bg-orange-500 border-orange-500 text-white", badge: "bg-orange-500 text-white", dot: "bg-orange-400", headerBg: "bg-orange-50", headerBorder: "border-orange-200" },
};

// ── Full Schedule Table ───────────────────────────────────────────────────────
const ScheduleTable = ({
  groupStates, onGroupClick,
}: {
  groupStates: Record<GroupId, GroupState>;
  onGroupClick: (g: GroupId) => void;
}) => {
  const GROUP_IDS: GroupId[] = ["A", "B", "C", "D", "E"];
  const totalRevealed = GROUP_IDS.filter(g => groupStates[g].isRevealed).length;
  const allMatches = GROUP_IDS.flatMap(gid =>
    groupStates[gid].revealedMatches.map(m => ({ ...m, gid }))
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(166,124,0,0.3)] bg-[rgba(255,253,245,0.9)] shadow-[0_8px_32px_rgba(28,22,0,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(166,124,0,0.2)] bg-[linear-gradient(135deg,rgba(240,232,208,0.9),rgba(255,253,245,0.95))] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#A67C00,#F0C040)] text-base shadow-[0_4px_12px_rgba(166,124,0,0.35)]">📋</div>
          <div>
            <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-[#1A1200]">Full Match Schedule</h3>
            <p className="text-xs text-[#5C4A10]">{totalRevealed * 6} / 30 matches revealed · {5 - totalRevealed} group{5 - totalRevealed !== 1 ? "s" : ""} pending</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GROUP_IDS.map(gid => {
            const c = GROUP_COLORS[gid];
            const done = groupStates[gid].isRevealed;
            return (
              <button key={gid} onClick={() => onGroupClick(gid)}
                className={cn("flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition", done ? c.pillActive : c.pill)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", done ? "bg-white" : c.dot)} />
                Grp {gid}{done ? " ✓" : ""}
              </button>
            );
          })}
        </div>
      </div>
      {allMatches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(240,192,64,0.1)] text-3xl">🏏</div>
          <p className="font-heading text-base font-bold text-[#1A1200]">No Matches Scheduled Yet</p>
          <p className="max-w-xs text-sm text-[#5C4A10]">Spin each group to reveal all 6 round-robin matches.</p>
        </div>
      ) : (
        <div className="divide-y divide-[rgba(166,124,0,0.08)]">
          {GROUP_IDS.map(gid => {
            const matches = groupStates[gid].revealedMatches;
            if (!matches.length) return null;
            const c = GROUP_COLORS[gid];
            return (
              <div key={gid}>
                <div className={cn("flex cursor-pointer items-center justify-between gap-3 border-b px-5 py-2.5 transition hover:brightness-95", c.headerBg, c.headerBorder)}
                  onClick={() => onGroupClick(gid)}>
                  <div className="flex items-center gap-2">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-md text-xs font-black", c.badge)}>{gid}</span>
                    <span className="font-heading text-sm font-bold text-[#1A1200]">Group {gid}</span>
                    <span className="text-xs text-[#5C4A10]/70">· 10/10 matches</span>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">✓ Complete</span>
                </div>
                <div className="divide-y divide-[rgba(166,124,0,0.06)]">
                  {matches.map(m => (
                    <div key={`${m.groupId}-${m.matchNumber}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[rgba(240,192,64,0.05)]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(166,124,0,0.2)] bg-[rgba(166,124,0,0.07)]">
                        <span className="font-heading text-xs font-black text-[#A67C00]">{m.matchNumber}</span>
                      </div>
                      <span className="min-w-0 flex-1 truncate font-heading text-sm font-semibold text-[#1A1200] sm:text-base">{m.team1.name}</span>
                      <span className="shrink-0 rounded-lg border border-[rgba(166,124,0,0.25)] bg-[rgba(166,124,0,0.08)] px-2.5 py-1 font-heading text-xs font-black tracking-[0.12em] text-[#A67C00]">VS</span>
                      <span className="min-w-0 flex-1 truncate text-right font-heading text-sm font-semibold text-[#1A1200] sm:text-base">{m.team2.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const SpinnerRevealSection = () => {
  const GROUP_IDS: GroupId[] = ["A", "B", "C", "D", "E"];
  const [activeGroup,    setActiveGroup]    = useState<GroupId>("A");
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [groupStates,    setGroupStates]    = useState<Record<GroupId, GroupState>>({
    A: makeInitial(), B: makeInitial(), C: makeInitial(), D: makeInitial(), E: makeInitial(),
  });

  const timersRef       = useRef<Record<GroupId, number[]>>({ A:[], B:[], C:[], D:[], E:[] });
  const spinHandleRef   = useRef<Record<GroupId, SpinHandle | null>>({ A:null, B:null, C:null, D:null, E:null });
  const revealHandleRef = useRef<Record<GroupId, RevealHandle | null>>({ A:null, B:null, C:null, D:null, E:null });
  const spinIntervalRef = useRef<Record<GroupId, number | null>>({ A:null, B:null, C:null, D:null, E:null });

  const patch = useCallback((gid: GroupId, p: Partial<GroupState>) =>
    setGroupStates(prev => ({ ...prev, [gid]: { ...prev[gid], ...p } })), []);

  const qt = (gid: GroupId, id: number) => timersRef.current[gid].push(id);

  const clearTimers = useCallback((gid: GroupId) => {
    timersRef.current[gid].forEach(id => { window.clearTimeout(id); window.clearInterval(id); });
    timersRef.current[gid] = [];
    if (spinIntervalRef.current[gid] !== null) { window.clearInterval(spinIntervalRef.current[gid]!); spinIntervalRef.current[gid] = null; }
    spinHandleRef.current[gid]?.stop();   spinHandleRef.current[gid] = null;
    revealHandleRef.current[gid]?.stop(); revealHandleRef.current[gid] = null;
  }, []);

  // ── Load from backend on mount ────────────────────────────────────────────
  useEffect(() => {
    loadAllGroupReveals().then(existing => {
      if (!Object.keys(existing).length) { setIsLoadingState(false); return; }
      setGroupStates(prev => {
        const next = { ...prev };
        GROUP_IDS.forEach(gid => {
          const record = existing[gid];
          if (!record) return;
          const group = GROUPS.find(g => g.id === gid)!;
          const revealedMatches: Match[] = record.matches.map(m => {
            const t1 = group.teams.find(t => t.name === m.team1_name) ?? { id:`${gid}-t1-${m.match_number}`, name:m.team1_name, groupId:gid, slotIndex:0 };
            const t2 = group.teams.find(t => t.name === m.team2_name) ?? { id:`${gid}-t2-${m.match_number}`, name:m.team2_name, groupId:gid, slotIndex:1 };
            return { matchNumber:m.match_number, groupId:gid, team1:t1, team2:t2 };
          });
          const allMatches = generateRoundRobin(group.teams, GROUP_MATCH_OFFSETS[gid] + 1);
          const spunTeam = group.teams.find(t => t.name === record.selected_team_name) ?? null;
          next[gid] = { ...makeInitial(), spunTeam, allMatches, revealedMatches, revealPhase:"done", isRevealed:true, syncStatus:"synced" };
        });
        return next;
      });
      setIsLoadingState(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gs    = groupStates[activeGroup];
  const group = GROUPS.find(g => g.id === activeGroup)!;
  const totalDone = GROUP_IDS.filter(g => groupStates[g].isRevealed).length;

  // ── Backend sync ──────────────────────────────────────────────────────────
  const syncToBackend = useCallback(async (gid: GroupId, matches: Match[], spunTeam: Team) => {
    patch(gid, { syncStatus:"syncing", syncError:null });
    const result = await saveGroupReveal(gid, spunTeam.name, matches);
    patch(gid, result ? { syncStatus:"synced" } : { syncStatus:"error", syncError:"Sync failed." });
  }, [patch]);

  // ── Reveal all 6 matches sequentially ────────────────────────────────────
  const runRevealAnimation = useCallback((gid: GroupId, matches: Match[], onDone: () => void) => {
    const PER_MATCH = 1600;
    matches.forEach((_, idx) => {
      const base = idx * PER_MATCH;
      qt(gid, window.setTimeout(() => {
        revealHandleRef.current[gid]?.stop();
        revealHandleRef.current[gid] = startRevealSound();
        patch(gid, { revealPhase:"loading", activeMatchIndex:idx });
      }, base));
      qt(gid, window.setTimeout(() => patch(gid, { revealPhase:"team1" }), base + 300));
      qt(gid, window.setTimeout(() => patch(gid, { revealPhase:"versus" }), base + 650));
      qt(gid, window.setTimeout(() => {
        patch(gid, { revealPhase:"team2" });
        playRevealHit();
        revealHandleRef.current[gid]?.stop();
        revealHandleRef.current[gid] = null;
        // Add this match to revealedMatches progressively
        setGroupStates(prev => ({
          ...prev,
          [gid]: { ...prev[gid], revealedMatches: matches.slice(0, idx + 1) },
        }));
      }, base + 1100));
    });
    qt(gid, window.setTimeout(() => {
      patch(gid, { revealPhase:"done", activeMatchIndex:null, isRevealed:true });
      onDone();
    }, matches.length * PER_MATCH + 200));
  }, [patch]);

  // ── Spin ──────────────────────────────────────────────────────────────────
  const spin = useCallback(() => {
    const gid = activeGroup;
    if (gs.isSpinning || gs.isRevealed) return;
    clearTimers(gid);

    // Pick a random team to land on
    const landTeam = shuffle(group.teams)[0];
    const teamIdx  = group.teams.findIndex(t => t.id === landTeam.id);

    // Generate all 6 matches
    const allMatches = generateRoundRobin(group.teams, GROUP_MATCH_OFFSETS[gid] + 1);

    patch(gid, { isSpinning:true, spinTransitionMs:90, revealPhase:"idle",
                 activeMatchIndex:null, syncStatus:"idle", syncError:null, allMatches, revealedMatches:[] });

    spinHandleRef.current[gid] = startSpinSound();
    const interval = window.setInterval(() => {
      setGroupStates(prev => ({ ...prev, [gid]: { ...prev[gid], spinStep: prev[gid].spinStep + 1 } }));
    }, 80);
    spinIntervalRef.current[gid] = interval;

    const stopTimer = window.setTimeout(() => {
      window.clearInterval(interval);
      spinIntervalRef.current[gid] = null;
      spinHandleRef.current[gid]?.stop();
      spinHandleRef.current[gid] = null;

      // Snap reel to landed team
      setGroupStates(prev => {
        const cur = prev[gid];
        const nowMod = cur.spinStep % group.teams.length;
        const delta  = (teamIdx - nowMod + group.teams.length) % group.teams.length;
        return { ...prev, [gid]: { ...cur, spinStep: cur.spinStep + delta + group.teams.length * 2, spinTransitionMs:700 } };
      });

      qt(gid, window.setTimeout(() => {
        patch(gid, { isSpinning:false, spinTransitionMs:120, spunTeam:landTeam });
        runRevealAnimation(gid, allMatches, () => {
          void syncToBackend(gid, allMatches, landTeam);
        });
      }, 750));
    }, 1800);
    qt(gid, stopTimer);
  }, [activeGroup, gs.isSpinning, gs.isRevealed, group.teams, patch, clearTimers, runRevealAnimation, syncToBackend]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    clearTimers(activeGroup);
    patch(activeGroup, makeInitial());
  }, [activeGroup, patch, clearTimers]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Group tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {GROUP_IDS.map(gid => {
          const done = groupStates[gid].isRevealed;
          const c = GROUP_COLORS[gid];
          return (
            <button key={gid} onClick={() => setActiveGroup(gid)}
              className={cn("flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition",
                activeGroup === gid
                  ? "border-[rgba(166,124,0,0.6)] bg-[linear-gradient(135deg,#A67C00,#F0C040)] text-[#1A1200] shadow-[0_4px_12px_rgba(166,124,0,0.35)]"
                  : "border-[rgba(166,124,0,0.25)] bg-white/60 text-[#5C4A10] hover:bg-[rgba(240,192,64,0.15)]",
              )}>
              <span className={cn("h-2 w-2 rounded-full", done ? "bg-green-500" : "bg-[rgba(166,124,0,0.4)]")} />
              Group {gid}
              {done && <span className="text-green-600">✓</span>}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-[#5C4A10]">
          <span className="font-semibold">{totalDone}/4</span> groups revealed
        </span>
      </div>

      {isLoadingState ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(166,124,0,0.3)] border-t-[#A67C00]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Spinner */}
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-[rgba(166,124,0,0.35)] bg-[linear-gradient(135deg,rgba(240,232,208,0.95),rgba(255,253,245,0.98))] p-5 shadow-[0_8px_32px_rgba(28,22,0,0.1)]">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold uppercase tracking-wide text-[#1A1200]">
                    Group {activeGroup} Spinner
                  </h3>
                  <p className="text-xs text-[#5C4A10] mt-0.5">
                    {gs.isRevealed ? "ALL 6 MATCHES revealed!" : "Spin to reveal ALL 6 MATCHES at once"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {gs.syncStatus === "syncing" && <span className="text-xs text-[#A67C00]">⟳ Saving…</span>}
                  {gs.syncStatus === "synced"  && <span className="text-xs text-green-600">✓ Saved</span>}
                  {gs.syncStatus === "error"   && <span className="text-xs text-red-500" title={gs.syncError ?? ""}>⚠ Sync failed</span>}
                  {gs.isRevealed && (
                    <button onClick={handleReset}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 transition">
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <SpinnerReel
                teams={group.teams}
                step={gs.spinStep}
                transitionMs={gs.spinTransitionMs}
                highlightTeam={gs.spunTeam}
              />

              {/* Teams in this group */}
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {group.teams.map(t => (
                  <span key={t.id}
                    className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold transition",
                      gs.spunTeam?.id === t.id
                        ? "border-[rgba(166,124,0,0.6)] bg-[rgba(166,124,0,0.15)] text-[#A67C00] font-bold"
                        : "border-[rgba(166,124,0,0.2)] text-[#5C4A10]",
                    )}>
                    {t.name}
                  </span>
                ))}
              </div>

              {/* Spin button */}
              {!gs.isRevealed && (
                <button
                  onClick={spin}
                  disabled={gs.isSpinning}
                  className={cn(
                    "mt-4 w-full rounded-xl py-3 text-base font-black uppercase tracking-wide transition",
                    "bg-[linear-gradient(135deg,#A67C00,#F0C040)] text-[#1A1200]",
                    "shadow-[0_4px_16px_rgba(166,124,0,0.4)] hover:shadow-[0_6px_20px_rgba(166,124,0,0.55)]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {gs.isSpinning ? "🎰 Spinning…" : "🎰 Spin to reveal ALL 6 MATCHES"}
                </button>
              )}

              {gs.isRevealed && gs.spunTeam && (
                <div className="mt-4 rounded-xl border border-[rgba(166,124,0,0.3)] bg-[rgba(240,192,64,0.1)] px-4 py-3 text-center">
                  <p className="text-xs text-[#5C4A10]">Spinner landed on</p>
                  <p className="font-heading text-base font-black text-[#A67C00]">{gs.spunTeam.name}</p>
                  <p className="text-xs text-green-600 mt-1">✅ ALL 6 MATCHES revealed</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Match cards */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#5C4A10]/60">
              {gs.revealedMatches.length > 0
                ? `${gs.revealedMatches.length} / 10 matches revealed`
                : "Matches will appear here after spin"}
            </p>
            {gs.revealedMatches.length === 0 && !gs.isSpinning ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[rgba(166,124,0,0.25)] py-14 text-center">
                <span className="text-3xl">🏏</span>
                <p className="text-sm font-semibold text-[#5C4A10]/60">
                  {gs.isRevealed ? "No matches to show" : "Spin to reveal ALL 6 MATCHES"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Show revealed matches + placeholder for pending ones */}
                {gs.allMatches.length > 0
                  ? gs.allMatches.map((match, idx) => {
                      const isRevealed = idx < gs.revealedMatches.length;
                      const isActive   = gs.activeMatchIndex === idx;
                      if (!isRevealed && !isActive && gs.activeMatchIndex !== idx) {
                        return (
                          <div key={`pending-${idx}`}
                            className="rounded-xl border border-dashed border-[rgba(166,124,0,0.2)] px-4 py-3 text-center text-xs text-[#5C4A10]/40">
                            Match {match.matchNumber} — pending…
                          </div>
                        );
                      }
                      return (
                        <MatchCard
                          key={`${match.groupId}-${match.matchNumber}`}
                          match={match}
                          isActive={isActive}
                          revealPhase={gs.revealPhase}
                          index={idx}
                        />
                      );
                    })
                  : gs.revealedMatches.map((match, idx) => (
                      <MatchCard
                        key={`${match.groupId}-${match.matchNumber}`}
                        match={match}
                        isActive={false}
                        revealPhase="done"
                        index={idx}
                      />
                    ))
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full schedule table */}
      <ScheduleTable groupStates={groupStates} onGroupClick={setActiveGroup} />
    </div>
  );
};

export default SpinnerRevealSection;





