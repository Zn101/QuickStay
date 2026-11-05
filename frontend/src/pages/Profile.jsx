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
  const [showPassword, setShowPassword] = useState(false)

  function set(key) {
    return (e) => {
      setError('')
      setSuccess('')
      setForm((f) => ({ ...f, [key]: e.target.value }))
    }
  }

  function resetForm() {
    setForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      email: user?.email || '',
      password: '',
    })
    setError('')
    setSuccess('')
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

  // Kiểm tra xem người dùng đã thay đổi thông tin gì chưa
  const isDirty =
    form.fullName !== (user?.fullName || '') ||
    form.phone !== (user?.phone || '') ||
    form.email !== (user?.email || '') ||
    form.password.length > 0

  // Đánh giá độ mạnh mật khẩu
  const getPasswordStrength = (pass) => {
    if (!pass) return { level: 0, text: '', color: 'bg-slate-200' }
    if (pass.length < 6) return { level: 1, text: 'Quá ngắn (tối thiểu 6 ký tự)', color: 'bg-rose-500' }
    if (pass.length < 9) return { level: 2, text: 'Trung bình', color: 'bg-amber-500' }
    return { level: 3, text: 'Mạnh & An toàn', color: 'bg-emerald-500' }
  }

  const pwdStrength = getPasswordStrength(form.password)

  const inputClass =
    'w-full rounded-2xl border border-slate-200/90 bg-slate-50/60 px-4 py-3.5 pl-11 text-sm font-medium text-slate-900 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-50 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10'

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      {/* ==================== PROFILE HEADER CARD ==================== */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/30">
        {/* Decorative Cover Banner */}
        <div className="relative h-40 bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-700 px-6 pt-6 overflow-hidden">
          {/* Hiệu ứng ánh sáng & lưới trang trí */}
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div className="absolute left-1/4 -bottom-16 h-40 w-40 rounded-full bg-sky-300/20 blur-xl pointer-events-none"></div>
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          {/* Role Badge */}
          <div className="relative z-10 flex justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              {user?.role === 'ADMIN' ? 'Quản trị viên hệ thống' : 'Thành viên hoạt động'}
            </span>
          </div>
        </div>

        {/* User Info & Avatar Section */}
        <div className="px-6 sm:px-8 pb-6 pt-0">
          <div className="relative -mt-14 mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Avatar với viền Gradient & Huy hiệu */}
            <div className="relative inline-block self-start">
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-tr from-sky-600 to-indigo-500 text-white text-4xl font-black shadow-lg shadow-indigo-500/20 select-none">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-sm"
                title="Tài khoản đã xác thực"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Quick Info Chips */}
            <div className="flex flex-wrap items-center gap-2 sm:pb-1">
              {user?.phone && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {user.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                <svg className="h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Bảo mật tiêu chuẩn
              </span>
            </div>
          </div>

          {/* User Name & Email */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {user?.fullName || 'Người dùng'}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {user?.email || 'Chưa cập nhật email'}
            </p>
          </div>
        </div>

        {/* Modern Pill Navigation Tabs */}
        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-6 sm:px-8 py-3">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'general'
              ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200/80'
              : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
              }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Thông tin cá nhân
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'security'
              ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200/80'
              : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
              }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Đổi mật khẩu
            {form.password.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* ==================== FORM CARD SECTION ==================== */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/30">
        {/* Section Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {activeTab === 'general' ? 'Thông tin định danh & Liên hệ' : 'Bảo mật & Mật khẩu'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {activeTab === 'general'
                ? 'Quản lý tên hiển thị, số điện thoại và địa chỉ nhận thông báo của bạn.'
                : 'Thiết lập mật khẩu mạnh để bảo vệ tài khoản khỏi các truy cập trái phép.'}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Alerts */}
          {error && <ErrorBox message={error} />}
          {success && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3.5 text-sm font-semibold text-emerald-800 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {success}
              </div>
              <button
                type="button"
                onClick={() => setSuccess('')}
                className="text-emerald-600 hover:text-emerald-900"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: THÔNG TIN CHUNG */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Họ và tên */}
              <div className="sm:col-span-1">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Họ và tên
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
              <div className="sm:col-span-1">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Số điện thoại
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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

              {/* Email (Full width) */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Địa chỉ Email
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                <p className="mt-2 text-xs text-slate-400">
                  Email này được sử dụng để đăng nhập và khôi phục mật khẩu khi cần thiết.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: BẢO MẬT & MẬT KHẨU */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Mật khẩu mới
                  </label>
                  <span className="text-xs font-medium text-slate-400">
                    Để trống nếu không muốn thay đổi
                  </span>
                </div>

                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                    value={form.password}
                    onChange={set('password')}
                    className={`${inputClass} pr-12`}
                  />
                  {/* Nút ẩn/hiện mật khẩu */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Thanh đo độ mạnh mật khẩu */}
                {form.password.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex gap-1.5 h-1.5 w-full">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${pwdStrength.level >= step ? pwdStrength.color : 'bg-slate-200'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      Độ bảo mật: <span className="font-bold text-slate-700">{pwdStrength.text}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Box gợi ý bảo mật */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-sky-900 flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mẹo tạo mật khẩu an toàn:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                  <li>Sử dụng tối thiểu từ 8 ký tự trở lên.</li>
                  <li>Kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt.</li>
                  <li>Tránh dùng ngày sinh hoặc số điện thoại cá nhân.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ==================== ACTION BUTTONS ==================== */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={resetForm}
              disabled={!isDirty || busy}
              className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              Khôi phục
            </button>

            <button
              type="submit"
              disabled={busy || !isDirty}
              className="w-full sm:w-auto min-w-[160px] rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/25 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
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