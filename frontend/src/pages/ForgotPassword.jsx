import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { ErrorBox } from '../components/ui'
import EmailInboxModal from '../components/EmailInboxModal'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [showDemoMail, setShowDemoMail] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.')
      return
    }
    setBusy(true)
    try {
      const res = await api('/auth/forgot-password', { method: 'POST', body: { email: trimmed } })
      setResult(res)
    } catch (err) {
      setError(err.message || 'Không thể xử lý yêu cầu lúc này.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/40">
        <div className="mb-6">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quên mật khẩu</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Nhập email tài khoản của bạn để nhận hướng dẫn đặt lại mật khẩu.
          </p>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-bold">✅ Yêu cầu đã được gửi!</p>
              <p className="mt-1 text-xs leading-5">{result.message}</p>
            </div>

            {result.demoMode && result.demoEmail && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900 space-y-3">
                <p className="font-bold">📧 Chế độ Demo Mail (chưa bật SMTP ngoài):</p>
                <p>Hệ thống đã tạo email khôi phục mật khẩu cho <strong>{result.demoEmail.recipient}</strong>.</p>
                <button
                  type="button"
                  onClick={() => setShowDemoMail(true)}
                  className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700"
                >
                  Mở Email Khôi Phục Ngay →
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-xs">
              <Link to="/reset-password" className="font-bold text-sky-600 hover:underline">
                Đã có mã khôi phục? Nhập mã →
              </Link>
              <Link to="/login" className="font-semibold text-slate-500 hover:text-slate-800">
                Về đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <ErrorBox message={error} />
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Địa chỉ email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-sky-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-60"
            >
              {busy ? 'Đang gửi yêu cầu...' : 'Gửi hướng dẫn đặt lại mật khẩu'}
            </button>

            <div className="pt-2 text-center text-sm text-slate-500">
              Nhớ lại mật khẩu?{' '}
              <Link to="/login" className="font-bold text-sky-600 hover:underline">
                Đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>

      <EmailInboxModal
        isOpen={showDemoMail}
        onClose={() => setShowDemoMail(false)}
        initialEmail={result?.demoEmail || null}
      />
    </div>
  )
}
