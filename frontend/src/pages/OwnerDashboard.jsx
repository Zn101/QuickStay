import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd } from '../lib/format'
import { useAuth } from '../store/authStore'
import { ORDER_STATUS_CLASS, ORDER_STATUS_LABEL } from '../lib/venues'

const KIND = {
  restaurants: {
    title: 'Cổng Chủ nhà hàng',
    listingLabel: 'Nhà hàng của tôi',
    ordersLabel: 'Đơn đặt bàn',
    ordersPath: '/owner/restaurants/reservations',
    fields: [
      ['name', 'Tên nhà hàng', true],
      ['city', 'Thành phố', true],
      ['cuisine', 'Ẩm thực'],
      ['address', 'Địa chỉ'],
      ['hours', 'Giờ mở cửa'],
      ['priceRange', 'Khoảng giá'],
      ['image', 'URL ảnh'],
    ],
    listField: ['specialties', 'Món đặc sắc (cách nhau bằng dấu phẩy)'],
    name: (x) => x.name,
  },
  tours: {
    title: 'Cổng Đơn vị Tour / Khu du lịch',
    listingLabel: 'Tour của tôi',
    ordersLabel: 'Đơn đặt tour',
    ordersPath: '/owner/tours/bookings',
    fields: [
      ['title', 'Tên tour', true],
      ['city', 'Thành phố', true],
      ['category', 'Danh mục'],
      ['duration', 'Thời lượng'],
      ['price', 'Giá mỗi khách (VND)', true, 'number'],
      ['transport', 'Phương tiện'],
      ['image', 'URL ảnh'],
    ],
    listField: ['highlights', 'Điểm nổi bật (cách nhau bằng dấu phẩy)'],
    name: (x) => x.title,
  },
}

const NEXT_ACTIONS = {
  PENDING: [
    ['CONFIRMED', 'Xác nhận', 'bg-sky-600 text-white'],
    ['CANCELLED', 'Từ chối', 'border border-rose-200 text-rose-700'],
  ],
  CONFIRMED: [
    ['COMPLETED', 'Hoàn tất', 'bg-emerald-600 text-white'],
    ['CANCELLED', 'Huỷ', 'border border-rose-200 text-rose-700'],
  ],
}

