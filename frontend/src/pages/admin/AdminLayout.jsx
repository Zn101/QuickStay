import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-sky-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-100 bg-white p-4 space-y-1">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Quản trị</p>
        <NavLink to="/admin/hotels" className={linkClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
            <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z"/><path d="M9 21v-7h6v7"/>
          </svg>
          Khách sạn
        </NavLink>
        <NavLink to="/admin/rooms" className={linkClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
            <path d="M3 7h18M3 12h18M3 17h18"/>
          </svg>
          Loại phòng
        </NavLink>
        <NavLink to="/admin/bookings" className={linkClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
          </svg>
          Đặt phòng
        </NavLink>

        <div className="border-t border-slate-100 pt-4 mt-4 space-y-1">
          <NavLink to="/" className={({ isActive }) => `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Trang khách
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Đăng xuất
          </button>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2.5 px-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-xs shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-slate-50 p-8">
        <Outlet />
      </main>
    </div>
  )
}
