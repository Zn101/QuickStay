import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
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
      {/* Sidebar */}
      <aside className="flex w-64 flex-col justify-between border-r border-slate-200 bg-white z-10">

        {/* Top Section: Brand & Menu */}
        <div className="flex flex-col gap-6 p-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 px-2 pt-2">
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

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <p className="mb-1 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Quản trị
            </p>
            <NavLink to="/admin" end className={linkClass}>
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
            <NavLink to="/admin/hotels" className={linkClass}>
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
            <NavLink to="/admin/rooms" className={linkClass}>
              {({ isActive }) => (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(isActive)}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                  Loại phòng
                </>
              )}
            </NavLink>
            <NavLink to="/admin/bookings" className={linkClass}>
              {({ isActive }) => (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(isActive)}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                  </svg>
                  Đặt phòng
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
              Về trang khách
            </NavLink>
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-rose-500 group-hover:text-rose-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Đăng xuất
            </button>
          </div>

          {/* User Profile Card */}
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-sm transition-colors hover:bg-slate-100/70 cursor-default">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-200/50 text-sm font-bold text-sky-700 ring-1 ring-sky-200">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-bold text-slate-900">{user?.fullName || 'Admin User'}</p>
              <p className="truncate text-[11px] font-medium text-slate-500">{user?.email || 'admin@hotel.com'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-6 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}