import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { matchesApi, teamsApi, tournamentsApi } from '@/api/services'
import { InputField, SelectField, Spinner } from '@/components/common'
import toast from 'react-hot-toast'

export default function CreateMatchPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    team1_id: '', team2_id: '', tournament_id: '',
    venue: '', match_date: '', overs: 20, match_type: 'league',
  })
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => teamsApi.list() })
  const { data: tournaments } = useQuery({ queryKey: ['tournaments'], queryFn: () => tournamentsApi.list() })

  const create = useMutation({
    mutationFn: () => matchesApi.create({
      team1_id: form.team1_id,
      team2_id: form.team2_id,
      tournament_id: form.tournament_id || undefined,
      venue: form.venue || undefined,
      match_date: form.match_date || undefined,
      overs: Number(form.overs),
      match_type: form.match_type,
    } as any),
    onSuccess: (m: any) => {
      toast.success('Match created!')
      navigate(`/match/${m.id}`)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Failed to create match'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    },
  })

  const teamOptions = [{ value: '', label: '— Select team —' }, ...(teams || []).map((t: { id: number; name: string }) => ({ value: String(t.id), label: t.name }))]
  const tournamentOptions = [{ value: '', label: '— No tournament —' }, ...(tournaments || []).map((t: { id: number; name: string }) => ({ value: String(t.id), label: t.name }))]

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Create Match</h1>
        <p className="text-slate-500 text-sm mt-1">Schedule a new cricket match</p>
      </div>
      <div className="card space-y-5">
        <SelectField label="Team 1 *" value={form.team1_id} onChange={set('team1_id')} options={teamOptions} />
        <SelectField label="Team 2 *" value={form.team2_id} onChange={set('team2_id')} options={teamOptions} />
        <SelectField label="Tournament (optional)" value={form.tournament_id} onChange={set('tournament_id')} options={tournamentOptions} />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Overs" type="number" min={1} max={100} value={form.overs} onChange={set('overs')} />
          <SelectField label="Match Type" value={form.match_type} onChange={set('match_type')} options={[
            { value: 'league', label: 'League' },
            { value: 'quarter_final', label: 'Quarter Final' },
            { value: 'semi_final', label: 'Semi Final' },
            { value: 'final', label: 'Final' },
            { value: 'practice', label: 'Practice' },
          ]} />
        </div>
        <InputField label="Venue" placeholder="Ground name" value={form.venue} onChange={set('venue')} />
        <InputField label="Schedule Date & Time" type="datetime-local" value={form.match_date} onChange={set('match_date')} />
        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.team1_id || !form.team2_id || form.team1_id === form.team2_id || create.isPending}
            className="btn-primary flex-1"
          >
            {create.isPending ? <Spinner size="sm" /> : '🏏 Create Match'}
          </button>
        </div>
      </div>
    </div>
  )
}

