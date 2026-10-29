import { create } from 'zustand'
import { api, AUTH_KEY } from '../lib/api'

const EMPTY = { token: null, user: null }

;['quickstay_mock_mode', 'quickstay_mock_hotels', 'quickstay_mock_rooms', 'quickstay_mock_bookings', 'quickstay_mock_users'].forEach(
  (k) => localStorage.removeItem(k),
)

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
    if (!saved?.token || saved.token.startsWith('mock-jwt-token')) {
      localStorage.removeItem(AUTH_KEY)
      return EMPTY
    }
    return saved
  } catch {
    return EMPTY
  }
}

const persist = (state) => localStorage.setItem(AUTH_KEY, JSON.stringify(state))

export const useAuth = create((set, get) => ({
  ...load(),

  async login(email, password) {
    const res = await api('/auth/login', { method: 'POST', body: { email, password } })
    persist({ token: res.token, user: res.user })
    set({ token: res.token, user: res.user })
    return res.user
  },

  async register(payload) {
    const res = await api('/auth/register', { method: 'POST', body: payload })
    persist({ token: res.token, user: res.user })
    set({ token: res.token, user: res.user })
    return res.user
  },

  setUser(user) {
    persist({ token: get().token, user })
    set({ user })
  },

  logout() {
    localStorage.removeItem(AUTH_KEY)
    set({ token: null, user: null })
  },
}))
