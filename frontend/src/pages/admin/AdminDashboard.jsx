import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatVnd, formatDate } from '../../lib/format'
import { StatusBadge, Spinner, ErrorBox } from '../../components/ui'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hotels, setHotels] = useState([])
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tableFilter, setTableFilter] = useState('ALL') // 'ALL' | 'PENDING'

  async function loadData(isManualRefresh = false) {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    setError('')
    try {
      const [hList, rList, bList] = await Promise.all([
        api('/admin/hotels').catch(() => []),
        api('/admin/rooms').catch(() => []),
        api('/admin/bookings').catch(() => []),
      ])
      setHotels(hList || [])
      setRooms(rList || [])
      setBookings(bList || [])
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu bảng điều khiển.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Thống kê đơn theo trạng thái
  const statusCounts = bookings.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1
      return acc
    },
    { PENDING: 0, CONFIRMED: 0, CHECKED_IN: 0, COMPLETED: 0, CANCELLED: 0 }
  )

  // Tổng doanh thu thực tế (CONFIRMED, CHECKED_IN, COMPLETED)
  const validRevenueBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED'
  )
  const totalRevenue = validRevenueBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)

  // Doanh thu đang chờ duyệt (PENDING)
  const pendingRevenue = bookings
    .filter((b) => b.status === 'PENDING')
    .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)

  // Giá trị trung bình mỗi đơn thành công
  const avgOrderValue =
    validRevenueBookings.length > 0 ? Math.round(totalRevenue / validRevenueBookings.length) : 0

  // Tỷ lệ chuyển đổi & hủy đơn
  const successRate =
    bookings.length > 0 ? Math.round((validRevenueBookings.length / bookings.length) * 100) : 0
  const cancelRate =
    bookings.length > 0 ? Math.round(((statusCounts.CANCELLED || 0) / bookings.length) * 100) : 0

  // Lọc danh sách hiển thị trong bảng
  const filteredBookings =
    tableFilter === 'PENDING'
      ? bookings.filter((b) => b.status === 'PENDING')
      : bookings
  const recentBookings = [...filteredBookings].slice(0, 6)

  // Cấu hình hiển thị trạng thái
  const statusConfig = [
    {
      status: 'PENDING',
      label: 'Chờ xác nhận',
      color: 'bg-amber-500',
      bgLight: 'bg-amber-50 border-amber-200/60',
      textColor: 'text-amber-700',
      dotRing: 'ring-amber-500/20',
    },
    {
      status: 'CONFIRMED',
      label: 'Đã xác nhận',
      color: 'bg-sky-500',
      bgLight: 'bg-sky-50 border-sky-200/60',
      textColor: 'text-sky-700',
      dotRing: 'ring-sky-500/20',
    },
    {
      status: 'CHECKED_IN',
      label: 'Đang lưu trú',
      color: 'bg-indigo-500',
      bgLight: 'bg-indigo-50 border-indigo-200/60',
      textColor: 'text-indigo-700',
      dotRing: 'ring-indigo-500/20',
    },
    {
      status: 'COMPLETED',
      label: 'Hoàn thành',
      color: 'bg-emerald-500',
      bgLight: 'bg-emerald-50 border-emerald-200/60',
      textColor: 'text-emerald-700',
      dotRing: 'ring-emerald-500/20',
    },
    {
      status: 'CANCELLED',
      label: 'Đã hủy',
      color: 'bg-rose-400',
      bgLight: 'bg-rose-50 border-rose-200/60',
      textColor: 'text-rose-700',
      dotRing: 'ring-rose-500/20',
    },
  ]

  // Helper lấy chữ cái đầu của tên khách
  const getInitials = (name) => {
    if (!name) return 'KH'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Helper tính số đêm lưu trú
  const getNightCount = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 1
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Spinner text="Đang đồng bộ dữ liệu điều hành..." />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-8 lg:p-10 text-white shadow-2xl border border-slate-800/80">
        {/* Subtle decorative grid & glows */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Hệ thống Quản trị & Điều hành Lưu trú
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Trung tâm Điều khiển Tổng quan
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Giám sát dòng tiền, hiệu suất công suất phòng và phê duyệt các giao dịch đặt phòng trên toàn hệ thống theo thời gian thực.
            </p>
          </div>

          {/* Right Action & Live Mini Metrics */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/15 hover:shadow-lg active:scale-95 disabled:opacity-60 border border-white/15 cursor-pointer"
            >
              <svg
                className={`h-4 w-4 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`}
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
              {isRefreshing ? 'Đang đồng bộ...' : 'Làm mới dữ liệu'}
            </button>

            {/* Quick Live Pills */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 backdrop-blur-sm">
                <span className="text-slate-400">Đang lưu trú:</span>
                <span className="font-bold text-indigo-300">{statusCounts.CHECKED_IN} phòng</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 backdrop-blur-sm">
                <span className="text-slate-400">Chờ duyệt:</span>
                <span className="font-bold text-amber-300">{formatVnd(pendingRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {/* KPI Bento Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Doanh thu thực tế */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(6,81,237,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Doanh thu ghi nhận
              </span>
              <h3 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900">
                {formatVnd(totalRevenue)}
              </h3>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100/70 text-emerald-600 ring-1 ring-emerald-500/15 transition-transform duration-300 group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50/80 px-3.5 py-2.5 text-xs border border-slate-100">
            <span className="text-slate-500 font-medium">Trung bình / đơn:</span>
            <span className="font-bold text-emerald-700">{formatVnd(avgOrderValue)}</span>
          </div>
        </div>

        {/* Card 2: Tổng đơn đặt phòng */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(6,81,237,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Tổng lượng đặt phòng
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900">
                  {bookings.length}
                </h3>
                <span className="text-xs font-semibold text-slate-400">giao dịch</span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100/70 text-sky-600 ring-1 ring-sky-500/15 transition-transform duration-300 group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50/80 px-3.5 py-2.5 text-xs border border-slate-100">
            {statusCounts.PENDING > 0 ? (
              <>
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  Cần xử lý ngay
                </span>
                <span className="rounded-lg bg-amber-100 px-2 py-0.5 font-extrabold text-amber-800">
                  {statusCounts.PENDING} đơn
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Tất cả đơn đã được duyệt
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Cơ sở Khách sạn */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(6,81,237,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Cơ sở Khách sạn
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900">
                  {hotels.length}
                </h3>
                <span className="text-xs font-semibold text-slate-400">điểm lưu trú</span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100/70 text-blue-600 ring-1 ring-blue-500/15 transition-transform duration-300 group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50/80 px-3.5 py-2.5 text-xs border border-slate-100">
            <span className="text-slate-500 font-medium">Trạng thái vận hành:</span>
            <span className="inline-flex items-center gap-1 font-bold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              100% Hoạt động
            </span>
          </div>
        </div>

        {/* Card 4: Hạng mục Phòng */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(6,81,237,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Hạng mục Phòng
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900">
                  {rooms.length}
                </h3>
                <span className="text-xs font-semibold text-slate-400">hạng phòng</span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100/70 text-indigo-600 ring-1 ring-indigo-500/15 transition-transform duration-300 group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50/80 px-3.5 py-2.5 text-xs border border-slate-100">
            <span className="text-slate-500 font-medium">Mật độ phân bổ:</span>
            <span className="font-bold text-indigo-700">
              {hotels.length > 0 ? `${(rooms.length / hotels.length).toFixed(1)} loại / KS` : 'Chưa phân bổ'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Bookings Table & Analytics Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings Table (2 cols) */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2 overflow-hidden">
          <div>
            {/* Table Header & Quick Filter Tabs */}
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-extrabold text-slate-900">Giao dịch đặt phòng</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                    Mới nhất
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Theo dõi chi tiết lịch trình khách hàng và trạng thái thanh toán
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Tabs */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTableFilter('ALL')}
                    className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${tableFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Tất cả ({bookings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableFilter('PENDING')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${tableFilter === 'PENDING'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Chờ duyệt
                    {statusCounts.PENDING > 0 && (
                      <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                        {statusCounts.PENDING}
                      </span>
                    )}
                  </button>
                </div>

                <Link
                  to="/admin/bookings"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                >
                  Tất cả
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Table Body */}
            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 ring-1 ring-slate-100">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700">
                  {tableFilter === 'PENDING'
                    ? 'Không có đơn đặt phòng nào đang chờ duyệt'
                    : 'Chưa có dữ liệu đặt phòng trên hệ thống'}
                </p>
                <p className="mt-1 text-xs text-slate-400 max-w-xs">
                  {tableFilter === 'PENDING'
                    ? 'Tuyệt vời! Mọi yêu cầu đặt phòng của khách hàng đều đã được xử lý.'
                    : 'Các giao dịch mới của khách hàng sẽ tự động cập nhật tại đây.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 pl-6 pr-3">Mã đơn</th>
                      <th className="px-3 py-3.5">Khách hàng</th>
                      <th className="px-3 py-3.5">Khách sạn & Phòng</th>
                      <th className="px-3 py-3.5">Lịch trình lưu trú</th>
                      <th className="px-3 py-3.5 text-right">Tổng thanh toán</th>
                      <th className="py-3.5 pl-3 pr-6 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {recentBookings.map((b) => {
                      const nights = getNightCount(b.checkIn, b.checkOut)
                      return (
                        <tr
                          key={b.id}
                          className="group transition-colors hover:bg-slate-50/90"
                        >
                          <td className="whitespace-nowrap py-4 pl-6 pr-3">
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-700">
                              #{b.id}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-indigo-950 text-xs font-bold text-white shadow-xs">
                                {getInitials(b.guestName)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">{b.guestName}</p>
                                <p className="text-xs text-slate-400 font-medium">{b.guestPhone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 max-w-[200px]">
                            <p className="font-bold text-slate-800 truncate">{b.hotelName}</p>
                            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-slate-500 truncate">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                              {b.roomType}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <div className="inline-flex flex-col gap-0.5 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200/60">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <span>{formatDate(b.checkIn)}</span>
                                <span className="text-slate-300">→</span>
                                <span>{formatDate(b.checkOut)}</span>
                              </div>
                              {nights && (
                                <span className="text-[10px] font-bold text-indigo-600">
                                  Thời gian: {nights} đêm
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-right">
                            <span className="font-black text-slate-900">
                              {formatVnd(b.totalPrice)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right">
                            <StatusBadge status={b.status} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Hiển thị <strong className="text-slate-700">{recentBookings.length}</strong> trên tổng số{' '}
              <strong className="text-slate-700">{filteredBookings.length}</strong> đơn
            </span>
            <Link
              to="/admin/bookings"
              className="font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Đi tới trình quản lý đơn →
            </Link>
          </div>
        </div>

        {/* Status Distribution & Conversion Analytics (1 col) */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Cơ cấu Trạng thái</h2>
                <p className="mt-0.5 text-xs text-slate-500">Phân tích tỷ trọng xử lý đơn</p>
              </div>
              <span className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-extrabold text-white">
                {bookings.length} đơn
              </span>
            </div>

            {/* Multi-segment Stacked Bar */}
            {bookings.length > 0 ? (
              <div className="mt-6 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 gap-1">
                {statusConfig.map(({ status, color, label }) => {
                  const count = statusCounts[status] || 0
                  const percent = (count / bookings.length) * 100
                  if (percent <= 0) return null
                  return (
                    <div
                      key={status}
                      style={{ width: `${percent}%` }}
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      title={`${label}: ${count} đơn (${Math.round(percent)}%)`}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="mt-6 h-3.5 w-full rounded-full bg-slate-100" />
            )}

            {/* Status Items List */}
            <div className="mt-6 space-y-4">
              {statusConfig.map(({ status, label, color, bgLight, textColor, dotRing }) => {
                const count = statusCounts[status] || 0
                const percent = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0
                return (
                  <div key={status} className="group">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2.5 font-bold text-slate-700">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${color} ring-4 ${dotRing} transition-transform group-hover:scale-125`}
                        />
                        {label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{count} đơn</span>
                        <span
                          className={`w-12 text-center rounded-lg border px-1.5 py-0.5 text-[11px] font-extrabold ${bgLight} ${textColor}`}
                        >
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dual Summary Metrics Box */}
          <div className="mt-8 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/60 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Tỷ lệ thành công
              </p>
              <p className="mt-1 text-xl font-black text-emerald-600">{successRate}%</p>
              <p className="mt-0.5 text-[11px] text-emerald-600/80">
                {validRevenueBookings.length} đơn hợp lệ
              </p>
            </div>

            <div className="rounded-2xl bg-rose-50/70 border border-rose-200/60 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Tỷ lệ hủy đơn
              </p>
              <p className="mt-1 text-xl font-black text-rose-600">{cancelRate}%</p>
              <p className="mt-0.5 text-[11px] text-rose-600/80">
                {statusCounts.CANCELLED || 0} đơn đã hủy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Phân hệ Điều hành Nhanh</h3>
            <p className="text-xs text-slate-500">Lối tắt quản trị danh mục tài nguyên và phê duyệt vận hành</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Shortcut 1: Hotels */}
          <Link
            to="/admin/hotels"
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/5"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-500/15 transition-colors duration-300 group-hover:bg-sky-600 group-hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-700 transition-colors">
                {hotels.length} cơ sở
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                  Quản lý Khách sạn
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Thêm cơ sở mới, chỉnh sửa địa chỉ & hình ảnh
                </p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:translate-x-1 group-hover:bg-sky-600 group-hover:text-white">
                →
              </span>
            </div>
          </Link>

          {/* Shortcut 2: Rooms */}
          <Link
            to="/admin/rooms"
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/15 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                {rooms.length} hạng phòng
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Quản lý Loại phòng
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Cấu hình bảng giá, sức chứa & số lượng phòng
                </p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:translate-x-1 group-hover:bg-indigo-600 group-hover:text-white">
                →
              </span>
            </div>
          </Link>

          {/* Shortcut 3: Bookings */}
          <Link
            to="/admin/bookings"
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/5"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-500/15 transition-colors duration-300 group-hover:bg-amber-500 group-hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {statusCounts.PENDING > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  {statusCounts.PENDING} chờ duyệt
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {bookings.length} giao dịch
                </span>
              )}
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Điều phối Đặt phòng
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Duyệt đơn mới, xác nhận check-in & trả phòng
                </p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:translate-x-1 group-hover:bg-amber-500 group-hover:text-white">
                →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}