import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { tournamentsApi } from '@/api/services'
import { Badge, EmptyState, Spinner, InputField } from '@/components/common'
import { formatDate, getTournamentStatusBadge } from '@/utils'
import type { Tournament } from '@/types'
import { useAppSelector } from '@/hooks/redux'

function TournamentCard({ t }: { t: Tournament }) {
  const statusInfo = getTournamentStatusBadge(t.status)
  const formatLabel: Record<string, string> = {
    league: 'League', knockout: 'Knockout',
    league_knockout: 'League + Knockout', round_robin: 'Round Robin'
  }
  return (
    <Link to={`/tournaments/${t.id}`} className="card hover:border-primary-500/40 transition-all group overflow-hidden">
      {/* Banner */}
      <div className="h-28 -mx-4 -mt-4 mb-4 bg-gradient-to-br from-primary-900/40 to-slate-800 overflow-hidden">
        {t.banner ? (
          <img src={t.banner} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🏆</div>
        )}
      </div>

      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-white text-base line-clamp-1 flex-1 mr-2">{t.name}</h3>
        <span className={`text-xs font-semibold shrink-0 ${statusInfo.color}`}>{statusInfo.label}</span>
      </div>

      {t.description && <p className="text-slate-400 text-xs line-clamp-2 mb-3">{t.description}</p>}

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
          🏏 {formatLabel[t.format] || t.format}
        </span>
        <span className="bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
          👥 {t.team_count ?? 0}/{t.max_teams} teams
        </span>
        <span className="bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
          ⚾ {t.overs_per_innings} ov
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span>{t.city || 'Location TBD'}</span>
        <span>{formatDate(t.start_date)}</span>
      </div>
    </Link>
  )
}

export default function TournamentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { user, isAuthenticated } = useAppSelector(s => s.auth)

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['tournaments', search, statusFilter],
    queryFn: () => tournamentsApi.list({ search: search || undefined, status: statusFilter || undefined }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tournaments</h1>
          <p className="text-slate-400 text-sm mt-1">Find and join cricket tournaments</p>
        </div>
        {isAuthenticated && (user?.role === 'admin' || user?.role === 'organizer') && (
          <Link to="/tournaments/create" className="btn-primary flex items-center gap-2">
            <span>+</span> Create Tournament
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search tournaments..." className="input" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-44">
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.map(t => <TournamentCard key={t.id} t={t} />)}
        </div>
      ) : (
        <EmptyState
          icon="🏆"
          title="No tournaments found"
          description={search ? `No results for "${search}"` : 'Be the first to create a tournament'}
          action={isAuthenticated && user?.role !== 'player' ? (
            <Link to="/tournaments/create" className="btn-primary">Create Tournament</Link>
          ) : undefined}
        />
      )}
    </div>
  )
}
