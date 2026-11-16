import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { ErrorBox, FieldError, SuccessModal } from '../components/ui'

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
  `w-full rounded-2xl border bg-white dark:bg-slate-800/90 pl-11 pr-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white shadow-sm outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? 'border-red-400 bg-red-50/10 focus:border-red-500 focus:ring-red-500/15'
      : 'border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-sky-600 focus:ring-sky-500/15'
  }`

function parseBackendErrors(message) {
  if (!message || typeof message !== 'string') return null
  const errs = {}
  const parts = message.split(';').map((s) => s.trim())
  for (const part of parts) {
    const colonIdx = part.indexOf(':')
    if (colonIdx > 0) {
      const field = part.slice(0, colonIdx).trim()
      let msg = part.slice(colonIdx + 1).trim()
      if (msg.includes('must not be blank')) {
        msg = 'Vui lòng không để trống trường này'
      } else if (msg.includes('mat khau tu 6')) {
        msg = 'Mật khẩu phải từ 6 đến 72 ký tự'
      }
      errs[field] = msg
    }
  }
  return Object.keys(errs).length > 0 ? errs : null
}

export default function Register() {
  const register = useAuth((s) => s.register)
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [registeredSuccess, setRegisteredSuccess] = useState(false)

  const goToLogin = useCallback(() => {
    navigate('/login', { state: { registeredEmail: form.email.trim() }, replace: true })
  }, [navigate, form.email])

  useEffect(() => {
    if (!registeredSuccess) return
    const timer = setTimeout(() => {
      goToLogin()
    }, 1800)
    return () => clearTimeout(timer)
  }, [registeredSuccess, goToLogin])

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
    const nameTrimmed = form.fullName.trim()
    const emailTrimmed = form.email.trim()
    const phoneTrimmed = form.phone.trim()

    if (!nameTrimmed) {
      errs.fullName = 'Vui lòng nhập họ và tên'
    }

    if (!emailTrimmed) {
      errs.email = 'Vui lòng nhập địa chỉ email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errs.email = 'Địa chỉ email không đúng định dạng'
    }

    if (!phoneTrimmed) {
      errs.phone = 'Vui lòng nhập số điện thoại'
    } else if (phoneTrimmed && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phoneTrimmed.replace(/\s+/g, ''))) {
      errs.phone = 'Số điện thoại không hợp lệ (gồm 10 chữ số)'
    }

    if (!form.password) {
      errs.password = 'Vui lòng nhập mật khẩu'
    } else if (form.password.length < 6) {
      errs.password = 'Mật khẩu phải có tối thiểu 6 ký tự'
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
      await register(form)
      setRegisteredSuccess(true)
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors)
      } else if (err?.status === 409 || err?.message?.toLowerCase().includes('email')) {
        setErrors({ email: err.message || 'Email này đã được sử dụng' })
      } else {
        const parsed = parseBackendErrors(err?.message)
        if (parsed) {
          setErrors(parsed)
        } else {
          setError(err?.message || 'Đăng ký không thành công. Vui lòng thử lại.')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const activeSlide = SLIDES[currentSlide]

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-white lg:grid lg:grid-cols-12">
      {/* CỘT TRÁI: Cinematic Auto-Carousel Showcase (7/12 cột đồng bộ chuẩn mực với Login) */}
      <div className="relative hidden min-h-[700px] flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:col-span-6 lg:flex xl:col-span-7 xl:p-16">
        {/* Danh sách ảnh nền tự động chuyển động với hiệu ứng Ken Burns */}
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide
          return (
            <div
              key={slide.url}
              className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'z-0 opacity-100' : '-z-10 opacity-0'
              }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className={`h-full w-full object-cover transition-transform duration-[8000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />
            </div>
          )
        })}

        {/* Lớp phủ Gradient điện ảnh chuẩn mực */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/50" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/40" />

        {/* Top: Header với logo và badge */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30 backdrop-blur-md">
              ⌂
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              QuickStay<span className="text-cyan-400">.</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-sky-100 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Không gian lưu trú dành cho bạn
          </div>
        </div>

        {/* Middle: Câu khẩu hiệu & 2 Thẻ Bento Glassmorphism */}
        <div className="relative z-10 my-auto max-w-xl py-8">
          <h2 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-[46px]">
            Mỗi chuyến đi,
            <br />
            <span className="text-sky-200">một trải nghiệm</span>
            <br />
            đáng nhớ.
          </h2>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-sky-100/90 xl:text-base">
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

            {/* Nút chuyển ảnh */}
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Xem ảnh ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentSlide
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

      {/* CỘT PHẢI: Form Đăng Ký (5/12 cột, bố cục và style đồng bộ với Login) */}
      <div className="relative flex min-h-[700px] flex-col items-center justify-center px-5 py-8 sm:px-10 lg:col-span-6 lg:px-12 xl:col-span-5 xl:px-16">
        {/* Quầng sáng trang trí */}
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-100/70 dark:bg-sky-900/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-100/50 dark:bg-cyan-900/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Mobile Header + Mini Banner ảnh động cho màn hình nhỏ */}
          <div className="mb-7 lg:hidden">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-700 text-white shadow-md shadow-sky-700/20">
                ⌂
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                QuickStay<span className="text-sky-600">.</span>
              </span>
            </div>

            <div className="relative h-36 w-full overflow-hidden rounded-2xl shadow-md">
              {SLIDES.map((slide, idx) => (
                <img
                  key={slide.url}
                  src={slide.url}
                  alt={slide.title}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                    idx === currentSlide ? 'opacity-100' : 'opacity-0'
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
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-7 shadow-[0_15px_50px_-12px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-9">
            <div className="mb-8">
              <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 dark:border-sky-800/80 bg-sky-50 dark:bg-sky-950/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                Bắt đầu hành trình
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Đăng ký tài khoản
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Nhập thông tin của bạn để tiếp tục cùng QuickStay.
              </p>
            </div>

            <form onSubmit={submit} noValidate className="space-y-4">
              <ErrorBox message={error} />

              {/* Họ và tên */}
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Họ và tên
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-sky-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21a8 8 0 0 1 16 0" />
                    </svg>
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    className={inputClass(errors.fullName)}
                    value={form.fullName}
                    onChange={set('fullName')}
                  />
                </div>
                <FieldError id="fullName-error" message={errors.fullName} />
              </div>

              {/* Địa chỉ Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
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

              {/* Số điện thoại */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Số điện thoại
                  </label>
                  <span className="text-[11px] text-slate-400">Tùy chọn</span>
                </div>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-sky-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0912 345 678"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={inputClass(errors.phone)}
                    value={form.phone}
                    onChange={set('phone')}
                  />
                </div>
                <FieldError id="phone-error" message={errors.phone} />
              </div>

              {/* Mật khẩu */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
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
                    autoComplete="new-password"
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
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
                    className="absolute inset-y-0 right-2.5 my-auto h-8 rounded-lg px-2.5 text-xs font-semibold text-sky-700 dark:text-sky-400 transition hover:bg-sky-50 dark:hover:bg-sky-950"
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
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-700/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-700/35 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {busy ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng ký</span>
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5 text-center text-sm text-slate-500 dark:text-slate-400">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-sky-700 dark:text-sky-400 transition hover:text-sky-900 dark:hover:text-sky-300 hover:underline">
                Đăng nhập ngay
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
            Đăng ký an toàn · Trải nghiệm tiện lợi
          </p>
        </div>
      </div>

      <SuccessModal
        isOpen={registeredSuccess}
        title="Đăng ký thành công!"
        message="Tài khoản của bạn đã được tạo thành công. Vui lòng đăng nhập lại để bắt đầu sử dụng QuickStay."
        buttonText="Đến trang đăng nhập"
        onClose={goToLogin}
      />
    </div>
  )
}
