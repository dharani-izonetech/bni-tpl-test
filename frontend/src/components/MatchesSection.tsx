import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { loadAllGroupReveals } from "@/lib/groupRevealStorage";
import type { AllGroupReveals, GroupRevealMatchItem } from "@/lib/groupRevealStorage";
import { GROUPS } from "@/data/tournamentData";
import type { GroupId } from "@/types/tournament";

// ── Types ─────────────────────────────────────────────────────────────────────
interface FlatMatch {
  matchNumber: number;
  team1Name: string;
  team2Name: string;
  groupId: GroupId;
  groupLabel: string;
  selectedTeamName: string;
}

// ── Group colour palette ──────────────────────────────────────────────────────
const GROUP_COLORS: Record<GroupId, {
  pill: string; pillActive: string; dot: string;
  headerBg: string; headerBorder: string; badge: string;
}> = {
  A: {
    pill:        "border-red-200 text-red-700 hover:bg-red-50",
    pillActive:  "bg-red-500 border-red-500 text-white",
    dot:         "bg-red-500",
    headerBg:    "bg-red-50/60",
    headerBorder:"border-red-200",
    badge:       "bg-red-500 text-white",
  },
  B: {
    pill:        "border-blue-200 text-blue-700 hover:bg-blue-50",
    pillActive:  "bg-blue-500 border-blue-500 text-white",
    dot:         "bg-blue-500",
    headerBg:    "bg-blue-50/60",
    headerBorder:"border-blue-200",
    badge:       "bg-blue-500 text-white",
  },
  C: {
    pill:        "border-green-200 text-green-700 hover:bg-green-50",
    pillActive:  "bg-green-500 border-green-500 text-white",
    dot:         "bg-green-500",
    headerBg:    "bg-green-50/60",
    headerBorder:"border-green-200",
    badge:       "bg-green-500 text-white",
  },
  D: {
    pill:        "border-purple-200 text-purple-700 hover:bg-purple-50",
    pillActive:  "bg-purple-500 border-purple-500 text-white",
    dot:         "bg-purple-500",
    headerBg:    "bg-purple-50/60",
    headerBorder:"border-purple-200",
    badge:       "bg-purple-500 text-white",
  },
  E: {
    pill:        "border-orange-200 text-orange-700 hover:bg-orange-50",
    pillActive:  "bg-orange-500 border-orange-500 text-white",
    dot:         "bg-orange-500",
    headerBg:    "bg-orange-50/60",
    headerBorder:"border-orange-200",
    badge:       "bg-orange-500 text-white",
  },
};

const GROUP_IDS: GroupId[] = ["A", "B", "C", "D", "E"];

