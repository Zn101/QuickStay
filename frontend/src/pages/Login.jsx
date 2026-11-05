import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { ErrorBox, FieldError } from '../components/ui'

// Danh sách ảnh nền tự động chuyển động
const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=85',
    title: 'Amanoi Ocean Pool Villa',
    location: 'Vịnh Vĩnh Hy, Ninh Thuận',
    rating: '4.98',
    tag: 'Biệt thự hướng biển',
  },
  {
    url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=85',
    title: 'Six Senses Ninh Van Bay',
    location: 'Ninh Hòa, Khánh Hòa',
    rating: '4.95',
    tag: 'Khu nghỉ dưỡng sinh thái',
  },
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85',
    title: 'Regent Phu Quoc Resort',
    location: 'Bãi Trường, Phú Quốc',
    rating: '4.99',
    tag: 'Sang trọng bậc nhất',
  },
  {
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=85',
    title: 'InterContinental Danang',
    location: 'Bán đảo Sơn Trà, Đà Nẵng',
    rating: '4.97',
    tag: 'Tuyệt tác kiến trúc',
  },
]

const inputClass = (hasError) =>
  `w-full rounded-2xl border bg-white pl-11 pr-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 focus:ring-4 ${hasError
    ? 'border-red-400 bg-red-50/10 focus:border-red-500 focus:ring-red-500/15'
    : 'border-slate-200/90 hover:border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
  }`

