
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/api/client";
import { tournamentStagesApi } from "@/api/tournamentStages";
import {
  loadMatchScheduleSnapshotAsync,
  type MatchScheduleSnapshot,
} from "@/lib/matchScheduleStorage";
import { TEAM_DEFS } from "@/data/teamSquads";

// ─── Constants ─────────────────────────────────────────────────────────────
const LEAGUE_GROUP_LETTERS = ["A", "B", "C", "D", "E"];
const TEAMS_PER_GROUP = 4;

// Display letters for the Super 12 stage. These are purely cosmetic labels
// assigned by ARRAY POSITION (index 0 -> "F", index 1 -> "G", ...). They do
// NOT come from the backend's internal group name/id, and they never cause
// any reordering — whatever order the backend returns groups/teams in is
// the order rendered. Extra entries included as a safety margin in case the
// backend ever adds more groups than expected.
const SUPER12_DISPLAY_LETTERS = ["F", "G", "H", "I", "J", "K", "L", "M"];

function super12DisplayLetter(idx: number): string {
  return SUPER12_DISPLAY_LETTERS[idx] ?? String.fromCharCode(70 + idx); // 70 = "F"
}

// Static Super 12 structure shown BEFORE backend generates the data.
// Slot descriptions match the backend group_defs exactly (G1W, G5W, etc.)
// with friendly "Slot N" labels on the left and the qualifier code on the
// right. The "letter" below is just the display label (F/G/H/I) — order of
// this array is the order shown, top to bottom, left to right.
const SUPER12_STATIC: {
  letter: string;
  color: string;
  slots: { label: string; qualifier: string }[];
}[] = [
  {
    letter: super12DisplayLetter(0), // "F"
    color: "bg-emerald-500",
    slots: [
      { label: "Slot 1", qualifier: "A1" },
      { label: "Slot 2", qualifier: "E1" },
      { label: "Slot 3", qualifier: "D2" },
    ],
  },
  {
    letter: super12DisplayLetter(1), // "G"
    color: "bg-emerald-500",
    slots: [
      { label: "Slot 1", qualifier: "B1" },
      { label: "Slot 2", qualifier: "A2" },
      { label: "Slot 3", qualifier: "E2" },
    ],
  },
  {
    letter: super12DisplayLetter(2), // "H"
    color: "bg-emerald-500",
    slots: [
      { label: "Slot 1", qualifier: "C1" },
      { label: "Slot 2", qualifier: "B2" },
      { label: "Slot 3", qualifier: "TBD" },
    ],
  },
  {
    letter: super12DisplayLetter(3), // "I"
    color: "bg-emerald-500",
    slots: [
      { label: "Slot 1", qualifier: "D1" },
      { label: "Slot 2", qualifier: "C2" },
      { label: "Slot 3", qualifier: "TBD" },
    ],
  },
];

// ─── Types ─────────────────────────────────────────────────────────────────
interface TeamRef {
  id: string;
  name: string;
  short?: string;
}

interface LeagueGroup {
  letter: string;
  teams: string[];
}

interface Super12GroupEntry {
  group: { id: string; name: string };
  teams: {
    id: string;
    group_id: string;
    team_id: string;
    slot_label?: string;
    is_wildcard?: boolean;
  }[];
  points: unknown[];
  matches: unknown[];
}

interface KOMatch {
  id: string;
  slot_label?: string;
  team1_id?: string | null;
  team2_id?: string | null;
  winner_id?: string | null;
  status: string;
}

