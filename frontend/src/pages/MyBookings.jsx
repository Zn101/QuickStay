import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, formatDate } from '../lib/format'
import { StatusBadge, Spinner, ErrorBox, ConfirmModal } from '../components/ui'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const { state } = useLocation()

  useEffect(() => {
    api('/bookings/me')
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleOpenCancelModal(booking) {
    setCancelTarget(booking)
    setCancelError('')
  }

  function handleCloseModal() {
    if (!cancelling) {
      setCancelTarget(null)
      setCancelError('')
    }
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    setCancelError('')
    try {
      const updated = await api(`/bookings/${cancelTarget.id}/cancel`, { method: 'PATCH' })
      setBookings((bs) => bs.map((b) => (b.id === cancelTarget.id ? updated : b)))
      setCancelTarget(null)
    } catch (err) {
      setCancelError(err.message || 'Không thể hủy đơn đặt phòng này. Vui lòng thử lại.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight text-slate-900">Đặt phòng của tôi</h1>

      {state?.newBookingId && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          ✅ Đặt phòng thành công! Mã đơn #{state.newBookingId}
        </div>
      )}

      {loading && <Spinner text="Đang tải lịch sử đặt phòng..." />}
      {error && <ErrorBox message={error} />}

      {!loading && !error && bookings.length === 0 && (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-400">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
            </svg>
          </div>
          <p className="text-lg font-semibold text-slate-700">Chưa có đặt phòng nào</p>
          <p className="mt-1 text-sm text-slate-400">Khám phá khách sạn và đặt phòng ngay hôm nay</p>
        </div>
      )}

      <div className="space-y-5">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-extrabold text-slate-900">{b.hotelName}</h3>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{b.roomType}</p>
              </div>
              <p className="text-xs text-slate-400 whitespace-nowrap">Mã #{b.id}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
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
                <p className="font-semibold text-slate-800">{b.guestName} · {b.guests} người</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Tổng tiền</p>
                <p className="font-extrabold text-sky-700">{formatVnd(b.totalPrice)}</p>
              </div>
            </div>

            {b.note && (
              <p className="mt-3 text-xs text-slate-500 italic">Ghi chú: {b.note}</p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Đặt lúc: {new Date(b.createdAt).toLocaleString('vi-VN')}
              </p>
              {b.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => handleOpenCancelModal(b)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  Hủy đơn
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Xác nhận hủy đơn đặt phòng"
        message={
          cancelTarget
            ? `Bạn có chắc chắn muốn hủy đơn đặt phòng #${cancelTarget.id} tại ${cancelTarget.hotelName} (${cancelTarget.roomType}) không? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmText="Hủy đặt phòng"
        cancelText="Giữ lại đơn"
        danger={true}
        loading={cancelling}
        error={cancelError}
        onCancel={handleCloseModal}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
