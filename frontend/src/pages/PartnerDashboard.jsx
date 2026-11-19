import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { api } from '../lib/api'
import { formatVnd, formatDate, nightsBetween, STATUS_LABEL, STATUS_STYLE, PAYMENT_METHOD_LABEL } from '../lib/format'
import { StatusBadge, PaymentBadge, ErrorBox, Spinner, ConfirmModal } from '../components/ui'

export default function PartnerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [hotel, setHotel] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [changingId, setChangingId] = useState(null)

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)

  // AI Pricing Hints & Reply Draft States
  const [pricingHints, setPricingHints] = useState(null)
  const [loadingPricing, setLoadingPricing] = useState(false)
  const [pricingError, setPricingError] = useState('')
  const [replyDraftModal, setReplyDraftModal] = useState({ open: false, guestName: '', draft: '', busy: false, copied: false })

  async function loadPricingHints() {
    if (!hotel?.id) return
    setLoadingPricing(true)
    setPricingError('')
    try {
      const res = await api(`/ai/pricing-hints/${hotel.id}`)
      setPricingHints(res)
    } catch (err) {
      setPricingError(err.message || 'Không thể tải phân tích định giá.')
    } finally {
      setLoadingPricing(false)
    }
  }

  async function handleOpenReplyDraft(booking) {
    setReplyDraftModal({
      open: true,
      guestName: booking.guestName || 'Quý khách',
      draft: '',
      busy: true,
      copied: false,
    })
    try {
      const res = await api('/ai/reply-draft', {
        method: 'POST',
        body: {
          guestName: booking.guestName,
          guestMessage: `Khách đặt phòng ${booking.roomType} từ ngày ${formatDate(booking.checkIn)} đến ${formatDate(booking.checkOut)}. Tổng thanh toán: ${formatVnd(booking.totalPrice)}.`,
          hotelName: hotel?.name,
          language: 'vi',
        },
      })
      setReplyDraftModal((prev) => ({ ...prev, draft: res.draft, busy: false }))
    } catch (err) {
      setReplyDraftModal((prev) => ({
        ...prev,
        draft: `Kính gửi ${booking.guestName || 'Quý khách'},\n\nKhách sạn ${hotel?.name || 'QuickStay'} xin chân thành cảm ơn quý khách đã tin tưởng đặt phòng. Chúng tôi đã chuẩn bị chu đáo để đón tiếp quý khách. Nếu cần hỗ trợ thêm thông tin, xin vui lòng liên hệ với chúng tôi qua số điện thoại lễ tân. Trân trọng!`,
        busy: false,
      }))
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/partner' } })
      return
    }
  }, [user, navigate])

  async function loadData(manual = false) {
    if (manual) setRefreshing(true)
    else setLoading(true)
    setError('')
    setActionError('')
    try {
      const [hInfo, bList] = await Promise.all([
        api('/partner/hotel').catch(() => null),
        api('/partner/bookings').catch(() => []),
      ])
      setHotel(hInfo)
      setBookings(Array.isArray(bList) ? bList : [])
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin đối tác và đơn đặt phòng.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user && (user.role === 'HOTEL_MANAGER' || user.role === 'ADMIN')) {
      loadData()
    }
  }, [user])

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

  // Doanh thu thực tế đã thu và chờ thu
  const totalRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)
  }, [bookings])

  const pendingRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'PENDING')
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)
  }, [bookings])

  // Lọc danh sách theo trạng thái và tìm kiếm
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matchId = String(b.id).includes(q)
        const matchGuest = b.guestName?.toLowerCase().includes(q)
        const matchPhone = b.guestPhone?.toLowerCase().includes(q)
        const matchEmail = b.userEmail?.toLowerCase().includes(q)
        const matchRoom = b.roomType?.toLowerCase().includes(q)
        if (!matchId && !matchGuest && !matchPhone && !matchEmail && !matchRoom) {
          return false
        }
      }
      return true
    })
  }, [bookings, statusFilter, search])

  // Thực hiện đổi trạng thái đơn
  async function executeChangeStatus(id, nextStatus) {
    setChangingId(id)
    setActionError('')
    try {
      const updated = await api(`/partner/bookings/${id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
      })
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)))
      const label = STATUS_LABEL[nextStatus] || nextStatus
      setSuccessMessage(`Đã cập nhật đơn #${id} thành công: "${label}"!`)
      setTimeout(() => setSuccessMessage(''), 4000)
      return true
    } catch (err) {
      setActionError(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái đơn.')
      return false
    } finally {
      setChangingId(null)
    }
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return
    const ok = await executeChangeStatus(cancelTarget.id, 'CANCELLED')
    if (ok) {
      setCancelTarget(null)
    }
  }

  if (user && user.role !== 'HOTEL_MANAGER' && user.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center font-sans">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-bold text-slate-800">Khu vực dành cho Đối tác Lưu trú</h2>
        <p className="mt-2 text-sm text-slate-500">
          Tài khoản hiện tại của bạn là Khách hàng. Vui lòng đăng nhập với tài khoản Đối tác được cấp quyền để truy cập cổng này.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-sky-700 transition-colors"
        >
          Quay lại trang chủ
        </Link>
      </div>
    )
  }

  const isHomestay = (hotel?.name || '').toLowerCase().includes('homestay')

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-main)] py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Banner Đối tác */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 right-1/4 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-indigo-200 backdrop-blur-md mb-3 border border-white/10">
                <span className="text-sm">{isHomestay ? '🏡' : '🏢'}</span>
                <span>{isHomestay ? 'Cổng quản lý Homestay' : 'Cổng quản lý Khách sạn'}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                <span>{hotel?.name || 'Cơ sở lưu trú đối tác'}</span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {hotel ? (
                  <span>
                    📍 {hotel.address}, {hotel.city} · Phụ trách: <strong>{user?.fullName}</strong> ({user?.email})
                  </span>
                ) : (
                  <span>Đang tải thông tin cơ sở lưu trú...</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur hover:bg-white/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Đang tải...' : 'Làm mới'}
              </button>
              {hotel && (
                <Link
                  to={`/hotels/${hotel.id}`}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-xs font-bold text-white backdrop-blur transition-all"
                >
                  <span>Xem trang công khai</span>
                  <span>↗</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Thẻ Phân tích Định giá & Công suất AI (Pricing Hints) */}
        <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white dark:from-purple-950/40 dark:to-slate-900 p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-purple-100 dark:border-purple-900/50 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white text-base shadow-xs">
                💡
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Gợi ý Định giá & Phân bổ Công suất Lưu trú (AI Pricing Hints)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phân tích dữ liệu đặt phòng thực tế (ngày thường vs cuối tuần, lead time). AI giải thích số liệu thống kê.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadPricingHints}
              disabled={loadingPricing || !hotel?.id}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              {loadingPricing ? (
                <>
                  <Spinner size="sm" />
                  <span>Đang tính toán...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Phân tích định giá AI</span>
                </>
              )}
            </button>
          </div>

          {pricingError && <ErrorBox message={pricingError} />}

          {pricingHints && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-purple-100 dark:border-purple-900/40 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Tỷ lệ Ngày thường vs Cuối tuần</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    {pricingHints.stats?.weekdayBookings || 0} vs {pricingHints.stats?.weekendBookings || 0} đơn
                  </p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                    {pricingHints.stats?.weekendSharePercent || 0}% đơn vào T6 - CN
                  </p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-purple-100 dark:border-purple-900/40 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Thời gian đặt trước trung bình</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    ~{pricingHints.stats?.averageLeadTimeDays || 3} ngày
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Khoảng cách từ đặt tới nhận phòng</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-purple-100 dark:border-purple-900/40 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Tổng lượt giao dịch</p>
                  <p className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {pricingHints.stats?.totalBookings || 0} đơn lưu trú
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Cơ sở dữ liệu mẫu khách sạn</p>
                </div>
              </div>

              <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 p-3.5 border border-purple-100 dark:border-purple-900/50 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                {pricingHints.pricingAdvice}
              </div>
            </div>
          )}
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Chờ xác nhận */}
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white dark:from-slate-800 dark:to-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Chờ xác nhận
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{counts.PENDING}</span>
              <span className="text-xs font-semibold text-slate-500">cần duyệt ngay</span>
            </div>
          </div>

          {/* Đã xác nhận */}
          <div className="rounded-2xl border border-sky-200/80 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đã xác nhận</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-sky-600 dark:text-sky-400">{counts.CONFIRMED}</span>
              <span className="text-xs font-semibold text-slate-500">sẵn sàng đón khách</span>
            </div>
          </div>

          {/* Đang lưu trú */}
          <div className="rounded-2xl border border-indigo-200/80 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đang lưu trú</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
                  <path d="M9 21v-7h6v7" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{counts.CHECKED_IN}</span>
              <span className="text-xs font-semibold text-slate-500">phòng đang ở</span>
            </div>
          </div>

          {/* Hoàn thành */}
          <div className="rounded-2xl border border-emerald-200/80 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hoàn tất</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{counts.COMPLETED}</span>
              <span className="text-xs font-semibold text-slate-500">đã trả phòng</span>
            </div>
          </div>

          {/* Doanh thu ghi nhận */}
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 p-5 shadow-xs sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Doanh thu ghi nhận</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="text-sm font-bold">₫</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatVnd(totalRevenue)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chờ duyệt: <strong>{formatVnd(pendingRevenue)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Thẻ Phân tích Định giá & Công suất AI (Pricing Hints) */}
        <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white dark:from-purple-950/40 dark:to-slate-900 p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-purple-100 dark:border-purple-900/50 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white text-base shadow-xs">
                💡
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Gợi ý Định giá & Phân bổ Công suất Lưu trú (AI Pricing Hints)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phân tích dữ liệu đặt phòng thực tế (ngày thường vs cuối tuần, lead time). AI giải thích số liệu thống kê.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadPricingHints}
              disabled={loadingPricing || !hotel?.id}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              {loadingPricing ? (
                <>
                  <Spinner size="sm" />
                  <span>Đang tính toán...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Phân tích định giá AI</span>
                </>
              )}
            </button>
          </div>

          {pricingError && <ErrorBox message={pricingError} />}

          {pricingHints && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-purple-100 dark:border-purple-900/40 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Tỷ lệ Ngày thường vs Cuối tuần</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    {pricingHints.stats?.weekdayBookings || 0} vs {pricingHints.stats?.weekendBookings || 0} đơn
                  </p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                    {pricingHints.stats?.weekendSharePercent || 0}% đơn vào T6 - CN
                  </p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-purple-100 dark:border-purple-900/40 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Thời gian đặt trước trung bình</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    ~{pricingHints.stats?.averageLeadTimeDays || 3} ngày
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Khoảng cách từ đặt tới nhận phòng</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-purple-100 dark:border-purple-900/40 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Tổng lượt giao dịch</p>
                  <p className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {pricingHints.stats?.totalBookings || 0} đơn lưu trú
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Cơ sở dữ liệu mẫu khách sạn</p>
                </div>
              </div>

              <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 p-3.5 border border-purple-100 dark:border-purple-900/50 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                {pricingHints.pricingAdvice}
              </div>
            </div>
          )}
        </div>

        {/* Thông báo kết quả thao tác */}
        {successMessage && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/70 dark:border-emerald-800 px-4 py-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {actionError && <ErrorBox message={actionError} />}
        {error && <ErrorBox message={error} />}

        {/* Bộ lọc trạng thái & Thanh tìm kiếm */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn (#id), tên khách hàng, số điện thoại, hạng phòng..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline-block">
              Lọc theo:
            </span>
            {[
              { id: 'ALL', label: 'Tất cả đơn', count: counts.ALL, color: 'bg-slate-900 text-white' },
              { id: 'PENDING', label: 'Chờ duyệt', count: counts.PENDING, color: 'bg-amber-600 text-white' },
              { id: 'CONFIRMED', label: 'Đã xác nhận', count: counts.CONFIRMED, color: 'bg-sky-600 text-white' },
              { id: 'CHECKED_IN', label: 'Đang lưu trú', count: counts.CHECKED_IN, color: 'bg-indigo-600 text-white' },
              { id: 'COMPLETED', label: 'Hoàn tất', count: counts.COMPLETED, color: 'bg-emerald-600 text-white' },
              { id: 'CANCELLED', label: 'Đã hủy', count: counts.CANCELLED, color: 'bg-slate-700 text-white' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? `${tab.color} shadow-xs`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách đơn đặt phòng */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
            <Spinner text="Đang đồng bộ danh sách đơn đặt phòng..." />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-400 text-2xl">
                  📋
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                  {bookings.length === 0
                    ? 'Cơ sở chưa có đơn đặt phòng nào'
                    : 'Không tìm thấy đơn đặt phòng phù hợp bộ lọc'}
                </p>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  {bookings.length === 0
                    ? 'Khi khách hàng đặt phòng tại cơ sở lưu trú của bạn, đơn mới sẽ xuất hiện ngay tại đây.'
                    : 'Thử xóa bộ lọc tìm kiếm để xem tất cả các đơn khác.'}
                </p>
                {(statusFilter !== 'ALL' || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL')
                      setSearch('')
                    }}
                    className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Xem tất cả đơn
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 pl-5 pr-3">Mã đơn</th>
                      <th className="px-3 py-3.5">Khách hàng</th>
                      <th className="px-3 py-3.5">Hạng phòng</th>
                      <th className="px-3 py-3.5">Lịch trình lưu trú</th>
                      <th className="px-3 py-3.5 text-center">Số khách</th>
                      <th className="px-3 py-3.5 text-right">Tổng tiền</th>
                      <th className="px-3 py-3.5 text-center">Trạng thái</th>
                      <th className="py-3.5 pl-3 pr-5 text-right">Thao tác của Đối tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBookings.map((b) => {
                      const nights = nightsBetween(b.checkIn, b.checkOut)
                      const isBusy = changingId === b.id

                      return (
                        <tr key={b.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Mã đơn */}
                          <td className="whitespace-nowrap py-4 pl-5 pr-3">
                            <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
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

                          {/* Khách hàng */}
                          <td className="px-3 py-4 max-w-[200px]">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{b.guestName}</p>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{b.guestPhone}</p>
                            <p className="text-[11px] text-slate-400 truncate" title={b.userEmail}>
                              {b.userEmail}
                            </p>
                          </td>

                          {/* Hạng phòng */}
                          <td className="px-3 py-4 max-w-[220px]">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{b.roomType}</p>
                            {b.note && (
                              <p
                                className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 italic truncate bg-amber-50 dark:bg-amber-950/60 rounded px-1.5 py-0.5 border border-amber-200/50"
                                title={`Ghi chú của khách: ${b.note}`}
                              >
                                Ghi chú: {b.note}
                              </p>
                            )}
                          </td>

                          {/* Lịch trình */}
                          <td className="whitespace-nowrap px-3 py-4">
                            <div className="inline-flex flex-col gap-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <span>{formatDate(b.checkIn)}</span>
                                <span className="text-slate-300 dark:text-slate-600">→</span>
                                <span>{formatDate(b.checkOut)}</span>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                Thời gian: {nights || 1} đêm
                              </span>
                            </div>
                          </td>

                          {/* Số khách */}
                          <td className="whitespace-nowrap px-3 py-4 text-center">
                            <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                              {b.guests} người
                            </span>
                          </td>

                          {/* Tổng tiền & thanh toán */}
                          <td className="whitespace-nowrap px-3 py-4 text-right">
                            <span className="font-extrabold text-sky-700 dark:text-sky-400 text-sm">
                              {formatVnd(b.totalPrice)}
                            </span>
                            <div className="mt-1 flex flex-col items-end gap-0.5">
                              <PaymentBadge status={b.paymentStatus} />
                              <span className="text-[10px] text-slate-400">
                                {PAYMENT_METHOD_LABEL[b.paymentMethod] || b.paymentMethod || 'Tại khách sạn'}
                              </span>
                            </div>
                          </td>

                          {/* Trạng thái */}
                          <td className="whitespace-nowrap px-3 py-4 text-center">
                            <StatusBadge status={b.status} />
                          </td>

                          {/* Thao tác độc quyền của Đối tác */}
                          <td className="whitespace-nowrap py-4 pl-3 pr-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {b.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => executeChangeStatus(b.id, 'CONFIRMED')}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                    title="Xác nhận giữ phòng cho khách"
                                  >
                                    {isBusy ? (
                                      '...'
                                    ) : (
                                      <>
                                        <span>✓</span>
                                        <span>Xác nhận đơn</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => setCancelTarget(b)}
                                    className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                                    title="Từ chối hoặc hủy đơn"
                                  >
                                    Hủy
                                  </button>
                                </>
                              )}

                              {b.status === 'CONFIRMED' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => executeChangeStatus(b.id, 'CHECKED_IN')}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                    title="Khách hàng đã đến và nhận chìa khóa phòng"
                                  >
                                    {isBusy ? (
                                      '...'
                                    ) : (
                                      <>
                                        <span>🔑</span>
                                        <span>Nhận phòng</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => setCancelTarget(b)}
                                    className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    Hủy
                                  </button>
                                </>
                              )}

                              {b.status === 'CHECKED_IN' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => executeChangeStatus(b.id, 'COMPLETED')}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                  title="Khách trả phòng và hoàn tất thủ tục lưu trú"
                                >
                                  {isBusy ? (
                                    '...'
                                  ) : (
                                    <>
                                      <span>🏁</span>
                                      <span>Trả phòng & Hoàn tất</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {b.status === 'COMPLETED' && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  <span>✨</span>
                                  <span>Đã kết thúc lưu trú</span>
                                </span>
                              )}

                              {b.status === 'CANCELLED' && (
                                <span className="text-xs font-semibold text-slate-400 italic">
                                  Đã hủy đơn
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenReplyDraft(b)}
                                className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors cursor-pointer"
                                title="Soạn tin nhắn phản hồi khách hàng bằng AI"
                              >
                                ✨ Nhắn tin
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

            {filteredBookings.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-5 py-3 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>
                  Hiển thị <strong className="text-slate-800 dark:text-white">{filteredBookings.length}</strong> trên tổng số{' '}
                  <strong className="text-slate-800 dark:text-white">{bookings.length}</strong> đơn đặt phòng của cơ sở
                </span>
                <span className="text-[11px] text-slate-400">
                  Thao tác trực tiếp cập nhật trạng thái đơn phòng của khách hàng
                </span>
              </div>
            )}
          </div>
        )}

        {/* Modal xác nhận Hủy đơn */}
        <ConfirmModal
          isOpen={!!cancelTarget}
          title="Xác nhận hủy đơn đặt phòng"
          message={`Bạn có chắc chắn muốn hủy đơn đặt phòng #${cancelTarget?.id} của khách hàng "${cancelTarget?.guestName}"? Thao tác này sẽ chuyển trạng thái đơn sang "Đã hủy".`}
          confirmText="Xác nhận hủy"
          cancelText="Quay lại"
          danger={true}
          loading={changingId === cancelTarget?.id}
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancelTarget(null)}
        />

        {/* Modal Soạn tin nhắn trả lời bằng AI (AI Reply Draft) */}
        {replyDraftModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black">
                    ✨
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Soạn tin nhắn cho khách (AI Reply Draft)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Người nhận: <strong className="text-slate-700 dark:text-slate-200">{replyDraftModal.guestName}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyDraftModal({ open: false, guestName: '', draft: '', busy: false, copied: false })}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {replyDraftModal.busy ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Spinner size="md" />
                  <p className="text-xs text-slate-500">AI đang soạn bản thảo trả lời lịch thiệp...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Nội dung bản thảo do AI tạo:
                    </label>
                    <textarea
                      rows={6}
                      value={replyDraftModal.draft}
                      onChange={(e) => setReplyDraftModal((prev) => ({ ...prev, draft: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      💡 Bạn có thể chỉnh sửa nội dung trước khi gửi.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(replyDraftModal.draft)
                        setReplyDraftModal((prev) => ({ ...prev, copied: true }))
                        setTimeout(() => setReplyDraftModal((prev) => ({ ...prev, copied: false })), 2000)
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition-colors shadow-xs cursor-pointer"
                    >
                      {replyDraftModal.copied ? '✓ Đã sao chép' : 'Sao chép tin nhắn'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
