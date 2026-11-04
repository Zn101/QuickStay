import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../store/authStore'
import { ErrorBox } from '../components/ui'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState('general') // 'general' | 'security'

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const body = {}
    if (form.fullName) body.fullName = form.fullName
    if (form.phone !== undefined) body.phone = form.phone
    if (form.email) body.email = form.email
    if (form.password.length >= 6) body.password = form.password
    setBusy(true)
    try {
      const updated = await api('/users/me', { method: 'PUT', body })
      setUser(updated)
      setSuccess('Cập nhật hồ sơ thành công!')
      setForm((f) => ({ ...f, password: '' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 pl-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10'

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      {/* Profile Header Card with Cover Background */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Decorative Cover Gradient */}
        <div className="h-32 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 px-6 pt-6">
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {user?.role === 'ADMIN' ? 'Quản trị viên hệ thống' : 'Thành viên hoạt động'}
            </span>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-6 pt-0">
          <div className="relative -mt-12 mb-4 flex items-end justify-between">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-sky-100 text-sky-700 text-3xl font-black shadow-md">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {user?.fullName || 'Người dùng'}
            </h1>
            <p className="text-sm font-medium text-slate-500">{user?.email}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-100 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`border-b-2 py-3.5 text-sm font-bold transition ${activeTab === 'general'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            Thông tin chung
          </button>
        </div>
      </div>

      {/* Form Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa thông tin tài khoản</h2>
          <p className="text-sm text-slate-500">Cập nhật thông tin cá nhân và bảo mật tài khoản của bạn.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {error && <ErrorBox message={error} />}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          {/* Họ và tên */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Họ và tên
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={set('fullName')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Số điện thoại
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                type="tel"
                placeholder="0912 345 678"
                value={form.phone}
                onChange={set('phone')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Địa chỉ Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={set('email')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Mật khẩu mới{' '}
              <span className="font-normal lowercase text-slate-400">(để trống nếu không đổi)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={set('password')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Nút submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-sky-600 py-3.5 text-sm font-bold text-white hover:bg-sky-700 active:scale-[0.99] transition-all shadow-md shadow-sky-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu thay đổi...
                </span>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}