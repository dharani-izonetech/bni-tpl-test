/**
 * PlayerLoginPage — dedicated login for players to view their performance.
 * Uses the same /auth/login endpoint but stores token in Redux + localStorage.
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/redux'
import { loginThunk } from '@/store/slices/authSlice'
import { saveTokens } from '@/api/client'
import apiClient from '@/api/client'
import toast from 'react-hot-toast'

export default function PlayerLoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { toast.error('Enter username and password'); return }
    setLoading(true)
    try {
      // Call login directly via apiClient (uses username not email)
      const { data } = await apiClient.post('/auth/login', { username, password })
      saveTokens(data.access_token, data.refresh_token, data.role)
      // Fetch user profile and store in Redux
      const { data: user } = await apiClient.get('/auth/me')
      dispatch({ type: 'auth/fetchMe/fulfilled', payload: user })
      toast.success(`Welcome, ${user.full_name || user.username}!`)
      navigate('/player/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Invalid credentials'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-3xl shadow-lg mb-4">
            🏏
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Player Login</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to view your performance stats</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. raj_azpire"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Test credentials hint */}
          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-xs font-semibold text-amber-800 mb-2">Test Player Accounts</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-amber-700">
              <span>raj_azpire</span><span>vijay_bmk</span>
              <span>arun_chp</span><span>kumar_dyn</span>
              <span>anbu_emp</span><span>deepak_chp</span>
            </div>
            <p className="text-xs text-amber-600 mt-2">Password: <strong>Player@1234</strong></p>
          </div>
        </div>

        <div className="text-center mt-6 space-y-2">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to Cricket Site</Link>
          <br />
          <Link to="/admin/login" className="text-xs text-slate-400 hover:text-slate-600">Admin Login →</Link>
        </div>
      </div>
    </div>
  )
}
