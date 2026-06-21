import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchesApi, teamsApi } from '@/api/services'
import { Spinner, EmptyState } from '@/components/common'
import { getMatchStatusBadge, formatDateTime } from '@/utils'
import toast from 'react-hot-toast'
import type { Match } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface XIState {
  matchId: string
  teamId: string
  teamName: string
  otherTeamId: string
  otherTeamName: string
}

interface ResetState {
  matchId: string
  matchLabel: string
  to: 'toss' | 'upcoming'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SAMatchesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  // filter
  const [statusFilter, setStatusFilter] = useState('')

  // toss modal
  const [tossMatchId, setTossMatchId] = useState<string | null>(null)
  const [tossWinner, setTossWinner] = useState('')
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat')

  // playing XI modal
  const [xiState, setXIState] = useState<XIState | null>(null)
  const [team1XI, setTeam1XI] = useState<number[]>([])
  const [team2XI, setTeam2XI] = useState<number[]>([])
  const [xiSelectingTeam, setXISelectingTeam] = useState<'team1' | 'team2'>('team1')
  const [xiSaving, setXISaving] = useState(false)

  // reset confirmation modal
  const [resetState, setResetState] = useState<ResetState | null>(null)
  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['sa-matches-list', statusFilter],
    queryFn: () => matchesApi.list({ status: statusFilter || undefined, page_size: 100 } as any),
  })

  // Players for XI modal — load both teams when modal opens
  const { data: xiTeam1Players = [], isLoading: xiT1Loading } = useQuery({
    queryKey: ['xi-players', xiState?.teamId],
    queryFn: () => teamsApi.getPlayers(xiState!.teamId),
    enabled: !!xiState?.teamId,
  })
  const { data: xiTeam2Players = [], isLoading: xiT2Loading } = useQuery({
    queryKey: ['xi-players', xiState?.otherTeamId],
    queryFn: () => teamsApi.getPlayers(xiState!.otherTeamId),
    enabled: !!xiState?.otherTeamId,
  })

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const recordToss = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { toss_winner_id: string; toss_decision: string } }) =>
      matchesApi.recordToss(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sa-matches-list'] })
      toast.success('Toss recorded!')
      setTossMatchId(null)
      // Open playing XI setup for this match
      const m = (matches as Match[]).find(x => String(x.id) === vars.id)
      if (m) openXIModal(m)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? 'Failed to record toss'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    },
  })

  const startInnings = useMutation({
    mutationFn: (id: string) => matchesApi.startInnings(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['sa-matches-list'] })
      toast.success('Match is now LIVE!')
      navigate(`/scoring/matches/${id}/live`)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? 'Failed to start innings'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    },
  })

  const resetMatch = useMutation({
    mutationFn: ({ id, to }: { id: string; to: 'toss' | 'upcoming' }) =>
      matchesApi.reset(id, to),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sa-matches-list'] })
      toast.success(`Match reset to '${vars.to}' state.`)
      setResetState(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? 'Reset failed'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    },
  })

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const isUpcoming = (status: string) =>
    status === 'UPCOMING' || status === 'upcoming' || status === 'scheduled'

  const openXIModal = (m: Match) => {
    setTeam1XI([])
    setTeam2XI([])
    setXISelectingTeam('team1')
    setXIState({
      matchId: String(m.id),
      teamId: String(m.team1_id),
      teamName: m.team1?.name ?? 'Team 1',
      otherTeamId: String(m.team2_id),
      otherTeamName: m.team2?.name ?? 'Team 2',
    })
  }

  const handleSaveXIAndStart = async () => {
    if (!xiState) return
    setXISaving(true)
    try {
      // Save Playing XI (best-effort — don't block start if team has no players)
      if (team1XI.length === 11) {
        await matchesApi.setPlayingXI(xiState.matchId, {
          team_id: xiState.teamId,
          player_ids: team1XI,
        })
      }
      if (team2XI.length === 11) {
        await matchesApi.setPlayingXI(xiState.matchId, {
          team_id: xiState.otherTeamId,
          player_ids: team2XI,
        })
      }
    } catch {
      // non-fatal — continue to start innings
    }
    setXIState(null)
    startInnings.mutate(xiState.matchId)
    setXISaving(false)
  }

  const playerLabel = (p: any) =>
    p.full_name || p.username || `Player #${p.id}`

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Matches</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage and score all matches</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
            <option value="">All Status</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="scheduled">Scheduled</option>
            <option value="toss">Toss</option>
            <option value="live">Live</option>
            <option value="innings_break">Innings Break</option>
            <option value="completed">Completed</option>
          </select>
          <Link to="/scoring/matches/create"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-primary-700">
            + New Match
          </Link>
        </div>
      </div>

      {/* Flow hint for upcoming matches */}
      {(matches as Match[]).some(m => isUpcoming(m.status)) && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span className="font-semibold">To start an upcoming match:</span>{' '}
          🪙 Record Toss → 👥 Set Playing XI → ▶ Start Match → Live Scoring
        </div>
      )}

      {/* Match list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (matches as Match[]).length === 0 ? (
        <EmptyState icon="🏏" title="No matches found" description="Create a match or generate fixtures from a tournament"
          action={<Link to="/scoring/matches/create" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">Create Match</Link>} />
      ) : (
        <div className="space-y-2">
          {(matches as Match[]).map(m => {
            const s = getMatchStatusBadge(m.status)
            const isLive = (m.status as string) === 'live' || (m.status as string) === 'LIVE'
            const canStart = m.status === 'toss' || m.status === 'innings_break'
            const upcoming = isUpcoming(m.status as string)
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 transition-colors">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : upcoming ? 'bg-amber-400' : 'bg-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">
                    {m.team1?.name ?? `Team ${m.team1_id}`}
                    <span className="text-slate-500 font-normal mx-2">vs</span>
                    {m.team2?.name ?? `Team ${m.team2_id}`}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                    <span className={`font-semibold text-slate-900 px-1.5 py-0.5 rounded text-[10px] ${s.color}`}>{s.label}</span>
                    {m.overs && <span>{m.overs} ov</span>}
                    {m.venue && <span>📍 {m.venue}</span>}
                    {(m.match_date ?? (m as any).scheduled_at) && (
                      <span>📅 {formatDateTime(m.match_date ?? (m as any).scheduled_at)}</span>
                    )}
                    {m.match_number && <span>Match #{m.match_number}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link to={`/match/${m.id}`}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                    Details
                  </Link>

                  {/* Step 1: Toss — for upcoming/scheduled matches */}
                  {upcoming && (
                    <button
                      onClick={() => {
                        setTossMatchId(String(m.id))
                        setTossWinner(String(m.team1_id))
                        setTossDecision('bat')
                      }}
                      className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600">
                      🪙 Toss
                    </button>
                  )}

                  {/* After toss: set playing XI */}
                  {m.status === 'toss' && (
                    <button
                      onClick={() => openXIModal(m)}
                      className="rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-600">
                      👥 Set XI
                    </button>
                  )}

                  {/* Step 2: Start innings (after toss) */}
                  {canStart && (
                    <button
                      onClick={() => startInnings.mutate(String(m.id))}
                      disabled={startInnings.isPending}
                      className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-700">
                      {startInnings.isPending ? <Spinner size="sm" /> : '▶ Start'}
                    </button>
                  )}

                  {/* Live: score the match */}
                  {isLive && (
                    <Link
                      to={`/scoring/matches/${m.id}/live`}
                      className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Score
                    </Link>
                  )}

                  {/* Reset button — shown for non-upcoming matches (testing helper) */}
                  {!upcoming && (
                    <button
                      onClick={() => setResetState({
                        matchId: String(m.id),
                        matchLabel: `${m.team1?.name ?? 'Team 1'} vs ${m.team2?.name ?? 'Team 2'}`,
                        to: m.status === 'toss' ? 'toss' : 'toss',
                      })}
                      className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                      title="Reset match state (testing)">
                      ↺ Reset
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Toss Modal ────────────────────────────────────────────────────────── */}
      {tossMatchId && (() => {
        const m = (matches as Match[]).find(x => String(x.id) === tossMatchId)
        if (!m) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-1">🪙 Record Toss</h3>
              <p className="text-sm text-slate-500 mb-5">
                {m.team1?.name} vs {m.team2?.name}
              </p>

              <label className="block text-sm font-semibold text-slate-700 mb-2">Toss Won By</label>
              <select
                value={tossWinner}
                onChange={e => setTossWinner(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm mb-5">
                <option value={String(m.team1_id)}>{m.team1?.name || 'Team 1'}</option>
                <option value={String(m.team2_id)}>{m.team2?.name || 'Team 2'}</option>
              </select>

              <label className="block text-sm font-semibold text-slate-700 mb-2">Elected to</label>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setTossDecision('bat')}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition ${
                    tossDecision === 'bat'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-300 text-slate-600 hover:border-amber-300'
                  }`}>
                  🏏 Bat
                </button>
                <button
                  onClick={() => setTossDecision('bowl')}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition ${
                    tossDecision === 'bowl'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-300 text-slate-600 hover:border-amber-300'
                  }`}>
                  🎳 Bowl
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setTossMatchId(null)}
                  className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  onClick={() =>
                    recordToss.mutate({
                      id: tossMatchId,
                      data: { toss_winner_id: tossWinner, toss_decision: tossDecision },
                    })
                  }
                  disabled={recordToss.isPending}
                  className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60">
                  {recordToss.isPending ? 'Saving…' : '🪙 Confirm Toss'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Playing XI Modal ──────────────────────────────────────────────────── */}
      {xiState && (() => {
        const currentTeamIsTeam1 = xiSelectingTeam === 'team1'
        const players: any[] = currentTeamIsTeam1 ? xiTeam1Players : xiTeam2Players
        const loading = currentTeamIsTeam1 ? xiT1Loading : xiT2Loading
        const xi = currentTeamIsTeam1 ? team1XI : team2XI
        const setXI = currentTeamIsTeam1 ? setTeam1XI : setTeam2XI
        const teamName = currentTeamIsTeam1 ? xiState.teamName : xiState.otherTeamName

        const sorted = [...players].sort((a, b) => {
          const na = a.jersey_number ?? Infinity
          const nb = b.jersey_number ?? Infinity
          return na - nb
        })

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
              <h3 className="text-lg font-bold text-slate-900 mb-1">👥 Set Playing XI</h3>
              <p className="text-xs text-slate-500 mb-4">
                Select 11 players for each team. This step is optional — you can skip and set it later.
              </p>

              {/* Team toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1 mb-4 shrink-0">
                <button
                  onClick={() => setXISelectingTeam('team1')}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                    xiSelectingTeam === 'team1' ? 'bg-white shadow text-blue-700' : 'text-slate-500'
                  }`}>
                  {xiState.teamName}
                  <span className={`ml-1 text-xs ${team1XI.length === 11 ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                    ({team1XI.length}/11)
                  </span>
                </button>
                <button
                  onClick={() => setXISelectingTeam('team2')}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                    xiSelectingTeam === 'team2' ? 'bg-white shadow text-blue-700' : 'text-slate-500'
                  }`}>
                  {xiState.otherTeamName}
                  <span className={`ml-1 text-xs ${team2XI.length === 11 ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                    ({team2XI.length}/11)
                  </span>
                </button>
              </div>

              {/* Player list */}
              <div className="flex-1 overflow-y-auto mb-4 min-h-0">
                {loading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : sorted.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    No players found for {teamName}.<br />
                    <span className="text-xs">You can skip this and add players later.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {sorted.map((p: any) => {
                      const isSelected = xi.includes(p.id)
                      const isFull = xi.length >= 11
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-400 bg-blue-50 shadow-sm'
                              : isFull
                              ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
                              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                          }`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isSelected && isFull}
                            onChange={e => {
                              if (e.target.checked) setXI(prev => [...prev, p.id])
                              else setXI(prev => prev.filter(id => id !== p.id))
                            }}
                            className="h-4 w-4 accent-blue-600 shrink-0"
                          />
                          <div className="w-8 text-center">
                            <span className="text-xs text-slate-400 font-semibold">
                              {p.jersey_number != null ? `#${p.jersey_number}` : '—'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {playerLabel(p)}
                            </div>
                            <div className="text-xs text-slate-400">{p.player_role || 'Player'}</div>
                          </div>
                          {isSelected && (
                            <svg className="h-4 w-4 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => {
                    setXIState(null)
                    // Still start innings even if XI skipped
                    startInnings.mutate(xiState.matchId)
                  }}
                  className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Skip & Start
                </button>
                <button
                  onClick={handleSaveXIAndStart}
                  disabled={xiSaving || startInnings.isPending}
                  className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60">
                  {xiSaving || startInnings.isPending ? <Spinner size="sm" /> : '▶ Save XI & Start Match'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
      {/* ── Reset Confirmation Modal ──────────────────────────────────────────── */}
      {resetState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Match</h3>
                <p className="text-sm text-slate-500 mt-0.5">{resetState.matchLabel}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-5">
              This will <span className="font-semibold text-red-600">delete all innings, balls, and scores</span> for this match. Choose how far back to reset:
            </p>

            {/* Reset target selector */}
            <div className="space-y-2 mb-6">
              <button
                onClick={() => setResetState(s => s ? { ...s, to: 'toss' } : s)}
                className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm transition ${
                  resetState.to === 'toss'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-amber-300'
                }`}>
                <div className="font-semibold text-slate-900">🪙 Back to Toss</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Keeps toss result. Deletes innings &amp; scores. Status → toss.
                </div>
              </button>
              <button
                onClick={() => setResetState(s => s ? { ...s, to: 'upcoming' } : s)}
                className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm transition ${
                  resetState.to === 'upcoming'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}>
                <div className="font-semibold text-slate-900">📋 Full Reset to Upcoming</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Clears toss, innings &amp; scores. Status → upcoming.
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setResetState(null)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => resetMatch.mutate({ id: resetState.matchId, to: resetState.to })}
                disabled={resetMatch.isPending}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {resetMatch.isPending ? <Spinner size="sm" /> : '↺ Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
