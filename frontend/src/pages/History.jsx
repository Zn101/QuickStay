import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatVnd } from '../lib/format'
import { ErrorBox, Spinner, StatusBadge } from '../components/ui'

export default function History() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  const load = () => api('/bookings/me').then(setItems).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  const cancel = async (b) => {
    if (!window.confirm(`Hủy đặt phòng #${b.id}?`)) return
    try {
      await api(`/bookings/${b.id}/cancel`, { method: 'PATCH' })
      setError('')
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Lịch sử đặt phòng</h1>
      <ErrorBox message={error} />
      {!items && !error && <Spinner />}
      {items?.length === 0 && <p className="py-10 text-center text-slate-500">Bạn chưa có đặt phòng nào.</p>}
      <div className="grid gap-3">
        {items?.map((b) => (
          <div key={b.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">#{b.id} · {b.hotelName} – {b.roomType}</p>
              <p className="text-sm text-slate-600">
                {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.guests} khách · {b.guestName} ({b.guestPhone})
              </p>
              {b.note && <p className="text-sm text-slate-500">Ghi chú: {b.note}</p>}
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <b className="text-brand-600">{formatVnd(b.totalPrice)}</b>
              <StatusBadge status={b.status} />
              {b.status === 'PENDING' && (
                <button className="btn-outline text-red-600" onClick={() => cancel(b)}>Hủy đặt phòng</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
