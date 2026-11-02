import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { ErrorBox, FieldError } from '../components/ui'

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-200 hover:border-slate-300 focus:border-sky-500 focus:ring-sky-100'
  }`

export default function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setErrors({})
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'ADMIN' ? '/admin' : '/')
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors)
      } else if (err?.status === 401) {
        setErrors({ password: err.message || 'Sai email hoặc mật khẩu' })
      } else {
        setError(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
      <div className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden rounded-[28px] bg-[#f7f9fc] text-slate-900 lg:grid lg:grid-cols-2">
        <div className="relative hidden min-h-[650px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0f172a] p-12 text-white lg:flex xl:p-16">
          <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-[420px] w-[420px] rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6"><path d="M3 10.5 12 3l9 7.5V21H3V10.5Z"/><path d="M9 21v-7h6v7"/></svg>
            </div>
            <span className="text-2xl font-extrabold tracking-tight">QuickStay<span className="text-cyan-300">.</span></span>
          </div>
          <div className="relative max-w-lg">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300" /> Không gian lưu trú dành cho bạn
            </div>
            <h2 className="text-5xl font-bold leading-[1.15] tracking-tight xl:text-6xl">Mỗi chuyến đi,<br /><span className="text-cyan-300">một trải nghiệm</span><br />đáng nhớ.</h2>
            <p className="mt-7 max-w-md text-lg leading-8 text-sky-100/85">Khám phá nơi lưu trú phù hợp, quản lý đặt phòng dễ dàng và tận hưởng hành trình theo cách của bạn.</p>
            <div className="mt-10 grid max-w-md grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"><div className="mb-2 text-2xl">⌂</div><p className="font-semibold">Lưu trú tiện lợi</p><p className="mt-1 text-sm text-sky-100/70">Tìm kiếm nhanh chóng</p></div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"><div className="mb-2 text-2xl">✦</div><p className="font-semibold">Trải nghiệm mượt mà</p><p className="mt-1 text-sm text-sky-100/70">Đặt phòng dễ dàng</p></div>
            </div>
          </div>
          <p className="relative text-sm text-sky-100/60">© {new Date().getFullYear()} QuickStay. Your stay, your way.</p>
        </div>

        <div className="flex min-h-[650px] items-center justify-center px-5 py-14 sm:px-10 lg:px-12 xl:px-20">
          <div className="w-full max-w-[430px]">
            <div className="mb-10 flex items-center gap-2 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-700 text-white">⌂</div><span className="text-2xl font-extrabold tracking-tight">QuickStay<span className="text-sky-600">.</span></span></div>
            <div className="mb-9">
              <div className="mb-4 inline-flex rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-sky-700">Chào mừng trở lại</div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Đăng nhập tài khoản</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">Nhập thông tin của bạn để tiếp tục cùng QuickStay.</p>
            </div>

            <form onSubmit={submit} noValidate className="space-y-5">
              <ErrorBox message={error} />
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Địa chỉ email</label>
                <input id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com" aria-invalid={!!errors.email} aria-describedby="email-error" className={inputClass(errors.email)} value={form.email} onChange={set('email')} />
                <FieldError id="email-error" message={errors.email} />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Nhập mật khẩu" aria-invalid={!!errors.password} aria-describedby="password-error" className={`${inputClass(errors.password)} pr-16`} value={form.password} onChange={set('password')} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} className="absolute inset-y-0 right-3 my-auto h-9 rounded-lg px-2 text-xs font-semibold text-sky-700 hover:bg-sky-50">{showPassword ? 'Ẩn' : 'Hiện'}</button>
                </div>
                <FieldError id="password-error" message={errors.password} />
              </div>
              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-700/20 transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
                {!busy && <span aria-hidden="true">→</span>}
              </button>
            </form>
            <div className="mt-8 border-t border-slate-200 pt-7 text-center text-sm text-slate-500">Chưa có tài khoản? <Link to="/register" className="font-bold text-sky-700 hover:text-sky-900 hover:underline">Đăng ký ngay</Link></div>
            <p className="mt-10 text-center text-xs text-slate-400">Đăng nhập an toàn · Trải nghiệm tiện lợi</p>
          </div>
        </div>
      </div>
  )
}
