import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { matchesApi, tournamentsApi, statsApi } from '@/api/services'
import { Spinner } from '@/components/common'

export default function ScoringDashboardPage() {
  const { data: matches = [], isLoading: mLoading } = useQuery({
    queryKey: ['sa-matches'],
    queryFn: () => matchesApi.list({ page_size: 5 } as any),
  })
  const { data: tournaments = [], isLoading: tLoading } = useQuery({
    queryKey: ['sa-tournaments'],
    queryFn: () => tournamentsApi.list({ page_size: 100 } as any),
  })
  const { data: batting = [] } = useQuery({
    queryKey: ['sa-batting'],
    queryFn: () => statsApi.battingLeaderboard({ limit: 5 }),
  })

  const liveMatches = (matches as any[]).filter(m => m.status === 'live')
  const ongoingTournaments = (tournaments as any[]).filter(t => t.status === 'ongoing')

  const stats = [
    { label: 'Total Matches',    value: (matches as any[]).length,       icon: '🏏', to: '/scoring-admin/matches',     color: 'from-blue-600 to-blue-800' },
    { label: 'Live Now',         value: liveMatches.length,              icon: '🔴', to: '/scoring-admin/matches',     color: 'from-green-600 to-green-800' },
    { label: 'Tournaments',      value: (tournaments as any[]).length,   icon: '🏆', to: '/scoring-admin/tournaments', color: 'from-yellow-600 to-yellow-800' },
    { label: 'Active Tournaments', value: ongoingTournaments.length,     icon: '⚡', to: '/scoring-admin/tournaments', color: 'from-purple-600 to-purple-800' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">CricPro Scoring Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} to={s.to}
            className={`rounded-2xl bg-gradient-to-br ${s.color} p-5 border border-white/10 hover:brightness-110 transition-all`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-black text-white">
              {mLoading || tLoading ? <Spinner size="sm" /> : s.value}
            </div>
            <div className="text-xs text-white/70 mt-1 font-medium">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Match',      icon: '🏏', to: '/scoring/matches/create' },
            { label: 'New Tournament', icon: '🏆', to: '/tournaments/create' },
            { label: 'New Team',       icon: '👥', to: '/scoring/teams/create' },
            { label: 'Edit Scores',    icon: '✏️', to: '/scoring-admin/scores' },
          ].map(a => (
            <Link key={a.label} to={a.to}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center hover:bg-slate-100/60 transition-all">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-semibold text-slate-300">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">🔴 Live Matches</h2>
          <div className="space-y-2">
            {liveMatches.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-green-800/50 bg-green-900/20 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <div className="flex-1 font-semibold text-slate-900 text-sm">
                  {m.team1?.name ?? `Team ${m.team1_id}`} vs {m.team2?.name ?? `Team ${m.team2_id}`}
                </div>
                <Link to={`/scoring/matches/${m.id}/live`}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-green-700">
                  Score →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top batsmen */}
      {(batting as any[]).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Top Batsmen</h2>
            <Link to="/scoring-admin/stats" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-400">
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Player</th>
                  <th className="text-center px-3 py-2">Runs</th>
                  <th className="text-center px-3 py-2">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(batting as any[]).slice(0, 5).map((p: any, i: number) => (
                  <tr key={p.player_id} className="hover:bg-white">
                    <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-white">{p.player_name}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-primary-400">{p.total_runs}</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">{p.average}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

