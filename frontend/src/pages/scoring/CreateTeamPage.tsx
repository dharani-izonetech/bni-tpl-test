import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { teamsApi } from '@/api/services'
import { InputField, TextareaField, Spinner } from '@/components/common'
import toast from 'react-hot-toast'

export default function CreateTeamPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', short_name: '', city: '', description: '' })
  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  const create = useMutation({
    mutationFn: () => teamsApi.create(form),
    onSuccess: (t) => { toast.success('Team created! 🏏'); navigate(`/teams/${t.id}`) },
  })

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Create Team</h1>
        <p className="text-slate-400 text-sm mt-1">Build your cricket squad</p>
      </div>
      <div className="card space-y-5">
        <InputField label="Team Name *" placeholder="e.g. Mumbai Warriors" value={form.name} onChange={set('name')} required />
        <InputField label="Short Name" placeholder="e.g. MW (max 10 chars)" maxLength={10} value={form.short_name} onChange={set('short_name')} />
        <InputField label="City" placeholder="e.g. Mumbai" value={form.city} onChange={set('city')} />
        <TextareaField label="Description" placeholder="About your team..." value={form.description} onChange={set('description')} />
        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => create.mutate()} disabled={!form.name || create.isPending} className="btn-primary flex-1">
            {create.isPending ? <Spinner size="sm" /> : '👥 Create Team'}
          </button>
        </div>
      </div>
    </div>
  )
}
