import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { ErrorBox, FieldError } from '../components/ui'

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=85',
    title: 'Amanoi Ocean Pool Villa',
    subtitle: 'Vịnh Vĩnh Hy, Ninh Thuận • Biệt thự hướng biển',
    rating: '4.98',
  },
  {
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=85',
    title: 'Six Senses Ninh Vân Bay',
    subtitle: 'Nha Trang, Khánh Hòa • Khu nghỉ dưỡng biệt lập',
    rating: '4.96',
  },
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85',
    title: 'JW Marriott Emerald Bay',
    subtitle: 'Bãi Khem, Phú Quốc • Kiến trúc Pháp cổ điển',
    rating: '4.95',
  },
  {
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=85',
    title: 'InterContinental Sun Peninsula',
    subtitle: 'Bán đảo Sơn Trà, Đà Nẵng • Tuyệt tác nhiệt đới',
    rating: '4.97',
  },
]

const Icon = ({ name, className = 'h-4 w-4' }) => {
  const paths = {
    home: (
      <>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8L7.1 10a16 16 0 0 0 6.9 6.9l1.5-1.9a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 1.7 2Z" />
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="12" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    sparkle: (
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    star: (
      <path
        fill="currentColor"
        d="m12 2 3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1L12 2Z"
      />
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  }
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

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
  const [activeSlide, setActiveSlide] = useState(0)

  // Tự động chuyển đổi ảnh nền mỗi 5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
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

    if (phoneTrimmed && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phoneTrimmed.replace(/\s+/g, ''))) {
      errs.phone = 'Số điện thoại không hợp lệ (gồm 10 chữ số)'
    }

    if (!form.password) {
      errs.password = 'Vui lòng nhập mật khẩu'
    } else if (form.password.length < 6) {
      errs.password = 'Mật khẩu phải có tối thiểu 6 ký tự'
    }

    return errs
  }

  const submit = async (event) => {
    event.preventDefault()
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
      navigate('/')
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

  const fieldClass = (hasError) =>
    `w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:ring-4 ${hasError
      ? 'border-red-400 bg-red-50/20 text-slate-900 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-[#0284c7] focus:ring-sky-500/10 text-slate-900'
    }`

  const currentSlide = SLIDES[activeSlide]

  return (
    <main className="grid min-h-[calc(100vh-64px)] w-full bg-[#f4f9fd] lg:grid-cols-[1.15fr_0.85fr]">
      {/* CỘT TRÁI: TRÌNH CHIẾU ẢNH ĐỘNG FULL-BLEED THEO MẪU */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#071925] p-10 text-white lg:flex xl:p-14">
        {/* Slideshow ảnh nền kèm hiệu ứng zoom mượt */}
        {SLIDES.map((slide, index) => {
          const isActive = index === activeSlide
          return (
            <div
              key={slide.url}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'z-0 opacity-100' : '-z-10 opacity-0'
                }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className={`h-full w-full object-cover transition-transform duration-[8000ms] ease-out ${isActive ? 'scale-105' : 'scale-100'
                  }`}
              />
            </div>
          )
        })}

        {/* Lớp phủ màu xanh trầm giống hệt trang Login */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#061826]/90 via-[#082233]/75 to-[#061826]/65" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#04121d]/95 via-transparent to-[#04121d]/50" />

        {/* Thanh trên cùng: Logo + Badge trạng thái */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-300 backdrop-blur-md">
              <Icon name="home" className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-white">
              QuickStay<span className="text-cyan-400">.</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/45 px-4 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Không gian lưu trú dành cho bạn
          </div>
        </div>

        {/* Nội dung chính giữa + 2 thẻ tính năng + Thanh địa điểm */}
        <div className="relative z-10 my-auto max-w-xl py-8">
          <h2 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-[46px]">
            Mỗi chuyến đi,
            <br />
            <span className="text-sky-200">một trải nghiệm</span>
            <br />
            đáng nhớ.
          </h2>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-200/90 xl:text-base">
            Khám phá nơi lưu trú phù hợp, quản lý đặt phòng dễ dàng và tận hưởng hành trình theo cách của bạn.
          </p>

          {/* 2 Thẻ kính mờ (Lưu trú tiện lợi & Trải nghiệm mượt mà) */}
          <div className="mt-8 grid max-w-lg grid-cols-2 gap-3.5">
            <div className="rounded-2xl border border-white/15 bg-slate-900/40 p-4 backdrop-blur-md transition-colors hover:bg-slate-900/55">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Icon name="home" className="h-4 w-4" />
                </span>
                <span className="text-sm font-bold text-white">Lưu trú tiện lợi</span>
              </div>
              <p className="mt-2 text-xs text-slate-300/90">Tìm kiếm nhanh chóng & chuẩn xác</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-slate-900/40 p-4 backdrop-blur-md transition-colors hover:bg-slate-900/55">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Icon name="sparkle" className="h-4 w-4" />
                </span>
                <span className="text-sm font-bold text-white">Trải nghiệm mượt mà</span>
              </div>
              <p className="mt-2 text-xs text-slate-300/90">Đặt phòng dễ dàng trong vài chạm</p>
            </div>
          </div>

          {/* Thanh thông tin Villa & Điều hướng Slide */}
          <div className="mt-5 flex max-w-lg items-center justify-between gap-4 rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3.5 backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-cyan-300">
                <Icon name="pin" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-bold text-white sm:text-sm">
                    {currentSlide.title}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    <Icon name="star" className="h-2.5 w-2.5 text-amber-300" />
                    {currentSlide.rating}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-300/90">
                  {currentSlide.subtitle}
                </p>
              </div>
            </div>

            {/* Dots chuyển ảnh */}
            <div className="flex shrink-0 items-center gap-1.5">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.title}
                  type="button"
                  aria-label={`Chuyển đến ảnh ${idx + 1}`}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeSlide
                      ? 'w-6 bg-cyan-400'
                      : 'w-1.5 bg-white/35 hover:bg-white/60'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer cột trái */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-300/80">
          <span>© 2026 QuickStay. Your stay, your way.</span>
          <span>Khám phá vẻ đẹp Việt Nam</span>
        </div>
      </aside>

      {/* CỘT PHẢI: KHUNG THẺ TRẮNG ĐĂNG KÝ TÀI KHOẢN */}
      <section className="relative flex flex-col items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        {/* Quầng sáng dịu nhẹ phía sau thẻ */}
        <div className="pointer-events-none absolute right-10 top-10 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-10 h-72 w-72 rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="relative z-10 w-full max-w-[430px]">
          <div className="rounded-[24px] border border-slate-100 bg-white p-7 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.1)] sm:p-9">
            {/* Header trong thẻ trắng */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0284c7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0284c7]" />
                Bắt đầu hành trình
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">
                Đăng ký tài khoản
              </h1>
              <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                Nhập thông tin của bạn để tiếp tục cùng QuickStay.
              </p>
            </div>

            <form onSubmit={submit} noValidate className="space-y-4">
              <ErrorBox message={error} />

              {/* Họ và tên */}
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Họ và tên
                </label>
                <div className="relative">
                  <Icon
                    name="user"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="fullName"
                    autoComplete="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    className={fieldClass(errors.fullName)}
                    value={form.fullName}
                    onChange={set('fullName')}
                  />
                </div>
                <FieldError id="fullName-error" message={errors.fullName} />
              </div>

              {/* Địa chỉ email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Địa chỉ email
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    autoComplete="email"
                    type="email"
                    placeholder="name@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={fieldClass(errors.email)}
                    value={form.email}
                    onChange={set('email')}
                  />
                </div>
                <FieldError id="email-error" message={errors.email} />
              </div>

              {/* Số điện thoại */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                    Số điện thoại
                  </label>
                  <span className="text-[11px] text-slate-400">Tùy chọn</span>
                </div>
                <div className="relative">
                  <Icon
                    name="phone"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="phone"
                    autoComplete="tel"
                    type="tel"
                    placeholder="0912 345 678"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={fieldClass(errors.phone)}
                    value={form.phone}
                    onChange={set('phone')}
                  />
                </div>
                <FieldError id="phone-error" message={errors.phone} />
              </div>

              {/* Mật khẩu (Có chữ "Hiện / Ẩn" giống ảnh mẫu) */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={`${fieldClass(errors.password)} pr-14`}
                    value={form.password}
                    onChange={set('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 transition-colors hover:text-[#0284c7] focus:outline-none"
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                <FieldError id="password-error" message={errors.password} />
              </div>

              {/* Nút Đăng ký màu xanh #0284c7 đồng bộ với Login */}
              <button
                type="submit"
                disabled={busy}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284c7] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition-all hover:bg-[#0369a1] focus:outline-none focus:ring-4 focus:ring-sky-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đăng ký <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Link chuyển sang Đăng nhập */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 sm:text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-[#0284c7] hover:underline">
                Đăng nhập ngay
              </Link>
            </div>
          </div>

          {/* Chữ nhỏ bên dưới thẻ trắng giống hệt ảnh mẫu */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Đăng ký an toàn • Trải nghiệm tiện lợi
          </p>
        </div>
      </section>
    </main>
  )
}