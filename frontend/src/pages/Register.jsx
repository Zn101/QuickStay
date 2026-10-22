import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { ErrorBox } from '../components/ui'

export default function Register() {
  const register = useAuth((s) => s.register)
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự')
    setBusy(true)
    setError('')
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <h1 className="text-xl font-bold">Đăng ký tài khoản</h1>
        <ErrorBox message={error} />
        <div>
          <label className="label" htmlFor="fullName">Họ và tên</label>
          <input id="fullName" required className="input" value={form.fullName} onChange={set('fullName')} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Số điện thoại</label>
          <input id="phone" className="input" value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="label" htmlFor="password">Mật khẩu (tối thiểu 6 ký tự)</label>
          <input id="password" type="password" required className="input" value={form.password} onChange={set('password')} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang xử lý...' : 'Đăng ký'}</button>
        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản? <Link to="/login" className="text-brand-600 hover:underline">Đăng nhập</Link>
        </p>
      </form>
    </div>
  )
}
