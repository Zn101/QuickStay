import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../store/authStore'
import { ErrorBox } from '../components/ui'

export default function Profile() {
  const setUser = useAuth((s) => s.setUser)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    api('/users/me')
      .then((u) => setForm({ fullName: u.fullName || '', email: u.email, phone: u.phone || '', password: '' }))
      .catch((e) => setError(e.message))
  }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    try {
      const body = { ...form }
      if (!body.password) delete body.password
      const u = await api('/users/me', { method: 'PUT', body })
      setUser(u)
      setForm((f) => ({ ...f, password: '' }))
      setOk('Đã cập nhật hồ sơ')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <h1 className="text-xl font-bold">Hồ sơ cá nhân</h1>
        <ErrorBox message={error} />
        {ok && <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{ok}</div>}
        <div>
          <label className="label" htmlFor="fullName">Họ và tên</label>
          <input id="fullName" className="input" value={form.fullName} onChange={set('fullName')} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Số điện thoại</label>
          <input id="phone" className="input" value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="label" htmlFor="password">Mật khẩu mới (bỏ trống nếu không đổi)</label>
          <input id="password" type="password" minLength={6} className="input" value={form.password} onChange={set('password')} />
        </div>
        <button className="btn-primary w-full">Lưu thay đổi</button>
      </form>
    </div>
  )
}
