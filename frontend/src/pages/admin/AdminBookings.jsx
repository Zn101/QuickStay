import { useState, useEffect, useMemo } from 'react'
import { api } from '../../lib/api'
import { formatVnd, formatDate, nightsBetween, STATUS_LABEL, STATUS_STYLE, NEXT_STATUS, PAYMENT_METHOD_LABEL } from '../../lib/format'
import { StatusBadge, PaymentBadge, ErrorBox, Spinner, ConfirmModal } from '../../components/ui'

const ACTION_CONFIG = {
  CONFIRMED: {
    label: 'Xác nhận đơn',
    className: 'border-sky-300 text-sky-700 bg-sky-50/70 hover:bg-sky-100 hover:border-sky-400 active:scale-95',
  },
  CHECKED_IN: {
    label: 'Nhận phòng',
    className: 'border-indigo-300 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 hover:border-indigo-400 active:scale-95',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    className: 'border-emerald-300 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-400 active:scale-95',
  },
  CANCELLED: {
    label: 'Hủy đơn',
    className: 'border-rose-300 text-rose-700 bg-rose-50/70 hover:bg-rose-100 hover:border-rose-400 active:scale-95',
  },
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [changing, setChanging] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)

  // Tải danh sách đơn đặt phòng từ API
  async function loadBookings(isManual = false) {
    if (isManual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError('')
    setActionError('')
    try {
      const data = await api('/admin/bookings')
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn đặt phòng.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  // Thống kê số lượng đơn theo từng trạng thái
  const counts = useMemo(() => {
    const res = { ALL: bookings.length, PENDING: 0, CONFIRMED: 0, CHECKED_IN: 0, COMPLETED: 0, CANCELLED: 0 }
    bookings.forEach((b) => {
      if (res[b.status] !== undefined) {
        res[b.status] += 1
      }
    })
    return res
  }, [bookings])

  // Lọc danh sách theo trạng thái và tìm kiếm
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Lọc trạng thái
      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false
      }
      // Lọc tìm kiếm theo từ khóa
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matchId = String(b.id).includes(q)
        const matchGuest = b.guestName?.toLowerCase().includes(q)
        const matchPhone = b.guestPhone?.toLowerCase().includes(q)
        const matchEmail = b.userEmail?.toLowerCase().includes(q)
        const matchHotel = b.hotelName?.toLowerCase().includes(q)
        const matchRoom = b.roomType?.toLowerCase().includes(q)
        if (!matchId && !matchGuest && !matchPhone && !matchEmail && !matchHotel && !matchRoom) {
          return false
        }
      }
      return true
    })
  }, [bookings, statusFilter, search])

  // Thực hiện gọi API chuyển trạng thái
  async function executeChangeStatus(id, nextStatus) {
    setChanging(id)
    setActionError('')
    try {
      const updated = await api(`/admin/bookings/${id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
      })

      // Cập nhật state trực tiếp tại client
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)))

      const label = STATUS_LABEL[nextStatus] || nextStatus
      setSuccessMessage(`Đã cập nhật đơn #${id} sang trạng thái "${label}" thành công!`)
      setTimeout(() => setSuccessMessage(''), 3500)
      return true
    } catch (err) {
      setActionError(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái.')
      return false
    } finally {
      setChanging(null)
    }
  }

  // Xử lý khi click vào nút hành động
  function handleActionClick(booking, nextStatus) {
    if (nextStatus === 'CANCELLED') {
      setCancelTarget(booking)
      return
    }
    executeChangeStatus(booking.id, nextStatus)
  }

  // Xử lý xác nhận trong Confirm Modal khi hủy đơn
  async function handleConfirmCancel() {
    if (!cancelTarget) return
    const ok = await executeChangeStatus(cancelTarget.id, 'CANCELLED')
    if (ok) {
      setCancelTarget(null)
    }
  }

  // Doanh thu thực tế (CONFIRMED, CHECKED_IN, COMPLETED)
  const totalRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)
  }, [bookings])

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-1/4 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-300 backdrop-blur-md mb-2.5 border border-white/10">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Hệ thống quản trị lưu trú
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Quản lý Đặt phòng</h1>
              <span className="rounded-full bg-sky-400/20 px-2.5 py-0.5 text-xs font-bold text-sky-200 border border-sky-400/30">
                {bookings.length} đơn
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Theo dõi, lọc theo trạng thái và phê duyệt toàn bộ giao dịch đặt phòng của khách hàng theo thời gian thực.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadBookings(true)}
            disabled={loading || refreshing}
            className="group inline-flex items-center justify-center gap-2.5 self-start sm:self-auto rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 text-white ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng giao dịch</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{bookings.length}</span>
            <span className="text-xs font-medium text-slate-400">đơn toàn thời gian</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chờ xác nhận</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">{counts.PENDING}</span>
            <span className="text-xs font-medium text-slate-400">cần xử lý</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đang phục vụ</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
                <path d="M9 21v-7h6v7" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600">{counts.CONFIRMED + counts.CHECKED_IN}</span>
            <span className="text-xs font-medium text-slate-400">đã duyệt & lưu trú</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Doanh thu ghi nhận</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-600">{formatVnd(totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Thông báo kết quả thao tác */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="relative">
          <ErrorBox message={actionError} />
          <button
            onClick={() => setActionError('')}
            className="absolute top-3 right-3 text-red-600 hover:text-red-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {/* Bộ lọc trạng thái & Thanh tìm kiếm */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Thanh tìm kiếm */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn (#id), tên khách hàng, số điện thoại, email, khách sạn..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Thanh bộ lọc theo trạng thái (Filter Tabs) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline-block">
            Trạng thái:
          </span>

          {/* Tất cả */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                statusFilter === 'ALL' ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'
              }`}
            >
              {counts.ALL}
            </span>
          </button>

          {/* Chờ xác nhận */}
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100/80 border border-amber-200/50'
            }`}
          >
            Chờ xác nhận
            {counts.PENDING > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  statusFilter === 'PENDING' ? 'bg-amber-700 text-white' : 'bg-amber-500 text-white font-extrabold'
                }`}
              >
                {counts.PENDING}
              </span>
            )}
          </button>

          {/* Đã xác nhận */}
          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'CONFIRMED'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100/80 border border-sky-200/50'
            }`}
          >
            Đã xác nhận
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                statusFilter === 'CONFIRMED' ? 'bg-sky-700 text-white' : 'bg-sky-200 text-sky-800'
              }`}
            >
              {counts.CONFIRMED}
            </span>
          </button>

          {/* Đang lưu trú */}
          <button
            type="button"
            onClick={() => setStatusFilter('CHECKED_IN')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'CHECKED_IN'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100/80 border border-indigo-200/50'
            }`}
          >
            Đang lưu trú
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                statusFilter === 'CHECKED_IN' ? 'bg-indigo-700 text-white' : 'bg-indigo-200 text-indigo-800'
              }`}
            >
              {counts.CHECKED_IN}
            </span>
          </button>

          {/* Hoàn thành */}
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/50'
            }`}
          >
            Hoàn thành
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                statusFilter === 'COMPLETED' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-800'
              }`}
            >
              {counts.COMPLETED}
            </span>
          </button>

          {/* Đã hủy */}
          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'CANCELLED'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/50'
            }`}
          >
            Đã hủy
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                statusFilter === 'CANCELLED' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.CANCELLED}
            </span>
          </button>
        </div>
      </div>

      {/* Nội dung danh sách / Bảng dữ liệu */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8">
          <Spinner text="Đang đồng bộ dữ liệu đơn đặt phòng..." />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 ring-1 ring-slate-100">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-700">
                {bookings.length === 0
                  ? 'Chưa có đơn đặt phòng nào trên hệ thống'
                  : 'Không tìm thấy đơn đặt phòng phù hợp'}
              </p>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                {bookings.length === 0
                  ? 'Khi khách hàng tạo yêu cầu đặt phòng mới, thông tin sẽ được tự động hiển thị tại đây.'
                  : 'Vui lòng thử chọn trạng thái khác hoặc xóa từ khóa tìm kiếm để xem các đơn khác.'}
              </p>
              {(statusFilter !== 'ALL' || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setSearch('')
                  }}
                  className="mt-4 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Xóa bộ lọc và tìm kiếm
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 pl-5 pr-3">Mã đơn</th>
                    <th className="px-3 py-3.5">Khách hàng</th>
                    <th className="px-3 py-3.5">Khách sạn & Phòng</th>
                    <th className="px-3 py-3.5">Lịch trình lưu trú</th>
                    <th className="px-3 py-3.5 text-center">Khách</th>
                    <th className="px-3 py-3.5 text-right">Tổng tiền</th>
                    <th className="px-3 py-3.5 text-center">Trạng thái</th>
                    <th className="py-3.5 pl-3 pr-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => {
                    const nights = nightsBetween(b.checkIn, b.checkOut)
                    const nextActions = NEXT_STATUS[b.status] || []
                    const isRowBusy = changing === b.id

                    return (
                      <tr key={b.id} className="group hover:bg-slate-50/70 transition-colors">
                        {/* Cột 1: Mã đơn */}
                        <td className="whitespace-nowrap py-4 pl-5 pr-3">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800 group-hover:bg-sky-50 group-hover:text-sky-700 transition-colors">
                            #{b.id}
                          </span>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {new Date(b.createdAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>

                        {/* Cột 2: Khách hàng */}
                        <td className="px-3 py-4 max-w-[200px]">
                          <p className="font-bold text-slate-900 truncate">{b.guestName}</p>
                          <p className="text-xs font-medium text-slate-600">{b.guestPhone}</p>
                          <p className="text-[11px] text-slate-400 truncate" title={b.userEmail}>
                            {b.userEmail}
                          </p>
                        </td>

                        {/* Cột 3: Khách sạn & Phòng */}
                        <td className="px-3 py-4 max-w-[220px]">
                          <p className="font-bold text-slate-900 truncate" title={b.hotelName}>
                            {b.hotelName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 truncate" title={b.roomType}>
                            {b.roomType}
                          </p>
                          {b.note && (
                            <p
                              className="mt-1 text-[11px] text-amber-700 italic truncate bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200/50"
                              title={`Ghi chú: ${b.note}`}
                            >
                              Ghi chú: {b.note}
                            </p>
                          )}
                        </td>

                        {/* Cột 4: Lịch trình lưu trú */}
                        <td className="whitespace-nowrap px-3 py-4">
                          <div className="inline-flex flex-col gap-0.5 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200/60">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <span>{formatDate(b.checkIn)}</span>
                              <span className="text-slate-300">→</span>
                              <span>{formatDate(b.checkOut)}</span>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600">
                              Thời gian: {nights || 1} đêm
                            </span>
                          </div>
                        </td>

                        {/* Cột 5: Số khách */}
                        <td className="whitespace-nowrap px-3 py-4 text-center">
                          <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                            {b.guests} người
                          </span>
                        </td>

                        {/* Cột 6: Tổng tiền */}
                        <td className="whitespace-nowrap px-3 py-4 text-right">
                          <span className="font-extrabold text-sky-700 text-sm">
                            {formatVnd(b.totalPrice)}
                          </span>
                          <div className="mt-1 flex flex-col items-end gap-0.5">
                            <PaymentBadge status={b.paymentStatus} />
                            <span className="text-[10px] text-slate-400">
                              {PAYMENT_METHOD_LABEL[b.paymentMethod] || b.paymentMethod || 'Tại khách sạn'}
                            </span>
                            {b.paymentRef && (
                              <span className="font-mono text-[10px] text-emerald-700">{b.paymentRef}</span>
                            )}
                          </div>
                        </td>

                        {/* Cột 7: Trạng thái */}
                        <td className="whitespace-nowrap px-3 py-4 text-center">
                          <StatusBadge status={b.status} />
                        </td>

                        {/* Cột 8: Thao tác chuyển đổi trạng thái & Hủy */}
                        <td className="whitespace-nowrap py-4 pl-3 pr-5 text-right">
                          {nextActions.length > 0 ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {nextActions.map((targetStatus) => {
                                const config = ACTION_CONFIG[targetStatus] || {
                                  label: targetStatus,
                                  className: 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50',
                                }
                                const isThisButtonBusy = isRowBusy && changing === b.id

                                return (
                                  <button
                                    key={targetStatus}
                                    type="button"
                                    onClick={() => handleActionClick(b, targetStatus)}
                                    disabled={isRowBusy}
                                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${config.className}`}
                                  >
                                    {isThisButtonBusy ? (
                                      <span className="inline-flex items-center gap-1">
                                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        ...
                                      </span>
                                    ) : (
                                      config.label
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 italic">
                              {b.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Đã kết thúc'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          {filteredBookings.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>
                Hiển thị <strong className="text-slate-800">{filteredBookings.length}</strong> trên tổng số{' '}
                <strong className="text-slate-800">{bookings.length}</strong> đơn đặt phòng
              </span>
              <span className="text-[11px] text-slate-400">
                Nhấp &quot;Xác nhận đơn&quot;, &quot;Nhận phòng&quot;, &quot;Hoàn thành&quot; hoặc &quot;Hủy đơn&quot; để cập nhật trạng thái
              </span>
            </div>
          )}
        </div>
      )}

      {/* Modal xác nhận Hủy đơn */}
      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Xác nhận hủy đơn đặt phòng"
        message={`Bạn có chắc chắn muốn hủy đơn đặt phòng #${cancelTarget?.id} của khách hàng "${cancelTarget?.guestName}" (${cancelTarget?.hotelName})? Thao tác này sẽ đổi trạng thái đơn sang "Đã hủy" và không thể hoàn tác.`}
        confirmText="Xác nhận hủy"
        cancelText="Quay lại"
        danger={true}
        loading={changing === cancelTarget?.id}
        error={actionError}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setCancelTarget(null)
          setActionError('')
        }}
      />
    </div>
  )
}
