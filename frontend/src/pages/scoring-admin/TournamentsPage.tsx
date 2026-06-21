import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tournamentsApi } from '@/api/services'
import { Spinner, EmptyState } from '@/components/common'
import { formatDate } from '@/utils'
import type { Tournament } from '@/types'

export default function SATournamentsPage() {
  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['sa-tournaments-list'],
    queryFn: () => tournamentsApi.list({ page_size: 100 } as any),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tournaments</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage all tournaments</p>
        </div>
        <Link to="/tournaments/create"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-primary-700">
          + Create Tournament
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (tournaments as Tournament[]).length === 0 ? (
        <EmptyState icon="🏆" title="No tournaments yet"
          action={<Link to="/tournaments/create" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">Create Tournament</Link>} />
      ) : (
        <div className="space-y-3">
          {(tournaments as Tournament[]).map(t => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>
                    <span className={`text-xs font-semibold text-slate-900 px-2 py-0.5 rounded-full ${
                      t.status === 'ongoing' ? 'bg-green-600' : t.status === 'upcoming' ? 'bg-blue-600' : 'bg-slate-600'
                    }`}>{t.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                    <span>📋 {t.format.replace('_', ' ')}</span>
                    <span>⚾ {t.overs_per_innings} overs</span>
                    <span>👥 Max {t.max_teams} teams</span>
                    {t.city && <span>📍 {t.city}</span>}
                    <span>📅 {formatDate(t.start_date)}</span>
                  </div>
                  {t.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{t.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link to={`/tournaments/${t.id}`}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-100">
                    Manage →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

