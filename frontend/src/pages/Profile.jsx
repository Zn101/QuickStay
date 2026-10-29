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
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100'

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 text-2xl font-extrabold">
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{user?.fullName}</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className="mt-1 inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
            {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-bold text-slate-900">Cập nhật hồ sơ</h2>

        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorBox message={error} />}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên</label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={set('fullName')}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại</label>
            <input
              type="tel"
              placeholder="0912 345 678"
              value={form.phone}
              onChange={set('phone')}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={set('email')}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Mật khẩu mới <span className="font-normal text-slate-400">(để trống nếu không đổi)</span>
            </label>
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              onChange={set('password')}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-sky-600 py-3.5 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {busy ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  )
}
