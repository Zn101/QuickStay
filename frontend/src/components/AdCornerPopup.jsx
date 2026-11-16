import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../lib/i18n'

export default function AdCornerPopup() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Show popup after 1.5s delay if not dismissed in session
    const isDismissed = sessionStorage.getItem('quickstay_ad_dismissed') === 'true'
    if (isDismissed) return

    const timer = setTimeout(() => {
      setVisible(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  function handleDismiss() {
    setVisible(false)
    setDismissed(true)
    sessionStorage.setItem('quickstay_ad_dismissed', 'true')
  }

  if (!visible || dismissed) return null

  return (
    <aside
      aria-label="Promotional Announcement"
      className="fixed bottom-6 left-6 z-40 max-w-xs sm:max-w-sm rounded-2xl border border-blue-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-blue-900/60 dark:bg-slate-900/95 dark:shadow-[0_0_30px_rgba(37,99,235,0.25)] animate-popup-in"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-blue-100 dark:bg-blue-950">
          <img
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=250&q=80"
            alt="Ưu đãi du lịch QuickStay"
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
          />
          <span className="absolute bottom-0 inset-x-0 bg-blue-600 py-0.5 text-center text-[9px] font-black uppercase text-white tracking-wider">
            -20%
          </span>
        </div>

        <div className="flex-1 min-w-0 pr-5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800">
              {t('ad_badge')}
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
            {t('ad_title')}
          </h4>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {t('ad_desc')}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <Link
              to="/?q=Resort"
              onClick={handleDismiss}
              className="btn-liquid-glass rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-xs"
            >
              {t('ad_cta')}
            </Link>
            <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-1 rounded border border-blue-200/50 dark:border-blue-800">
              QUICKSTAY20
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label={t('ad_dismiss')}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
