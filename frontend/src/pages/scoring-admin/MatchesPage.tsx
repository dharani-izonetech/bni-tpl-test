import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchesApi } from '@/api/services'
import { Spinner, EmptyState } from '@/components/common'
import { getMatchStatusBadge, formatDateTime } from '@/utils'
import toast from 'react-hot-toast'
import type { Match } from '@/types'

export default function SAMatchesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [tossMatchId, setTossMatchId] = useState<string | null>(null)
  const [tossWinner, setTossWinner] = useState('')
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat')

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['sa-matches-list', statusFilter],
    queryFn: () => matchesApi.list({ status: statusFilter || undefined, page_size: 100 } as any),
  })

  const recordToss = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { toss_winner_id: string; toss_decision: string } }) =>
      matchesApi.recordToss(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-matches-list'] })
      toast.success('Toss recorded!')
      setTossMatchId(null)
    },
    onError: () => toast.error('Failed to record toss'),
  })

  const startInnings = useMutation({
    mutationFn: (id: string) => matchesApi.startInnings(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['sa-matches-list'] })
      toast.success('Innings started!')
      navigate(`/scoring/matches/${id}/live`)
    },
    onError: () => toast.error('Failed to start innings'),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Matches</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage and score all matches</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
            <option value="">All Status</option>
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

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (matches as Match[]).length === 0 ? (
        <EmptyState icon="🏏" title="No matches found" description="Create a match to get started"
          action={<Link to="/scoring/matches/create" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">Create Match</Link>} />
      ) : (
        <div className="space-y-2">
          {(matches as Match[]).map(m => {
            const s = getMatchStatusBadge(m.status)
            const isLive = m.status === 'live'
            const canStart = m.status === 'toss' || m.status === 'innings_break'
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 transition-colors">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
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
                    {(m.match_date ?? m.scheduled_at) && <span>📅 {formatDateTime(m.match_date ?? m.scheduled_at)}</span>}
                    {m.match_number && <span>Match #{m.match_number}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link to={`/match/${m.id}`}
                    className="rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-100">
                    Details
                  </Link>
                  {m.status === 'scheduled' && (
                    <button onClick={() => { setTossMatchId(String(m.id)); setTossWinner(String(m.team1_id)); }}
                      className="rounded-lg bg-yellow-500 px-2.5 py-1.5 text-xs font-bold text-slate-900 hover:bg-yellow-600">
                      🪙 Toss
                    </button>
                  )}
                  {isLive && (
                    <Link to={`/scoring/matches/${m.id}/live`}
                      className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-slate-900 hover:bg-green-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Score
                    </Link>
                  )}
                  {canStart && (
                    <button onClick={() => startInnings.mutate(m.id)}
                      disabled={startInnings.isPending}
                      className="rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-bold text-slate-900 hover:bg-primary-700">
                      {startInnings.isPending ? <Spinner size="sm" /> : '▶ Start'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toss Modal */}
      {tossMatchId && (() => {
        const m = (matches as Match[]).find(x => String(x.id) === tossMatchId)
        if (!m) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4">🪙 Record Toss</h3>
              <p className="text-sm text-slate-500 mb-4">{m.team1?.name} vs {m.team2?.name}</p>
              
              <label className="block text-sm font-medium text-slate-700 mb-2">Toss Won By</label>
              <select value={tossWinner} onChange={e => setTossWinner(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4">
                <option value={String(m.team1_id)}>{m.team1?.name || 'Team 1'}</option>
                <option value={String(m.team2_id)}>{m.team2?.name || 'Team 2'}</option>
              </select>

              <label className="block text-sm font-medium text-slate-700 mb-2">Elected to</label>
              <div className="flex gap-3 mb-6">
                <button onClick={() => setTossDecision('bat')}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium ${tossDecision === 'bat' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-300 text-slate-600'}`}>
                  🏏 Bat
                </button>
                <button onClick={() => setTossDecision('bowl')}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium ${tossDecision === 'bowl' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-300 text-slate-600'}`}>
                  🎳 Bowl
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setTossMatchId(null)}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600">
                  Cancel
                </button>
                <button
                  onClick={() => recordToss.mutate({ id: tossMatchId, data: { toss_winner_id: tossWinner, toss_decision: tossDecision } })}
                  disabled={recordToss.isPending}
                  className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-bold text-white hover:bg-amber-600">
                  {recordToss.isPending ? 'Saving...' : '🪙 Confirm Toss'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}


