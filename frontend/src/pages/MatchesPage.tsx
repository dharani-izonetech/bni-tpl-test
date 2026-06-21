import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { tournamentStagesApi } from '@/api/tournamentStages'
import SEO from '@/components/SEO'

// Cosmetic display letters for the Super 12 groups, continuing on from the
// 5 league-stage groups (A–E). This matches the convention already used on
// the public Group page — based on array position, not the backend's
// internal "Group A/B/C/D" naming.
const SUPER12_DISPLAY_LETTERS = ['F', 'G', 'H', 'I']

// ─── Types ───────────────────────────────────────────────────────────────
interface StageMatch {
  id: string
  match_number?: number
  team1_id?: string | null
  team2_id?: string | null
  winner_id?: string | null
  status?: string
  created_at?: string
  // Real fields returned by the backend (Super12MatchOut / QFMatchOut /
  // SFMatchOut / FinalMatchOut): a plain date string ("2026-07-05") and a
  // plain time string ("19:00:00"), kept separate rather than combined
  // into one ISO datetime.
  match_date?: string | null
  start_time?: string | null
}

interface TeamRef {
  id: string
  name: string
  short?: string
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

// League Stage I rows from GET /matches: a single ISO datetime field
// (MatchOut.match_date), with team1/team2 embedded as full objects.
interface LeagueMatchOut {
  id: string
  match_number?: number | null
  slot?: number | null
  team1?: { id: string; name?: string } | null
  team2?: { id: string; name?: string } | null
  match_date?: string | null
  match_type?: string | null
}

// ─── Helpers ────────────────────────────────────────────────────────────
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

// Splits an ISO datetime string (e.g. "2026-06-25T09:00:00+05:30") into the
// plain "YYYY-MM-DD" / "HH:MM:SS" shape the rest of this page already knows
// how to format (formatMatchDate / formatMatchTime below), rendered in IST
// so the date/time shown always matches the tournament's local time
// regardless of the viewer's own timezone.
function splitIsoDateTime(iso?: string | null): { date: string | null; time: string | null } {
  if (!iso) return { date: null, time: null }
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { date: null, time: null }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const time = `${get('hour')}:${get('minute')}:${get('second')}`
  return { date, time }
}

// Formats the backend's plain "YYYY-MM-DD" into "Jun 18, 2026". Returns
// null if there's no date — callers skip rendering the whole stub row.
// Parsed as local date components (not via raw `new Date(isoString)`) so a
// UTC-vs-local shift can never silently move the date back a day.
function formatMatchDate(matchDate?: string | null): string | null {
  if (!matchDate) return null
  const [y, m, d] = matchDate.split('-').map(Number)
  if (!y || !m || !d) return null
  const dateObj = new Date(y, m - 1, d)
  if (isNaN(dateObj.getTime())) return null
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Formats the backend's plain "HH:MM:SS" (24h) into "5:00 AM". Returns null
// if there's no time — the stub row then shows the date alone, full width.
function formatMatchTime(matchDate?: string | null, startTime?: string | null): string | null {
  if (!matchDate || !startTime) return null
  const [y, m, d] = matchDate.split('-').map(Number)
  const [hh, mm] = startTime.split(':').map(Number)
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null
  const timeObj = new Date(y, m - 1, d, hh, mm)
  if (isNaN(timeObj.getTime())) return null
  return timeObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── Shared match-card UI — "ticket stub" treatment ────────────────────────
// Badge sits up top like a gate number. Team matchup is the hero, large and
// centered. A dashed tear-line separates the matchup from a scoreboard-style
// footer: date on the left, time on the right, each with a small glyph.
function MatchCard({
  badge,
  team1,
  team2,
  matchDate,
  startTime,
}: {
  badge: string
  team1: string
  team2: string
  matchDate?: string | null
  startTime?: string | null
}) {
  const datePart = formatMatchDate(matchDate)
  const timePart = formatMatchTime(matchDate, startTime)

  return (
    <div className="rounded-xl border border-[rgba(166,124,0,0.35)] bg-[linear-gradient(160deg,rgba(240,232,208,0.95)_0%,rgba(240,192,64,0.5)_50%,rgba(166,124,0,0.35)_100%)] shadow-[0_4px_14px_rgba(28,22,0,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(166,124,0,0.28)]">
      <div className="p-4 pb-3">
        <span className="inline-block rounded bg-[#A67C00] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          {badge}
        </span>
        <div className="mt-3 flex flex-col items-center gap-1 text-center">
          <span className="font-heading text-sm font-bold uppercase tracking-wide text-[#1A1200] leading-tight">
            {team1}
          </span>
          <span className="text-[10px] font-black text-[#A67C00]">VS</span>
          <span className="font-heading text-sm font-bold uppercase tracking-wide text-[#1A1200] leading-tight">
            {team2}
          </span>
        </div>
      </div>

      {(datePart || timePart) && (
        <>
          {/* Tear line */}
          <div className="mx-4 border-t border-dashed border-[rgba(166,124,0,0.5)]" />
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7A5C00]">
              {datePart && (
                <>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#A67C00]">
                    <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 9h18M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {datePart}
                </>
              )}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7A5C00]">
              {timePart && (
                <>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#A67C00]">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {timePart}
                </>
              )}
            </span>
          </div>
        </>
      )}
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
  const [teamMap, setTeamMap] = useState<Record<string, TeamRef>>({})
  const [bracket, setBracket] = useState<BracketData | null>(null)
  const [leagueMatches, setLeagueMatches] = useState<LeagueMatchOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.allSettled([
      apiClient.get('/teams'),
      tournamentStagesApi.getBracket(),
      // League Stage I — teams + match_date both come from here. Whatever
      // date/time the admin saves on the "Manual Date / Time" screen shows
      // up here automatically, same as Super 12 / QF / SF / Final.
      apiClient.get('/matches', { params: { page_size: 100 } }),
    ]).then(([teamsRes, bracketRes, matchesRes]) => {
      if (cancelled) return

      if (teamsRes.status === 'fulfilled') {
        const list = unwrapList<TeamRef>(teamsRes.value.data)
        setTeamMap(Object.fromEntries(list.map((t) => [t.id, t])))
      }

      if (bracketRes.status === 'fulfilled') {
        const b = unwrapObject<BracketData>(bracketRes.value.data)
        setBracket(b)
      }

      if (matchesRes.status === 'fulfilled') {
        const rows = unwrapList<LeagueMatchOut>(matchesRes.value.data)
        const league = rows
          .filter((r) => !r.match_type || r.match_type === 'league')
          .sort((a, b) => (a.match_number ?? a.slot ?? 0) - (b.match_number ?? b.slot ?? 0))
        setLeagueMatches(league)
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  const resolveTeamName = (id?: string | null) =>
    id && teamMap[id] ? teamMap[id].name : 'TBD'

  // ── League Stage I — 5 columns of 6, in match_number order ─────────────
  // The fixture sheet lays out M1–M6 = Group 1, M7–M12 = Group 2, etc., so
  // splitting the match_number-sorted list into chunks of 6 reproduces the
  // same 5-column layout the page has always shown — just with real dates.
  const leagueColumns: LeagueMatchOut[][] = [[], [], [], [], []]
  leagueMatches.forEach((m, i) => {
    const col = Math.floor(i / 6)
    if (col < 5) leagueColumns[col].push(m)
  })

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
        {leagueMatches.length > 0 && (
          <>
            <StageHeading>League Stage I</StageHeading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {leagueColumns.map((col, colIdx) => (
                <div key={colIdx} className="space-y-3">
                  {col.map((match) => {
                    const sched = splitIsoDateTime(match.match_date)
                    return (
                      <MatchCard
                        key={match.id}
                        badge={`Match ${match.match_number ?? match.slot ?? ''}`}
                        team1={resolveTeamName(match.team1?.id)}
                        team2={resolveTeamName(match.team2?.id)}
                        matchDate={sched.date}
                        startTime={sched.time}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Super 12 — Group Stage II ───────────────────────────────── */}
        {/* Whole section is omitted until at least one match is scheduled */}
        {super12Display.length > 0 && (
          <>
            <StageHeading>Super 12 — Group Stage II</StageHeading>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {super12Display.map((sg) => (
                <div key={sg.id} className="space-y-3">
                  {sg.numbered.map(({ match, number }) => (
                    <MatchCard
                      key={match.id}
                      badge={`Match ${number}`}
                      team1={resolveTeamName(match.team1_id)}
                      team2={resolveTeamName(match.team2_id)}
                      matchDate={match.match_date}
                      startTime={match.start_time}
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
                  matchDate={m.match_date}
                  startTime={m.start_time}
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
                  matchDate={m.match_date}
                  startTime={m.start_time}
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
                matchDate={finalDisplay.match_date}
                startTime={finalDisplay.start_time}
              />
            </div>
          </>
        )}
      </div>
    </main>
  )
}