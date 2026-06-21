
/**
 * Matches Page — shows every stage of the tournament in one place:
 *   1. League Stage I   (30 matches, from the spinner schedule-snapshot)
 *   2. Super 12         (Group Stage II, from /tournament-stages/bracket)
 *   3. Quarter Finals
 *   4. Semi Finals
 *   5. Final
 *
 * League Stage I team names come from the schedule snapshot (unchanged from
 * before). Everything from Super 12 onward comes from the bracket endpoint,
 * which only returns team IDs, so we resolve names via a /teams lookup map —
 * same pattern already used in GroupsSection.tsx.
 *
 * IMPORTANT: Super 12 / QF / SF / Final sections only render once the
 * backend has actually generated/scheduled those matches. We never
 * fabricate placeholder "TBD vs TBD" cards — if a stage isn't scheduled
 * yet, its whole section is simply omitted from the page.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMatchScheduleSnapshotAsync, type MatchScheduleSnapshot } from '@/lib/matchScheduleStorage'
import { apiClient } from '@/api/client'
import { tournamentStagesApi } from '@/api/tournamentStages'
import SEO from '@/components/SEO'

const ALL_SLOTS = 'ABCDEFGHIJKLMNOPQRST'.split('')
const GROUPS: Record<number, string[]> = {
  1: ['A', 'B', 'C', 'D'],
  2: ['E', 'F', 'G', 'H'],
  3: ['I', 'J', 'K', 'L'],
  4: ['M', 'N', 'O', 'P'],
  5: ['Q', 'R', 'S', 'T'],
}

// Cosmetic display letters for the Super 12 groups, continuing on from the
// 5 league-stage groups (A–E). This matches the convention already used on
// the public Group page — based on array position, not the backend's
// internal "Group A/B/C/D" naming.
const SUPER12_DISPLAY_LETTERS = ['F', 'G', 'H', 'I']

// ─── Types ───────────────────────────────────────────────────────────────
interface TeamRef {
  id: string
  name: string
  short?: string
}

interface StageMatch {
  id: string
  match_number?: number
  team1_id?: string | null
  team2_id?: string | null
  winner_id?: string | null
  status?: string
  created_at?: string
}

interface Super12GroupBlock {
  group: { id: string; name: string }
  points: unknown[]
  matches: StageMatch[]
}

interface BracketData {
  super12_groups: Super12GroupBlock[]
  quarter_finals: StageMatch[]
  semi_finals: StageMatch[]
  final: StageMatch | null
}

// ─── Helpers ────────────────────────────────────────────────────────────
function generateLeagueMatches(snap: MatchScheduleSnapshot | null) {
  const matches: { matchNumber: number; group: number; team1: string; team2: string }[] = []
  let matchNum = 1
  for (let g = 1; g <= 5; g++) {
    const groupSlots = GROUPS[g]
    for (let i = 0; i < groupSlots.length; i++) {
      for (let j = i + 1; j < groupSlots.length; j++) {
        const idx1 = ALL_SLOTS.indexOf(groupSlots[i])
        const idx2 = ALL_SLOTS.indexOf(groupSlots[j])
        const team1 = snap?.slotToTeamName?.[idx1]?.trim() || `Team ${groupSlots[i]}`
        const team2 = snap?.slotToTeamName?.[idx2]?.trim() || `Team ${groupSlots[j]}`
        matches.push({ matchNumber: matchNum, group: g, team1, team2 })
        matchNum++
      }
    }
  }
  return matches
}

function unwrapList<T>(axiosData: unknown): T[] {
  if (axiosData == null) return []
  const d = axiosData as any
  if (Array.isArray(d)) return d as T[]
  if (Array.isArray(d.data)) return d.data as T[]
  return []
}

function unwrapObject<T>(axiosData: unknown): T | null {
  if (axiosData == null) return null
  const d = axiosData as any
  return (d.data !== undefined ? d.data : d) as T
}

// A match only counts as "scheduled" once both teams are actually assigned.
// This is what gates whether a stage/section/card is shown at all — we
// never render synthetic "TBD vs TBD" placeholders.
function isScheduled(m?: StageMatch | null): m is StageMatch {
  return !!m && !!m.team1_id && !!m.team2_id
}

// ── Schedule join helpers ───────────────────────────────────────────────────
// The seeded date/time lives in the `matches` table (GET /matches). The league
// cards here only know team *names*, and their match numbers are generated in
// group order (not the fixture-sheet order), so we join on the unordered team
// pair rather than the number. Names are normalised (lowercased, "BNI " prefix
// stripped) so "BNI Royals" and "Royals" match.
function normTeam(name?: string | null): string {
  return (name ?? '').trim().toLowerCase().replace(/^bni\s+/, '')
}
function pairKey(a?: string | null, b?: string | null): string {
  return [normTeam(a), normTeam(b)].sort().join(' :: ')
}
function formatIST(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// ─── Shared match-card UI (same gold pill style as League Stage I) ────────
function MatchCard({
  badge,
  team1,
  team2,
  dateTime,
}: {
  badge: string
  team1: string
  team2: string
  dateTime?: string | null
}) {
  return (
    <div className="rounded-xl border border-[rgba(166,124,0,0.35)] bg-[linear-gradient(160deg,rgba(240,232,208,0.95)_0%,rgba(240,192,64,0.5)_50%,rgba(166,124,0,0.35)_100%)] p-4 shadow-[0_4px_14px_rgba(28,22,0,0.12)] transition hover:shadow-[0_6px_20px_rgba(166,124,0,0.25)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded bg-[#A67C00] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          {badge}
        </span>
        {dateTime && (
          <span className="rounded bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7A5C00]">
            🕒 {dateTime}
          </span>
        )}
      </div>
      <div className="text-center">
        <span className="font-heading text-sm font-bold uppercase tracking-wide text-[#1A1200]">
          {team1}
        </span>
        <span className="mx-2 text-xs font-black text-[#A67C00]">VS</span>
        <span className="font-heading text-sm font-bold uppercase tracking-wide text-[#1A1200]">
          {team2}
        </span>
      </div>
    </div>
  )
}

function StageHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 mt-10 flex items-center gap-4">
      <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-[#A67C00] md:text-xl">
        {children}
      </h2>
      <div className="h-px flex-1 bg-[rgba(166,124,0,0.3)]" />
    </div>
  )
}

export default function MatchesPage() {
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState<MatchScheduleSnapshot | null>(null)
  const [teamMap, setTeamMap] = useState<Record<string, TeamRef>>({})
  const [bracket, setBracket] = useState<BracketData | null>(null)
  const [scheduleByPair, setScheduleByPair] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.allSettled([
      loadMatchScheduleSnapshotAsync(),
      apiClient.get('/teams'),
      tournamentStagesApi.getBracket(),
      apiClient.get('/matches', { params: { page_size: 100 } }),
    ]).then(([snapRes, teamsRes, bracketRes, matchesRes]) => {
      if (cancelled) return

      if (snapRes.status === 'fulfilled' && snapRes.value) {
        setSnapshot(snapRes.value)
      }

      if (teamsRes.status === 'fulfilled') {
        const list = unwrapList<TeamRef>(teamsRes.value.data)
        setTeamMap(Object.fromEntries(list.map((t) => [t.id, t])))
      }

      if (bracketRes.status === 'fulfilled') {
        const b = unwrapObject<BracketData>(bracketRes.value.data)
        setBracket(b)
      }

      // Seeded league fixtures (teams + match_date) → pair-keyed date lookup
      if (matchesRes.status === 'fulfilled') {
        const rows = unwrapList<{ team1?: { name?: string }; team2?: { name?: string }; match_date?: string | null }>(matchesRes.value.data)
        const map: Record<string, string | null> = {}
        for (const r of rows) {
          if (r.team1?.name && r.team2?.name) {
            map[pairKey(r.team1.name, r.team2.name)] = r.match_date ?? null
          }
        }
        setScheduleByPair(map)
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  const resolveTeamName = (id?: string | null) =>
    id && teamMap[id] ? teamMap[id].name : 'TBD'

  // Date/time for a card, joined by the unordered team-name pair.
  const dtFor = (a?: string | null, b?: string | null) =>
    formatIST(scheduleByPair[pairKey(a, b)])

  // ── League Stage I (unchanged from before) ──────────────────────────────
  const leagueMatches = generateLeagueMatches(snapshot)
  const leagueColumns: typeof leagueMatches[] = [[], [], [], [], []]
  leagueMatches.forEach((m) => { leagueColumns[m.group - 1].push(m) })

  // ── Super 12 — numbered match badges continue on from League Stage I ───
  // Only groups that actually have scheduled matches get shown, and within
  // each group only the scheduled matches themselves are listed.
  const super12Groups = bracket?.super12_groups ?? []
  let runningMatchNumber = leagueMatches.length + 1
  const super12Display = super12Groups
    .map((sg, gIdx) => {
      const letter = SUPER12_DISPLAY_LETTERS[gIdx] ?? String.fromCharCode(70 + gIdx)
      const sortedMatches = [...sg.matches]
        .filter(isScheduled)
        .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
      const numbered = sortedMatches.map((m) => ({ match: m, number: runningMatchNumber++ }))
      return { id: sg.group.id, letter, numbered }
    })
    .filter((sg) => sg.numbered.length > 0)

  // ── Quarter Finals / Semi Finals / Final ────────────────────────────────
  // Only real, scheduled matches are kept — no synthetic TBD placeholders.
  const qfDisplay = (bracket?.quarter_finals ?? []).filter(isScheduled)
  const sfDisplay = (bracket?.semi_finals ?? []).filter(isScheduled)
  const finalDisplay = isScheduled(bracket?.final) ? bracket!.final : null

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FFFDF5] px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(166,124,0,0.3)] border-t-[#A67C00]" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFFDF5] px-2 py-6 sm:px-4">
      <SEO
        title="Matches"
        description="BNI Cricket Tournament — League Stage, Super 12, Quarter Finals, Semi Finals and Final matches."
      />

      <div className="mx-auto max-w-7xl">
        {/* Back + Title */}
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(166,124,0,0.3)] bg-white shadow-sm hover:bg-[rgba(240,192,64,0.1)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#A67C00]"><path d="M19 12H5m7-7-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wide text-[#1A1200] md:text-4xl">
            Matches
          </h1>
        </div>

        {/* ── League Stage I ──────────────────────────────────────────── */}
        <StageHeading>League Stage I</StageHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {leagueColumns.map((col, colIdx) => (
            <div key={colIdx} className="space-y-3">
              {col.map((match) => (
                <MatchCard
                  key={match.matchNumber}
                  badge={`Match ${match.matchNumber}`}
                  team1={match.team1}
                  team2={match.team2}
                  dateTime={dtFor(match.team1, match.team2)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* ── Super 12 — Group Stage II ───────────────────────────────── */}
        {/* Whole section is omitted until at least one match is scheduled */}
        {super12Display.length > 0 && (
          <>
            <StageHeading>Super 12 — Group Stage II</StageHeading>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {super12Display.map((sg) => (
                <div key={sg.id} className="space-y-3">
                  {/* <h3 className="text-center text-xs font-bold uppercase tracking-widest text-[#A67C00]">
                    Group {sg.letter}
                  </h3> */}
                  {sg.numbered.map(({ match, number }) => (
                    <MatchCard
                      key={match.id}
                      badge={`Match ${number}`}
                      team1={resolveTeamName(match.team1_id)}
                      team2={resolveTeamName(match.team2_id)}
                      dateTime={dtFor(resolveTeamName(match.team1_id), resolveTeamName(match.team2_id))}
                    />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Quarter Finals ──────────────────────────────────────────── */}
        {/* Whole section is omitted until at least one QF is scheduled */}
        {qfDisplay.length > 0 && (
          <>
            <StageHeading>Quarter Finals</StageHeading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {qfDisplay.map((m) => (
                <MatchCard
                  key={m.id}
                  badge={`QF ${m.match_number ?? ''}`}
                  team1={resolveTeamName(m.team1_id)}
                  team2={resolveTeamName(m.team2_id)}
                  dateTime={dtFor(resolveTeamName(m.team1_id), resolveTeamName(m.team2_id))}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Semi Finals ──────────────────────────────────────────────── */}
        {/* Whole section is omitted until at least one SF is scheduled */}
        {sfDisplay.length > 0 && (
          <>
            <StageHeading>Semi Finals</StageHeading>
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
              {sfDisplay.map((m) => (
                <MatchCard
                  key={m.id}
                  badge={`SF ${m.match_number ?? ''}`}
                  team1={resolveTeamName(m.team1_id)}
                  team2={resolveTeamName(m.team2_id)}
                  dateTime={dtFor(resolveTeamName(m.team1_id), resolveTeamName(m.team2_id))}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Final ────────────────────────────────────────────────────── */}
        {/* Section is omitted until the final is actually scheduled */}
        {finalDisplay && (
          <>
            <StageHeading>Final</StageHeading>
            <div className="mx-auto max-w-md pb-10">
              <MatchCard
                badge="Final"
                team1={resolveTeamName(finalDisplay.team1_id)}
                team2={resolveTeamName(finalDisplay.team2_id)}
                dateTime={dtFor(resolveTeamName(finalDisplay.team1_id), resolveTeamName(finalDisplay.team2_id))}
              />
            </div>
          </>
        )}
      </div>
    </main>
  )
}