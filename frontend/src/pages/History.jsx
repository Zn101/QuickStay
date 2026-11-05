import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatVnd } from '../lib/format'
import { ErrorBox, Spinner, StatusBadge } from '../components/ui'

// =======================================================================
// 1. COMPONENT GỘP: CONFIRM MODAL (Giao diện chuẩn SaaS)
// =======================================================================
function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  danger = false,
  loading = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!loading) onCancel()
        }}
      ></div>

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 pb-6 pt-8 sm:px-8">
          <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-5">
            <div
              className={`mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-12 sm:w-12 ${danger ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'
                }`}
            >
              {danger ? (
                <svg className="h-7 w-7 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="h-7 w-7 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="mt-4 text-center sm:mt-0 sm:text-left">
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              Cảnh báo: {error}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:flex sm:flex-row-reverse sm:px-8">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex w-full justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-all sm:ml-3 sm:w-auto disabled:pointer-events-none disabled:opacity-50 active:scale-95 ${danger ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700' : 'bg-sky-600 shadow-sky-600/20 hover:bg-sky-700'
              }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              confirmText
            )}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="mt-3 inline-flex w-full justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-all hover:bg-slate-50 hover:text-slate-900 sm:mt-0 sm:w-auto disabled:opacity-50 active:scale-95"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}

// =======================================================================
// 2. COMPONENT CHÍNH: HISTORY
// =======================================================================
export default function History() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [filter, setFilter] = useState('ALL')

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

  const filteredItems = items?.filter((b) => {
    if (filter === 'ALL') return true
    return b.status === filter
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
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
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
          {[
            { key: 'ALL', label: 'Tất cả đơn', count: items.length },
            { key: 'PENDING', label: 'Đang chờ', count: items.filter((b) => b.status === 'PENDING').length },
            { key: 'CONFIRMED', label: 'Đã xác nhận', count: items.filter((b) => b.status === 'CONFIRMED').length },
            { key: 'COMPLETED', label: 'Đã hoàn thành', count: items.filter((b) => b.status === 'COMPLETED').length },
            { key: 'CANCELLED', label: 'Đã hủy', count: items.filter((b) => b.status === 'CANCELLED').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex whitespace-nowrap items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${filter === tab.key
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty State (Global) */}
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
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Left Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    #{b.id}
                  </span>
                  <StatusBadge status={b.status} />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 transition group-hover:text-sky-600">
                    {b.hotelName}
                  </h3>
                  <p className="text-sm font-semibold text-slate-600">{b.roomType}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
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
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-xs italic text-slate-600">
                    <span className="not-italic font-bold text-slate-700">Ghi chú:</span> {b.note}
                  </div>
                )}
              </div>

              {/* Right Price & Actions */}
              <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
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
                    className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-95"
                  >
                    Hủy đặt phòng
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Modal gộp */}
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