// ── Component ─────────────────────────────────────────────────────────────────
const MatchesSection = () => {
  const [reveals,     setReveals]     = useState<AllGroupReveals>({});
  const [loading,     setLoading]     = useState(true);
  const [filterGroup, setFilterGroup] = useState<GroupId | "ALL">("ALL");
  const [filterTeam,  setFilterTeam]  = useState<string | null>(null);

  useEffect(() => {
    loadAllGroupReveals()
      .then(data => setReveals(data))
      .finally(() => setLoading(false));
  }, []);

  // ── Flatten all matches from all revealed groups ───────────────────────────
  const allMatches: FlatMatch[] = GROUP_IDS.flatMap(gid => {
    const record = reveals[gid];
    if (!record) return [];
    const groupLabel = GROUPS.find(g => g.id === gid)?.label ?? `Group ${gid}`;
    return record.matches.map((m: GroupRevealMatchItem) => ({
      matchNumber:      m.match_number,
      team1Name:        m.team1_name,
      team2Name:        m.team2_name,
      groupId:          gid,
      groupLabel,
      selectedTeamName: record.selected_team_name,
    }));
  });

  // ── All unique team names across all revealed matches ─────────────────────
  const allTeamNames = Array.from(
    new Set(allMatches.flatMap(m => [m.team1Name, m.team2Name]))
  ).sort();

  // ── Apply filters ─────────────────────────────────────────────────────────
  const filtered = allMatches
    .filter(m => filterGroup === "ALL" || m.groupId === filterGroup)
    .filter(m => !filterTeam || m.team1Name === filterTeam || m.team2Name === filterTeam);

  // ── Group the filtered matches by groupId for display ─────────────────────
  const byGroup: Partial<Record<GroupId, FlatMatch[]>> = {};
  filtered.forEach(m => {
    if (!byGroup[m.groupId]) byGroup[m.groupId] = [];
    byGroup[m.groupId]!.push(m);
  });

  const revealedGroupCount = GROUP_IDS.filter(g => !!reveals[g]).length;
  const totalMatchCount    = allMatches.length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-4xl">
          <h2 className="mb-4 font-heading text-3xl font-bold uppercase text-foreground">
            Match Schedule
          </h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(166,124,0,0.3)] border-t-[#A67C00]" />
            Loading schedule…
          </div>
        </div>
      </section>
    );
  }

  // ── No reveals yet ────────────────────────────────────────────────────────
  if (revealedGroupCount === 0) {
    return (
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-4xl">
          <h2 className="mb-4 font-heading text-3xl font-bold uppercase text-foreground">
            Match Schedule
          </h2>
          <div className="rounded-2xl border border-[rgba(166,124,0,0.2)] bg-[rgba(255,253,245,0.7)] px-6 py-14 text-center">
            <p className="text-3xl">🏏</p>
            <p className="mt-3 font-heading text-lg font-bold text-foreground">
              Schedule Not Yet Revealed
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Match schedule will be revealed soon. Stay tuned!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="matches" className="px-4 py-10 md:py-14">
      <div className="container mx-auto max-w-4xl">

        {/* ── Page header ── */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-3xl font-bold uppercase text-foreground md:text-4xl">
            Match Schedule
          </h2>
          <span className="text-sm text-muted-foreground">
            {revealedGroupCount} / {GROUP_IDS.length} groups revealed
            {totalMatchCount > 0 && ` · ${totalMatchCount} matches`}
          </span>
        </div>

        {/* ── Group filter pills ── */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => { setFilterGroup("ALL"); setFilterTeam(null); }}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
              filterGroup === "ALL" && !filterTeam
                ? "border-[rgba(166,124,0,0.6)] bg-[linear-gradient(135deg,#A67C00,#F0C040)] text-[#1A1200] shadow-[0_3px_10px_rgba(166,124,0,0.3)]"
                : "border-border text-muted-foreground hover:text-foreground hover:border-[rgba(166,124,0,0.4)]",
            )}
          >
            All Matches
          </button>
          {GROUP_IDS.filter(g => !!reveals[g]).map(gid => {
            const c = GROUP_COLORS[gid];
            const isActive = filterGroup === gid && !filterTeam;
            return (
              <button
                key={gid}
                onClick={() => { setFilterGroup(gid); setFilterTeam(null); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                  isActive ? c.pillActive : c.pill,
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", c.dot)} />
                Group {gid}
              </button>
            );
          })}
        </div>

        {/* ── Team filter pills ── */}
        {allTeamNames.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {allTeamNames.map(name => (
              <button
                key={name}
                onClick={() => {
                  setFilterTeam(prev => prev === name ? null : name);
                  setFilterGroup("ALL");
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  filterTeam === name
                    ? "border-[rgba(166,124,0,0.6)] bg-[rgba(166,124,0,0.15)] text-[#A67C00]"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-[rgba(166,124,0,0.4)]",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* ── Match list ── */}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {filterTeam ? `No matches found for ${filterTeam}.` : "No matches to show."}
          </p>
        ) : (
          <div className="space-y-4">
            {GROUP_IDS.map(gid => {
              const matches = byGroup[gid];
              if (!matches?.length) return null;
              const record = reveals[gid]!;
              const c = GROUP_COLORS[gid];

              return (
                <div key={gid} className="overflow-hidden rounded-2xl border border-border/40">

                  {/* Group header */}
                  <div className={cn(
                    "flex items-center justify-between gap-3 border-b px-5 py-3",
                    c.headerBg, c.headerBorder,
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-md text-xs font-black", c.badge)}>
                        {gid}
                      </span>
                      <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                        Group {gid}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · Selected: <span className="font-semibold text-[#A67C00]">{record.selected_team_name}</span>
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {matches.length} match{matches.length !== 1 ? "es" : ""}
                    </span>
                  </div>

                  {/* Match rows */}
                  <div className="divide-y divide-border/20">
                    {matches.map(match => (
                      <div
                        key={`${match.groupId}-${match.matchNumber}`}
                        className="flex items-center gap-3 px-5 py-4 transition hover:bg-primary/5 animate-fade-up"
                      >
                        {/* Match number */}
                        <span className="w-10 shrink-0 text-center text-xs font-bold text-muted-foreground">
                          M{match.matchNumber}
                        </span>

                        {/* Team 1 */}
                        <span className={cn(
                          "flex-1 truncate font-heading text-base font-semibold",
                          filterTeam === match.team1Name ? "text-[#A67C00]" : "text-foreground",
                        )}>
                          {match.team1Name}
                        </span>

                        {/* VS */}
                        <span className="shrink-0 rounded bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                          VS
                        </span>

                        {/* Team 2 */}
                        <span className={cn(
                          "flex-1 truncate text-right font-heading text-base font-semibold",
                          filterTeam === match.team2Name ? "text-[#A67C00]" : "text-foreground",
                        )}>
                          {match.team2Name}
                        </span>

                        {/* Group badge (only in ALL view) */}
                        {filterGroup === "ALL" && (
                          <span className={cn("hidden shrink-0 rounded-md px-2 py-0.5 text-xs font-bold sm:block", c.badge)}>
                            {gid}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer count ── */}
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Showing {filtered.length} match{filtered.length !== 1 ? "es" : ""}
          {filterTeam ? ` for ${filterTeam}` : filterGroup !== "ALL" ? ` in Group ${filterGroup}` : ""}
        </p>

        {/* ── Pending groups notice ── */}
        {revealedGroupCount < GROUP_IDS.length && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {GROUP_IDS.length - revealedGroupCount} group{GROUP_IDS.length - revealedGroupCount !== 1 ? "s" : ""} pending reveal
          </p>
        )}

      </div>
    </section>
  );
};

export default MatchesSection;
