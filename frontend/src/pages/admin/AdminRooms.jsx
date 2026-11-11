import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { formatVnd } from '../../lib/format'
import { ErrorBox } from '../../components/ui'

const EMPTY = { hotelId: '', roomType: '', pricePerNight: '', capacity: '', quantity: '', description: '' }

export default function AdminRooms() {
  const [rooms, setRooms] = useState([])
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterHotelId, setFilterHotelId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // State quản lý Modal xác nhận xóa
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    Promise.all([api('/admin/hotels'), api('/admin/rooms')])
      .then(([h, r]) => { setHotels(h); setRooms(r) })
      .finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setForm(EMPTY)
    setEditId(null)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(r) {
    setForm({
      hotelId: String(r.hotelId),
      roomType: r.roomType,
      pricePerNight: String(r.pricePerNight),
      capacity: String(r.capacity),
      quantity: String(r.quantity),
      description: r.description || '',
    })
    setEditId(r.id)
    setFormError('')
    setShowForm(true)
  }

  async function submit(e) {
    e.preventDefault()
    setFormError('')
    setBusy(true)
    const body = {
      hotelId: Number(form.hotelId),
      roomType: form.roomType,
      pricePerNight: Number(form.pricePerNight),
      capacity: Number(form.capacity),
      quantity: Number(form.quantity),
      description: form.description,
    }
    try {
      if (editId) {
        const updated = await api(`/admin/rooms/${editId}`, { method: 'PUT', body })
        setRooms((rs) => rs.map((r) => (r.id === editId ? updated : r)))
      } else {
        const created = await api('/admin/rooms', { method: 'POST', body })
        setRooms((rs) => [...rs, created])
      }
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function triggerDelete(room) {
    setDeleteTarget(room)
    setDeleteError('')
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await api(`/admin/rooms/${deleteTarget.id}`, { method: 'DELETE' })
      setRooms((rs) => rs.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err.message || 'Đã có lỗi xảy ra khi xóa hạng phòng này')
    } finally {
      setDeleting(false)
    }
  }

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  const filteredRooms = rooms.filter((r) => {
    const matchHotel = filterHotelId ? r.hotelId === Number(filterHotelId) : true
    const hotelName = hotels.find((h) => h.id === r.hotelId)?.name || ''
    const matchSearch = searchQuery
      ? r.roomType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
    return matchHotel && matchSearch
  })

  const totalRoomTypes = filteredRooms.length
  const totalRoomQuantity = filteredRooms.reduce((sum, r) => sum + Number(r.quantity || 0), 0)
  const totalCapacity = filteredRooms.reduce((sum, r) => sum + Number(r.capacity || 0) * Number(r.quantity || 0), 0)
  const avgPrice = totalRoomTypes > 0
    ? Math.round(filteredRooms.reduce((sum, r) => sum + Number(r.pricePerNight || 0), 0) / totalRoomTypes)
    : 0

  const inputClass = 'w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all duration-200'

  return (
    <div className="space-y-6 pb-10">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Quản lý hạng phòng</h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Thiết lập cấu hình loại phòng, mức giá niêm yết, sức chứa tiêu chuẩn và số lượng phòng cho từng khách sạn.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="group inline-flex items-center justify-center gap-2.5 self-start sm:self-auto rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 transition-transform group-hover:rotate-90">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Thêm hạng phòng
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hạng phòng</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalRoomTypes}</span>
            <span className="text-xs font-medium text-slate-400">phân loại</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng quỹ phòng</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalRoomQuantity}</span>
            <span className="text-xs font-medium text-slate-400">phòng khai thác</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng công suất</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalCapacity}</span>
            <span className="text-xs font-medium text-slate-400">khách tối đa</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Giá trung bình</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900">{formatVnd(avgPrice)}</span>
            <span className="text-xs font-medium text-slate-400">/ đêm</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm tên hạng phòng, khách sạn, mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="relative min-w-[220px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
            </svg>
            <select
              value={filterHotelId}
              onChange={(e) => setFilterHotelId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 py-2 text-sm font-medium text-slate-700 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer"
            >
              <option value="">Tất cả khách sạn ({hotels.length})</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {(filterHotelId || searchQuery) && (
          <button
            onClick={() => { setFilterHotelId(''); setSearchQuery('') }}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="divide-y divide-slate-100 p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center justify-between pt-4 first:pt-0 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-slate-200" />
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-6 w-28 rounded-lg bg-slate-100" />
                <div className="h-8 w-20 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-4 text-left">Mã</th>
                  <th className="px-5 py-4 text-left">Khách sạn</th>
                  <th className="px-5 py-4 text-left">Hạng phòng & Mô tả</th>
                  <th className="px-5 py-4 text-right">Giá niêm yết / đêm</th>
                  <th className="px-5 py-4 text-center">Sức chứa</th>
                  <th className="px-5 py-4 text-center">Số lượng</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((r) => {
                  const hotel = hotels.find((h) => h.id === r.hotelId)
                  return (
                    <tr key={r.id} className="group hover:bg-sky-50/30 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                          #{r.id}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-700 font-bold text-xs">
                            {hotel?.name ? hotel.name.charAt(0).toUpperCase() : 'H'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 line-clamp-1">
                              {hotel?.name || `Khách sạn #${r.hotelId}`}
                            </div>
                            {hotel?.city && (
                              <div className="text-xs text-slate-400">{hotel.city}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-slate-900">{r.roomType}</div>
                        {r.description ? (
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1" title={r.description}>
                            {r.description}
                          </p>
                        ) : (
                          <span className="text-xs italic text-slate-300">Chưa có mô tả</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center rounded-xl bg-sky-50 px-3 py-1.5 text-sm font-extrabold text-sky-700 border border-sky-100">
                          {formatVnd(r.pricePerNight)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-slate-400">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {r.capacity} khách
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${r.quantity > 5
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : r.quantity > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${r.quantity > 5 ? 'bg-emerald-500' : r.quantity > 0 ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                          {r.quantity} phòng
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(r)}
                            title="Chỉnh sửa"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition-all cursor-pointer"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Sửa
                          </button>
                          <button
                            onClick={() => triggerDelete(r)}
                            title="Xóa phòng"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all cursor-pointer"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        </div>
                        <h3 className="text-base font-bold text-slate-800">Không tìm thấy hạng phòng nào</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {filterHotelId || searchQuery
                            ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.'
                            : 'Hãy bắt đầu bằng việc thêm hạng phòng đầu tiên cho khách sạn.'}
                        </p>
                        {!(filterHotelId || searchQuery) && (
                          <button
                            onClick={openCreate}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition"
                          >
                            + Thêm phòng ngay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form Thêm / Sửa */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-md px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {editId ? 'Cập nhật hạng phòng' : 'Thêm hạng phòng mới'}
                  </h2>
                  <p className="text-xs text-slate-400">Điền đầy đủ thông tin tiêu chuẩn bên dưới</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={submit} className="p-6 space-y-5">
              <ErrorBox message={formError} />

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Khách sạn trực thuộc <span className="text-rose-500">*</span>
                </label>
                <select required value={form.hotelId} onChange={setField('hotelId')} className={inputClass}>
                  <option value="">-- Chọn khách sạn --</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tên hạng phòng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Deluxe Ocean View..."
                    value={form.roomType}
                    onChange={setField('roomType')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Giá / đêm (VND) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="0"
                      placeholder="1500000"
                      value={form.pricePerNight}
                      onChange={setField('pricePerNight')}
                      className={`${inputClass} pr-14 font-semibold text-sky-700`}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      VND
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Sức chứa tiêu chuẩn <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="2"
                      value={form.capacity}
                      onChange={setField('capacity')}
                      className={`${inputClass} pr-16`}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      khách
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Số lượng phòng <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="10"
                      value={form.quantity}
                      onChange={setField('quantity')}
                      className={`${inputClass} pr-16`}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      phòng
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mô tả chi tiết & Tiện nghi
                </label>
                <textarea
                  rows={4}
                  placeholder="Mô tả diện tích, hướng nhìn, nội thất, tiện ích đi kèm..."
                  value={form.description}
                  onChange={setField('description')}
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-600/20 hover:brightness-110 disabled:opacity-60 transition-all cursor-pointer"
                >
                  {busy ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang lưu...
                    </>
                  ) : editId ? (
                    'Lưu thay đổi'
                  ) : (
                    'Tạo hạng phòng'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa phòng */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Xác nhận xóa hạng phòng</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn xóa hạng phòng{' '}
                  <span className="font-bold text-slate-800">"{deleteTarget.roomType}"</span> không?
                  Hành động này sẽ xóa dữ liệu vĩnh viễn và không thể khôi phục.
                </p>
              </div>
            </div>

            {deleteError && (
              <ErrorBox message={deleteError} />
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
              >
                {deleting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  'Xác nhận xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}