import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authApi } from '@/api/services'
import type { AuthState, User } from '@/types'

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const tokens = await authApi.login(email, password)
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    const user = await authApi.me()
    return { tokens, user }
  }
)

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  const refreshToken = localStorage.getItem('refresh_token') || ''
  try { await authApi.logout(refreshToken) } catch {}
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
})

export const fetchMeThunk = createAsyncThunk('auth/fetchMe', async () => {
  return authApi.me()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.isAuthenticated = true
    },
    clearAuth(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginThunk.pending, state => { state.isLoading = true })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.tokens.access_token
        state.refreshToken = action.payload.tokens.refresh_token
        state.isAuthenticated = true
      })
      .addCase(loginThunk.rejected, state => { state.isLoading = false })
      .addCase(logoutThunk.fulfilled, state => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
  },
})

export const { setUser, clearAuth } = authSlice.actions
export default authSlice.reducer
