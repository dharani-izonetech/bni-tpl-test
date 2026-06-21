import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchesApi, teamsApi } from '@/api/services'
import { Badge, Spinner, EmptyState, TabBar, Modal, SelectField } from '@/components/common'
import { getMatchStatusBadge, formatDateTime, formatOvers, getDismissalText } from '@/utils'
import { useAppSelector } from '@/hooks/redux'
import toast from 'react-hot-toast'
import type { ScorecardData } from '@/types'

function ScorecardTab({ matchId }: { matchId: string }) {
  const { data: scorecards, isLoading } = useQuery({
    queryKey: ['scorecard', matchId],
    queryFn: () => matchesApi.getScorecard(matchId),
  })
  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (!scorecards || scorecards.length === 0) return <EmptyState icon="📋" title="No scorecard yet" description="Scorecard will appear once the match starts" />

  return (
    <div className="space-y-6">
      {scorecards.map((sc: ScorecardData) => (
        <div key={sc.innings.id} className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{sc.innings.batting_team?.name || `Team ${sc.innings.batting_team_id}`}</h3>
              <p className="text-slate-400 text-sm">Innings {sc.innings.innings_number}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">{sc.innings.total_runs}/{sc.innings.total_wickets}</div>
              <div className="text-sm text-slate-500">({formatOvers(sc.innings.total_overs)} ov)</div>
            </div>
          </div>

          {/* Batting */}
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Batting</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="text-left py-2 px-1">Batsman</th>
                    <th className="text-left py-2 px-1 text-slate-400 font-normal hidden sm:table-cell">Dismissal</th>
                    <th className="text-center py-2 px-1">R</th>
                    <th className="text-center py-2 px-1">B</th>
                    <th className="text-center py-2 px-1">4s</th>
                    <th className="text-center py-2 px-1">6s</th>
                    <th className="text-center py-2 px-1">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {sc.batting.map((b: any) => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-1">
                        <div className="font-medium text-slate-900">{b.batsman_name}</div>
                      </td>
                      <td className="py-2 px-1 text-xs text-slate-400 hidden sm:table-cell">
                        {b.is_out
                          ? getDismissalText(b.dismissal_type, b.bowler_name, undefined)
                          : <span className="text-green-400">not out</span>}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-slate-900">{b.runs}</td>
                      <td className="py-2 px-1 text-center text-slate-500">{b.balls_faced}</td>
                      <td className="py-2 px-1 text-center text-blue-400">{b.fours}</td>
                      <td className="py-2 px-1 text-center text-purple-400">{b.sixes}</td>
                      <td className="py-2 px-1 text-center text-slate-700">
                        {b.balls_faced > 0 ? ((b.runs / b.balls_faced) * 100).toFixed(1) : '0.0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Extras */}
            <div className="mt-2 flex gap-4 text-xs text-slate-400 px-1">
              <span>Extras: <span className="text-slate-900">{sc.innings.extras_wide + sc.innings.extras_no_ball + sc.innings.extras_bye + sc.innings.extras_leg_bye}</span></span>
              <span>Wd: {sc.innings.extras_wide}</span>
              <span>Nb: {sc.innings.extras_no_ball}</span>
              <span>B: {sc.innings.extras_bye}</span>
              <span>Lb: {sc.innings.extras_leg_bye}</span>
            </div>
          </div>

          {/* Bowling */}
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Bowling</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="text-left py-2 px-1">Bowler</th>
                    <th className="text-center py-2 px-1">O</th>
                    <th className="text-center py-2 px-1">M</th>
                    <th className="text-center py-2 px-1">R</th>
                    <th className="text-center py-2 px-1">W</th>
                    <th className="text-center py-2 px-1">Econ</th>
                    <th className="text-center py-2 px-1 hidden sm:table-cell">Wd</th>
                    <th className="text-center py-2 px-1 hidden sm:table-cell">Nb</th>
                  </tr>
                </thead>
                <tbody>
                  {sc.bowling.map((b: any) => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-1 font-medium text-slate-900">{b.bowler_name}</td>
                      <td className="py-2 px-1 text-center text-slate-700">{formatOvers(b.overs)}</td>
                      <td className="py-2 px-1 text-center text-slate-700">{b.maidens}</td>
                      <td className="py-2 px-1 text-center text-slate-700">{b.runs}</td>
                      <td className="py-2 px-1 text-center font-bold text-primary-600">{b.wickets}</td>
                      <td className="py-2 px-1 text-center text-slate-700">{b.economy_rate.toFixed(2)}</td>
                      <td className="py-2 px-1 text-center text-yellow-400 hidden sm:table-cell">{b.wides}</td>
                      <td className="py-2 px-1 text-center text-orange-400 hidden sm:table-cell">{b.no_balls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fall of Wickets */}
          {sc.fall_of_wickets.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Fall of Wickets</h4>
              <div className="flex flex-wrap gap-2">
                {sc.fall_of_wickets.map((fow: any) => (
                  <div key={fow.wicket_number} className="text-xs bg-slate-100 rounded-lg px-2 py-1.5 border border-slate-200">
                    <span className="text-slate-500">{fow.wicket_number}-</span>
                    <span className="font-bold text-slate-900">{fow.runs_at_fall}</span>
                    <span className="text-slate-400 ml-1">({formatOvers(fow.overs_at_fall)})</span>
                    {fow.batsman_name && <span className="text-slate-400 ml-1">{fow.batsman_name.split(' ')[0]}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const mid = matchId!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, isAuthenticated } = useAppSelector(s => s.auth)
  const [tab, setTab] = useState('info')
  const [showTossModal, setShowTossModal] = useState(false)
  const [showXIModal, setShowXIModal] = useState(false)
  const [tossWinner, setTossWinner] = useState('')
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat')
  const [xiTeamId, setXITeamId] = useState<number | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([])

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', mid],
    queryFn: () => matchesApi.get(mid),
  })

  const { data: team1Detail } = useQuery({
    queryKey: ['team-players', match?.team1_id],
    queryFn: () => teamsApi.getPlayers(match!.team1_id),
    enabled: !!match,
  })
  const { data: team2Detail } = useQuery({
    queryKey: ['team-players', match?.team2_id],
    queryFn: () => teamsApi.getPlayers(match!.team2_id),
    enabled: !!match,
  })

  const recordToss = useMutation({
    mutationFn: () => matchesApi.recordToss(mid, { toss_winner_id: tossWinner, toss_decision: tossDecision }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['match', mid] }); toast.success('Toss recorded!'); setShowTossModal(false) },
  })

  const setPlayingXI = useMutation({
    mutationFn: () => matchesApi.setPlayingXI(mid, { team_id: String(xiTeamId), player_ids: selectedPlayers }),
    onSuccess: () => { toast.success('Playing XI set!'); setShowXIModal(false) },
  })

  const startInnings = useMutation({
    mutationFn: () => matchesApi.startInnings(mid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match', mid] })
      toast.success('Innings started!')
      navigate(`/matches/${mid}/live`)
    },
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!match) return <div className="text-center py-20 text-slate-500">Match not found</div>

  const status = getMatchStatusBadge(match.status)
  const isAdmin = user && (user.role === 'admin' || user.role === 'organizer' || user.role === 'scorer')
  const isLive = match.status === 'live'

  const xiTeamPlayers = xiTeamId === match.team1_id ? team1Detail : team2Detail

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Match Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-semibold text-white px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
          <div className="text-xs text-slate-500">
            {match.overs} overs · {match.match_type.replace('_', ' ')}
            {match.match_number && ` · Match #${match.match_number}`}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex-1 text-center">
            {match.team1?.logo
              ? <img src={match.team1.logo} className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-slate-200" />
              : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center text-3xl mx-auto mb-2">🏏</div>}
            <div className="font-bold text-slate-900 text-lg">{match.team1?.name || `Team ${match.team1_id}`}</div>
            {match.winner_id === match.team1_id && <div className="text-yellow-600 text-sm mt-1">🏆 Winner</div>}
          </div>

          <div className="text-center px-4">
            <div className="text-slate-500 text-xl font-bold">VS</div>
            {match.toss_winner_id && (
              <div className="text-xs text-slate-400 mt-1">
                Toss: {match.toss_winner_id === match.team1_id ? match.team1?.name : match.team2?.name}
                <br />chose to {match.toss_decision}
              </div>
            )}
          </div>

          <div className="flex-1 text-center">
            {match.team2?.logo
              ? <img src={match.team2.logo} className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-slate-200" />
              : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center text-3xl mx-auto mb-2">🏏</div>}
            <div className="font-bold text-slate-900 text-lg">{match.team2?.name || `Team ${match.team2_id}`}</div>
            {match.winner_id === match.team2_id && <div className="text-yellow-600 text-sm mt-1">🏆 Winner</div>}
          </div>
        </div>

        {match.result_summary && (
          <div className="mt-3 text-center text-sm text-primary-700 font-medium bg-primary-50 border border-primary-200 py-2 rounded-lg">
            {match.result_summary}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs text-slate-500">
          {match.venue && <span>📍 {match.venue}</span>}
          {(match.match_date ?? match.scheduled_at) && <span>📅 {formatDateTime((match.match_date ?? match.scheduled_at))}</span>}
          {match.started_at && <span>▶️ Started {formatDateTime(match.started_at)}</span>}
          {match.completed_at && <span>✅ Ended {formatDateTime(match.completed_at)}</span>}
        </div>

        {/* Action buttons */}
        {isAdmin && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center border-t border-slate-100 pt-4">
            {isLive && (
              <Link to={`/matches/${mid}/live`} className="btn-primary flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live Scoring
              </Link>
            )}
            {match.status === 'scheduled' && (
              <button onClick={() => setShowTossModal(true)} className="btn-secondary">🪙 Record Toss</button>
            )}
            {match.status === 'toss' && (
              <>
                <button onClick={() => { setXITeamId(match.team1_id); setShowXIModal(true) }} className="btn-secondary text-sm">
                  Set XI: {match.team1?.name}
                </button>
                <button onClick={() => { setXITeamId(match.team2_id); setShowXIModal(true) }} className="btn-secondary text-sm">
                  Set XI: {match.team2?.name}
                </button>
                <button onClick={() => startInnings.mutate()} disabled={startInnings.isPending} className="btn-primary">
                  {startInnings.isPending ? <Spinner size="sm" /> : '▶️ Start Match'}
                </button>
              </>
            )}
            {match.status === 'innings_break' && (
              <button onClick={() => startInnings.mutate()} disabled={startInnings.isPending} className="btn-primary">
                {startInnings.isPending ? <Spinner size="sm" /> : '▶️ Start 2nd Innings'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <TabBar
        tabs={[
          { key: 'info', label: 'Info', icon: 'ℹ️' },
          { key: 'scorecard', label: 'Scorecard', icon: '📋' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'info' && (
        <div className="card space-y-3 text-sm">
          <h3 className="font-bold text-slate-900">Match Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`text-xs font-semibold text-white px-2 py-0.5 rounded ${status.color}`}>{status.label}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Format</span><span className="text-white capitalize">{match.match_type.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Overs</span><span className="text-slate-900">{match.overs}</span></div>
            {match.venue && <div className="flex justify-between"><span className="text-slate-500">Venue</span><span className="text-slate-900">{match.venue}</span></div>}
            {match.toss_winner_id && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Toss Won By</span>
                  <span className="text-slate-900">{match.toss_winner_id === match.team1_id ? match.team1?.name : match.team2?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Elected to</span>
                  <span className="text-white capitalize">{match.toss_decision}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'scorecard' && <ScorecardTab matchId={mid} />}

      {/* Toss Modal */}
      <Modal open={showTossModal} onClose={() => setShowTossModal(false)} title="Record Toss">
        <div className="space-y-4">
          <SelectField label="Toss Winner" value={tossWinner} onChange={e => setTossWinner(e.target.value)} options={[
            { value: '', label: '— Select team —' },
            { value: String(match.team1_id), label: match.team1?.name || `Team ${match.team1_id}` },
            { value: String(match.team2_id), label: match.team2?.name || `Team ${match.team2_id}` },
          ]} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Elected to</label>
            <div className="flex gap-3">
              {(['bat', 'bowl'] as const).map(d => (
                <button key={d} onClick={() => setTossDecision(d)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${tossDecision === d ? 'border-primary-500 bg-primary-600/20 text-primary-300' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                  {d === 'bat' ? '🏏 Bat' : '🎳 Bowl'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowTossModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => recordToss.mutate()} disabled={!tossWinner || recordToss.isPending} className="btn-primary flex-1">
              {recordToss.isPending ? <Spinner size="sm" /> : '🪙 Record Toss'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Playing XI Modal */}
      <Modal open={showXIModal} onClose={() => setShowXIModal(false)} title={`Set Playing XI — ${xiTeamId === match.team1_id ? match.team1?.name : match.team2?.name}`}>
        <p className="text-xs text-slate-400 mb-3">Select exactly 11 players ({selectedPlayers.length}/11)</p>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {xiTeamPlayers?.map((p: any) => (
            <label key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-colors">
              <input type="checkbox"
                checked={selectedPlayers.includes(p.id)}
                onChange={e => setSelectedPlayers(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                className="w-4 h-4 accent-primary-600"
              />
              <div>
                <div className="font-medium text-slate-900 text-sm">{p.full_name || p.username || `Player #${p.id}`}</div>
                <div className="text-xs text-slate-500">{p.username ? `@${p.username}` : ''}{p.jersey_number ? ` · #${p.jersey_number}` : ''}</div>
              </div>
            </label>
          ))}
          {(!xiTeamPlayers || xiTeamPlayers.length === 0) && (
            <div className="text-center text-slate-500 py-4">No players in this team</div>
          )}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setShowXIModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => setPlayingXI.mutate()}
            disabled={selectedPlayers.length !== 11 || setPlayingXI.isPending}
            className="btn-primary flex-1"
          >
            {setPlayingXI.isPending ? <Spinner size="sm" /> : `Set XI (${selectedPlayers.length}/11)`}
          </button>
        </div>
      </Modal>
    </div>
  )
}






