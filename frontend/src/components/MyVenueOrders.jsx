import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatVnd } from '../lib/format'
import { ORDER_STATUS_CLASS, ORDER_STATUS_LABEL } from '../lib/venues'

/** Đơn đặt bàn nhà hàng và đơn đặt tour của khách đang đăng nhập. */
export default function MyVenueOrders() {
  const [reservations, setReservations] = useState([])
  const [tourBookings, setTourBookings] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    Promise.all([api('/restaurant-reservations/me'), api('/tour-bookings/me')])
      .then(([r, t]) => {
        setReservations(Array.isArray(r) ? r : [])
        setTourBookings(Array.isArray(t) ? t : [])
      })
      .catch((err) => setError(err.message || 'Không tải được đơn đặt bàn / đặt tour.'))
  }, [])

  async function cancel(kind, order) {
    setBusy(`${kind}-${order.id}`)
    setError('')
    try {
      const path = kind === 'res' ? `/restaurant-reservations/${order.id}/cancel` : `/tour-bookings/${order.id}/cancel`
      const updated = await api(path, { method: 'PATCH' })
      if (kind === 'res') setReservations((l) => l.map((x) => (x.id === order.id ? updated : x)))
      else setTourBookings((l) => l.map((x) => (x.id === order.id ? updated : x)))
    } catch (err) {
      setError(err.message || 'Không huỷ được đơn.')
    } finally {
      setBusy(null)
    }
  }

  if (reservations.length === 0 && tourBookings.length === 0 && !error) return null

  const rows = [
    ...reservations.map((r) => ({
      key: `res-${r.id}`,
      kind: 'res',
      order: r,
      icon: '🍽️',
      title: r.restaurantName,
      when: `${r.date} · ${r.time}`,
      detail: `${r.partySize} khách`,
    })),
    ...tourBookings.map((b) => ({
      key: `tour-${b.id}`,
      kind: 'tour',
      order: b,
      icon: '🧭',
      title: b.tourTitle,
      when: b.date,
      detail: `${b.guests} khách · ${formatVnd(b.totalPrice)}`,
    })),
  ].sort((a, b) => String(b.order.createdAt).localeCompare(String(a.order.createdAt)))

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-black text-slate-900 dark:text-white">Đặt bàn & Đặt tour</h2>
      {error && <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <ul className="space-y-3">
        {rows.map(({ key, kind, order, icon, title, when, detail }) => (
          <li
            key={key}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {icon} {title} <span className="font-mono text-xs text-slate-400">#{order.id}</span>
              </p>
              <p className="text-xs text-slate-500">
                {when} · {detail}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_CLASS[order.status]}`}>
                {ORDER_STATUS_LABEL[order.status]}
              </span>
              {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                <button
                  type="button"
                  disabled={busy === key}
                  onClick={() => cancel(kind, order)}
                  className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50"
                >
                  Huỷ
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
