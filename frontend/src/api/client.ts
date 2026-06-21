/**
 * Unified API Client
 * Combines BNI's fetch-based client and CricPro's axios client.
 * BNI components use apiFetch / apiLogin / apiLogout.
 * CricPro components use apiClient (axios).
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// ── Token helpers (BNI style, shared) ─────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem('bni_access_token') ?? localStorage.getItem('access_token')
export const getRefreshToken = () => localStorage.getItem('bni_refresh_token') ?? localStorage.getItem('refresh_token')

export function saveTokens(access: string, refresh: string, role?: string) {
  localStorage.setItem('bni_access_token', access)
  localStorage.setItem('access_token', access)
  localStorage.setItem('bni_refresh_token', refresh)
  localStorage.setItem('refresh_token', refresh)
  if (role) localStorage.setItem('bni_role', role)
}

export function clearTokens() {
  localStorage.removeItem('bni_access_token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('bni_refresh_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('bni_role')
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── BNI fetch-based client ─────────────────────────────────────────────────
let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const rt = getRefreshToken()
    if (!rt) return false
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      })
      if (!res.ok) { clearTokens(); return false }
      const d = await res.json()
      saveTokens(d.access_token, d.refresh_token, d.role)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  _retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined ?? {}),
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401 && !_retried) {
    const ok = await tryRefresh()
    if (ok) return apiFetch<T>(path, options, true)
    clearTokens()
    window.dispatchEvent(new Event('bni-auth-expired'))
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    let msg = res.statusText
    try {
      const body = await res.json() as { message?: string; detail?: string }
      msg = body.message ?? body.detail ?? msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  return res.json() as Promise<T>
}

export async function apiLogin(username: string, password: string): Promise<{ role: string }> {
  const d = await apiFetch<{ access_token: string; refresh_token: string; role: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
  )
  saveTokens(d.access_token, d.refresh_token, d.role)
  return { role: d.role }
}

export async function apiLogout(): Promise<void> {
  const rt = getRefreshToken()
  if (rt) {
    await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: rt }) })
      .catch(() => { /* best-effort */ })
  }
  clearTokens()
}

// ── CricPro axios-based client ─────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

apiClient.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        window.location.href = '/admin/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers!.Authorization = `Bearer ${token}`
          return apiClient(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        saveTokens(data.access_token, data.refresh_token, data.role)
        processQueue(null, data.access_token)
        original.headers!.Authorization = `Bearer ${data.access_token}`
        return apiClient(original)
      } catch (err) {
        processQueue(err, null)
        clearTokens()
        window.location.href = '/admin/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
