import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
    setMenuOpen(false)
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
            {user && <NavLink to="/my-bookings" className={linkClass}>Đặt phòng của tôi</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin" className={linkClass}>Quản trị</NavLink>}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-sm">
                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="font-medium max-w-[120px] truncate">{user.fullName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
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
            {user?.role === 'ADMIN' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-700">Quản trị</Link>}
            {user ? (
              <button onClick={handleLogout} className="block w-full text-left text-sm font-medium text-red-600">Đăng xuất</button>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-700">Đăng nhập</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 rounded-lg bg-sky-600 py-2 text-center text-sm font-bold text-white">Đăng ký</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} QuickStay. Your stay, your way.
      </footer>
    </div>
  )
}
