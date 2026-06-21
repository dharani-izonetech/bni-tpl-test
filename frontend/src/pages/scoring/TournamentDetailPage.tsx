import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tournamentsApi, teamsApi } from '@/api/services'
import { Badge, Spinner, EmptyState, TabBar, Modal } from '@/components/common'
import { formatDate, formatNRR, getMatchStatusBadge } from '@/utils'
import { useAppSelector } from '@/hooks/redux'
import toast from 'react-hot-toast'

function PointsTable({ tournamentId }: { tournamentId: number }) {
  const { data: table, isLoading } = useQuery({
    queryKey: ['points-table', tournamentId],
    queryFn: () => tournamentsApi.getPointsTable(tournamentId),
  })
  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (!table || table.length === 0) return <EmptyState icon="📊" title="No points data yet" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-2 text-slate-400 font-medium">#</th>
            <th className="text-left py-3 px-2 text-slate-400 font-medium">Team</th>
            <th className="text-center py-3 px-1 text-slate-400 font-medium">P</th>
            <th className="text-center py-3 px-1 text-slate-400 font-medium">W</th>
            <th className="text-center py-3 px-1 text-slate-400 font-medium">L</th>
            <th className="text-center py-3 px-1 text-slate-400 font-medium">T</th>
            <th className="text-center py-3 px-1 text-slate-400 font-medium">NR</th>
            <th className="text-center py-3 px-1 text-slate-400 font-medium">Pts</th>
            <th className="text-center py-3 px-2 text-slate-400 font-medium">NRR</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row, i) => (
            <tr key={row.team.id} className={`border-b border-slate-800 hover:bg-slate-800/40 transition-colors ${i < 4 ? 'border-l-2 border-l-primary-500' : ''}`}>
              <td className="py-3 px-2 text-slate-400">{i + 1}</td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  {row.team.logo ? <img src={row.team.logo} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs">🏏</div>}
                  <span className="font-medium text-white">{row.team.name}</span>
                </div>
              </td>
              <td className="py-3 px-1 text-center text-slate-300">{row.played}</td>
              <td className="py-3 px-1 text-center text-green-400 font-medium">{row.won}</td>
              <td className="py-3 px-1 text-center text-red-400">{row.lost}</td>
              <td className="py-3 px-1 text-center text-yellow-400">{row.tied}</td>
              <td className="py-3 px-1 text-center text-slate-400">{row.no_result}</td>
              <td className="py-3 px-1 text-center font-bold text-primary-400">{row.points}</td>
              <td className="py-3 px-2 text-center">
                <span className={row.nrr >= 0 ? 'text-green-400' : 'text-red-400'}>{formatNRR(row.nrr)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MatchesTab({ tournamentId }: { tournamentId: number }) {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['tournament-matches', tournamentId],
    queryFn: () => tournamentsApi.getMatches(tournamentId),
  })
  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (!matches || matches.length === 0) return <EmptyState icon="🏏" title="No fixtures yet" description="Fixtures will appear once generated" />
  return (
    <div className="space-y-2">
      {matches.map(m => {
        const s = getMatchStatusBadge(m.status)
        return (
          <Link key={m.id} to={m.status === 'live' ? `/matches/${m.id}/live` : `/matches/${m.id}`}
            className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-600 transition-all">
            <div className="text-xs text-slate-500 w-8 text-center">M{m.match_number}</div>
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="text-sm font-medium text-white truncate">{m.team1?.short_name || m.team1?.name}</span>
              <span className="text-slate-500 text-xs mx-2">vs</span>
              <span className="text-sm font-medium text-white truncate">{m.team2?.short_name || m.team2?.name}</span>
            </div>
            <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const tid = Number(tournamentId)
  const qc = useQueryClient()
  const { user } = useAppSelector(s => s.auth)
  const [tab, setTab] = useState('overview')
  const [showAddTeam, setShowAddTeam] = useState(false)

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', tid],
    queryFn: () => tournamentsApi.get(tid),
  })
  const { data: allTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.list(),
    enabled: showAddTeam,
  })

  const addTeam = useMutation({
    mutationFn: (teamId: number) => tournamentsApi.addTeam(tid, teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament', tid] })
      toast.success('Team added!')
      setShowAddTeam(false)
    },
  })

  const generateFixtures = useMutation({
    mutationFn: () => tournamentsApi.generateFixtures(tid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament-matches', tid] })
      toast.success('Fixtures generated!')
      setTab('fixtures')
    },
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!tournament) return <div className="text-center py-20 text-slate-400">Tournament not found</div>

  const isOrganizer = user && (user.id === tournament.organizer_id || user.role === 'admin')
  const tabs = [
    { key: 'overview', label: 'Overview', icon: '🏆' },
    { key: 'points', label: 'Points Table', icon: '📊' },
    { key: 'fixtures', label: 'Fixtures', icon: '📅' },
    { key: 'teams', label: 'Teams', icon: '👥' },
  ]

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative h-48 rounded-2xl overflow-hidden">
        {tournament.banner ? (
          <img src={tournament.banner} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-900 via-slate-800 to-slate-900 flex items-center justify-center text-8xl">🏆</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-5">
          <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-300">
            <span>{tournament.format.replace('_', ' ')}</span>
            <span>•</span>
            <span>{tournament.overs_per_innings} overs</span>
            <span>•</span>
            <span>{formatDate(tournament.start_date)}</span>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <Badge
            label={tournament.status}
            color={tournament.status === 'ongoing' ? 'bg-green-600' : tournament.status === 'upcoming' ? 'bg-blue-600' : 'bg-slate-600'}
          />
        </div>
      </div>

      {/* Organizer actions */}
      {isOrganizer && (
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowAddTeam(true)} className="btn-secondary text-sm flex items-center gap-2">
            👥 Add Team
          </button>
          <button onClick={() => generateFixtures.mutate()} disabled={generateFixtures.isPending} className="btn-primary text-sm flex items-center gap-2">
            {generateFixtures.isPending ? <Spinner size="sm" /> : '📅'} Generate Fixtures
          </button>
        </div>
      )}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card space-y-3">
            <h3 className="font-bold text-white mb-2">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Format</span><span className="text-white capitalize">{tournament.format.replace('_', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Overs</span><span className="text-white">{tournament.overs_per_innings}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Teams</span><span className="text-white">{tournament.team_count || 0}/{tournament.max_teams}</span></div>
              {tournament.venue && <div className="flex justify-between"><span className="text-slate-400">Venue</span><span className="text-white">{tournament.venue}</span></div>}
              {tournament.city && <div className="flex justify-between"><span className="text-slate-400">City</span><span className="text-white">{tournament.city}</span></div>}
              <div className="flex justify-between"><span className="text-slate-400">Start</span><span className="text-white">{formatDate(tournament.start_date)}</span></div>
              {tournament.end_date && <div className="flex justify-between"><span className="text-slate-400">End</span><span className="text-white">{formatDate(tournament.end_date)}</span></div>}
            </div>
          </div>
          {tournament.description && (
            <div className="card">
              <h3 className="font-bold text-white mb-2">About</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{tournament.description}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'points' && <PointsTable tournamentId={tid} />}
      {tab === 'fixtures' && <MatchesTab tournamentId={tid} />}

      {tab === 'teams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournament.teams && tournament.teams.length > 0 ? (
            tournament.teams.map((team: { id: number; name: string; logo?: string | null; city?: string | null }) => (
              <Link key={team.id} to={`/teams/${team.id}`} className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-primary-500/40 transition-all">
                {team.logo ? <img src={team.logo} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-2xl">🏏</div>}
                <div>
                  <div className="font-semibold text-white">{team.name}</div>
                  <div className="text-xs text-slate-400">{team.city || 'Unknown city'}</div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState icon="👥" title="No teams registered" description="Teams will appear here once added" />
            </div>
          )}
        </div>
      )}

      {/* Add Team Modal */}
      <Modal open={showAddTeam} onClose={() => setShowAddTeam(false)} title="Add Team to Tournament">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {allTeams?.map((team: { id: number; name: string; logo?: string | null; city?: string | null; player_count?: number }) => (
            <button key={team.id} onClick={() => addTeam.mutate(team.id)}
              className="w-full flex items-center gap-3 p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-left">
              {team.logo ? <img src={team.logo} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">🏏</div>}
              <div>
                <div className="font-medium text-white">{team.name}</div>
                <div className="text-xs text-slate-400">{team.city} • {team.player_count || 0} players</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

