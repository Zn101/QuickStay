import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatVnd } from '../lib/format'
import { ErrorBox, Spinner, StatusBadge, ConfirmModal } from '../components/ui'

export default function History() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [filter, setFilter] = useState('ALL') // ALL | PENDING | CONFIRMED | COMPLETED | CANCELLED

  const load = () => api('/bookings/me').then(setItems).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    setCancelError('')
    try {
      await api(`/bookings/${cancelTarget.id}/cancel`, { method: 'PATCH' })
      setCancelTarget(null)
      load()
    } catch (e) {
      setCancelError(e.message || 'Không thể hủy đơn đặt phòng')
    } finally {
      setCancelling(false)
    }
  }

  // Lọc danh sách theo tab
  const filteredItems = items?.filter((b) => {
    if (filter === 'ALL') return true
    return b.status === filter
  })

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Lịch sử đặt phòng</h1>
          <p className="text-sm font-medium text-slate-500">Quản lý và theo dõi các trạng thái đặt phòng của bạn.</p>
        </div>
      </div>

      {/* Error & Loading */}
      <ErrorBox message={error} />
      {!items && !error && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {/* Filter Tabs */}
      {items && items.length > 0 && (
        <div className="mb-6 flex overflow-x-auto gap-2 border-b border-slate-200 pb-3 no-scrollbar">
          {[
            { key: 'ALL', label: 'Tất cả đơn', count: items.length },
            { key: 'PENDING', label: 'Đang chờ', count: items.filter(b => b.status === 'PENDING').length },
            { key: 'CONFIRMED', label: 'Đã xác nhận', count: items.filter(b => b.status === 'CONFIRMED').length },
            { key: 'COMPLETED', label: 'Đã hoàn thành', count: items.filter(b => b.status === 'COMPLETED').length },
            { key: 'CANCELLED', label: 'Đã hủy', count: items.filter(b => b.status === 'CANCELLED').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${filter === tab.key
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {items?.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900">Chưa có lịch sử đặt phòng</h3>
          <p className="mt-1 text-sm text-slate-500">Bạn chưa thực hiện đơn đặt phòng nào trên hệ thống.</p>
        </div>
      )}

      {/* Filtered Empty State */}
      {items && items.length > 0 && filteredItems?.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">Không tìm thấy đơn đặt phòng nào ở trạng thái này.</p>
        </div>
      )}

      {/* Booking List Cards */}
      <div className="grid gap-4">
        {filteredItems?.map((b) => (
          <div
            key={b.id}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              {/* Left Info */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    #{b.id}
                  </span>
                  <StatusBadge status={b.status} />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-sky-600 transition">
                    {b.hotelName}
                  </h3>
                  <p className="text-sm font-semibold text-slate-600">{b.roomType}</p>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{b.guests} khách · {b.guestName} ({b.guestPhone})</span>
                  </div>
                </div>

                {b.note && (
                  <div className="rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-600 italic border border-slate-100">
                    <span className="font-bold not-italic text-slate-700">Ghi chú:</span> {b.note}
                  </div>
                )}
              </div>

              {/* Right Price & Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t border-slate-100 pt-4 sm:border-0 sm:pt-0 gap-4 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng thanh toán</p>
                  <p className="text-lg font-black text-sky-600">{formatVnd(b.totalPrice)}</p>
                </div>

                {b.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelTarget(b)
                      setCancelError('')
                    }}
                    className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 active:scale-95 transition"
                  >
                    Hủy đặt phòng
                  </button>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Xác nhận hủy đặt phòng"
        message={
          cancelTarget
            ? `Bạn có chắc muốn hủy đơn đặt phòng #${cancelTarget.id} tại ${cancelTarget.hotelName}? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmText="Xác nhận hủy đơn"
        cancelText="Giữ lại đơn"
        danger={true}
        loading={cancelling}
        error={cancelError}
        onCancel={() => {
          if (!cancelling) setCancelTarget(null)
        }}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}