import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/api/services'
import { Spinner, EmptyState } from '@/components/common'
import SEO from '@/components/SEO'

function BattingBoard() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'batting'],
    queryFn: () => statsApi.battingLeaderboard({ limit: 50 }),
  })
  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!data || data.length === 0) return <EmptyState icon="🏏" title="No batting stats yet" description="Stats will appear after matches are scored" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[rgba(166,124,0,0.3)] text-xs font-bold uppercase text-[#5C4A10]">
            <th className="text-left py-3 px-2">#</th>
            <th className="text-left py-3 px-2">Batsman</th>
            <th className="text-center py-3 px-2">Inn</th>
            <th className="text-center py-3 px-2">Runs</th>
            <th className="text-center py-3 px-2">HS</th>
            <th className="text-center py-3 px-2">Avg</th>
            <th className="text-center py-3 px-2">4s</th>
            <th className="text-center py-3 px-2">6s</th>
          </tr>
        </thead>
        <tbody>
          {data.map((b: any, i: number) => (
            <tr key={b.player_id} className="border-b border-slate-100 hover:bg-[rgba(240,192,64,0.06)] transition-colors">
              <td className="py-3 px-2 font-bold text-[#A67C00]">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </td>
              <td className="py-3 px-2">
                <div className="font-semibold text-[#1A1200]">{b.player_name}</div>
                <div className="text-xs text-slate-400">@{b.username}</div>
              </td>
              <td className="py-3 px-2 text-center text-slate-600">{b.innings}</td>
              <td className="py-3 px-2 text-center font-bold text-[#A67C00] text-base">{b.total_runs}</td>
              <td className="py-3 px-2 text-center font-semibold text-[#1A1200]">{b.highest_score}</td>
              <td className="py-3 px-2 text-center text-slate-600">{b.average}</td>
              <td className="py-3 px-2 text-center text-blue-600 font-semibold">{b.fours}</td>
              <td className="py-3 px-2 text-center text-purple-600 font-semibold">{b.sixes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BowlingBoard() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'bowling'],
    queryFn: () => statsApi.bowlingLeaderboard({ limit: 50 }),
  })
  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!data || data.length === 0) return <EmptyState icon="🎳" title="No bowling stats yet" description="Stats will appear after matches are scored" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[rgba(166,124,0,0.3)] text-xs font-bold uppercase text-[#5C4A10]">
            <th className="text-left py-3 px-2">#</th>
            <th className="text-left py-3 px-2">Bowler</th>
            <th className="text-center py-3 px-2">Inn</th>
            <th className="text-center py-3 px-2">Wkts</th>
            <th className="text-center py-3 px-2">Runs</th>
            <th className="text-center py-3 px-2">Overs</th>
            <th className="text-center py-3 px-2">Econ</th>
            <th className="text-center py-3 px-2">Avg</th>
          </tr>
        </thead>
        <tbody>
          {data.map((b: any, i: number) => (
            <tr key={b.player_id} className="border-b border-slate-100 hover:bg-[rgba(240,192,64,0.06)] transition-colors">
              <td className="py-3 px-2 font-bold text-[#A67C00]">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </td>
              <td className="py-3 px-2">
                <div className="font-semibold text-[#1A1200]">{b.player_name}</div>
                <div className="text-xs text-slate-400">@{b.username}</div>
              </td>
              <td className="py-3 px-2 text-center text-slate-600">{b.innings}</td>
              <td className="py-3 px-2 text-center font-bold text-green-700 text-base">{b.total_wickets}</td>
              <td className="py-3 px-2 text-center text-slate-700">{b.total_runs_conceded}</td>
              <td className="py-3 px-2 text-center text-slate-600">{b.overs_bowled}</td>
              <td className="py-3 px-2 text-center text-[#A67C00] font-semibold">{b.economy}</td>
              <td className="py-3 px-2 text-center text-slate-600">{b.average}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function StatsPage() {
  const [tab, setTab] = useState<'batting' | 'bowling'>('batting')
  return (
    <section className="min-h-[60vh] px-4 py-8">
      <SEO title="Statistics" description="BNI Cricket Tournament — Batting and bowling leaderboards." />
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-center font-heading text-3xl font-bold uppercase text-[#1A1200]">Player Statistics</h1>
        <p className="mb-6 text-center text-sm text-[#5C4A10]">Top performers across all matches</p>

        {/* Tabs */}
        <div className="mb-6 flex justify-center gap-2">
          <button onClick={() => setTab('batting')}
            className={`rounded-lg px-6 py-2.5 text-sm font-bold transition ${
              tab === 'batting'
                ? 'bg-[linear-gradient(135deg,#A67C00,#F0C040)] text-[#1A1200] shadow-md'
                : 'border border-[rgba(166,124,0,0.3)] text-[#5C4A10] hover:bg-[rgba(240,192,64,0.1)]'
            }`}>
            🏏 Batting
          </button>
          <button onClick={() => setTab('bowling')}
            className={`rounded-lg px-6 py-2.5 text-sm font-bold transition ${
              tab === 'bowling'
                ? 'bg-[linear-gradient(135deg,#A67C00,#F0C040)] text-[#1A1200] shadow-md'
                : 'border border-[rgba(166,124,0,0.3)] text-[#5C4A10] hover:bg-[rgba(240,192,64,0.1)]'
            }`}>
            🎳 Bowling
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[rgba(166,124,0,0.25)] bg-white shadow-sm">
          {tab === 'batting' && <BattingBoard />}
          {tab === 'bowling' && <BowlingBoard />}
        </div>
      </div>
    </section>
  )
}
