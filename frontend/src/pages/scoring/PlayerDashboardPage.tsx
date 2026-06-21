/**
 * PlayerDashboardPage — personal performance dashboard for logged-in players.
 * Shows batting stats, bowling stats, and match-by-match history.
 */
import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { fetchMeThunk, logoutThunk } from '@/store/slices/authSlice'
import { Spinner } from '@/components/common'
import apiClient from '@/api/client'
import { getAccessToken } from '@/api/client'
import { playersApi } from '@/api/services'

function StatCard({ label, value, sub, color = 'text-slate-900' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-sm font-semibold text-slate-700 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function PlayerDashboardPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, accessToken } = useAppSelector(s => s.auth)

  // Hydrate user if token exists but user not loaded
  useEffect(() => {
    if (getAccessToken() && !user) {
      dispatch(fetchMeThunk())
    }
  }, [user, dispatch])

  // Redirect if not logged in
  useEffect(() => {
    if (!getAccessToken()) {
      navigate('/player/login')
    }
  }, [navigate])

  const { data: perf, isLoading, error } = useQuery({
    queryKey: ['my-performance'],
    queryFn: () => playersApi.myPerformance(),
    enabled: !!getAccessToken(),
    retry: 1,
  })

  const handleLogout = async () => {
    await dispatch(logoutThunk())
    navigate('/player/login')
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load performance data</p>
          <button onClick={() => navigate('/player/login')} className="btn-primary">Back to Login</button>
        </div>
      </div>
    )
  }

  const bat = perf?.batting ?? {}
  const bowl = perf?.bowling ?? {}
  const profiles = perf?.profiles ?? []
  const recentBat = perf?.recent_batting ?? []
  const recentBowl = perf?.recent_bowling ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
              {user.full_name?.[0] ?? user.username[0].toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{user.full_name || user.username}</div>
              <div className="text-xs text-slate-500">
                {profiles[0]?.team ?? 'No team'} · #{profiles[0]?.jersey_number ?? '—'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">Cricket Site</Link>
            <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 font-medium">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Player info */}
        <div className="bg-gradient-to-r from-primary-600 to-amber-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black">{user.full_name || user.username}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/80">
                {profiles.map((p: any) => (
                  <span key={p.id} className="bg-white/20 rounded-full px-3 py-0.5">
                    {p.team} · #{p.jersey_number}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-white/70">
                {user.batting_style && <span>🏏 {user.batting_style}</span>}
                {user.bowling_style && <span>🎳 {user.bowling_style}</span>}
              </div>
            </div>
            <div className="text-5xl">🏏</div>
          </div>
        </div>

        {/* Batting stats */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">🏏 Batting Statistics</h2>
          {bat.innings === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
              No batting records yet. Play some matches to see your stats here.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Innings" value={bat.innings} />
              <StatCard label="Total Runs" value={bat.runs} color="text-primary-600" />
              <StatCard label="Highest Score" value={bat.highest} color="text-green-600" />
              <StatCard label="Average" value={bat.average} sub="runs per dismissal" />
              <StatCard label="Strike Rate" value={bat.strike_rate} sub="per 100 balls" color="text-blue-600" />
              <StatCard label="Fours" value={bat.fours} color="text-blue-500" />
              <StatCard label="Sixes" value={bat.sixes} color="text-purple-600" />
              <StatCard label="Not Outs" value={bat.not_outs} color="text-green-500" />
            </div>
          )}
        </div>

        {/* Bowling stats */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">🎳 Bowling Statistics</h2>
          {bowl.innings === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
              No bowling records yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Innings" value={bowl.innings} />
              <StatCard label="Wickets" value={bowl.wickets} color="text-primary-600" />
              <StatCard label="Runs Conceded" value={bowl.runs} />
              <StatCard label="Overs" value={bowl.overs} />
              <StatCard label="Economy" value={bowl.economy} sub="runs per over" color="text-green-600" />
              <StatCard label="Average" value={bowl.average} sub="runs per wicket" />
              <StatCard label="Maidens" value={bowl.maidens} color="text-blue-600" />
            </div>
          )}
        </div>

        {/* Recent batting */}
        {recentBat.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Batting</h2>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                    <th className="text-left px-4 py-3">Match</th>
                    <th className="text-center px-3 py-3">R</th>
                    <th className="text-center px-3 py-3">B</th>
                    <th className="text-center px-3 py-3">SR</th>
                    <th className="text-center px-3 py-3">4s</th>
                    <th className="text-center px-3 py-3">6s</th>
                    <th className="text-left px-3 py-3">Dismissal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBat.map((b: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 text-xs max-w-[160px] truncate">{b.match}</td>
                      <td className="px-3 py-3 text-center font-bold text-primary-600">{b.runs}</td>
                      <td className="px-3 py-3 text-center text-slate-500">{b.balls}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{b.sr}</td>
                      <td className="px-3 py-3 text-center text-blue-500">{b.fours}</td>
                      <td className="px-3 py-3 text-center text-purple-500">{b.sixes}</td>
                      <td className="px-3 py-3 text-xs">
                        <span className={b.dismissal === 'not out' ? 'text-green-600 font-medium' : 'text-slate-500'}>
                          {b.dismissal}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent bowling */}
        {recentBowl.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Bowling</h2>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                    <th className="text-left px-4 py-3">Match</th>
                    <th className="text-center px-3 py-3">O</th>
                    <th className="text-center px-3 py-3">M</th>
                    <th className="text-center px-3 py-3">R</th>
                    <th className="text-center px-3 py-3">W</th>
                    <th className="text-center px-3 py-3">Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBowl.map((b: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 text-xs max-w-[160px] truncate">{b.match}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{b.overs}</td>
                      <td className="px-3 py-3 text-center text-slate-500">{b.maidens}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{b.runs}</td>
                      <td className="px-3 py-3 text-center font-bold text-primary-600">{b.wickets}</td>
                      <td className="px-3 py-3 text-center text-green-600">{b.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {recentBat.length === 0 && recentBowl.length === 0 && bat.innings === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="text-5xl mb-4">🏏</div>
            <h3 className="text-lg font-bold text-slate-700">No match data yet</h3>
            <p className="text-slate-400 text-sm mt-2">
              Your batting and bowling stats will appear here once matches are scored.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
