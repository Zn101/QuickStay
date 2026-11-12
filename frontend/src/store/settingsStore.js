import { create } from 'zustand'
import { api } from '../lib/api'

const SETTINGS_KEY = 'quickstay-settings'
const DEFAULTS = {
  preferredLanguage: 'vi',
  currencyDisplay: 'VND',
  notifyEmail: true,
  notifyPromo: false,
  compactMode: false,
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    return saved ? { ...DEFAULTS, ...saved } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export const useSettings = create((set, get) => ({
  ...loadSettings(),

  async syncFromServer() {
    try {
      const data = await api('/users/me/settings')
      if (data) {
        const next = { ...DEFAULTS, ...data }
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
        set(next)
      }
    } catch {
      // ignore if anonymous or offline
    }
  },

  async saveSettings(partial, isLoggedIn) {
    const next = { ...get(), ...partial }
    const payload = {
      preferredLanguage: next.preferredLanguage,
      currencyDisplay: next.currencyDisplay,
      notifyEmail: next.notifyEmail,
      notifyPromo: next.notifyPromo,
      compactMode: next.compactMode,
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload))
    set(payload)
    if (isLoggedIn) {
      const saved = await api('/users/me/settings', { method: 'PUT', body: payload })
      if (saved) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved))
        set(saved)
      }
    }
  },
}))
