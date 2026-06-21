/**
 * Score Editor — manually add/edit player scores for any match innings.
 * Flow: Select Match → Select/Start Innings → Add Batting Scores & Bowling Figures
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchesApi } from '@/api/services'
import { playersApi } from '@/api/services'
import { Spinner, EmptyState, Modal, InputField, SelectField } from '@/components/common'
import { formatOvers } from '@/utils'
import apiClient from '@/api/client'
import toast from 'react-hot-toast'

const DISMISSALS = ['bowled','caught','lbw','run_out','stumped','hit_wicket','retired_hurt']

export default function ScoreEditorPage() {
  const [matchId, setMatchId] = useState('')
  const [selectedInningsId, setSelectedInningsId] = useState<number | null>(null)
  const [editingBat, setEditingBat] = useState<any>(null)
  const [editingBowl, setEditingBowl] = useState<any>(null)
  const [addingBat, setAddingBat] = useState(false)
  const [addingBowl, setAddingBowl] = useState(false)
  const [newBat, setNewBat] = useState({ batsman_id: '', runs: 0, balls_faced: 0, fours: 0, sixes: 0, is_out: false, dismissal_type: '' })
  const [newBowl, setNewBowl] = useState({ bowler_id: '', overs: 0, maidens: 0, runs: 0, wickets: 0, wides: 0, no_balls: 0 })
  const qc = useQueryClient()

  // Load all matches
  const { data: matches = [], isLoading: mLoading, error: mError } = useQuery({
    queryKey: ['sa-matches-all'],
    queryFn: () => matchesApi.list({ page_size: 100 } as any),
    retry: 2,
  })

  // Load scorecard for selected match
  const { data: scorecard = [], isLoading: scLoading } = useQuery({
    queryKey: ['sa-scorecard', matchId],
    queryFn: () => matchesApi.getScorecard(matchId),
    enabled: !!matchId,
  })

  // Load ALL players for the dropdowns (striker/non-striker/bowler)
  const { data: allPlayers = [] } = useQuery({
    queryKey: ['all-players'],
    queryFn: () => playersApi.list(),
  })

  // Get selected match info
  const selectedMatch = (matches as any[]).find(m => String(m.id) === matchId)

  // Add batting score
  const addBat = useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/scoring/innings/${selectedInningsId}/batting`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-scorecard', matchId] }); toast.success('Batting score added'); setAddingBat(false); setNewBat({ batsman_id: '', runs: 0, balls_faced: 0, fours: 0, sixes: 0, is_out: false, dismissal_type: '' }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to add'),
  })

  // Update batting score
  const updateBat = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.patch(`/scoring/batting/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-scorecard', matchId] }); toast.success('Updated'); setEditingBat(null) },
    onError: () => toast.error('Update failed'),
  })

  // Add bowling figure
  const addBowl = useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/scoring/innings/${selectedInningsId}/bowling`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-scorecard', matchId] }); toast.success('Bowling figure added'); setAddingBowl(false); setNewBowl({ bowler_id: '', overs: 0, maidens: 0, runs: 0, wickets: 0, wides: 0, no_balls: 0 }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to add'),
  })

  // Update bowling figure
  const updateBowl = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.patch(`/scoring/bowling/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-scorecard', matchId] }); toast.success('Updated'); setEditingBowl(null) },
    onError: () => toast.error('Update failed'),
  })

  // Complete innings
  const completeInnings = useMutation({
    mutationFn: () => apiClient.post(`/scoring/innings/${selectedInningsId}/complete`).then(r => r.data),
    onSuccess: (d: any) => { qc.invalidateQueries({ queryKey: ['sa-scorecard', matchId] }); toast.success(d.message || 'Innings completed!') },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed'),
  })

  // Recalculate totals
  const recalculate = useMutation({
    mutationFn: () => apiClient.post(`/scoring/innings/${selectedInningsId}/recalculate`).then(r => r.data),
    onSuccess: (d: any) => { qc.invalidateQueries({ queryKey: ['sa-scorecard', matchId] }); toast.success(`Totals: ${d.total_runs}/${d.total_wickets} (${d.total_overs} ov)`) },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed'),
  })

  // Start innings
  const startInnings = useMutation({
    mutationFn: () => matchesApi.startInnings(matchId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-scorecard', matchId] }); toast.success('Innings started!') },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed'),
  })

  const playerOptions = (allPlayers as any[]).map(p => ({ value: String(p.id), label: `${p.full_name || p.username} (${p.team ?? '?'}) #${p.jersey_number ?? '—'}` }))

  const selectedInnings = (scorecard as any[]).find(sc => sc.innings.id === selectedInningsId)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Score Editor</h1>
        <p className="text-slate-500 text-sm mt-0.5">Add and edit player batting & bowling scores for any match</p>
      </div>

      {/* Step 1: Select Match */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Step 1 — Select Match</h2>
        {mLoading ? <Spinner /> : mError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            Failed to load matches. Make sure you're logged in as admin.
            <br /><span className="text-xs text-red-400">{String(mError)}</span>
          </div>
        ) : (matches as any[]).length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            No matches found. Create a match first from the <strong>Matches</strong> tab.
          </div>
        ) : (
          <select
            value={matchId}
            onChange={e => { setMatchId(e.target.value); setSelectedInningsId(null) }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">— Choose a match to edit scores —</option>
            {(matches as any[]).map(m => (
              <option key={m.id} value={m.id}>
                {m.team1?.name ?? `Team ${m.team1_id}`} vs {m.team2?.name ?? `Team ${m.team2_id}`}
                {m.status === 'live' ? ' 🔴 LIVE' : m.status === 'completed' ? ' ✅' : ` (${m.status})`}
              </option>
            ))}
          </select>
        )}
        {matchId && !mLoading && (
          <div className="mt-3 flex items-center gap-3">
            <Link to={`/match/${matchId}`} className="text-xs text-primary-600 hover:text-primary-800 font-medium">View scorecard →</Link>
            {selectedMatch?.status === 'toss' && (
              <button onClick={() => startInnings.mutate()} disabled={startInnings.isPending}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700">
                {startInnings.isPending ? <Spinner size="sm" /> : '▶ Start Innings'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 2: No innings yet */}
      {matchId && !scLoading && (scorecard as any[]).length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-500 text-sm">No innings yet. Start the match from the <strong>Matches</strong> tab (set toss first, then start innings).</p>
          <Link to="/scoring-admin/matches" className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">Go to Matches →</Link>
        </div>
      )}

      {/* Step 3: Select Innings */}
      {matchId && (scorecard as any[]).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Step 2 — Select Innings</h2>
          <div className="flex gap-2">
            {(scorecard as any[]).map((sc: any) => (
              <button key={sc.innings.id}
                onClick={() => setSelectedInningsId(sc.innings.id)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  selectedInningsId === sc.innings.id
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}>
                Innings {sc.innings.innings_number}
                <span className="ml-2 text-xs font-normal">
                  {sc.innings.batting_team?.name ?? `Team ${sc.innings.batting_team_id}`}
                  — {sc.innings.total_runs}/{sc.innings.total_wickets} ({formatOvers(sc.innings.total_overs)} ov)
                </span>
              </button>
            ))}
          </div>
          {/* Action buttons for selected innings */}
          {selectedInningsId && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
              <Link to={`/scoring/matches/${matchId}/live`}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 flex items-center gap-1">
                🏏 Ball-by-Ball Scoring
              </Link>
              <button onClick={() => recalculate.mutate()} disabled={recalculate.isPending}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                {recalculate.isPending ? <Spinner size="sm" /> : '🔄 Recalculate Totals'}
              </button>
              <button onClick={() => completeInnings.mutate()} disabled={completeInnings.isPending}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                {completeInnings.isPending ? <Spinner size="sm" /> : '✅ Complete Innings'}
              </button>
              {selectedMatch?.status === 'innings_break' && (
                <button onClick={() => startInnings.mutate()} disabled={startInnings.isPending}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700">
                  {startInnings.isPending ? <Spinner size="sm" /> : '▶ Start 2nd Innings'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Edit scores for selected innings */}
      {selectedInnings && (
        <div className="space-y-4">
          {/* Batting */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">🏏 Batting Scores</h3>
              <button onClick={() => setAddingBat(true)}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700">
                + Add Batsman
              </button>
            </div>
            {selectedInnings.batting.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">No batting records yet. Click "+ Add Batsman" to add scores.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedInnings.batting.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{b.batsman?.user?.full_name ?? `Player #${b.batsman_id}`}</div>
                      <div className="text-xs text-slate-500">
                        <span className="font-bold text-slate-800">{b.runs}</span>({b.balls_faced}) · 4s:{b.fours} · 6s:{b.sixes}
                        {b.is_out ? ` · ${b.dismissal_type?.replace(/_/g,' ')}` : ' · not out'}
                      </div>
                    </div>
                    <button onClick={() => setEditingBat({ ...b })}
                      className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100">✏️ Edit</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bowling */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">🎳 Bowling Figures</h3>
              <button onClick={() => setAddingBowl(true)}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700">
                + Add Bowler
              </button>
            </div>
            {selectedInnings.bowling.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">No bowling records yet. Click "+ Add Bowler" to add figures.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedInnings.bowling.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{b.bowler?.user?.full_name ?? `Player #${b.bowler_id}`}</div>
                      <div className="text-xs text-slate-500">
                        {formatOvers(b.overs)} ov · <span className="font-bold text-slate-800">{b.wickets}</span>/{b.runs}
                        · Econ:{b.economy_rate?.toFixed(2)} · Wd:{b.wides} · Nb:{b.no_balls}
                      </div>
                    </div>
                    <button onClick={() => setEditingBowl({ ...b })}
                      className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100">✏️ Edit</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Batting Modal ── */}
      <Modal open={addingBat} onClose={() => setAddingBat(false)} title="Add Batting Score">
        <div className="space-y-4">
          <SelectField label="Batsman *" value={newBat.batsman_id} onChange={e => setNewBat(p => ({ ...p, batsman_id: e.target.value }))} options={playerOptions} placeholder="— Select player —" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Runs" type="number" min={0} value={newBat.runs} onChange={e => setNewBat(p => ({ ...p, runs: Number(e.target.value) }))} />
            <InputField label="Balls Faced" type="number" min={0} value={newBat.balls_faced} onChange={e => setNewBat(p => ({ ...p, balls_faced: Number(e.target.value) }))} />
            <InputField label="Fours (4s)" type="number" min={0} value={newBat.fours} onChange={e => setNewBat(p => ({ ...p, fours: Number(e.target.value) }))} />
            <InputField label="Sixes (6s)" type="number" min={0} value={newBat.sixes} onChange={e => setNewBat(p => ({ ...p, sixes: Number(e.target.value) }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newBat.is_out} onChange={e => setNewBat(p => ({ ...p, is_out: e.target.checked }))} className="w-4 h-4 accent-red-500" />
            <span className="text-sm text-slate-700">Player is out</span>
          </label>
          {newBat.is_out && (
            <SelectField label="Dismissal" value={newBat.dismissal_type} onChange={e => setNewBat(p => ({ ...p, dismissal_type: e.target.value }))} options={DISMISSALS.map(d => ({ value: d, label: d.replace(/_/g,' ') }))} placeholder="— Select —" />
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setAddingBat(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={() => addBat.mutate({ batsman_id: Number(newBat.batsman_id), runs: newBat.runs, balls_faced: newBat.balls_faced, fours: newBat.fours, sixes: newBat.sixes, is_out: newBat.is_out, dismissal_type: newBat.dismissal_type || null, batting_position: selectedInnings?.batting.length + 1 })}
              disabled={!newBat.batsman_id || addBat.isPending}
              className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">
              {addBat.isPending ? <Spinner size="sm" /> : 'Add Score'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Add Bowling Modal ── */}
      <Modal open={addingBowl} onClose={() => setAddingBowl(false)} title="Add Bowling Figure">
        <div className="space-y-4">
          <SelectField label="Bowler *" value={newBowl.bowler_id} onChange={e => setNewBowl(p => ({ ...p, bowler_id: e.target.value }))} options={playerOptions} placeholder="— Select player —" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Overs" type="number" min={0} step={0.1} value={newBowl.overs} onChange={e => setNewBowl(p => ({ ...p, overs: Number(e.target.value) }))} />
            <InputField label="Maidens" type="number" min={0} value={newBowl.maidens} onChange={e => setNewBowl(p => ({ ...p, maidens: Number(e.target.value) }))} />
            <InputField label="Runs Conceded" type="number" min={0} value={newBowl.runs} onChange={e => setNewBowl(p => ({ ...p, runs: Number(e.target.value) }))} />
            <InputField label="Wickets" type="number" min={0} max={10} value={newBowl.wickets} onChange={e => setNewBowl(p => ({ ...p, wickets: Number(e.target.value) }))} />
            <InputField label="Wides" type="number" min={0} value={newBowl.wides} onChange={e => setNewBowl(p => ({ ...p, wides: Number(e.target.value) }))} />
            <InputField label="No Balls" type="number" min={0} value={newBowl.no_balls} onChange={e => setNewBowl(p => ({ ...p, no_balls: Number(e.target.value) }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setAddingBowl(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={() => addBowl.mutate({ bowler_id: Number(newBowl.bowler_id), overs: newBowl.overs, maidens: newBowl.maidens, runs: newBowl.runs, wickets: newBowl.wickets, wides: newBowl.wides, no_balls: newBowl.no_balls })}
              disabled={!newBowl.bowler_id || addBowl.isPending}
              className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">
              {addBowl.isPending ? <Spinner size="sm" /> : 'Add Figure'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Batting Modal ── */}
      <Modal open={!!editingBat} onClose={() => setEditingBat(null)} title="Edit Batting Score">
        {editingBat && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">{editingBat.batsman?.user?.full_name ?? `Player #${editingBat.batsman_id}`}</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Runs" type="number" min={0} value={editingBat.runs} onChange={e => setEditingBat((p: any) => ({ ...p, runs: Number(e.target.value) }))} />
              <InputField label="Balls Faced" type="number" min={0} value={editingBat.balls_faced} onChange={e => setEditingBat((p: any) => ({ ...p, balls_faced: Number(e.target.value) }))} />
              <InputField label="Fours" type="number" min={0} value={editingBat.fours} onChange={e => setEditingBat((p: any) => ({ ...p, fours: Number(e.target.value) }))} />
              <InputField label="Sixes" type="number" min={0} value={editingBat.sixes} onChange={e => setEditingBat((p: any) => ({ ...p, sixes: Number(e.target.value) }))} />
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editingBat.is_out} onChange={e => setEditingBat((p: any) => ({ ...p, is_out: e.target.checked }))} className="accent-red-500" /><span className="text-sm">Out</span></label>
            {editingBat.is_out && <SelectField label="Dismissal" value={editingBat.dismissal_type ?? ''} onChange={e => setEditingBat((p: any) => ({ ...p, dismissal_type: e.target.value }))} options={DISMISSALS.map(d => ({ value: d, label: d.replace(/_/g,' ') }))} placeholder="— Select —" />}
            <div className="flex gap-3">
              <button onClick={() => setEditingBat(null)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm text-slate-600">Cancel</button>
              <button onClick={() => updateBat.mutate({ id: editingBat.id, data: { runs: editingBat.runs, balls_faced: editingBat.balls_faced, fours: editingBat.fours, sixes: editingBat.sixes, is_out: editingBat.is_out, dismissal_type: editingBat.dismissal_type } })} disabled={updateBat.isPending} className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white hover:bg-primary-700">{updateBat.isPending ? <Spinner size="sm" /> : 'Save'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Bowling Modal ── */}
      <Modal open={!!editingBowl} onClose={() => setEditingBowl(null)} title="Edit Bowling Figure">
        {editingBowl && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">{editingBowl.bowler?.user?.full_name ?? `Player #${editingBowl.bowler_id}`}</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Overs" type="number" min={0} step={0.1} value={editingBowl.overs} onChange={e => setEditingBowl((p: any) => ({ ...p, overs: Number(e.target.value) }))} />
              <InputField label="Maidens" type="number" min={0} value={editingBowl.maidens} onChange={e => setEditingBowl((p: any) => ({ ...p, maidens: Number(e.target.value) }))} />
              <InputField label="Runs" type="number" min={0} value={editingBowl.runs} onChange={e => setEditingBowl((p: any) => ({ ...p, runs: Number(e.target.value) }))} />
              <InputField label="Wickets" type="number" min={0} value={editingBowl.wickets} onChange={e => setEditingBowl((p: any) => ({ ...p, wickets: Number(e.target.value) }))} />
              <InputField label="Wides" type="number" min={0} value={editingBowl.wides} onChange={e => setEditingBowl((p: any) => ({ ...p, wides: Number(e.target.value) }))} />
              <InputField label="No Balls" type="number" min={0} value={editingBowl.no_balls} onChange={e => setEditingBowl((p: any) => ({ ...p, no_balls: Number(e.target.value) }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingBowl(null)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm text-slate-600">Cancel</button>
              <button onClick={() => updateBowl.mutate({ id: editingBowl.id, data: { overs: editingBowl.overs, maidens: editingBowl.maidens, runs: editingBowl.runs, wickets: editingBowl.wickets, wides: editingBowl.wides, no_balls: editingBowl.no_balls } })} disabled={updateBowl.isPending} className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white hover:bg-primary-700">{updateBowl.isPending ? <Spinner size="sm" /> : 'Save'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