interface FinalMatch {
  id: string;
  team1_id?: string | null;
  team2_id?: string | null;
  winner_id?: string | null;
  status: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function buildLeagueGroups(snap: MatchScheduleSnapshot | null): LeagueGroup[] {
  return LEAGUE_GROUP_LETTERS.map((letter, gIdx) => {
    const start = gIdx * TEAMS_PER_GROUP;
    const teams = Array.from({ length: TEAMS_PER_GROUP }, (_, i) => {
      const slotIdx = start + i;
      const fromSnap = snap?.slotToTeamName?.[slotIdx]?.trim();
      if (fromSnap) return fromSnap;
      return TEAM_DEFS[slotIdx]?.name ?? `Team ${letter}${i + 1}`;
    });
    return { letter, teams };
  });
}

function unwrapList<T>(axiosData: unknown): T[] {
  if (axiosData == null) return [];
  const d = axiosData as any;
  if (Array.isArray(d)) return d as T[];
  if (Array.isArray(d.data)) return d.data as T[];
  return [];
}

// ─── Sub-components ────────────────────────────────────────────────────────
function SectionDivider({
  label,
  color,
}: {
  label: string;
  color: "amber" | "emerald" | "red";
}) {
  const lineClass = {
    amber: "bg-amber-300",
    emerald: "bg-emerald-300",
    red: "bg-red-300",
  }[color];
  const textClass = {
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    red: "text-red-600",
  }[color];
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`h-px flex-1 ${lineClass}`} />
      <h2 className={`text-sm font-bold uppercase tracking-widest whitespace-nowrap ${textClass}`}>
        {label}
      </h2>
      <div className={`h-px flex-1 ${lineClass}`} />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#e2d5c0] rounded-2xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SlotRow({
  left,
  right,
  highlight = false,
}: {
  left: string;
  right: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center px-3 py-2 rounded-lg ${
        highlight
          ? "bg-emerald-50 border border-emerald-100"
          : "bg-[#f0fdf4] border border-[#bbf7d0]"
      }`}
    >
      <span className="text-emerald-600 font-medium text-xs">{left}</span>
      <span className="text-[#1a0a14] font-bold text-xs">{right}</span>
    </div>
  );
}

function MatchPill({
  label,
  left,
  right,
}: {
  label?: string;
  left: string;
  right: string;
}) {
  return (
    <div className="bg-[#fdf6ec] border border-[#e2d5c0] rounded-xl px-4 py-3 text-center">
      {label && (
        <p className="text-[10px] text-[#1a0a14]/45 uppercase tracking-widest mb-1">{label}</p>
      )}
      <p className="text-sm font-bold text-[#1a0a14]">
        <span>{left}</span>
        <span className="text-amber-500 font-black mx-1.5">vs</span>
        <span>{right}</span>
      </p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#1a0a14]/60 font-medium text-sm">Loading tournament…</p>
      </div>
    </div>
  );
}

// ─── Super 12 — Static placeholder (before generation) ────────────────────
function Super12Static() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {SUPER12_STATIC.map((g) => (
        <Card key={g.letter}>
          <h3 className="font-bold text-[#1a0a14] text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full ${g.color} text-white text-xs flex items-center justify-center font-black shrink-0`}
            >
              {g.letter}
            </span>
            Group {g.letter}
          </h3>
          <div className="space-y-2">
            {g.slots.map((slot) => (
              <SlotRow key={slot.qualifier} left={slot.label} right={slot.qualifier} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Super 12 — Live data (after generation) ──────────────────────────────
// IMPORTANT: groups are rendered in the exact order the backend returns them
// (no sorting). The display letter (F/G/H/I...) comes from the array index,
// not from sg.group.name/id — so renaming/reordering on the backend never
// silently changes what's shown here. Likewise sg.teams is mapped in the
// exact order received; it is never re-sorted.
function Super12Live({
  groups,
  teamName,
}: {
  groups: Super12GroupEntry[];
  teamName: (id?: string | null) => string;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {groups.map((sg, idx) => {
        const letter = super12DisplayLetter(idx);
        return (
          <Card key={sg.group.id}>
            <h3 className="font-bold text-[#1a0a14] text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-black shrink-0">
                {letter}
              </span>
              Group {letter}
            </h3>
            <div className="space-y-2">
              {sg.teams.length === 0 ? (
                <p className="text-xs text-[#1a0a14]/40 text-center py-2">Teams TBD</p>
              ) : (
                sg.teams.map((slot, i) => (
                  <SlotRow
                    key={slot.id}
                    left={`Slot ${i + 1}`}
                    right={teamName(slot.team_id)}
                    highlight
                  />
                ))
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
const GroupsSection = () => {
  const navigate = useNavigate();

  const [leagueGroups, setLeagueGroups]   = useState<LeagueGroup[]>([]);
  const [super12Groups, setSuper12Groups] = useState<Super12GroupEntry[]>([]);
  const [super12Ready, setSuper12Ready]   = useState(false); // true = backend has generated data
  const [teamMap, setTeamMap]             = useState<Record<string, TeamRef>>({});
  const [qfMatches, setQfMatches]         = useState<KOMatch[]>([]);
  const [sfMatches, setSfMatches]         = useState<KOMatch[]>([]);
  const [finalMatch, setFinalMatch]       = useState<FinalMatch | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Stage I — snapshot is source of truth for league team names
      const snap = await loadMatchScheduleSnapshotAsync().catch(() => null);
      setLeagueGroups(buildLeagueGroups(snap));

      // All other calls in parallel
      const [teamsRes, super12Res, qfRes, sfRes, finalRes] = await Promise.allSettled([
        apiClient.get("/teams"),
        tournamentStagesApi.getSuper12Groups(),
        tournamentStagesApi.getQFMatches(),
        tournamentStagesApi.getSFMatches(),
        tournamentStagesApi.getFinal(),
      ]);

      // Teams map id → TeamRef
      if (teamsRes.status === "fulfilled") {
        const list = unwrapList<TeamRef>(teamsRes.value.data);
        setTeamMap(Object.fromEntries(list.map((t) => [t.id, t])));
      }

      // Super 12 — show static placeholder if empty / API failed.
      // NOTE: list is stored exactly as returned — no sorting/reordering.
      if (super12Res.status === "fulfilled") {
        const list = unwrapList<Super12GroupEntry>(super12Res.value.data);
        if (list.length > 0) {
          setSuper12Groups(list);
          setSuper12Ready(true);
        } else {
          setSuper12Ready(false);
        }
      } else {
        // API error (e.g. 404 before generation) → show static placeholder
        setSuper12Ready(false);
      }

      // QF
      if (qfRes.status === "fulfilled") {
        setQfMatches(unwrapList<KOMatch>(qfRes.value.data));
      }

      // SF
      if (sfRes.status === "fulfilled") {
        setSfMatches(unwrapList<KOMatch>(sfRes.value.data));
      }

      // Final — single object unwrap
      if (finalRes.status === "fulfilled") {
        const raw = finalRes.value.data as any;
        const f =
          raw?.data !== undefined
            ? Array.isArray(raw.data)
              ? raw.data[0] ?? null
              : raw.data
            : Array.isArray(raw)
            ? raw[0] ?? null
            : raw ?? null;
        setFinalMatch(f);
      }
    } catch {
      setError("Failed to load tournament data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Full name lookup — used in Super 12 live view
  const resolveTeamName = (id?: string | null) =>
    id && teamMap[id] ? teamMap[id].name : "TBD";

  // Number of placeholder pills to show for Quarter Finals before matches exist
  const QF_PLACEHOLDER_COUNT = 4;

  return (
    <section
      id="groups"
      className="min-h-screen text-[#1a0a14]"
      style={{
        background: "linear-gradient(160deg, #fdf6ec 0%, #f5e8cc 60%, #fdf6ec 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="text-center">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border bg-amber-100 text-amber-800 border-amber-300 mb-3">
            Tournament Structure
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-[#1a0a14] tracking-tight">
            Groups
          </h1>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 font-medium mb-3">{error}</p>
            <button
              onClick={loadAll}
              className="px-5 py-2 rounded-lg bg-amber-400 text-white font-bold text-sm hover:bg-amber-500 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* ── Stage I — League ──────────────────────────────────── */}
            <section>
              <SectionDivider label="Group Stage I — League" color="amber" />
              <Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                  {leagueGroups.map((g) => (
                    <div key={g.letter}>
                      <h3 className="font-black text-sm uppercase tracking-wider mb-3 text-center text-[#1a0a14]">
                        Group {g.letter}
                      </h3>
                      <div className="space-y-2">
                        {g.teams.map((name, i) => (
                          <div
                            key={i}
                            className="bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl text-center"
                          >
                            <span className="text-xs font-medium text-[#1a0a14]">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* ── Stage II — Super 12 ───────────────────────────────── */}
            <section>
              <SectionDivider label="Group Stage II — Super 12" color="emerald" />

              {/* Badge showing current state */}
              {!super12Ready && (
                <p className="text-center text-xs text-emerald-600 font-medium mb-4 opacity-70">
                  ⏳ Super 12 not yet generated — showing expected group structure
                </p>
              )}

              {super12Ready ? (
                <Super12Live groups={super12Groups} teamName={resolveTeamName} />
              ) : (
                <Super12Static />
              )}
            </section>

            {/* ── Knockout Stages ───────────────────────────────────── */}
            <section>
              <SectionDivider label="Knockout Stages" color="red" />

              {/* Quarter Finals */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-[#1a0a14]/55 uppercase tracking-widest mb-3">
                  Quarter Finals
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {qfMatches.length > 0
                    ? qfMatches.map((m) => {
                        const team1 = resolveTeamName(m.team1_id);
                        const team2 = resolveTeamName(m.team2_id);
                        return (
                          <MatchPill
                            key={m.id}
                            // No qualifier-code label (e.g. "A1 vs D2") shown — just the
                            // full team names below.
                            left={team1}
                            right={team2}
                          />
                        );
                      })
                    : Array.from({ length: QF_PLACEHOLDER_COUNT }, (_, i) => (
                        <MatchPill key={i} left="TBD" right="TBD" />
                      ))}
                </div>
              </div>

              {/* Semi Finals */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-[#1a0a14]/55 uppercase tracking-widest mb-3">
                  Semi Finals
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(sfMatches.length > 0
                    ? sfMatches
                    : ([
                        { id: "sf1", team1_id: null, team2_id: null, status: "pending" },
                        { id: "sf2", team1_id: null, team2_id: null, status: "pending" },
                      ] as KOMatch[])
                  ).map((m, i) => (
                    <MatchPill
                      key={m.id ?? i}
                      left={resolveTeamName(m.team1_id)}
                      right={resolveTeamName(m.team2_id)}
                    />
                  ))}
                </div>
              </div>

              {/* Final */}
              <div>
                <h3 className="text-xs font-bold text-[#1a0a14]/55 uppercase tracking-widest mb-3">
                  Final
                </h3>
                <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-6 shadow-md text-center">
                  <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-amber-200/40 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-amber-300/30 blur-2xl pointer-events-none" />
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-2">
                    🏆 Grand Final
                  </p>
                  <p className="text-2xl font-black text-[#1a0a14]">
                    {finalMatch
                      ? `${resolveTeamName(finalMatch.team1_id)} vs ${resolveTeamName(finalMatch.team2_id)}`
                      : "TBD vs TBD"}
                  </p>
                  {finalMatch?.winner_id && (
                    <p className="mt-2 text-sm font-bold text-amber-600">
                      🥇 Winner: {resolveTeamName(finalMatch.winner_id)}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ── View Matches ──────────────────────────────────────── */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => navigate("/matches")}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-6 py-3 font-heading text-sm font-bold uppercase tracking-[0.08em] text-primary-foreground shadow-[0_6px_16px_rgba(var(--dark-surface-rgb),0.24)] transition hover:brightness-110"
              >
                <span>View Matches</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path
                    d="M5 12h14m-6-6 6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default GroupsSection;