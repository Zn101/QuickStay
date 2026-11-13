import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { api } from '../../lib/api'
import { ConfirmModal } from '../../components/ui'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    function updateClock() {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    api('/admin/bookings')
      .then((res) => {
        if (Array.isArray(res)) {
          const count = res.filter((b) => b.status === 'PENDING').length
          setPendingCount(count)
        }
      })
      .catch(() => {})
  }, [])

  function openLogoutModal() {
    setMobileMenuOpen(false)
    setShowLogoutConfirm(true)
  }

  function handleConfirmLogout() {
    setShowLogoutConfirm(false)
    logout()
    navigate('/')
  }

  // Cấu hình style cho menu link
  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
      ? 'bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100/50'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`

  const iconClass = (isActive) =>
    `h-5 w-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
    }`

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'
        }`}
      >
        {/* Top Section: Brand & Menu */}
        <div className="flex flex-col gap-6 p-4">
          {/* Brand Logo & Mobile Close */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight text-slate-900">Hotel<span className="text-sky-600">Admin</span></h2>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <p className="mb-1 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Quản trị
            </p>
            <NavLink to="/admin" end className={linkClass} onClick={() => setMobileMenuOpen(false)}>
              {({ isActive }) => (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(isActive)}>
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                  Tổng quan
                </>
              )}
            </NavLink>
            <NavLink to="/admin/hotels" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
              {({ isActive }) => (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(isActive)}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-7h6v7" />
                  </svg>
                  Khách sạn
                </>
              )}
            </NavLink>
            <NavLink to="/admin/rooms" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
              {({ isActive }) => (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(isActive)}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                  Loại phòng
                </>
              )}
            </NavLink>
            <NavLink to="/admin/bookings" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
              {({ isActive }) => (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(isActive)}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                  </svg>
                  <span className="flex-1">Đặt phòng</span>
                  {pendingCount > 0 && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white shadow-xs animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
            <NavLink to="/admin/emails" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
              {({ isActive }) => (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(isActive)}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Nhật ký Email</span>
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Bottom Section: Footer Actions & Profile */}
        <div className="flex flex-col gap-2 p-4">
          <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
            <NavLink
              to="/"
              className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Về trang khách</span>
              <span className="ml-auto text-[10px] font-bold uppercase rounded bg-sky-50 text-sky-600 px-1.5 py-0.5">Live</span>
            </NavLink>
            <button
              type="button"
              onClick={openLogoutModal}
              className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-rose-500 group-hover:text-rose-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>

          {/* User Profile Card */}
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-sm transition-colors hover:bg-slate-100/70 cursor-default">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-200/50 text-sm font-bold text-sky-700 ring-1 ring-sky-200">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-bold text-slate-900">{user?.fullName || 'Admin User'}</p>
              <p className="truncate text-[11px] font-medium text-slate-500">{user?.email || 'admin@quickstay.io.vn'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Desktop Bar */}
        <header className="hidden md:flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Hệ thống vận hành (Live)
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono font-medium text-slate-500">
              Hà Nội (GMT+7) {currentTime}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 transition-all cursor-pointer"
            >
              <span>🌐 Mở Trang Khách Hàng (QuickStay)</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </NavLink>
            <div className="h-4 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
              👑 Quản trị viên
            </span>
          </div>
        </header>

        {/* Top Mobile Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white font-bold text-xs">
              QS
            </div>
            <span className="font-bold text-sm text-slate-800">Hotel Admin</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Mở menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modal xác nhận Đăng xuất */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Bạn có muốn đăng xuất không?"
        message="Bạn có chắc chắn muốn kết thúc phiên làm việc Quản trị viên hiện tại không?"
        confirmText="Đăng xuất"
        cancelText="Ở lại"
        danger={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}
