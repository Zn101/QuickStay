import { useState, useEffect } from 'react'
import { useTranslation } from '../lib/i18n'

export default function CookieConsentBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('quickstay_cookie_consent')
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleChoice(choice) {
    localStorage.setItem('quickstay_cookie_consent', choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Cookie Consent"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 pointer-events-none max-w-sm sm:max-w-md"
    >
      <div className="pointer-events-auto rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 animate-popup-in">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/80 dark:text-sky-400 text-lg shadow-inner">
            🍪
          </span>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {t('cookie_title')}
            </h4>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('cookie_desc')}
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleChoice('declined')}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('cookie_decline')}
              </button>
              <button
                type="button"
                onClick={() => handleChoice('accepted')}
                className="btn-liquid-glass rounded-lg px-3 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer"
              >
                {t('cookie_accept')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
