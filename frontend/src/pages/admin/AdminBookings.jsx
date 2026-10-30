import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { formatVnd, formatDate, NEXT_STATUS } from '../../lib/format'
import { StatusBadge, ErrorBox } from '../../components/ui'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [changing, setChanging] = useState(null)

  useEffect(() => {
    api('/admin/bookings')
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function changeStatus(id, status) {
    setChanging(id)
    try {
      const updated = await api(`/admin/bookings/${id}/status`, { method: 'PATCH', body: { status } })
      setBookings((bs) => bs.map((b) => (b.id === id ? updated : b)))
    } catch (err) {
      alert(err.message)
    } finally {
      setChanging(null)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Quản lý đặt phòng</h1>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Đang tải...</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-extrabold text-slate-900">{b.hotelName}</h3>
                    <StatusBadge status={b.status} />
                    <span className="text-xs text-slate-400">#{b.id}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{b.roomType} · {b.userEmail}</p>
                </div>
                <p className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(b.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Nhận phòng</p>
                  <p className="font-semibold text-slate-800">{formatDate(b.checkIn)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Trả phòng</p>
                  <p className="font-semibold text-slate-800">{formatDate(b.checkOut)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Khách</p>
                  <p className="font-semibold text-slate-800">{b.guestName}</p>
                  <p className="text-xs text-slate-400">{b.guestPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Số khách</p>
                  <p className="font-semibold text-slate-800">{b.guests} người</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Tổng tiền</p>
                  <p className="font-extrabold text-sky-700">{formatVnd(b.totalPrice)}</p>
                </div>
              </div>

              {b.note && (
                <p className="mt-2 text-xs text-slate-400 italic">Ghi chú: {b.note}</p>
              )}

              {/* Status actions */}
              {NEXT_STATUS[b.status]?.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">Chuyển sang:</span>
                  {NEXT_STATUS[b.status].map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(b.id, s)}
                      disabled={changing === b.id}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        s === 'CANCELLED'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-sky-200 text-sky-700 hover:bg-sky-50'
                      }`}
                    >
                      {changing === b.id ? '...' : s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="py-20 text-center text-slate-400">Chưa có đơn đặt phòng nào.</div>
          )}
        </div>
      )}
    </div>
  )
}
