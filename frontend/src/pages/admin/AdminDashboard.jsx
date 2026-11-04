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

  async function loadData() {
    setLoading(true)
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
  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)

  // 5 đơn gần đây nhất
  const recentBookings = [...bookings].slice(0, 5)

  if (loading) {
    return (
      <div className="py-24">
        <Spinner text="Đang tải dữ liệu tổng quan..." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Bảng điều khiển Tổng quan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem nhanh thống kê hoạt động kinh doanh, khách sạn, phòng và đơn đặt phòng.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Doanh thu */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Doanh thu tạm tính</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{formatVnd(totalRevenue)}</h3>
            <p className="mt-1 text-xs text-slate-400">Từ các đơn đã xác nhận / hoàn tất</p>
          </div>
        </div>

        {/* Tổng đơn đặt */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng đơn đặt</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
              </svg>
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{bookings.length}</h3>
            <p className="mt-1 text-xs text-amber-600 font-medium">
              {statusCounts.PENDING > 0 ? `⚡ ${statusCounts.PENDING} đơn đang chờ duyệt` : 'Tất cả đơn đã được xử lý'}
            </p>
          </div>
        </div>

        {/* Tổng khách sạn */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Khách sạn</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{hotels.length}</h3>
            <p className="mt-1 text-xs text-slate-400">Cơ sở lưu trú đang hoạt động</p>
          </div>
        </div>

        {/* Loại phòng */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loại phòng</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{rooms.length}</h3>
            <p className="mt-1 text-xs text-slate-400">Cấu hình loại phòng sẵn sàng</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Bookings & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Đơn đặt phòng gần đây</h2>
              <p className="text-xs text-slate-400 mt-0.5">5 đơn đặt mới nhất trên hệ thống</p>
            </div>
            <Link
              to="/admin/bookings"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">Chưa có đơn đặt phòng nào trong hệ thống.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <th className="pb-3">Mã đơn</th>
                    <th className="pb-3">Khách sạn / Loại phòng</th>
                    <th className="pb-3">Khách đặt</th>
                    <th className="pb-3">Thời gian</th>
                    <th className="pb-3">Tổng tiền</th>
                    <th className="pb-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 font-bold text-slate-700">#{b.id}</td>
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-800">{b.hotelName}</p>
                        <p className="text-xs text-slate-400">{b.roomType}</p>
                      </td>
                      <td className="py-3.5 text-slate-600">
                        <p className="font-medium text-slate-800">{b.guestName}</p>
                        <p className="text-xs text-slate-400">{b.guestPhone}</p>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                      </td>
                      <td className="py-3.5 font-bold text-slate-800 whitespace-nowrap">
                        {formatVnd(b.totalPrice)}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Breakdown (1 col) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Trạng thái đơn phòng</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tỷ lệ theo từng trạng thái</p>

            <div className="mt-6 space-y-4">
              {[
                { status: 'PENDING', label: 'Chờ xác nhận', color: 'bg-amber-500' },
                { status: 'CONFIRMED', label: 'Đã xác nhận', color: 'bg-blue-500' },
                { status: 'CHECKED_IN', label: 'Đã nhận phòng', color: 'bg-indigo-500' },
                { status: 'COMPLETED', label: 'Hoàn thành', color: 'bg-emerald-500' },
                { status: 'CANCELLED', label: 'Đã hủy', color: 'bg-slate-400' },
              ].map(({ status, label, color }) => {
                const count = statusCounts[status] || 0
                const percent = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-600 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                        {label}
                      </span>
                      <span className="text-slate-900 font-bold">
                        {count} <span className="text-slate-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${color} transition-all duration-500 rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng cộng:</span>
            <span className="font-extrabold text-slate-900">{bookings.length} đơn</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-6">
        <h3 className="text-base font-bold text-sky-950 mb-3">Lối tắt thao tác nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/hotels"
            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:shadow transition-shadow border border-sky-100/80 group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              +
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Quản lý khách sạn</p>
              <p className="text-xs text-slate-500">Thêm hoặc cập nhật cơ sở</p>
            </div>
          </Link>

          <Link
            to="/admin/rooms"
            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:shadow transition-shadow border border-sky-100/80 group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              +
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Quản lý loại phòng</p>
              <p className="text-xs text-slate-500">Tạo mới, chỉnh sửa giá & sức chứa</p>
            </div>
          </Link>

          <Link
            to="/admin/bookings"
            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:shadow transition-shadow border border-sky-100/80 group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              ⚡
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Duyệt đơn đặt phòng</p>
              <p className="text-xs text-slate-500">Xác nhận hoặc cập nhật trạng thái</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
