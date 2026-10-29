import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { ErrorBox } from '../components/ui'

const Icon = ({ name, className = 'h-5 w-5' }) => {
  const paths = {
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8L7.1 10a16 16 0 0 0 6.9 6.9l1.5-1.9a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 1.7 2Z"/>,
    lock: <><rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff: <><path d="m3 3 18 18M10.6 5.1A11.3 11.3 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.2 4.1M6.1 6.1C3.5 8 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.1-.8"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    star: <path d="m12 2 3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1L12 2Z"/>,
  }
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export default function Register() {
  const register = useAuth((s) => s.register)
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự')
    setBusy(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err?.message || 'Đã có lỗi xảy ra')
    } finally {
      setBusy(false)
    }
  }
  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
  return (
      <main className="relative isolate min-h-[calc(100vh-80px)] overflow-hidden bg-[#f5f7fb] px-4 py-8 sm:px-6 lg:py-12">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_25px_90px_-30px_rgba(15,23,42,0.28)] lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="relative hidden min-h-[710px] flex-col justify-between overflow-hidden bg-[#102d55] p-10 text-white lg:flex xl:p-12">
            <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85)' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#092345]/85 via-[#092345]/35 to-[#071b36]/95" />
            <div className="relative z-10 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black ring-1 ring-white/25">Q</span>
              <span className="text-2xl font-extrabold tracking-tight">Quick<span className="text-sky-300">Stay</span></span>
            </div>
            <div className="relative z-10 max-w-md">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide backdrop-blur-sm"><Icon name="star" className="h-4 w-4 text-amber-300" /> HÀNH TRÌNH MỚI BẮT ĐẦU</div>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">Mỗi chuyến đi,<br/><span className="text-sky-300">một trải nghiệm</span><br/>đáng nhớ.</h2>
              <p className="mt-6 max-w-sm text-base leading-7 text-slate-200">Tạo tài khoản QuickStay để khám phá những điểm lưu trú tuyệt vời và lên kế hoạch cho hành trình tiếp theo.</p>
            </div>
            <div className="relative z-10 flex items-center gap-3 border-t border-white/20 pt-6 text-sm text-slate-200"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><Icon name="check" /></span> Khám phá. Đặt phòng. Tận hưởng.</div>
          </aside>
          <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
            <div className="w-full max-w-md">
              <div className="mb-8 lg:mb-9">
                <div className="mb-6 flex items-center gap-2 text-xl font-extrabold text-[#102d55] lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">Q</span> QuickStay</div>
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-700">Chào mừng đến QuickStay</span>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Tạo tài khoản mới</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">Tham gia QuickStay để bắt đầu hành trình của bạn.</p>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <ErrorBox message={error} />
                <div><label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên <span className="text-rose-500">*</span></label><div className="relative"><Icon name="user" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input id="fullName" autoComplete="name" type="text" required placeholder="Nhập họ và tên của bạn" className={fieldClass} value={form.fullName} onChange={set('fullName')}/></div></div>
                <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Địa chỉ email <span className="text-rose-500">*</span></label><div className="relative"><Icon name="mail" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input id="email" autoComplete="email" type="email" required placeholder="name@example.com" className={fieldClass} value={form.email} onChange={set('email')}/></div></div>
                <div><label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại <span className="font-normal text-slate-400">(không bắt buộc)</span></label><div className="relative"><Icon name="phone" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input id="phone" autoComplete="tel" type="tel" placeholder="0912 345 678" className={fieldClass} value={form.phone} onChange={set('phone')}/></div></div>
                <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu <span className="text-rose-500">*</span></label><div className="relative"><Icon name="lock" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input id="password" autoComplete="new-password" type={showPassword ? 'text' : 'password'} minLength={6} required placeholder="Tối thiểu 6 ký tự" className={`${fieldClass} pr-12`} value={form.password} onChange={set('password')}/><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md text-slate-400 transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"><Icon name={showPassword ? 'eyeOff' : 'eye'}/></button></div><p className="mt-2 text-xs text-slate-400">Sử dụng ít nhất 6 ký tự để bảo vệ tài khoản.</p></div>
                <button type="submit" disabled={busy} className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">{busy ? <><svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg> Đang xử lý...</> : <>Tạo tài khoản <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1"/></>}</button>
              </form>
              <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">Đã có tài khoản? <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">Đăng nhập ngay</Link></div>
              <p className="mt-7 text-center text-xs leading-5 text-slate-400">Chào mừng bạn đến với cộng đồng QuickStay.</p>
            </div>
          </section>
        </div>
      </main>
  )
}