export default function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Tự động chuyển ảnh mỗi 5.5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
    setError('')
  }

  const validate = () => {
    const errs = {}
    const emailTrimmed = form.email.trim()
    if (!emailTrimmed) {
      errs.email = 'Vui lòng nhập địa chỉ email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errs.email = 'Địa chỉ email không đúng định dạng'
    }

    if (!form.password) {
      errs.password = 'Vui lòng nhập mật khẩu'
    }
    return errs
  }

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError('')

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setBusy(true)
    try {
      const user = await login(form.email, form.password)
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else if (location.state?.from) {
        navigate(location.state.from, { state: location.state, replace: true })
      } else {
        navigate('/')
      }
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors)
      } else {
        setError(err?.message || 'Sai email hoặc mật khẩu')
      }
    } finally {
      setBusy(false)
    }
  }

  const activeSlide = SLIDES[currentSlide]

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden  border border-slate-200/80 bg-[#f8fafc] text-slate-900 shadow-[0_25px_90px_-20px_rgba(15,23,42,0.12)] lg:grid lg:grid-cols-12">
      {/* CỘT TRÁI: Cinematic Auto-Carousel Showcase (7/12 cột) */}
      <div className="relative hidden min-h-[700px] flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:col-span-6 lg:flex xl:col-span-7 xl:p-16">
        {/* Danh sách ảnh nền tự động chuyển động với hiệu ứng Ken Burns */}
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide
          return (
            <div
              key={slide.url}
              className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'z-0 opacity-100' : '-z-10 opacity-0'
                }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className={`h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${isActive ? 'scale-100' : 'scale-110'
                  }`}
              />
            </div>
          )
        })}

        {/* Lớp phủ Gradient đa tầng giúp chữ luôn nổi bật và giữ tone màu thương hiệu */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-[#041d2d] via-[#06283d]/75 to-[#083344]/40" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-[#06283d]/80 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 z-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-[120px]" />

        {/* Top: Logo & Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/30 backdrop-blur-md">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6 text-cyan-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-7h6v7" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              QuickStay<span className="text-cyan-300">.</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/40 px-4 py-1.5 text-xs font-medium text-cyan-100 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Không gian lưu trú dành cho bạn
          </div>
        </div>

        {/* Center: Thông điệp chính & Bento tính năng */}
        <div className="relative z-10 my-auto max-w-xl py-8">
          <h2 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl xl:text-[54px]">
            Mỗi chuyến đi,
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
              một trải nghiệm
            </span>
            <br />
            đáng nhớ.
          </h2>

          <p className="mt-5 max-w-md text-base leading-relaxed text-sky-100/85 xl:text-lg">
            Khám phá nơi lưu trú phù hợp, quản lý đặt phòng dễ dàng và tận hưởng hành trình theo cách của bạn.
          </p>

          {/* 2 Thẻ Bento Glassmorphism */}
          <div className="mt-8 grid max-w-lg grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition duration-300 hover:bg-white/15">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300">
                  ⌂
                </div>
                <p className="font-bold text-white">Lưu trú tiện lợi</p>
              </div>
              <p className="text-xs text-sky-100/75">Tìm kiếm nhanh chóng & chuẩn xác</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition duration-300 hover:bg-white/15">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/20 text-sky-300">
                  ✦
                </div>
                <p className="font-bold text-white">Trải nghiệm mượt mà</p>
              </div>
              <p className="text-xs text-sky-100/75">Đặt phòng dễ dàng trong vài chạm</p>
            </div>
          </div>
        </div>

        {/* Bottom: Thẻ thông tin ảnh động & Điều hướng Slide */}
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-slate-950/45 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{activeSlide.title}</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                    ★ {activeSlide.rating}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-sky-200/75">
                  {activeSlide.location} · <span className="text-cyan-300">{activeSlide.tag}</span>
                </p>
              </div>
            </div>

            {/* Nút chuyển ảnh thủ công */}
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Xem ảnh ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide
                    ? 'w-8 bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-sky-100/50">
            <p>© {new Date().getFullYear()} QuickStay. Your stay, your way.</p>
            <span>Khám phá vẻ đẹp Việt Nam</span>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: Form Đăng Nhập (5/12 cột) */}
      <div className="relative flex min-h-[700px] flex-col items-center justify-center px-5 py-12 sm:px-10 lg:col-span-6 lg:px-12 xl:col-span-5 xl:px-16">
        {/* Quầng sáng trang trí góc phải */}
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Mobile Header + Mini Banner ảnh động cho màn hình nhỏ */}
          <div className="mb-7 lg:hidden">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-700 text-white shadow-md shadow-sky-700/20">
                ⌂
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                QuickStay<span className="text-sky-600">.</span>
              </span>
            </div>

            {/* Khung ảnh tự chuyển động rút gọn trên Mobile */}
            <div className="relative h-36 w-full overflow-hidden rounded-2xl shadow-md">
              {SLIDES.map((slide, idx) => (
                <img
                  key={slide.url}
                  src={slide.url}
                  alt={slide.title}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                    {activeSlide.tag}
                  </p>
                  <p className="text-sm font-bold">{activeSlide.title}</p>
                </div>
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold backdrop-blur-md">
                  ★ {activeSlide.rating}
                </span>
              </div>
            </div>
          </div>

          {/* Card Form chính */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_15px_50px_-12px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-9">
            <div className="mb-8">
              <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-sky-700">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                Chào mừng trở lại
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Đăng nhập tài khoản
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nhập thông tin của bạn để tiếp tục cùng QuickStay.
              </p>
            </div>

            <form onSubmit={submit} noValidate className="space-y-5">
              <ErrorBox message={error} />

              {/* Địa chỉ Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Địa chỉ email
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-sky-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={inputClass(errors.email)}
                    value={form.email}
                    onChange={set('email')}
                  />
                </div>
                <FieldError id="email-error" message={errors.email} />
              </div>

              {/* Mật khẩu */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-sky-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={`${inputClass(errors.password)} pr-16`}
                    value={form.password}
                    onChange={set('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-2.5 my-auto h-8 rounded-lg px-2.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                <FieldError id="password-error" message={errors.password} />
              </div>

              {/* Nút Submit với hiệu ứng ánh sáng lướt */}
              <button
                type="submit"
                disabled={busy}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-700/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-700/35 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {busy ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-sky-700 transition hover:text-sky-900 hover:underline">
                Đăng ký ngay
              </Link>
            </div>
          </div>

          <p className="mt-7 text-center text-xs font-medium text-slate-400">
            Đăng nhập an toàn · Trải nghiệm tiện lợi
          </p>
        </div>
      </div>
    </div>
  )
}