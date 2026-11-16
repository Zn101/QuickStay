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
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="mx-auto max-w-4xl pointer-events-auto rounded-3xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.15)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_0_35px_rgba(37,99,235,0.2)] animate-popup-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 text-xl shadow-inner">
              🍪
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('cookie_title')}
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('cookie_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => handleChoice('declined')}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('cookie_decline')}
            </button>
            <button
              type="button"
              onClick={() => handleChoice('accepted')}
              className="btn-liquid-glass rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
            >
              {t('cookie_accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
