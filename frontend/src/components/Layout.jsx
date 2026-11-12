import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { useSettings } from '../store/settingsStore'
import { useState, useEffect } from 'react'
import { ConfirmModal } from './ui'
import EmailInboxModal from './EmailInboxModal'
import { api } from '../lib/api'

export default function Layout() {
  const { user, logout } = useAuth()
  const { syncFromServer } = useSettings()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showInbox, setShowInbox] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendNotice, setResendNotice] = useState('')

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
      setResendNotice('Đã gửi lại email xác thực!')
      setShowInbox(true)
    } catch {
      setResendNotice('Không thể gửi lại lúc này.')
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
    `text-sm font-medium transition-colors ${isActive ? 'text-sky-600' : 'text-slate-600 hover:text-slate-900'}`

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white text-sm">Q</span>
              Quick<span className="text-sky-600">Stay</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={linkClass} end>Trang chủ</NavLink>
            <NavLink to="/policies" className={linkClass}>Chính sách & Q&A</NavLink>
            {user && <NavLink to="/my-bookings" className={linkClass}>Đặt phòng của tôi</NavLink>}
            {user && <NavLink to="/profile" className={linkClass}>Cài đặt</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin" className={linkClass}>Quản trị</NavLink>}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowInbox(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/80 px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer"
                  title="Xem email xác thực, đặt phòng & biên lai"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Hộp thư
                </button>
                <Link to="/profile" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-sm">
                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="font-medium max-w-[120px] truncate">{user.fullName}</span>
                </Link>
                <button
                  type="button"
                  onClick={openLogoutModal}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Đăng nhập</Link>
                <Link to="/register" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-sky-700 transition-colors">
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
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
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-700">Trang chủ</Link>
            {user && <Link to="/my-bookings" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-700">Đặt phòng của tôi</Link>}
            {user && <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-700">Hồ sơ</Link>}
            {user && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setShowInbox(true) }}
                className="block w-full text-left text-sm font-medium text-sky-600"
              >
                Hộp thư (Email đã gửi)
              </button>
            )}
            {user?.role === 'ADMIN' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-700">Quản trị</Link>}
            {user ? (
              <button type="button" onClick={openLogoutModal} className="block w-full text-left text-sm font-medium text-red-600">
                Đăng xuất
              </button>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-700">Đăng nhập</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 rounded-lg bg-sky-600 py-2 text-center text-sm font-bold text-white">Đăng ký</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Banner nhắc xác thực email cho khách chưa xác thực */}
      {user && user.role === 'CUSTOMER' && user.emailVerified === false && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <span>
              ⚠️ Email <strong>{user.email}</strong> chưa được xác thực.
              {resendNotice && <span className="ml-2 font-semibold text-emerald-700">{resendNotice}</span>}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInbox(true)}
                className="rounded-lg bg-white px-2.5 py-1 font-bold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
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

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-4">
          <span>© {new Date().getFullYear()} QuickStay. Your stay, your way.</span>
          <span>·</span>
          <Link to="/policies" className="font-medium text-slate-500 hover:text-sky-600">
            Chính sách lưu trú & Q&A
          </Link>
        </div>
      </footer>

      <EmailInboxModal isOpen={showInbox} onClose={() => setShowInbox(false)} />

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
