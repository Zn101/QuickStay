import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { ErrorBox } from '../components/ui'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [doneMsg, setDoneMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!token.trim()) return setError('Vui lòng nhập mã khôi phục từ email.')
    if (newPassword.length < 6) return setError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
    if (newPassword !== confirm) return setError('Mật khẩu xác nhận không khớp.')

    setBusy(true)
    try {
      const res = await api('/auth/reset-password', {
        method: 'POST',
        body: { token: token.trim(), newPassword },
      })
      setDoneMsg(res.message || 'Đặt lại mật khẩu thành công!')
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu. Mã có thể đã hết hạn.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/40">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Đặt lại mật khẩu</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Thiết lập mật khẩu mới an toàn cho tài khoản QuickStay của bạn.
          </p>
        </div>

        {doneMsg ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              ✅ {doneMsg}
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full rounded-2xl bg-sky-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-sky-700"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <ErrorBox message={error} />
            <div>
              <label htmlFor="reset-token" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Mã khôi phục (Token)
              </label>
              <input
                id="reset-token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Dán mã khôi phục trong email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="reset-pass" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Mật khẩu mới
              </label>
              <input
                id="reset-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="reset-confirm" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="reset-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-sky-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-sky-700 disabled:opacity-60"
            >
              {busy ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>

            <div className="pt-2 text-center text-xs">
              <Link to="/forgot-password" className="font-semibold text-sky-600 hover:underline">
                Gửi lại mã khôi phục mới
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
