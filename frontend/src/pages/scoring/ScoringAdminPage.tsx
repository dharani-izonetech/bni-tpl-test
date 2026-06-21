/**
 * CricPro Scoring Admin — central hub for admins/scorers/organizers.
 * Tabs:
 *   1. Matches      — list all matches, start innings, go to live scoring
 *   2. Score Editor — manually edit batting/bowling figures for any innings
 *   3. Players      — view player profiles and career stats
 *   4. Tournaments  — quick links to manage tournaments
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchesApi, tournamentsApi, statsApi } from '@/api/services'
import { Spinner, EmptyState, TabBar, Badge, Modal, InputField, SelectField } from '@/components/common'
import { getMatchStatusBadge, formatDateTime, formatOvers } from '@/utils'
import { useAppSelector } from '@/hooks/redux'
import apiClient from '@/api/client'
import toast from 'react-hot-toast'
import type { Match, Tournament } from '@/types'

// ── Matches Tab ───────────────────────────────────────────────────────────────
function MatchesTab() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['admin-matches', statusFilter],
    queryFn: () => matchesApi.list({ status: statusFilter || undefined, page_size: 50 } as any),
  })

  const startInnings = useMutation({
    mutationFn: (id: string) => matchesApi.startInnings(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['admin-matches'] })
      toast.success('Innings started!')
      navigate(`/scoring/matches/${id}/live`)
    },
    onError: () => toast.error('Failed to start innings'),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">All Matches</h2>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-white">
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="toss">Toss</option>
            <option value="live">Live</option>
            <option value="innings_break">Innings Break</option>
            <option value="completed">Completed</option>
          </select>
          <Link to="/scoring/matches/create" className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
            + New Match
          </Link>
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        : matches.length === 0 ? <EmptyState icon="🏏" title="No matches found" description="Create a match to get started" />
        : (
          <div className="space-y-2">
            {matches.map((m: Match) => {
              const s = getMatchStatusBadge(m.status)
              const isLive = m.status === 'live'
              const canStart = m.status === 'toss' || m.status === 'innings_break'
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
                  {/* Status dot */}
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />

                  {/* Teams */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">
                      {m.team1?.name ?? `Team ${m.team1_id}`} <span className="text-slate-400 font-normal">vs</span> {m.team2?.name ?? `Team ${m.team2_id}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2">
                      <span className={`font-medium ${s.color} text-white px-1.5 py-0.5 rounded text-[10px]`}>{s.label}</span>
                      {m.overs && <span>{m.overs} ov</span>}
                      {m.venue && <span>📍 {m.venue}</span>}
                      {(m.match_date ?? m.scheduled_at) && <span>📅 {formatDateTime((m.match_date ?? m.scheduled_at))}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <Link to={`/match/${m.id}`}
                      className="rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700">
                      Details
                    </Link>
                    {isLive && (
                      <Link to={`/scoring/matches/${m.id}/live`}
                        className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Score
                      </Link>
                    )}
                    {canStart && (
                      <button onClick={() => startInnings.mutate(m.id)}
                        disabled={startInnings.isPending}
                        className="rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-primary-700">
                        {startInnings.isPending ? <Spinner size="sm" /> : '▶ Start'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}

// ── Score Editor Tab ──────────────────────────────────────────────────────────
function ScoreEditorTab() {
  const [matchId, setMatchId] = useState('')
  const [selectedInnings, setSelectedInnings] = useState<any>(null)
  const [editingBat, setEditingBat] = useState<any>(null)
  const [editingBowl, setEditingBowl] = useState<any>(null)
  const qc = useQueryClient()

  const { data: matches = [] } = useQuery({
    queryKey: ['admin-matches-all'],
    queryFn: () => matchesApi.list({ page_size: 100 } as any),
  })

  const { data: scorecard = [], isLoading: scLoading } = useQuery({
    queryKey: ['scorecard-admin', matchId],
    queryFn: () => matchesApi.getScorecard(matchId),
    enabled: !!matchId,
  })

  // Update batting score
  const updateBat = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.patch(`/scoring/batting/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scorecard-admin', matchId] })
      toast.success('Batting score updated')
      setEditingBat(null)
    },
    onError: () => toast.error('Update failed'),
  })

  // Update bowling figure
  const updateBowl = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.patch(`/scoring/bowling/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scorecard-admin', matchId] })
      toast.success('Bowling figure updated')
      setEditingBowl(null)
    },
    onError: () => toast.error('Update failed'),
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Manual Score Editor</h2>
        <p className="text-sm text-slate-400 mb-4">
          Select a match to view and edit batting/bowling figures for any innings.
        </p>
        <select value={matchId} onChange={e => { setMatchId(e.target.value); setSelectedInnings(null) }}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
          <option value="">— Select a match —</option>
          {(matches as Match[]).map(m => (
            <option key={m.id} value={m.id}>
              {m.team1?.name ?? `Team ${m.team1_id}`} vs {m.team2?.name ?? `Team ${m.team2_id}`}
              {m.status === 'live' ? ' 🔴 LIVE' : ` (${m.status})`}
            </option>
          ))}
        </select>
      </div>

      {matchId && scLoading && <div className="flex justify-center py-8"><Spinner size="lg" /></div>}

      {matchId && !scLoading && scorecard.length === 0 && (
        <EmptyState icon="📋" title="No innings yet" description="Innings will appear once the match starts" />
      )}

      {scorecard.map((sc: any) => (
        <div key={sc.innings.id} className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          {/* Innings header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-700">
            <div>
              <span className="font-bold text-white">
                Innings {sc.innings.innings_number} — {sc.innings.batting_team?.name ?? `Team ${sc.innings.batting_team_id}`}
              </span>
              <span className="ml-3 text-slate-400 text-sm">
                {sc.innings.total_runs}/{sc.innings.total_wickets} ({formatOvers(sc.innings.total_overs)} ov)
              </span>
            </div>
            <button onClick={() => setSelectedInnings(selectedInnings?.id === sc.innings.id ? null : sc.innings)}
              className="text-xs text-primary-400 hover:text-primary-300 font-medium">
              {selectedInnings?.id === sc.innings.id ? 'Collapse ▲' : 'Edit ▼'}
            </button>
          </div>

          {selectedInnings?.id === sc.innings.id && (
            <div className="p-4 space-y-5">
              {/* Batting */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">🏏 Batting Scores</h4>
                <div className="space-y-2">
                  {sc.batting.map((b: any) => (
                    <div key={b.id} className="flex items-center gap-3 rounded-lg bg-slate-700/40 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {b.batsman_name ?? `Player #${b.batsman_id}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          {b.runs}({b.balls_faced}) · 4s:{b.fours} · 6s:{b.sixes}
                          {b.is_out ? ` · ${b.dismissal_type?.replace(/_/g, ' ')}` : ' · not out'}
                        </div>
                      </div>
                      <button onClick={() => setEditingBat({ ...b })}
                        className="shrink-0 rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-600">
                        ✏️ Edit
                      </button>
                    </div>
                  ))}
                  {sc.batting.length === 0 && <p className="text-xs text-slate-500 py-2">No batting records yet</p>}
                </div>
              </div>

              {/* Bowling */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">🎳 Bowling Figures</h4>
                <div className="space-y-2">
                  {sc.bowling.map((b: any) => (
                    <div key={b.id} className="flex items-center gap-3 rounded-lg bg-slate-700/40 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {b.bowler_name ?? `Player #${b.bowler_id}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatOvers(b.overs)} ov · {b.wickets}/{b.runs} · Econ:{b.economy_rate.toFixed(2)}
                          · Wd:{b.wides} · Nb:{b.no_balls}
                        </div>
                      </div>
                      <button onClick={() => setEditingBowl({ ...b })}
                        className="shrink-0 rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-600">
                        ✏️ Edit
                      </button>
                    </div>
                  ))}
                  {sc.bowling.length === 0 && <p className="text-xs text-slate-500 py-2">No bowling records yet</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Edit Batting Modal */}
      <Modal open={!!editingBat} onClose={() => setEditingBat(null)} title="Edit Batting Score">
        {editingBat && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 font-medium">
              {editingBat.batsman_name ?? `Player #${editingBat.batsman_id}`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Runs" type="number" min={0} value={editingBat.runs}
                onChange={e => setEditingBat((p: any) => ({ ...p, runs: Number(e.target.value) }))} />
              <InputField label="Balls Faced" type="number" min={0} value={editingBat.balls_faced}
                onChange={e => setEditingBat((p: any) => ({ ...p, balls_faced: Number(e.target.value) }))} />
              <InputField label="Fours" type="number" min={0} value={editingBat.fours}
                onChange={e => setEditingBat((p: any) => ({ ...p, fours: Number(e.target.value) }))} />
              <InputField label="Sixes" type="number" min={0} value={editingBat.sixes}
                onChange={e => setEditingBat((p: any) => ({ ...p, sixes: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_out" checked={editingBat.is_out}
                onChange={e => setEditingBat((p: any) => ({ ...p, is_out: e.target.checked }))}
                className="w-4 h-4 accent-red-500" />
              <label htmlFor="is_out" className="text-sm text-slate-300">Out</label>
            </div>
            {editingBat.is_out && (
              <SelectField label="Dismissal Type" value={editingBat.dismissal_type ?? ''}
                onChange={e => setEditingBat((p: any) => ({ ...p, dismissal_type: e.target.value }))}
                options={['bowled','caught','lbw','run_out','stumped','hit_wicket','retired_hurt'].map(d => ({ value: d, label: d.replace(/_/g,' ') }))}
                placeholder="— Select —" />
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingBat(null)} className="flex-1 rounded-lg border border-slate-600 py-2 text-sm text-slate-300 hover:bg-slate-700">Cancel</button>
              <button onClick={() => updateBat.mutate({ id: editingBat.id, data: { runs: editingBat.runs, balls_faced: editingBat.balls_faced, fours: editingBat.fours, sixes: editingBat.sixes, is_out: editingBat.is_out, dismissal_type: editingBat.dismissal_type } })}
                disabled={updateBat.isPending}
                className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-bold text-white hover:bg-primary-700">
                {updateBat.isPending ? <Spinner size="sm" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Bowling Modal */}
      <Modal open={!!editingBowl} onClose={() => setEditingBowl(null)} title="Edit Bowling Figure">
        {editingBowl && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 font-medium">
              {editingBowl.bowler_name ?? `Player #${editingBowl.bowler_id}`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Overs" type="number" min={0} step={0.1} value={editingBowl.overs}
                onChange={e => setEditingBowl((p: any) => ({ ...p, overs: Number(e.target.value) }))} />
              <InputField label="Maidens" type="number" min={0} value={editingBowl.maidens}
                onChange={e => setEditingBowl((p: any) => ({ ...p, maidens: Number(e.target.value) }))} />
              <InputField label="Runs Conceded" type="number" min={0} value={editingBowl.runs}
                onChange={e => setEditingBowl((p: any) => ({ ...p, runs: Number(e.target.value) }))} />
              <InputField label="Wickets" type="number" min={0} max={10} value={editingBowl.wickets}
                onChange={e => setEditingBowl((p: any) => ({ ...p, wickets: Number(e.target.value) }))} />
              <InputField label="Wides" type="number" min={0} value={editingBowl.wides}
                onChange={e => setEditingBowl((p: any) => ({ ...p, wides: Number(e.target.value) }))} />
              <InputField label="No Balls" type="number" min={0} value={editingBowl.no_balls}
                onChange={e => setEditingBowl((p: any) => ({ ...p, no_balls: Number(e.target.value) }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingBowl(null)} className="flex-1 rounded-lg border border-slate-600 py-2 text-sm text-slate-300 hover:bg-slate-700">Cancel</button>
              <button onClick={() => updateBowl.mutate({ id: editingBowl.id, data: { overs: editingBowl.overs, maidens: editingBowl.maidens, runs: editingBowl.runs, wickets: editingBowl.wickets, wides: editingBowl.wides, no_balls: editingBowl.no_balls } })}
                disabled={updateBowl.isPending}
                className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-bold text-white hover:bg-primary-700">
                {updateBowl.isPending ? <Spinner size="sm" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── Players Tab ───────────────────────────────────────────────────────────────
function PlayersTab() {
  const [search, setSearch] = useState('')

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['batting-leaderboard-admin'],
    queryFn: () => statsApi.battingLeaderboard({ limit: 50 }),
  })

  const filtered = (leaderboard as any[]).filter(p =>
    !search || p.player_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Player Stats</h2>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search player..." className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-white placeholder-slate-500 w-48" />
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        : filtered.length === 0 ? <EmptyState icon="👤" title="No players found" description="Players appear here once they have batting records" />
        : (
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Player</th>
                  <th className="text-center px-3 py-3">Inn</th>
                  <th className="text-center px-3 py-3">Runs</th>
                  <th className="text-center px-3 py-3">HS</th>
                  <th className="text-center px-3 py-3">Avg</th>
                  <th className="text-center px-3 py-3">4s</th>
                  <th className="text-center px-3 py-3">6s</th>
                  <th className="text-center px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((p: any, i: number) => (
                  <tr key={p.player_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{p.player_name}</div>
                      <div className="text-xs text-slate-500">@{p.username}</div>
                    </td>
                    <td className="px-3 py-3 text-center text-slate-300">{p.innings}</td>
                    <td className="px-3 py-3 text-center font-bold text-primary-400">{p.total_runs}</td>
                    <td className="px-3 py-3 text-center text-white">{p.highest_score}</td>
                    <td className="px-3 py-3 text-center text-slate-300">{p.average}</td>
                    <td className="px-3 py-3 text-center text-blue-400">{p.fours}</td>
                    <td className="px-3 py-3 text-center text-purple-400">{p.sixes}</td>
                    <td className="px-3 py-3 text-center">
                      <Link to={`/stats`}
                        className="text-xs text-primary-400 hover:text-primary-300 font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}

// ── Tournaments Tab ───────────────────────────────────────────────────────────
function TournamentsTab() {
  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['admin-tournaments'],
    queryFn: () => tournamentsApi.list({ page_size: 50 } as any),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Tournaments</h2>
        <Link to="/tournaments/create" className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
          + Create Tournament
        </Link>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        : (tournaments as Tournament[]).length === 0 ? <EmptyState icon="🏆" title="No tournaments yet" />
        : (
          <div className="space-y-2">
            {(tournaments as Tournament[]).map(t => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{t.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2">
                    <span className={`font-medium text-white px-1.5 py-0.5 rounded text-[10px] ${
                      t.status === 'ongoing' ? 'bg-green-600' : t.status === 'upcoming' ? 'bg-blue-600' : 'bg-slate-600'
                    }`}>{t.status}</span>
                    <span>{t.format.replace('_', ' ')}</span>
                    <span>{t.overs_per_innings} ov</span>
                    {t.city && <span>📍 {t.city}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link to={`/tournaments/${t.id}`}
                    className="rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700">
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'matches',    label: 'Matches',      icon: '🏏' },
  { key: 'scores',     label: 'Score Editor', icon: '✏️' },
  { key: 'players',    label: 'Players',      icon: '👤' },
  { key: 'tournaments',label: 'Tournaments',  icon: '🏆' },
]

export default function ScoringAdminPage() {
  const { user, isAuthenticated } = useAppSelector(s => s.auth)
  const [tab, setTab] = useState('matches')

  // Accept both CricPro Redux auth AND BNI localStorage auth
  const localRole = localStorage.getItem('bni_role') ?? localStorage.getItem('role') ?? ''
  const allowedRoles = ['admin', 'organizer', 'scorer']
  const hasAccess = (isAuthenticated && user && allowedRoles.includes(user.role))
    || allowedRoles.includes(localRole)
  const displayRole = user?.role ?? localRole

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-400 text-sm mb-6">
          This page is only available to admins, organizers, and scorers.
          <br />
          <span className="text-slate-500 text-xs mt-1 block">
            Login at <strong>/admin/login</strong> with your admin credentials.
          </span>
        </p>
        <Link to="/admin/login" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          Login as Admin
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">⚙️ Scoring Admin</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage matches, edit scores, and oversee player stats
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Logged in as</span>
          <span className="rounded-full bg-primary-600/20 border border-primary-500/30 px-2.5 py-0.5 text-primary-300 font-medium capitalize">
            {displayRole}
          </span>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'New Match',      icon: '🏏', to: '/scoring/matches/create',    color: 'from-primary-700 to-primary-900' },
          { label: 'New Tournament', icon: '🏆', to: '/tournaments/create',         color: 'from-yellow-700 to-yellow-900' },
          { label: 'New Team',       icon: '👥', to: '/scoring/teams/create',       color: 'from-blue-700 to-blue-900' },
          { label: 'Live Stats',     icon: '📊', to: '/stats',                      color: 'from-green-700 to-green-900' },
        ].map(card => (
          <Link key={card.label} to={card.to}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br ${card.color} border border-white/10 p-4 text-center hover:brightness-110 transition-all`}>
            <span className="text-2xl">{card.icon}</span>
            <span className="text-xs font-semibold text-white">{card.label}</span>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* Tab content */}
      <div>
        {tab === 'matches'     && <MatchesTab />}
        {tab === 'scores'      && <ScoreEditorTab />}
        {tab === 'players'     && <PlayersTab />}
        {tab === 'tournaments' && <TournamentsTab />}
      </div>
    </div>
  )
}

