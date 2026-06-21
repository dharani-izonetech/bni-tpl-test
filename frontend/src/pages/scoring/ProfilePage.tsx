import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/services'
import { Avatar, Spinner, InputField } from '@/components/common'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { setUser } from '@/store/slices/authSlice'
import { formatDate } from '@/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user } = useAppSelector(s => s.auth)
  const dispatch = useAppDispatch()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    batting_style: user?.batting_style || '',
    bowling_style: user?.bowling_style || '',
  })

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: (updated) => {
      dispatch(setUser(updated))
      toast.success('Profile updated!')
      setEditing(false)
    },
  })

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => authApi.uploadPhoto(file),
    onSuccess: (updated) => { dispatch(setUser(updated)); toast.success('Photo updated!') },
  })

  if (!user) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group">
            <Avatar name={user.full_name} photo={user.profile_photo} size="xl" />
            <label className="absolute inset-0 rounded-full bg-black/40 hidden group-hover:flex items-center justify-center cursor-pointer text-white text-xs">
              📸 Change
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) uploadPhoto.mutate(e.target.files[0]) }} />
            </label>
            {uploadPhoto.isPending && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Spinner size="sm" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-900">{user.full_name}</h1>
            <p className="text-slate-500">@{user.username}</p>
            <p className="text-slate-500 text-sm mt-0.5">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded border border-primary-200">
                {user.role}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border ${user.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button onClick={() => setEditing(e => !e)} className="btn-secondary text-sm shrink-0">
            {editing ? '✕ Cancel' : '✏️ Edit'}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="card space-y-4">
          <h2 className="font-bold text-slate-900">Edit Profile</h2>
          <InputField label="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          <InputField label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="input resize-none" rows={3} placeholder="Tell something about yourself..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Batting Style" value={form.batting_style} onChange={e => setForm(f => ({ ...f, batting_style: e.target.value }))} placeholder="e.g. Right-hand bat" />
            <InputField label="Bowling Style" value={form.bowling_style} onChange={e => setForm(f => ({ ...f, bowling_style: e.target.value }))} placeholder="e.g. Right-arm fast" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="btn-primary flex-1">
              {updateProfile.isPending ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card space-y-3">
          <h2 className="font-bold text-slate-900 mb-2">About</h2>
          {user.bio && <p className="text-slate-600 text-sm">{user.bio}</p>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {user.batting_style && (
              <div><span className="text-slate-500">Batting: </span><span className="text-slate-900 font-medium">{user.batting_style}</span></div>
            )}
            {user.bowling_style && (
              <div><span className="text-slate-500">Bowling: </span><span className="text-slate-900 font-medium">{user.bowling_style}</span></div>
            )}
            {user.phone && (
              <div><span className="text-slate-500">Phone: </span><span className="text-slate-900 font-medium">{user.phone}</span></div>
            )}
            <div><span className="text-slate-500">Member since: </span><span className="text-slate-900 font-medium">{formatDate(user.created_at)}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
