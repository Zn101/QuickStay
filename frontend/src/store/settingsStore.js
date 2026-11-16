import { create } from 'zustand'
import { api } from '../lib/api'

const SETTINGS_KEY = 'quickstay-settings'
const DEFAULTS = {
  preferredLanguage: 'vi',
  currencyDisplay: 'VND',
  notifyEmail: true,
  notifyPromo: false,
  compactMode: false,
  darkMode: false,
}

function applyDarkMode(isDark) {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    const final = saved ? { ...DEFAULTS, ...saved } : DEFAULTS
    applyDarkMode(final.darkMode)
    return final
  } catch {
    applyDarkMode(false)
    return DEFAULTS
  }
}

export const useSettings = create((set, get) => ({
  ...loadSettings(),

  toggleDarkMode() {
    const nextDark = !get().darkMode
    applyDarkMode(nextDark)
    const next = { ...get(), darkMode: nextDark }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    set({ darkMode: nextDark })
  },

  setLanguage(lang) {
    const next = { ...get(), preferredLanguage: lang }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    set({ preferredLanguage: lang })
  },

  async syncFromServer() {
    try {
      const data = await api('/users/me/settings')
      if (data) {
        const next = { ...DEFAULTS, ...get(), ...data }
        applyDarkMode(next.darkMode)
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
        set(next)
      }
    } catch {
      // ignore if anonymous or offline
    }
  },

  async saveSettings(partial, isLoggedIn) {
    const next = { ...get(), ...partial }
    if (partial.darkMode !== undefined) {
      applyDarkMode(partial.darkMode)
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    set(next)

    if (isLoggedIn) {
      const payload = {
        preferredLanguage: next.preferredLanguage,
        currencyDisplay: next.currencyDisplay,
        notifyEmail: next.notifyEmail,
        notifyPromo: next.notifyPromo,
        compactMode: next.compactMode,
      }
      const saved = await api('/users/me/settings', { method: 'PUT', body: payload })
      if (saved) {
        const updated = { ...next, ...saved }
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
        set(updated)
      }
    }
  },
}))
