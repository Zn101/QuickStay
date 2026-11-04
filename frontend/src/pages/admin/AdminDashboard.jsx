import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatVnd, formatDate, STATUS_LABEL, STATUS_STYLE } from '../../lib/format'
import { StatusBadge, Spinner, ErrorBox } from '../../components/ui'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hotels, setHotels] = useState([])
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  // Tổng doanh thu từ các đơn CONFIRMED, CHECKED_IN, COMPLETED
  const validRevenueBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED'
  )
  const totalRevenue = validRevenueBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)

  // Giá trị trung bình mỗi đơn thành công
  const avgOrderValue =
    validRevenueBookings.length > 0 ? Math.round(totalRevenue / validRevenueBookings.length) : 0

  // 5 đơn gần đây nhất
  const recentBookings = [...bookings].slice(0, 5)

  // Cấu hình hiển thị trạng thái
  const statusConfig = [
    { status: 'PENDING', label: 'Chờ xác nhận', color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700' },
    { status: 'CONFIRMED', label: 'Đã xác nhận', color: 'bg-sky-500', bgLight: 'bg-sky-50', textColor: 'text-sky-700' },
    { status: 'CHECKED_IN', label: 'Đã nhận phòng', color: 'bg-indigo-500', bgLight: 'bg-indigo-50', textColor: 'text-indigo-700' },
    { status: 'COMPLETED', label: 'Hoàn thành', color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { status: 'CANCELLED', label: 'Đã hủy', color: 'bg-rose-400', bgLight: 'bg-rose-50', textColor: 'text-rose-700' },
  ]

  // Helper lấy chữ cái đầu của tên khách
  const getInitials = (name) => {
    if (!name) return 'KH'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner text="Đang đồng bộ dữ liệu hệ thống..." />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative background blur */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-1/4 h-48 w-48 rounded-full bg-indigo-500/15 blur-2xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Hệ thống quản trị lưu trú
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Bảng điều khiển Tổng quan
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              Theo dõi hiệu suất kinh doanh, doanh thu thực tế và điều phối danh mục phòng trực tiếp theo thời gian thực.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 disabled:opacity-60 border border-white/15 shadow-sm"
            >
              <svg
                className={`h-4 w-4 text-sky-300 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isRefreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Doanh thu */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Doanh thu ghi nhận</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {formatVnd(totalRevenue)}
              </h3>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10 transition-transform group-hover:scale-105">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-400">Trung bình/đơn:</span>
            <span className="font-semibold text-emerald-600">{formatVnd(avgOrderValue)}</span>
          </div>
        </div>

        {/* Card 2: Tổng đơn đặt */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 to-blue-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng đơn đặt phòng</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {bookings.length}
              </h3>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-500/10 transition-transform group-hover:scale-105">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            {statusCounts.PENDING > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                {statusCounts.PENDING} đơn đang chờ duyệt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                ✓ Tất cả đơn đã được xử lý
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Khách sạn */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cơ sở Khách sạn</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {hotels.length}
              </h3>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-500/10 transition-transform group-hover:scale-105">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-400">Trạng thái:</span>
            <span className="font-semibold text-slate-700">Đang khai thác</span>
          </div>
        </div>

        {/* Card 4: Loại phòng */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hạng mục Phòng</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {rooms.length}
              </h3>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/10 transition-transform group-hover:scale-105">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-400">Trung bình:</span>
            <span className="font-semibold text-indigo-600">
              {hotels.length > 0 ? `${(rooms.length / hotels.length).toFixed(1)} loại / KS` : 'Chưa phân bổ'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Bookings & Status Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings Table (2 cols) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2 overflow-hidden">
          <div>
            <div className="flex flex-col gap-2 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Đơn đặt phòng mới nhất</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Danh sách 5 giao dịch đặt phòng gần đây trên hệ thống
                </p>
              </div>
              <Link
                to="/admin/bookings"
                className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-sky-600 transition-colors hover:bg-sky-50 hover:text-sky-700 sm:self-auto"
              >
                Xem toàn bộ
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">Chưa có đơn đặt phòng nào</p>
                <p className="mt-1 text-xs text-slate-400">Các đơn đặt phòng mới của khách hàng sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 pl-6 pr-3">Mã đơn</th>
                      <th className="px-3 py-3.5">Khách hàng</th>
                      <th className="px-3 py-3.5">Khách sạn / Phòng</th>
                      <th className="px-3 py-3.5">Lịch trình</th>
                      <th className="px-3 py-3.5 text-right">Tổng tiền</th>
                      <th className="py-3.5 pl-3 pr-6 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="group transition-colors hover:bg-slate-50/80">
                        <td className="whitespace-nowrap py-4 pl-6 pr-3">
                          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700 group-hover:bg-white group-hover:shadow-sm">
                            #{b.id}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-xs font-bold text-indigo-700">
                              {getInitials(b.guestName)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 line-clamp-1">{b.guestName}</p>
                              <p className="text-xs text-slate-400">{b.guestPhone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-semibold text-slate-800 line-clamp-1">{b.hotelName}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{b.roomType}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-100">
                            <span>{formatDate(b.checkIn)}</span>
                            <span className="text-slate-300">→</span>
                            <span>{formatDate(b.checkOut)}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right font-bold text-slate-900">
                          {formatVnd(b.totalPrice)}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/40 px-6 py-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Hiển thị {recentBookings.length} trên tổng số {bookings.length} đơn</span>
            <span>Cập nhật tức thời</span>
          </div>
        </div>

        {/* Status Breakdown (1 col) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Phân bổ trạng thái</h2>
                <p className="mt-0.5 text-xs text-slate-500">Tỷ trọng xử lý đơn đặt phòng</p>
              </div>
              <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-700">
                {bookings.length} đơn
              </span>
            </div>

            {/* Multi-segment Stacked Progress Bar */}
            {bookings.length > 0 && (
              <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 gap-0.5">
                {statusConfig.map(({ status, color }) => {
                  const count = statusCounts[status] || 0
                  const percent = (count / bookings.length) * 100
                  if (percent <= 0) return null
                  return (
                    <div
                      key={status}
                      style={{ width: `${percent}%` }}
                      className={`h-full ${color} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                      title={`${status}: ${count} đơn`}
                    />
                  )
                })}
              </div>
            )}

            {/* Detailed Status List */}
            <div className="mt-6 space-y-4">
              {statusConfig.map(({ status, label, color, bgLight, textColor }) => {
                const count = statusCounts[status] || 0
                const percent = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0
                return (
                  <div key={status} className="group">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2.5 font-semibold text-slate-700">
                        <span className={`h-2.5 w-2.5 rounded-full ${color} ring-2 ring-offset-1 ring-transparent group-hover:ring-slate-200 transition-all`} />
                        {label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{count}</span>
                        <span className={`w-11 text-right rounded-md px-1.5 py-0.5 text-[11px] font-bold ${bgLight} ${textColor}`}>
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

          <div className="mt-6 rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Tỷ lệ hoàn tất / xác nhận</span>
            <span className="font-extrabold text-emerald-600">
              {bookings.length > 0
                ? `${Math.round((validRevenueBookings.length / bookings.length) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Lối tắt điều hành nhanh</h3>
          <span className="text-xs text-slate-400">Truy cập trực tiếp các phân hệ quản lý</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/admin/hotels"
            className="group relative flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  Quản lý Khách sạn
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Thêm mới hoặc cập nhật cơ sở</p>
              </div>
            </div>
            <span className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-sky-600">
              →
            </span>
          </Link>

          <Link
            to="/admin/rooms"
            className="group relative flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Quản lý Loại phòng
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Thiết lập giá, sức chứa & tiện nghi</p>
              </div>
            </div>
            <span className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600">
              →
            </span>
          </Link>

          <Link
            to="/admin/bookings"
            className="group relative flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Duyệt Đơn đặt phòng
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Xác nhận check-in & cập nhật đơn</p>
              </div>
            </div>
            <span className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-amber-600">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}