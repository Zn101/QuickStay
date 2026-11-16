import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { useSettings } from '../store/settingsStore'
import { useTranslation } from '../lib/i18n'
import { useState, useEffect } from 'react'
import { ConfirmModal } from './ui'
import EmailInboxModal from './EmailInboxModal'
import ChatWidget from './ChatWidget'
import ScrollToTop from './ScrollToTop'
import AdCornerPopup from './AdCornerPopup'
import CookieConsentBanner from './CookieConsentBanner'
import { api } from '../lib/api'

export default function Layout() {
  const { user, logout } = useAuth()
  const { syncFromServer, darkMode, toggleDarkMode } = useSettings()
  const { t, lang, setLanguage, isEnglish } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showInbox, setShowInbox] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendNotice, setResendNotice] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)

  function handleSubscribeNewsletter(e) {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setNewsletterSuccess(true)
    setNewsletterEmail('')
    setTimeout(() => setNewsletterSuccess(false), 5000)
  }

  useEffect(() => {
    if (user) {
      syncFromServer()
    }
  }, [user, syncFromServer])

  async function handleQuickResend() {
    if (!user?.email || resending) return
    setResending(true)
    setResendNotice('')
    try {
      await api('/auth/resend-verification', { method: 'POST', body: { email: user.email } })
      setResendNotice(isEnglish ? 'Verification email resent!' : 'Đã gửi lại email xác thực!')
      setShowInbox(true)
    } catch {
      setResendNotice(isEnglish ? 'Failed to resend right now.' : 'Không thể gửi lại lúc này.')
    } finally {
      setResending(false)
    }
  }

  function openLogoutModal() {
    setMenuOpen(false)
    setShowLogoutConfirm(true)
  }

  function handleConfirmLogout() {
    setShowLogoutConfirm(false)
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? 'text-blue-400 font-bold drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]'
        : 'text-slate-300 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-main)] flex flex-col font-sans transition-colors duration-200">
      <ScrollToTop />

      {/* Inverted Navbar: Sleek Dark Background (#020617 / slate-950) */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-white group">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white text-sm shadow-md transition-transform duration-200 group-hover:scale-105">
                Q
              </span>
              <span className="tracking-tighter inline-flex items-center text-white">
                Quick<span className="text-blue-400 font-black -ml-0.5">Stay</span>
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={linkClass} end>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                {t('nav_home')}
              </span>
            </NavLink>
            <NavLink to="/policies" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('nav_policies')}
              </span>
            </NavLink>
            {user && (
              <NavLink to="/my-bookings" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  {t('nav_my_bookings')}
                </span>
              </NavLink>
            )}
            {user && (
              <NavLink to="/profile" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {t('nav_settings')}
                </span>
              </NavLink>
            )}
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                  {t('nav_admin')}
                </span>
              </NavLink>
            )}
          </nav>

          {/* Controls: Language + Dark Mode + Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs font-bold text-slate-400">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  lang === 'vi' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-slate-200'
                }`}
                title="Tiếng Việt"
              >
                🇻🇳 VN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-slate-200'
                }`}
                title="English"
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-amber-300 hover:border-slate-700 transition-colors cursor-pointer"
              aria-label={darkMode ? t('theme_light') : t('theme_dark')}
              title={darkMode ? t('theme_light') : t('theme_dark')}
            >
              {darkMode ? (
                /* Sun Icon */
                <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                /* Moon Icon */
                <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Auth actions */}
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowInbox(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-950/60 px-2.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/60 transition-colors cursor-pointer"
                  title="Xem email xác thực, đặt phòng & biên lai"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('nav_inbox')}
                </button>
                <Link to="/profile" className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-sm">
                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="font-medium max-w-[120px] truncate">{user.fullName}</span>
                </Link>
                <button
                  type="button"
                  onClick={openLogoutModal}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  {t('nav_logout')}
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-2 py-1.5">
                  {t('nav_login')}
                </Link>
                <Link to="/register" className="btn-liquid-glass rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm">
                  {t('nav_register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="m18 6-12 12M6 6l12 12"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-800/80 bg-slate-950 px-4 py-4 space-y-3 animate-popup-in">
            {/* Mobile Language and Dark Mode Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setLanguage('vi')}
                  className={`px-2.5 py-1 rounded font-bold ${lang === 'vi' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  VN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded font-bold ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  EN
                </button>
              </div>

              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300"
              >
                <span>{darkMode ? '☀️ ' + t('theme_light') : '🌙 ' + t('theme_dark')}</span>
              </button>
            </div>

            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-300 hover:text-white">{t('nav_home')}</Link>
            <Link to="/policies" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-300 hover:text-white">{t('nav_policies')}</Link>
            {user && <Link to="/my-bookings" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-300 hover:text-white">{t('nav_my_bookings')}</Link>}
            {user && <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-300 hover:text-white">{t('nav_profile')}</Link>}
            {user && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setShowInbox(true) }}
                className="block w-full text-left text-sm font-medium text-blue-400"
              >
                {t('nav_inbox')}
              </button>
            )}
            {user?.role === 'ADMIN' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-amber-300">{t('nav_admin')}</Link>}
            {user ? (
              <button type="button" onClick={openLogoutModal} className="block w-full text-left text-sm font-medium text-red-400 pt-2 border-t border-slate-800">
                {t('nav_logout')}
              </button>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-center text-sm font-medium text-slate-200">
                  {t('nav_login')}
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-liquid-glass flex-1 rounded-xl py-2.5 text-center text-sm font-bold text-white">
                  {t('nav_register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Verification notice for unverified customer */}
      {user && user.role === 'CUSTOMER' && user.emailVerified === false && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/40 px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <span>
              ⚠️ Email <strong>{user.email}</strong> chưa được xác thực.
              {resendNotice && <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">{resendNotice}</span>}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInbox(true)}
                className="rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1 font-bold text-amber-900 dark:text-amber-200 ring-1 ring-amber-300 dark:ring-amber-700 hover:bg-amber-100 dark:hover:bg-slate-700"
              >
                Mở hộp thư để xác thực
              </button>
              <button
                type="button"
                disabled={resending}
                onClick={handleQuickResend}
                className="rounded-lg bg-amber-600 px-2.5 py-1 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {resending ? 'Đang gửi...' : 'Gửi lại email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Enterprise Professional Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-300 border-t border-slate-800/80">
        {/* Newsletter subscription strip */}
        <div className="border-b border-slate-800/80 bg-gradient-to-r from-blue-950/40 via-slate-950 to-blue-900/30">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/30 mb-2">
                  ✨ Ưu đãi đặc quyền thành viên
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Tiết kiệm đến 20% cho chuyến đi tiếp theo
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Đăng ký email để nhận mã giảm giá độc quyền, thông báo phòng trống giờ chót và gợi ý du lịch từ QuickStay.
                </p>
              </div>

              <form onSubmit={handleSubscribeNewsletter} className="w-full md:w-auto flex flex-col sm:flex-row gap-2 max-w-md">
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Nhập email của bạn..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-liquid-glass rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md whitespace-nowrap cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </form>
            </div>
            {newsletterSuccess && (
              <div className="mt-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 p-2.5 text-center text-xs font-medium text-emerald-300 animate-popup-in">
                🎉 Cảm ơn bạn! Mã voucher <span className="font-bold text-white">QUICKSTAY20</span> giảm 20% đã được ghi nhận cho email của bạn.
              </div>
            )}
          </div>
        </div>

        {/* Main 4-column directory */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Col 1: Về QuickStay & Liên hệ */}
            <div>
              <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white text-sm shadow-md">
                  Q
                </span>
                <span className="tracking-tighter inline-flex items-center">Quick<span className="text-blue-400 font-black -ml-0.5">Stay</span></span>
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Hệ thống đặt phòng khách sạn và khu nghỉ dưỡng hàng đầu Việt Nam. Mang đến kỳ nghỉ trọn vẹn với giá tốt nhất, xác nhận tức thì và dịch vụ chăm sóc 24/7.
              </p>
              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">Hotline 24/7:</span>
                  <a href="tel:19006868" className="font-semibold text-white hover:text-blue-400 transition-colors">1900 6868</a>
                  <span className="text-slate-500">·</span>
                  <a href="tel:02873006868" className="hover:text-blue-400 transition-colors">(028) 7300 6868</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">Email hỗ trợ:</span>
                  <a href="mailto:support@quickstay.io.vn" className="text-slate-300 hover:text-blue-400 transition-colors">support@quickstay.io.vn</a>
                </div>
                <div className="text-slate-400 text-[11px] leading-relaxed pt-1">
                  📍 <strong className="text-slate-300">Trụ sở:</strong> Tòa nhà QuickStay Tower, 182 Lê Duẩn, Hải Châu, Đà Nẵng
                </div>
              </div>
            </div>

            {/* Col 2: Điểm đến nổi tiếng */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Điểm Đến Hàng Đầu</h4>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <Link to="/?city=Đà Nẵng" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>Khách sạn Đà Nẵng</span>
                    <span className="text-[10px] text-slate-500">Bãi biển Mỹ Khê</span>
                  </Link>
                </li>
                <li>
                  <Link to="/?city=Hà Nội" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>Khách sạn Hà Nội</span>
                    <span className="text-[10px] text-slate-500">Phố cổ & Hồ Gươm</span>
                  </Link>
                </li>
                <li>
                  <Link to="/?city=Hồ Chí Minh" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>Khách sạn TP. Hồ Chí Minh</span>
                    <span className="text-[10px] text-slate-500">Trung tâm Quận 1</span>
                  </Link>
                </li>
                <li>
                  <Link to="/?city=Phú Quốc" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>Khách sạn Phú Quốc</span>
                    <span className="text-[10px] text-blue-400">Khu nghỉ dưỡng biển</span>
                  </Link>
                </li>
                <li>
                  <Link to="/?city=Nha Trang" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>Khách sạn Nha Trang</span>
                    <span className="text-[10px] text-slate-500">Mặt biển Trần Phú</span>
                  </Link>
                </li>
                <li>
                  <Link to="/?city=Đà Lạt" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>Khách sạn & Villa Đà Lạt</span>
                    <span className="text-[10px] text-slate-500">Rừng thông</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Dịch vụ & Chính sách */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Dịch Vụ & Hỗ Trợ</h4>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <Link to="/policies" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Chính sách lưu trú & Câu hỏi Q&A
                  </Link>
                </li>
                <li>
                  <Link to="/policies" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Chính sách hủy phòng & Hoàn tiền tự động
                  </Link>
                </li>
                <li>
                  <Link to="/policies" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Điều khoản sử dụng dịch vụ & Bảo mật
                  </Link>
                </li>
                <li>
                  <Link to="/my-bookings" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Tra cứu & Quản lý đơn đặt phòng
                  </Link>
                </li>
                <li className="pt-2 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  Dịch vụ Concierge
                </li>
                <li>
                  <span className="text-slate-400">Đưa đón sân bay 4 - 7 chỗ & VIP Limousine</span>
                </li>
                <li>
                  <span className="text-slate-400">Buffet ẩm thực & Phục vụ phòng 24/7</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Thanh toán & Chứng nhận tin cậy */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Thanh Toán & Chứng Nhận</h4>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                Thanh toán linh hoạt, tức thì qua cổng thanh toán bảo mật tiêu chuẩn quốc tế:
              </p>

              {/* Payment badges */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['VietQR', 'Visa', 'Mastercard', 'JCB', 'MoMo', 'VNPay', 'ZaloPay', 'Tiền mặt'].map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-300 shadow-xs"
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Security badges */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-[11px] text-emerald-400">
                  <span>🔒</span>
                  <span className="font-semibold text-slate-200">Bảo mật SSL 256-bit DigiCert CA</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-[11px] text-blue-400">
                  <span>🛡️</span>
                  <span className="font-semibold text-slate-200">Chứng nhận PCI-DSS Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Legal & Copyright */}
        <div className="border-t border-slate-900 bg-slate-950 px-4 py-6 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-left text-[11px] text-slate-500 max-w-2xl">
              <p>
                <strong>CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ DỊCH VỤ DU LỊCH QUICKSTAY</strong> · GPĐKKD số: <strong>0104850587</strong> do Sở Kế hoạch và Đầu tư TP. Hà Nội cấp ngày 02/11/2026.
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <p>© {new Date().getFullYear()} QuickStay Corporation. All rights reserved.</p>
              <p className="mt-0.5 text-blue-400 font-medium">QuickStay — Your stay, your way.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Auxiliary Modals & Overlays */}
      <EmailInboxModal isOpen={showInbox} onClose={() => setShowInbox(false)} />
      <ChatWidget />
      <AdCornerPopup />
      <CookieConsentBanner />

      {/* Modal xác nhận Đăng xuất */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Bạn có muốn đăng xuất không?"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại trên QuickStay không?"
        confirmText="Đăng xuất"
        cancelText="Ở lại"
        danger={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}
