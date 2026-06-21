import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playersApi, statsApi } from '@/api/services'
import { Spinner, EmptyState } from '@/components/common'
import toast from 'react-hot-toast'

// ── Shared option lists (used by both the create modal and the edit row) ──
const ROLE_OPTIONS = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper']
const BATTING_OPTIONS = [
  { value: 'Right Hand Bat', label: 'Right Hand' },
  { value: 'Left Hand Bat', label: 'Left Hand' },
]
const BOWLING_OPTIONS = [
  'Right Arm Fast', 'Right Arm Medium', 'Right Arm Spin',
  'Left Arm Fast', 'Left Arm Medium', 'Left Arm Spin',
]

type EditForm = {
  player_role: string; batting_style: string; bowling_style: string;
  jersey_number: number; is_captain: boolean; is_vice_captain: boolean; is_wicket_keeper: boolean;
}

const EMPTY_EDIT: EditForm = {
  player_role: '', batting_style: '', bowling_style: '',
  jersey_number: 0, is_captain: false, is_vice_captain: false, is_wicket_keeper: false,
}

function roleBadgeClass(role?: string) {
  return role === 'Batsman' ? 'bg-blue-100 text-blue-700'
    : role === 'Bowler' ? 'bg-green-100 text-green-700'
    : role === 'All-Rounder' ? 'bg-purple-100 text-purple-700'
    : role === 'Wicket Keeper' ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-600'
}

