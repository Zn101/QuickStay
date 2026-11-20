import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { useSettings } from '../store/settingsStore'
import { useTranslation } from '../lib/i18n'
import { useState, useEffect } from 'react'
import { ConfirmModal } from './ui'
import EmailInboxModal from './EmailInboxModal'
import ChatWidget from './ChatWidget'
import ScrollToTop from './ScrollToTop'
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

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
    `text-sm font-semibold transition-colors ${
      isActive
        ? 'text-sky-600 dark:text-sky-400 font-bold'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-main)] flex flex-col font-sans transition-colors duration-200">
      <ScrollToTop />

      {/* Clean Light Navbar with Dark Mode Support (Reverted nav bar color flip) */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white group">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white text-sm shadow-md transition-transform duration-200 group-hover:scale-105 font-black">
                Q
              </span>
              <span className="tracking-tighter inline-flex items-center">
                Quick<span className="text-sky-600 font-black -ml-0.5">Stay</span>
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={linkClass} end>
              {t('nav_home')}
            </NavLink>
            <NavLink to="/tours" className={linkClass}>
              Tour & Điểm đến
            </NavLink>
            <NavLink to="/restaurants" className={linkClass}>
              Nhà hàng & Ẩm thực
            </NavLink>
            <NavLink to="/news" className={linkClass}>
              Tin tức du lịch
            </NavLink>
            {!user && (
              <NavLink to="/policies" className={linkClass}>
                {t('nav_policies')}
              </NavLink>
            )}
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={linkClass}>
                {t('nav_admin')}
              </NavLink>
            )}
            {user?.role === 'HOTEL_MANAGER' && (
              <NavLink to="/partner" className={linkClass}>
                Cổng Đối tác
              </NavLink>
            )}
            {(user?.role === 'RESTAURANT_OWNER' || user?.role === 'TOUR_OPERATOR') && (
              <NavLink to="/owner" className={linkClass}>
                Cổng Đối tác
              </NavLink>
            )}
          </nav>

          {/* Controls: Language + Dark Mode + Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher Pill: VN / ENG only */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  lang === 'vi' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Tiếng Việt"
              >
                VN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="English"
              >
                ENG
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
              aria-label={darkMode ? t('theme_light') : t('theme_dark')}
              title={darkMode ? t('theme_light') : t('theme_dark')}
            >
              {darkMode ? (
                <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Auth actions with Profile Popup Dropdown */}
            {user ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInbox(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer"
                  title="Hòm thư xác thực & hóa đơn"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{t('nav_inbox')}</span>
                </button>

                {/* Profile Button with Dropdown Popup */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    aria-label="Tài khoản cá nhân"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-white font-bold text-xs shadow-xs">
                      {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                    <span className="font-semibold max-w-[120px] truncate text-xs">{user.fullName || user.email}</span>
                    <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Popup Window: Policies Q&A, My Bookings, Settings */}
                  {profileDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-popup-in"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{user.fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {user.role === 'ADMIN' ? '👑 Quản trị viên' : user.role === 'HOTEL_MANAGER' ? '🏡 Đối tác Lưu trú' : user.role === 'RESTAURANT_OWNER' ? '🍽️ Chủ nhà hàng' : user.role === 'TOUR_OPERATOR' ? '🧭 Đơn vị tour' : '✨ Khách hàng'}
                        </span>
                      </div>

                      <div className="py-1 space-y-0.5 text-xs font-semibold">
                        <Link
                          to="/my-bookings"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-700 transition-colors"
                        >
                          <span>📋</span>
                          <span>{t('nav_my_bookings')}</span>
                        </Link>
                        <Link
                          to="/policies"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-700 transition-colors"
                        >
                          <span>📜</span>
                          <span>Chính sách lưu trú & Q&A</span>
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-700 transition-colors"
                        >
                          <span>⚙️</span>
                          <span>{t('nav_settings')}</span>
                        </Link>
                        {user.role === 'ADMIN' && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors font-bold"
                          >
                            <span>👑</span>
                            <span>Bảng điều khiển Admin</span>
                          </Link>
                        )}
                        {user.role === 'HOTEL_MANAGER' && (
                          <Link
                            to="/partner"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors font-bold"
                          >
                            <span>🏡</span>
                            <span>Trang Đối tác Lưu trú</span>
                          </Link>
                        )}
                        {(user.role === 'RESTAURANT_OWNER' || user.role === 'TOUR_OPERATOR') && (
                          <Link
                            to="/owner"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors font-bold"
                          >
                            <span>{user.role === 'RESTAURANT_OWNER' ? '🍽️' : '🧭'}</span>
                            <span>Cổng Đối tác</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                        <button
                          type="button"
                          onClick={openLogoutModal}
                          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <span>🚪</span>
                          <span>{t('nav_logout')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors px-2.5 py-1.5">
                  {t('nav_login')}
                </Link>
                <Link to="/register" className="rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md cursor-pointer">
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
            {user?.role === 'HOTEL_MANAGER' && <Link to="/partner" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-indigo-400">🏡 Cổng Đối tác Lưu trú</Link>}
            {(user?.role === 'RESTAURANT_OWNER' || user?.role === 'TOUR_OPERATOR') && <Link to="/owner" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-indigo-400">🤝 Cổng Đối tác</Link>}
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

      {/* Footer: chỉ thông tin có thật về sản phẩm */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            <div>
              <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm text-white shadow-md">Q</span>
                <span className="inline-flex items-center tracking-tighter">
                  Quick<span className="-ml-0.5 font-black text-blue-400">Stay</span>
                </span>
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Nền tảng đặt phòng khách sạn, homestay, bàn nhà hàng và tour du lịch. Đối tác tự quản lý phòng, giá và lịch phòng trống.
              </p>
              <p className="mt-4 text-xs">
                <span className="font-bold text-blue-400">Email hỗ trợ: </span>
                <a href="mailto:support@quickstay.io.vn" className="text-slate-300 transition-colors hover:text-blue-400">
                  support@quickstay.io.vn
                </a>
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Khám phá</h4>
              <ul className="mt-3 space-y-2 text-xs">
                <li><Link to="/" className="text-slate-400 transition-colors hover:text-blue-400">Khách sạn & Homestay</Link></li>
                <li><Link to="/restaurants" className="text-slate-400 transition-colors hover:text-blue-400">Nhà hàng & Đặt bàn</Link></li>
                <li><Link to="/tours" className="text-slate-400 transition-colors hover:text-blue-400">Tour & Điểm đến</Link></li>
                <li><Link to="/news" className="text-slate-400 transition-colors hover:text-blue-400">Tin tức du lịch</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Hỗ trợ khách hàng</h4>
              <ul className="mt-3 space-y-2 text-xs">
                <li><Link to="/policies" className="text-slate-400 transition-colors hover:text-blue-400">Điều khoản & Chính sách</Link></li>
                <li><Link to="/policies#huy-phong" className="text-slate-400 transition-colors hover:text-blue-400">Hủy phòng & Hoàn tiền</Link></li>
                <li><Link to="/policies#bao-mat" className="text-slate-400 transition-colors hover:text-blue-400">Bảo mật dữ liệu cá nhân</Link></li>
                <li><Link to="/my-bookings" className="text-slate-400 transition-colors hover:text-blue-400">Quản lý đơn đặt phòng</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Thanh toán</h4>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Thanh toán tại cơ sở khi nhận phòng, hoặc trực tuyến bằng thẻ, chuyển khoản, ví điện tử.
              </p>
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
                Cổng thanh toán trực tuyến đang chạy ở chế độ thử nghiệm: không trừ tiền thật.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 px-4 py-6 text-xs text-slate-500">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 md:flex-row">
            <p>© {new Date().getFullYear()} QuickStay · Dự án đào tạo thực tế (OJT).</p>
            <p className="font-medium text-blue-400">QuickStay — Your stay, your way.</p>
          </div>
        </div>
      </footer>

      {/* Auxiliary Modals & Overlays */}
      <EmailInboxModal isOpen={showInbox} onClose={() => setShowInbox(false)} />
      <ChatWidget />
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