export default function OwnerDashboard() {
  const { user } = useAuth()
  const defaultKind = user?.role === 'TOUR_OPERATOR' ? 'tours' : 'restaurants'
  const [kind, setKind] = useState(defaultKind)
  const cfg = KIND[kind]
  const [listings, setListings] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [busyId, setBusyId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const allowed = user && ['RESTAURANT_OWNER', 'TOUR_OPERATOR', 'ADMIN'].includes(user.role)

  useEffect(() => {
    if (!allowed) return
    setLoading(true)
    setError('')
    Promise.all([api(`/owner/${kind}`), api(cfg.ordersPath)])
      .then(([l, o]) => {
        setListings(Array.isArray(l) ? l : [])
        setOrders(Array.isArray(o) ? o : [])
      })
      .catch((err) => setError(err.message || 'Không tải được dữ liệu.'))
      .finally(() => setLoading(false))
  }, [kind, allowed, cfg.ordersPath])

  const filteredOrders = useMemo(
    () => (statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter],
  )
  const pending = orders.filter((o) => o.status === 'PENDING').length

  if (!user) return <Navigate to="/login" replace state={{ from: '/owner' }} />
  if (!allowed) return <Navigate to="/" replace />

  async function changeStatus(order, status) {
    setBusyId(order.id)
    setError('')
    try {
      const updated = await api(`${cfg.ordersPath}/${order.id}/status`, { method: 'PATCH', body: { status } })
      setOrders((list) => list.map((o) => (o.id === order.id ? updated : o)))
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái.')
    } finally {
      setBusyId(null)
    }
  }

  function openEdit(item) {
    const f = {}
    cfg.fields.forEach(([key]) => {
      f[key] = item[key] ?? ''
    })
    f[cfg.listField[0]] = (item[cfg.listField[0]] || []).join(', ')
    f.description = item.description || ''
    setForm(f)
    setFormError('')
    setEditing(item)
  }

  async function saveEdit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const body = { ...form }
      body[cfg.listField[0]] = form[cfg.listField[0]]
        ? form[cfg.listField[0]].split(',').map((s) => s.trim()).filter(Boolean)
        : []
      if (kind === 'tours') body.price = Number(form.price)
      const updated = await api(`/owner/${kind}/${editing.id}`, { method: 'PUT', body })
      setListings((list) => list.map((x) => (x.id === editing.id ? updated : x)))
      setEditing(null)
    } catch (err) {
      setFormError(err.message || 'Không lưu được.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{cfg.title}</h1>
          <p className="text-sm text-slate-500">
            Xin chào {user.fullName || user.email} · {pending} đơn đang chờ xác nhận
          </p>
        </div>
        {user.role === 'ADMIN' && (
          <div className="flex gap-2">
            {Object.keys(KIND).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${kind === k ? 'bg-sky-600 text-white' : 'border border-slate-200 text-slate-600'}`}
              >
                {k === 'restaurants' ? 'Nhà hàng' : 'Tour'}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Đang tải...</p>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{cfg.listingLabel}</h2>
            {listings.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Tài khoản chưa được gán cơ sở nào. Vui lòng liên hệ quản trị viên QuickStay.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((x) => (
                  <div key={x.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {x.image && <img src={x.image} alt="" className="h-36 w-full object-cover" />}
                    <div className="space-y-1 p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{cfg.name(x)}</p>
                      <p className="text-xs text-slate-500">
                        📍 {x.city}
                        {kind === 'tours' ? ` · ${formatVnd(x.price)}/khách` : x.hours ? ` · 🕒 ${x.hours}` : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => openEdit(x)}
                        className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Sửa thông tin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{cfg.ordersLabel}</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {filteredOrders.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có đơn nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2 pr-3">Mã</th>
                      <th className="py-2 pr-3">{kind === 'tours' ? 'Tour' : 'Nhà hàng'}</th>
                      <th className="py-2 pr-3">Khách</th>
                      <th className="py-2 pr-3">Thời gian</th>
                      <th className="py-2 pr-3">Số khách</th>
                      <th className="py-2 pr-3">Trạng thái</th>
                      <th className="py-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3 pr-3 font-mono text-xs">#{o.id}</td>
                        <td className="py-3 pr-3 font-semibold">{o.restaurantName || o.tourTitle}</td>
                        <td className="py-3 pr-3">
                          <p className="font-semibold">{o.guestName}</p>
                          <p className="text-xs text-slate-500">{o.guestPhone}</p>
                          {o.note && <p className="text-xs italic text-slate-400">“{o.note}”</p>}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          {o.date}
                          {o.time ? ` · ${o.time}` : ''}
                        </td>
                        <td className="py-3 pr-3">
                          {o.partySize ?? o.guests}
                          {o.totalPrice != null && <p className="text-xs text-slate-500">{formatVnd(o.totalPrice)}</p>}
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_CLASS[o.status]}`}>
                            {ORDER_STATUS_LABEL[o.status]}
                          </span>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap space-x-2">
                          {(NEXT_ACTIONS[o.status] || []).map(([status, label, cls]) => (
                            <button
                              key={status}
                              type="button"
                              disabled={busyId === o.id}
                              onClick={() => changeStatus(o, status)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${cls}`}
                            >
                              {label}
                            </button>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={saveEdit}
            className="max-h-[90vh] w-full max-w-2xl space-y-3 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sửa: {cfg.name(editing)}</h3>
            {formError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {cfg.fields.map(([key, label, required, type]) => (
                <label key={key} className="text-xs font-semibold text-slate-600">
                  {label}
                  <input
                    type={type || 'text'}
                    required={!!required}
                    min={type === 'number' ? 0 : undefined}
                    value={form[key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
              ))}
            </div>
            <label className="block text-xs font-semibold text-slate-600">
              {cfg.listField[1]}
              <input
                value={form[cfg.listField[0]] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [cfg.listField[0]]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Mô tả
              <textarea
                rows={4}
                maxLength={4000}
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">
                Huỷ
              </button>
              <button type="submit" disabled={saving} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
