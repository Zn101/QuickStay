import { useState, useEffect, useMemo } from 'react'
import { api } from '../../lib/api'
import { Spinner, ErrorBox, ConfirmModal } from '../../components/ui'

export default function AdminPartners() {
  const [partners, setPartners] = useState([])
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [search, setSearch] = useState('')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPartner, setEditingPartner] = useState(null)
  const [deletingPartner, setDeletingPartner] = useState(null)

  // Form states
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    hotelId: '',
  })
  const [formBusy, setFormBusy] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadData(manual = false) {
    if (manual) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [partnerList, hotelList] = await Promise.all([
        api('/admin/partners'),
        api('/admin/hotels'),
      ])
      setPartners(Array.isArray(partnerList) ? partnerList : [])
      setHotels(Array.isArray(hotelList) ? hotelList : [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách tài khoản đối tác.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function showToast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  function openCreate() {
    setForm({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      hotelId: hotels.length > 0 ? String(hotels[0].id) : '',
    })
    setFormError('')
    setShowCreateModal(true)
  }

  function openEdit(p) {
    setEditingPartner(p)
    setForm({
      fullName: p.fullName || '',
      email: p.email || '',
      password: '',
      phone: p.phone || '',
      hotelId: p.hotelId ? String(p.hotelId) : (hotels.length > 0 ? String(hotels[0].id) : ''),
    })
    setFormError('')
  }

  async function handleCreateSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!form.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên người đại diện đối tác.')
      return
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setFormError('Vui lòng nhập địa chỉ email hợp lệ.')
      return
    }
    if (!form.password || form.password.length < 6) {
      setFormError('Mật khẩu khởi tạo phải từ 6 ký tự trở lên.')
      return
    }
    if (!form.hotelId) {
      setFormError('Vui lòng chọn cơ sở lưu trú (Khách sạn hoặc Homestay) phụ trách.')
      return
    }

    setFormBusy(true)
    try {
      const created = await api('/admin/partners', {
        method: 'POST',
        body: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          hotelId: Number(form.hotelId),
        },
      })
      setPartners((prev) => [created, ...prev])
      setShowCreateModal(false)
      showToast(`Đã cấp tài khoản đối tác thành công cho ${created.fullName} (${created.hotelName || 'Lưu trú'})!`)
    } catch (err) {
      setFormError(err.message || 'Có lỗi xảy ra khi tạo tài khoản đối tác.')
    } finally {
      setFormBusy(false)
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editingPartner) return
    setFormError('')

    if (!form.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên người đại diện.')
      return
    }

    setFormBusy(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        hotelId: form.hotelId ? Number(form.hotelId) : undefined,
      }
      if (form.password && form.password.trim()) {
        if (form.password.trim().length < 6) {
          setFormError('Mật khẩu mới phải từ 6 ký tự trở lên.')
          setFormBusy(false)
          return
        }
        payload.password = form.password.trim()
      }

      const updated = await api(`/admin/partners/${editingPartner.id}`, {
        method: 'PUT',
        body: payload,
      })
      setPartners((prev) => prev.map((p) => (p.id === editingPartner.id ? updated : p)))
      setEditingPartner(null)
      showToast(`Đã cập nhật thông tin tài khoản đối tác #${editingPartner.id} thành công!`)
    } catch (err) {
      setFormError(err.message || 'Có lỗi xảy ra khi cập nhật thông tin.')
    } finally {
      setFormBusy(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingPartner) return
    setFormBusy(true)
    try {
      await api(`/admin/partners/${deletingPartner.id}`, { method: 'DELETE' })
      setPartners((prev) => prev.filter((p) => p.id !== deletingPartner.id))
      showToast(`Đã xóa tài khoản đối tác ${deletingPartner.email} thành công!`)
      setDeletingPartner(null)
    } catch (err) {
      setError(err.message || 'Không thể xóa tài khoản đối tác.')
    } finally {
      setFormBusy(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return partners
    const q = search.trim().toLowerCase()
    return partners.filter((p) => {
      const matchName = p.fullName?.toLowerCase().includes(q)
      const matchEmail = p.email?.toLowerCase().includes(q)
      const matchPhone = p.phone?.toLowerCase().includes(q)
      const matchHotel = p.hotelName?.toLowerCase().includes(q)
      const matchCity = p.hotelCity?.toLowerCase().includes(q)
      const matchId = String(p.id).includes(q)
      return matchName || matchEmail || matchPhone || matchHotel || matchCity || matchId
    })
  }, [partners, search])

  // Phân loại đối tác homestay và khách sạn
  const homestayPartners = useMemo(
    () => partners.filter((p) => (p.hotelName || '').toLowerCase().includes('homestay')),
    [partners]
  )
  const hotelPartners = useMemo(
    () => partners.filter((p) => !(p.hotelName || '').toLowerCase().includes('homestay')),
    [partners]
  )

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-1/3 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-300 backdrop-blur-md mb-2.5 border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Phân quyền & Đối tác lưu trú
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Quản lý Tài khoản Đối tác</h1>
              <span className="rounded-full bg-indigo-400/20 px-2.5 py-0.5 text-xs font-bold text-indigo-200 border border-indigo-400/30">
                {partners.length} tài khoản
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Cấp tài khoản đăng nhập cho từng Khách sạn và Homestay để cơ sở lưu trú chủ động duyệt đơn, check-in và phục vụ khách hàng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur hover:bg-white/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Cấp tài khoản Đối tác
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng tài khoản</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{partners.length}</span>
            <span className="text-xs font-medium text-slate-400">đối tác đang hoạt động</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đối tác Khách sạn</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600">{hotelPartners.length}</span>
            <span className="text-xs font-medium text-slate-400">tài khoản khách sạn</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đối tác Homestay</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
                <path d="M9 21v-7h6v7" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">{homestayPartners.length}</span>
            <span className="text-xs font-medium text-slate-400">tài khoản homestay</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cơ sở lưu trú</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">{hotels.length}</span>
            <span className="text-xs font-medium text-slate-400">địa điểm trên hệ thống</span>
          </div>
        </div>
      </div>

      {/* Thông báo kết quả thao tác */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {/* Thanh tìm kiếm */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên người đại diện, email đối tác, số điện thoại, tên khách sạn hoặc homestay..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bảng danh sách tài khoản đối tác */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8">
          <Spinner text="Đang tải danh sách tài khoản đối tác..." />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400 ring-1 ring-indigo-100">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-700">
                {partners.length === 0 ? 'Chưa có tài khoản đối tác nào' : 'Không tìm thấy tài khoản phù hợp'}
              </p>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Bấm vào nút &quot;Cấp tài khoản Đối tác&quot; ở trên để tạo quyền truy cập cho cơ sở lưu trú.
              </p>
              {partners.length === 0 && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition-colors cursor-pointer"
                >
                  Cấp tài khoản đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 pl-5 pr-3">Đối tác</th>
                    <th className="px-3 py-3.5">Email đăng nhập</th>
                    <th className="px-3 py-3.5">Cơ sở lưu trú phụ trách</th>
                    <th className="px-3 py-3.5 text-center">Vai trò</th>
                    <th className="px-3 py-3.5 text-center">Ngày tạo</th>
                    <th className="py-3.5 pl-3 pr-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => {
                    const isHomestay = (p.hotelName || '').toLowerCase().includes('homestay')
                    return (
                      <tr key={p.id} className="group hover:bg-slate-50/70 transition-colors">
                        {/* Người đại diện */}
                        <td className="py-4 pl-5 pr-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 font-bold text-white text-xs shadow-xs">
                              {p.fullName?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{p.fullName}</p>
                              <p className="text-xs text-slate-500">{p.phone || 'Chưa cập nhật SĐT'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-3 py-4 font-mono text-xs text-slate-700">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-800">
                            {p.email}
                          </span>
                        </td>

                        {/* Cơ sở lưu trú phụ trách */}
                        <td className="px-3 py-4 max-w-[280px]">
                          {p.hotelName ? (
                            <div className="flex items-center gap-2">
                              <span className="text-base">{isHomestay ? '🏡' : '🏢'}</span>
                              <div className="truncate">
                                <p className="font-bold text-slate-900 truncate" title={p.hotelName}>
                                  {p.hotelName}
                                </p>
                                <p className="text-[11px] text-slate-400">{p.hotelCity || 'Việt Nam'}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs italic text-amber-600">Chưa gán cơ sở</span>
                          )}
                        </td>

                        {/* Vai trò */}
                        <td className="px-3 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                            {isHomestay ? '🏡 Đối tác Homestay' : '🏢 Đối tác Khách sạn'}
                          </span>
                        </td>

                        {/* Ngày tạo */}
                        <td className="px-3 py-4 text-center text-xs text-slate-400 whitespace-nowrap">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : 'Mặc định'}
                        </td>

                        {/* Thao tác */}
                        <td className="py-4 pl-3 pr-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPartner(p)}
                              className="rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          {filtered.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>
                Hiển thị <strong className="text-slate-800">{filtered.length}</strong> trên tổng số{' '}
                <strong className="text-slate-800">{partners.length}</strong> tài khoản đối tác
              </span>
              <span className="text-[11px] text-slate-400">
                Tài khoản đối tác đăng nhập tại trang Login và được tự động điều hướng về /partner
              </span>
            </div>
          )}
        </div>
      )}

      {/* Modal Cấp Tài khoản Đối tác Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-popup-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 text-lg">
                  🏡
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Cấp tài khoản Đối tác Mới</h3>
                  <p className="text-xs text-slate-500">Tạo tài khoản quản trị riêng cho Khách sạn / Homestay</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && <ErrorBox message={formError} />}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chọn Cơ sở lưu trú phụ trách <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.hotelId}
                  onChange={(e) => setForm((prev) => ({ ...prev, hotelId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Chọn khách sạn hoặc homestay --</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name.toLowerCase().includes('homestay') ? '🏡 [Homestay] ' : '🏢 [Khách sạn] '}
                      {h.name} — ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Họ và tên người đại diện / Quản lý <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Hoài Nam"
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email đăng nhập đối tác <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="partner-name@quickstay.local hoặc email thực"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={formBusy}
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {formBusy ? 'Đang tạo...' : 'Xác nhận cấp tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Tài khoản Đối tác */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-popup-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Chỉnh sửa Tài khoản Đối tác</h3>
                <p className="text-xs text-slate-500">Cập nhật thông tin #{editingPartner.id} ({editingPartner.email})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && <ErrorBox message={formError} />}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cơ sở lưu trú phụ trách
                </label>
                <select
                  value={form.hotelId}
                  onChange={(e) => setForm((prev) => ({ ...prev, hotelId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name.toLowerCase().includes('homestay') ? '🏡 [Homestay] ' : '🏢 [Khách sạn] '}
                      {h.name} — ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Họ và tên người đại diện
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Đổi mật khẩu mới <span className="font-normal text-slate-400 lowercase">(bỏ trống nếu giữ nguyên)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Mật khẩu mới (nếu đổi)"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={formBusy}
                  onClick={() => setEditingPartner(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {formBusy ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal Xóa Tài khoản */}
      <ConfirmModal
        isOpen={!!deletingPartner}
        title="Xác nhận xóa tài khoản đối tác"
        message={`Bạn có chắc chắn muốn xóa tài khoản đối tác "${deletingPartner?.fullName}" (${deletingPartner?.email}) quản lý ${deletingPartner?.hotelName}? Người này sẽ không còn quyền đăng nhập để xác nhận đơn phòng.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        danger={true}
        loading={formBusy}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPartner(null)}
      />
    </div>
  )
}
