import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const link = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-brand-50 font-semibold text-brand-600' : 'text-slate-600 hover:bg-slate-100'}`
  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-brand-600" onClick={close}>
          Quick<span className="text-slate-800">Stay</span>
        </Link>
        <button
          className="rounded-md border px-3 py-1 text-sm md:hidden"
          aria-label="Mở menu"
          onClick={() => setOpen((o) => !o)}
        >
          ☰
        </button>
        <nav
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-1 border-b bg-white p-3 md:static md:flex md:flex-row md:items-center md:border-0 md:p-0`}
        >
          <NavLink to="/" end className={link} onClick={close}>Khách sạn</NavLink>
          {user?.role === 'CUSTOMER' && <NavLink to="/history" className={link} onClick={close}>Lịch sử đặt phòng</NavLink>}
          {user?.role === 'ADMIN' && <NavLink to="/admin" className={link} onClick={close}>Quản trị</NavLink>}
          {user ? (
            <>
              <NavLink to="/profile" className={link} onClick={close}>{user.fullName || user.email}</NavLink>
              <button
                className="btn-outline"
                onClick={() => {
                  logout()
                  close()
                  navigate('/')
                }}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link} onClick={close}>Đăng nhập</NavLink>
              <Link to="/register" className="btn-primary" onClick={close}>Đăng ký</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
