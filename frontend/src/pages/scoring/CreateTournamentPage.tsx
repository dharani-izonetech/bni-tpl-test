import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { tournamentsApi } from '@/api/services'
import { InputField, SelectField, TextareaField, Spinner } from '@/components/common'
import toast from 'react-hot-toast'

export default function CreateTournamentPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', description: '', format: 'league', start_date: '', end_date: '',
    venue: '', city: '', overs_per_innings: 20, max_teams: 8,
    entry_fee: '', prize_money: '', rules: '', is_public: true,
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const create = useMutation({
    mutationFn: () => tournamentsApi.create({
      ...form,
      overs_per_innings: Number(form.overs_per_innings),
      max_teams: Number(form.max_teams),
      entry_fee: form.entry_fee ? Number(form.entry_fee) : undefined,
      prize_money: form.prize_money ? Number(form.prize_money) : undefined,
      end_date: form.end_date || undefined,
    } as any),
    onSuccess: (t) => { toast.success('Tournament created! 🏆'); navigate(`/tournaments/${t.id}`) },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Create Tournament</h1>
        <p className="text-slate-400 text-sm mt-1">Set up a new cricket tournament</p>
      </div>
      <div className="card space-y-5">
        <InputField label="Tournament Name *" placeholder="e.g. Premier League 2024" value={form.name} onChange={set('name')} required />
        <TextareaField label="Description" placeholder="About the tournament..." value={form.description} onChange={set('description')} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Format *" value={form.format} onChange={set('format')} options={[
            { value: 'league', label: 'League' },
            { value: 'knockout', label: 'Knockout' },
            { value: 'league_knockout', label: 'League + Knockout' },
            { value: 'round_robin', label: 'Round Robin' },
          ]} />
          <InputField label="Overs per Innings *" type="number" min={1} max={100} value={form.overs_per_innings} onChange={set('overs_per_innings')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Start Date *" type="datetime-local" value={form.start_date} onChange={set('start_date')} required />
          <InputField label="End Date" type="datetime-local" value={form.end_date} onChange={set('end_date')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Max Teams" type="number" min={2} max={32} value={form.max_teams} onChange={set('max_teams')} />
          <InputField label="Venue" placeholder="Stadium name" value={form.venue} onChange={set('venue')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="City" placeholder="City name" value={form.city} onChange={set('city')} />
          <InputField label="Entry Fee (₹)" type="number" min={0} placeholder="0 = Free" value={form.entry_fee} onChange={set('entry_fee')} />
        </div>
        <InputField label="Prize Money (₹)" type="number" min={0} value={form.prize_money} onChange={set('prize_money')} />
        <TextareaField label="Rules & Regulations" placeholder="Tournament rules..." value={form.rules} onChange={set('rules')} />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="w-4 h-4 accent-primary-500" />
          <span className="text-sm text-slate-300">Public tournament (visible to all)</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => create.mutate()} disabled={!form.name || !form.start_date || create.isPending} className="btn-primary flex-1">
            {create.isPending ? <Spinner size="sm" /> : '🏆 Create Tournament'}
          </button>
        </div>
      </div>
    </div>
  )
}
