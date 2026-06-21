import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/api/services'
import { Spinner, EmptyState } from '@/components/common'

export default function SAStatsPage() {
  const { data: batting = [], isLoading: bLoading } = useQuery({
    queryKey: ['sa-stats-batting'],
    queryFn: () => statsApi.battingLeaderboard({ limit: 20 }),
  })
  const { data: bowling = [], isLoading: wLoading } = useQuery({
    queryKey: ['sa-stats-bowling'],
    queryFn: () => statsApi.bowlingLeaderboard({ limit: 20 }),
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Statistics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Tournament-wide batting and bowling leaderboards</p>
      </div>

      {/* Batting */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">🏏 Batting Leaderboard</h2>
        {bLoading ? <div className="flex justify-center py-8"><Spinner /></div>
          : (batting as any[]).length === 0 ? <EmptyState icon="🏏" title="No batting data yet" />
          : (
            <div className="rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase">
                    <th className="text-left px-4 py-3">#</th>
                    <th className="text-left px-4 py-3">Player</th>
                    <th className="text-center px-3 py-3">Inn</th>
                    <th className="text-center px-3 py-3">Runs</th>
                    <th className="text-center px-3 py-3">HS</th>
                    <th className="text-center px-3 py-3">Avg</th>
                    <th className="text-center px-3 py-3">4s</th>
                    <th className="text-center px-3 py-3">6s</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(batting as any[]).map((p: any, i: number) => (
                    <tr key={p.player_id} className="hover:bg-white">
                      <td className="px-4 py-3 text-slate-500">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                      <td className="px-4 py-3"><div className="font-semibold text-white">{p.player_name}</div><div className="text-xs text-slate-500">@{p.username}</div></td>
                      <td className="px-3 py-3 text-center text-slate-300">{p.innings}</td>
                      <td className="px-3 py-3 text-center font-bold text-primary-400">{p.total_runs}</td>
                      <td className="px-3 py-3 text-center text-white">{p.highest_score}</td>
                      <td className="px-3 py-3 text-center text-slate-300">{p.average}</td>
                      <td className="px-3 py-3 text-center text-blue-400">{p.fours}</td>
                      <td className="px-3 py-3 text-center text-purple-400">{p.sixes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Bowling */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">🎳 Bowling Leaderboard</h2>
        {wLoading ? <div className="flex justify-center py-8"><Spinner /></div>
          : (bowling as any[]).length === 0 ? <EmptyState icon="🎳" title="No bowling data yet" />
          : (
            <div className="rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase">
                    <th className="text-left px-4 py-3">#</th>
                    <th className="text-left px-4 py-3">Player</th>
                    <th className="text-center px-3 py-3">Inn</th>
                    <th className="text-center px-3 py-3">Wkts</th>
                    <th className="text-center px-3 py-3">Runs</th>
                    <th className="text-center px-3 py-3">Overs</th>
                    <th className="text-center px-3 py-3">Econ</th>
                    <th className="text-center px-3 py-3">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(bowling as any[]).map((p: any, i: number) => (
                    <tr key={p.player_id} className="hover:bg-white">
                      <td className="px-4 py-3 text-slate-500">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                      <td className="px-4 py-3"><div className="font-semibold text-white">{p.player_name}</div><div className="text-xs text-slate-500">@{p.username}</div></td>
                      <td className="px-3 py-3 text-center text-slate-300">{p.innings}</td>
                      <td className="px-3 py-3 text-center font-bold text-primary-400">{p.total_wickets}</td>
                      <td className="px-3 py-3 text-center text-white">{p.total_runs_conceded}</td>
                      <td className="px-3 py-3 text-center text-slate-300">{p.overs_bowled}</td>
                      <td className="px-3 py-3 text-center text-green-400">{p.economy}</td>
                      <td className="px-3 py-3 text-center text-slate-300">{p.average}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}

