import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../store/authStore'
import { ErrorBox, Spinner } from '../components/ui'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const initialToken = searchParams.get('token') || ''
  const { user, setUser } = useAuth()
  const [token, setToken] = useState(initialToken)
  const [status, setStatus] = useState(initialToken ? 'verifying' : 'idle') // idle | verifying | success | error
  const [error, setError] = useState('')

  async function runVerify(tok) {
    if (!tok.trim()) {
      setStatus('error')
      setError('Vui lòng nhập mã xác thực.')
      return
    }
    setStatus('verifying')
    setError('')
    try {
      const updatedUser = await api('/auth/verify-email', {
        method: 'POST',
        body: { token: tok.trim() },
      })
      if (user && updatedUser && user.email === updatedUser.email) {
        setUser(updatedUser)
      }
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.')
    }
  }

  useEffect(() => {
    if (initialToken) {
      runVerify(initialToken)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken])

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/40 text-center">
        {status === 'verifying' && (
          <div className="py-8">
            <Spinner text="Đang xác thực địa chỉ email của bạn..." />
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Xác thực email thành công!</h1>
            <p className="text-sm text-slate-500">
              Tài khoản QuickStay của bạn đã được xác thực hoàn tất. Bạn có thể tiếp tục đặt phòng và quản lý hồ sơ.
            </p>
            <div className="flex gap-3 pt-2">
              <Link
                to={user ? '/profile' : '/login'}
                className="flex-1 rounded-2xl bg-sky-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-sky-700"
              >
                {user ? 'Về hồ sơ' : 'Đăng nhập ngay'}
              </Link>
              <Link
                to="/"
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Trang chủ
              </Link>
            </div>
          </div>
        )}

        {(status === 'idle' || status === 'error') && (
          <div className="space-y-5 text-left">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Xác thực địa chỉ email</h1>
              <p className="mt-1 text-sm text-slate-500">
                Nhập mã xác thực nhận được trong email của bạn.
              </p>
            </div>
            {error && <ErrorBox message={error} />}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                runVerify(token)
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Dán mã xác thực email..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none focus:border-sky-500 focus:bg-white"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-sky-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-sky-700"
              >
                Xác thực ngay
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