export default function SAPlayersPage() {
  const [tab, setTab] = useState<'all' | 'batting' | 'bowling'>('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT)
  const [showCreate, setShowCreate] = useState(false)
  const qc = useQueryClient()

  const { data: players = [], isLoading: pLoading } = useQuery({
    queryKey: ['sa-all-players', search],
    queryFn: () => playersApi.list({ search: search || undefined }),
  })

  const updatePlayer = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => playersApi.updateProfile(id, data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-all-players'] })
      toast.success('Player updated!')
      setEditingId(null)
    },
    onError: () => toast.error('Failed to update player'),
  })

  const deletePlayer = useMutation({
    mutationFn: (id: number) => playersApi.remove(id),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['sa-all-players'] })
      toast.success(res?.message || 'Player deleted')
    },
    onError: () => toast.error('Failed to delete player'),
  })

  const { data: batting = [], isLoading: bLoading } = useQuery({
    queryKey: ['sa-batting-lb'],
    queryFn: () => statsApi.battingLeaderboard({ limit: 100 }),
    enabled: tab === 'batting',
  })

  const { data: bowling = [], isLoading: wLoading } = useQuery({
    queryKey: ['sa-bowling-lb'],
    queryFn: () => statsApi.bowlingLeaderboard({ limit: 100 }),
    enabled: tab === 'bowling',
  })

  const isLoading = tab === 'all' ? pLoading : tab === 'batting' ? bLoading : wLoading

  function confirmDelete(p: any) {
    if (window.confirm(`Delete player "${p.full_name || p.username}"? Players with scoring history are deactivated instead of removed.`)) {
      deletePlayer.mutate(p.id)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Players</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {tab === 'all' ? `${(players as any[]).length} registered players` : 'Match performance stats'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search player..."
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 w-52 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          {tab === 'all' && (
            <button onClick={() => setShowCreate(true)}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 whitespace-nowrap">
              + Add Player
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 border border-slate-200 p-1 w-fit">
        {[
          { key: 'all',     label: '👥 All Players' },
          { key: 'batting', label: '🏏 Batting Stats' },
          { key: 'bowling', label: '🎳 Bowling Stats' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tab === 'all' ? (
        /* ── All Players ── */
        (players as any[]).length === 0 ? (
          <EmptyState icon="👤" title="No players found" description="No player profiles registered yet" />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Player</th>
                  <th className="text-left px-4 py-3">Team</th>
                  <th className="text-center px-3 py-3">Jersey</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Batting</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Bowling</th>
                  <th className="text-center px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(players as any[]).map((p: any, i: number) => (
                  editingId === p.id ? (
                    <tr key={p.id} className="bg-amber-50">
                      <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2">
                        <div className="font-semibold text-slate-900 text-sm">{p.full_name || p.username}</div>
                        <div className="flex gap-2 mt-1">
                          <label className="flex items-center gap-1 text-[10px] text-slate-600">
                            <input type="checkbox" checked={editForm.is_captain}
                              onChange={e => setEditForm(f => ({ ...f, is_captain: e.target.checked, is_vice_captain: e.target.checked ? false : f.is_vice_captain }))} />
                            Captain (C)
                          </label>
                          <label className="flex items-center gap-1 text-[10px] text-slate-600">
                            <input type="checkbox" checked={editForm.is_vice_captain}
                              onChange={e => setEditForm(f => ({ ...f, is_vice_captain: e.target.checked, is_captain: e.target.checked ? false : f.is_captain }))} />
                            Vice (VC)
                          </label>
                          <label className="flex items-center gap-1 text-[10px] text-slate-600">
                            <input type="checkbox" checked={editForm.is_wicket_keeper}
                              onChange={e => setEditForm(f => ({ ...f, is_wicket_keeper: e.target.checked }))} />
                            WK
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-600">{p.team ?? '—'}</td>
                      <td className="px-3 py-2">
                        <input type="number" value={editForm.jersey_number || ''} onChange={e => setEditForm(f => ({ ...f, jersey_number: Number(e.target.value) }))}
                          className="w-14 rounded border border-slate-300 px-1.5 py-1 text-xs text-center" placeholder="#" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={editForm.player_role} onChange={e => setEditForm(f => ({ ...f, player_role: e.target.value }))}
                          className="rounded border border-slate-300 px-2 py-1 text-xs">
                          <option value="">—</option>
                          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell">
                        <select value={editForm.batting_style} onChange={e => setEditForm(f => ({ ...f, batting_style: e.target.value }))}
                          className="rounded border border-slate-300 px-2 py-1 text-xs">
                          <option value="">—</option>
                          {BATTING_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell">
                        <select value={editForm.bowling_style} onChange={e => setEditForm(f => ({ ...f, bowling_style: e.target.value }))}
                          className="rounded border border-slate-300 px-2 py-1 text-xs">
                          <option value="">—</option>
                          {BOWLING_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => updatePlayer.mutate({ id: p.id, data: editForm })}
                            className="rounded bg-green-600 px-2 py-1 text-[10px] font-bold text-white">Save</button>
                          <button onClick={() => setEditingId(null)}
                            className="rounded bg-slate-300 px-2 py-1 text-[10px] font-bold text-slate-700">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {p.full_name || p.username}
                          {p.is_captain && <span className="rounded bg-yellow-100 text-yellow-800 px-1.5 py-0.5 text-[10px] font-bold">C</span>}
                          {p.is_vice_captain && <span className="rounded bg-sky-100 text-sky-800 px-1.5 py-0.5 text-[10px] font-bold">VC</span>}
                          {p.is_wicket_keeper && <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">WK</span>}
                        </div>
                        <div className="text-xs text-slate-400">@{p.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-primary-50 border border-primary-200 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                          {p.team ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold text-slate-700">#{p.jersey_number ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass(p.player_role)}`}>
                          {p.player_role || 'Unset'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{p.batting_style ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{p.bowling_style ?? '—'}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => {
                            setEditingId(p.id)
                            setEditForm({
                              player_role: p.player_role || '',
                              batting_style: p.batting_style || '',
                              bowling_style: p.bowling_style || '',
                              jersey_number: p.jersey_number || 0,
                              is_captain: p.is_captain || false,
                              is_vice_captain: p.is_vice_captain || false,
                              is_wicket_keeper: p.is_wicket_keeper || false,
                            })
                          }} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
                            ✏️ Edit
                          </button>
                          <button onClick={() => confirmDelete(p)}
                            className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'batting' ? (
        /* ── Batting Stats ── */
        (batting as any[]).length === 0 ? (
          <EmptyState icon="🏏" title="No batting stats yet" description="Stats appear once matches are scored" />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
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
                  <tr key={p.player_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                    <td className="px-4 py-3"><div className="font-semibold text-slate-900">{p.player_name}</div><div className="text-xs text-slate-400">@{p.username}</div></td>
                    <td className="px-3 py-3 text-center text-slate-600">{p.innings}</td>
                    <td className="px-3 py-3 text-center font-bold text-primary-600">{p.total_runs}</td>
                    <td className="px-3 py-3 text-center text-slate-700">{p.highest_score}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{p.average}</td>
                    <td className="px-3 py-3 text-center text-blue-500">{p.fours}</td>
                    <td className="px-3 py-3 text-center text-purple-500">{p.sixes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ── Bowling Stats ── */
        (bowling as any[]).length === 0 ? (
          <EmptyState icon="🎳" title="No bowling stats yet" description="Stats appear once matches are scored" />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Player</th>
                  <th className="text-center px-3 py-3">Inn</th>
                  <th className="text-center px-3 py-3">Wkts</th>
                  <th className="text-center px-3 py-3">Runs</th>
                  <th className="text-center px-3 py-3">Overs</th>
                  <th className="text-center px-3 py-3">Econ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(bowling as any[]).map((p: any, i: number) => (
                  <tr key={p.player_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                    <td className="px-4 py-3"><div className="font-semibold text-slate-900">{p.player_name}</div><div className="text-xs text-slate-400">@{p.username}</div></td>
                    <td className="px-3 py-3 text-center text-slate-600">{p.innings}</td>
                    <td className="px-3 py-3 text-center font-bold text-primary-600">{p.total_wickets}</td>
                    <td className="px-3 py-3 text-center text-slate-700">{p.total_runs_conceded}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{p.overs_bowled}</td>
                    <td className="px-3 py-3 text-center text-green-600">{p.economy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {showCreate && (
        <CreatePlayerModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['sa-all-players'] })
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}

// ── Create Player Modal ────────────────────────────────────────────────────
function CreatePlayerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [userSearch, setUserSearch] = useState('')
  const [form, setForm] = useState({
    user_id: '', team_id: '', player_role: '', batting_style: '', bowling_style: '',
    jersey_number: 0, is_captain: false, is_vice_captain: false, is_wicket_keeper: false,
  })

  const { data: teams = [] } = useQuery({ queryKey: ['cricpro-teams'], queryFn: () => playersApi.teams() })
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['cricpro-users', userSearch],
    queryFn: () => playersApi.users(userSearch || undefined),
  })

  const create = useMutation({
    mutationFn: () => playersApi.create({
      user_id: form.user_id,
      team_id: form.team_id || null,
      player_role: form.player_role || undefined,
      batting_style: form.batting_style || undefined,
      bowling_style: form.bowling_style || undefined,
      jersey_number: form.jersey_number || undefined,
      is_captain: form.is_captain,
      is_vice_captain: form.is_vice_captain,
      is_wicket_keeper: form.is_wicket_keeper,
    }),
    onSuccess: () => { toast.success('Player created!'); onCreated() },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to create player'),
  })

  function submit() {
    if (!form.user_id) { toast.error('Select a user to link this player to'); return }
    create.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Add Player</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">User *</label>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search user by name / username / email…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2" />
            <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">{usersLoading ? 'Loading users…' : '— Select user —'}</option>
              {(users as any[]).map(u => (
                <option key={u.id} value={u.id}>{(u.full_name || u.username)} (@{u.username})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Team</label>
              <select value={form.team_id} onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">— No team —</option>
                {(teams as any[]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jersey #</label>
              <input type="number" value={form.jersey_number || ''} onChange={e => setForm(f => ({ ...f, jersey_number: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. 7" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
              <select value={form.player_role} onChange={e => setForm(f => ({ ...f, player_role: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">—</option>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Batting</label>
              <select value={form.batting_style} onChange={e => setForm(f => ({ ...f, batting_style: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">—</option>
                {BATTING_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bowling</label>
              <select value={form.bowling_style} onChange={e => setForm(f => ({ ...f, bowling_style: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">—</option>
                {BOWLING_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_captain}
                onChange={e => setForm(f => ({ ...f, is_captain: e.target.checked, is_vice_captain: e.target.checked ? false : f.is_vice_captain }))} />
              Captain (C)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_vice_captain}
                onChange={e => setForm(f => ({ ...f, is_vice_captain: e.target.checked, is_captain: e.target.checked ? false : f.is_captain }))} />
              Vice Captain (VC)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_wicket_keeper}
                onChange={e => setForm(f => ({ ...f, is_wicket_keeper: e.target.checked }))} />
              Wicket Keeper
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
          <button onClick={submit} disabled={create.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            {create.isPending ? 'Creating…' : 'Create Player'}
          </button>
        </div>
      </div>
    </div>
  )
}
