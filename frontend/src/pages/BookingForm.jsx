import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, formatDate, todayIso, nightsBetween } from '../lib/format'
import { useAuth } from '../store/authStore'
import { ErrorBox, FieldError, Spinner } from '../components/ui'

function getNextDay(isoDate) {
  if (!isoDate) return todayIso(1)
  const [y, m, d] = isoDate.split('-').map(Number)
  const next = new Date(y, m - 1, d + 1)
  const pad = (n) => String(n).padStart(2, '0')
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

function isValidPhone(phone) {
  if (!phone) return false
  const clean = phone.replace(/[\s.-]/g, '')
  // Số điện thoại Việt Nam hợp lệ: 10 chữ số (hoặc +84 theo sau 9 chữ số)
  return /^(0|\+84)\d{9}$/.test(clean)
}

export default function BookingForm() {
  const { hotelId, roomId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [hotel, setHotel] = useState(state?.hotel || null)
  const [room, setRoom] = useState(state?.room || null)
  const [loadingRoom, setLoadingRoom] = useState(!state?.hotel || !state?.room)

  const [checkIn, setCheckIn] = useState(state?.checkIn || todayIso(1))
  const [checkOut, setCheckOut] = useState(state?.checkOut || todayIso(2))

  const [form, setForm] = useState({
    guestName: user?.fullName || '',
    guestPhone: user?.phone || '',
    guests: 1,
    note: '',
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Cập nhật thông tin người dùng nếu tải lại hoặc thay đổi auth
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        guestName: prev.guestName || user.fullName || '',
        guestPhone: prev.guestPhone || user.phone || '',
      }))
    }
  }, [user])

  // Phục hồi dữ liệu nếu truy cập trực tiếp URL hoặc F5 tải lại trang
  useEffect(() => {
    if (hotel && room) return
    if (!hotelId || !roomId) {
      setLoadingRoom(false)
      return
    }

    setLoadingRoom(true)
    Promise.all([
      api(`/hotels/${hotelId}`),
      api(`/hotels/${hotelId}/rooms`, {
        params: checkIn && checkOut ? { checkIn, checkOut } : undefined,
      }),
    ])
      .then(([h, rooms]) => {
        setHotel(h)
        const targetRoom = (rooms || []).find((r) => String(r.id) === String(roomId))
        if (!targetRoom) {
          setError('Không tìm thấy thông tin phòng đã chọn.')
        } else {
          setRoom(targetRoom)
        }
      })
      .catch((err) => setError(err.message || 'Không thể tải thông tin phòng.'))
      .finally(() => setLoadingRoom(false))
  }, [hotelId, roomId, hotel, room, checkIn, checkOut])

  const nights = nightsBetween(checkIn, checkOut)
  const total = room && nights > 0 ? room.pricePerNight * nights : 0

  function validateField(name, value) {
    const today = todayIso()
    switch (name) {
      case 'guestName':
        if (!value || !value.trim()) return 'Vui lòng nhập họ và tên người nhận phòng.'
        return ''
      case 'guestPhone':
        if (!value || !value.trim()) return 'Vui lòng nhập số điện thoại liên hệ.'
        if (!isValidPhone(value)) return 'Số điện thoại không hợp lệ (10 chữ số, ví dụ: 0912345678).'
        return ''
      case 'guests':
        if (!value || Number(value) < 1) return 'Số lượng khách phải lớn hơn 0.'
        if (room && Number(value) > room.capacity)
          return `Số khách không được vượt quá sức chứa tối đa (${room.capacity} khách).`
        return ''
      case 'checkIn':
        if (!value) return 'Vui lòng chọn ngày nhận phòng.'
        if (value < today) return 'Ngày nhận phòng không được ở trong quá khứ.'
        return ''
      case 'checkOut':
        if (!value) return 'Vui lòng chọn ngày trả phòng.'
        if (value <= checkIn) return 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.'
        return ''
      default:
        return ''
    }
  }

  function handleInputChange(name) {
    return (e) => {
      const val = e.target.value
      setForm((prev) => ({ ...prev, [name]: val }))
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, val) }))
    }
  }

  function handleCheckInChange(val) {
    setCheckIn(val)
    const errIn = validateField('checkIn', val)
    const errOut = validateField('checkOut', checkOut)
    setFieldErrors((prev) => ({ ...prev, checkIn: errIn, checkOut: errOut }))
  }

  function handleCheckOutChange(val) {
    setCheckOut(val)
    const errOut = val <= checkIn ? 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.' : ''
    setFieldErrors((prev) => ({ ...prev, checkOut: errOut }))
  }

  function validateAll() {
    const today = todayIso()
    const errors = {}

    if (!form.guestName || !form.guestName.trim()) {
      errors.guestName = 'Vui lòng nhập họ và tên người nhận phòng.'
    }
    if (!form.guestPhone || !form.guestPhone.trim()) {
      errors.guestPhone = 'Vui lòng nhập số điện thoại liên hệ.'
    } else if (!isValidPhone(form.guestPhone)) {
      errors.guestPhone = 'Số điện thoại không hợp lệ (10 chữ số, ví dụ: 0912345678).'
    }

    const guestsNum = Number(form.guests)
    if (!form.guests || guestsNum < 1) {
      errors.guests = 'Số lượng khách phải lớn hơn 0.'
    } else if (room && guestsNum > room.capacity) {
      errors.guests = `Số khách không được vượt quá sức chứa tối đa (${room.capacity} khách).`
    }

    if (!checkIn) {
      errors.checkIn = 'Vui lòng chọn ngày nhận phòng.'
    } else if (checkIn < today) {
      errors.checkIn = 'Ngày nhận phòng không được ở trong quá khứ.'
    }

    if (!checkOut) {
      errors.checkOut = 'Vui lòng chọn ngày trả phòng.'
    } else if (checkOut <= checkIn) {
      errors.checkOut = 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setError('')

    if (!user) {
      setError('Vui lòng đăng nhập để tiến hành đặt phòng.')
      navigate('/login', {
        state: {
          from: `/hotels/${hotel?.id || hotelId}/rooms/${room?.id || roomId}/book`,
          hotel,
          room,
          checkIn,
          checkOut,
        },
      })
      return
    }

    const isValid = validateAll()
    if (!isValid) {
      setError('Vui lòng kiểm tra và sửa các thông tin chưa hợp lệ trong form.')
      return
    }

    if (nights <= 0) {
      setError('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.')
      return
    }

    setBusy(true)
    try {
      const cleanPhone = form.guestPhone.replace(/[\s.-]/g, '')
      const booking = await api('/bookings', {
        method: 'POST',
        body: {
          roomId: Number(room.id),
          checkIn,
          checkOut,
          guests: Number(form.guests),
          guestName: form.guestName.trim(),
          guestPhone: cleanPhone,
          note: form.note ? form.note.trim() : '',
        },
      })
      navigate('/my-bookings', { state: { newBookingId: booking.id } })
    } catch (err) {
      if (err.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        navigate('/login', {
          state: {
            from: `/hotels/${hotel?.id || hotelId}/rooms/${room?.id || roomId}/book`,
            hotel,
            room,
            checkIn,
            checkOut,
          },
        })
      } else {
        setError(err.message || 'Đã có lỗi xảy ra khi tạo đơn đặt phòng.')
      }
    } finally {
      setBusy(false)
    }
  }

  if (loadingRoom) {
    return (
      <div className="py-24">
        <Spinner text="Đang tải thông tin phòng..." />
      </div>
    )
  }

  if (!hotel || !room) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Thông tin đặt phòng không hợp lệ</h2>
        <p className="mt-2 text-sm text-slate-500">
          {error || 'Không tìm thấy thông tin khách sạn hoặc loại phòng đã chọn.'}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    )
  }

  const fieldClass = (hasError) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
      hasError
        ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100'
        : 'border-slate-200 bg-slate-50 hover:border-slate-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100'
    }`

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-slate-600 transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link to={`/hotels/${hotel.id}`} className="hover:text-slate-600 transition-colors">{hotel.name}</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">Đặt phòng</span>
      </nav>

      {!user && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 flex items-center justify-between gap-4">
          <span>Bạn cần đăng nhập để hoàn tất đặt phòng.</span>
          <Link
            to="/login"
            state={{
              from: `/hotels/${hotel.id}/rooms/${room.id}/book`,
              hotel,
              room,
              checkIn,
              checkOut,
            }}
            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition-colors flex-shrink-0"
          >
            Đăng nhập ngay
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Form */}
        <div className="lg:col-span-3">
          <h1 className="mb-7 text-2xl font-extrabold tracking-tight text-slate-900">Thông tin đặt phòng</h1>

          <form onSubmit={submit} noValidate className="space-y-5">
            {error && <ErrorBox message={error} />}

            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="check-in-date" className="mb-2 block text-sm font-semibold text-slate-700">
                  Ngày nhận phòng <span className="text-rose-500">*</span>
                </label>
                <input
                  id="check-in-date"
                  type="date"
                  required
                  value={checkIn}
                  min={todayIso()}
                  aria-invalid={!!fieldErrors.checkIn}
                  aria-describedby={fieldErrors.checkIn ? 'checkin-error' : undefined}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  className={fieldClass(fieldErrors.checkIn)}
                />
                <FieldError id="checkin-error" message={fieldErrors.checkIn} />
              </div>
              <div>
                <label htmlFor="check-out-date" className="mb-2 block text-sm font-semibold text-slate-700">
                  Ngày trả phòng <span className="text-rose-500">*</span>
                </label>
                <input
                  id="check-out-date"
                  type="date"
                  required
                  value={checkOut}
                  min={getNextDay(checkIn)}
                  aria-invalid={!!fieldErrors.checkOut}
                  aria-describedby={fieldErrors.checkOut ? 'checkout-error' : undefined}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  className={fieldClass(fieldErrors.checkOut)}
                />
                <FieldError id="checkout-error" message={fieldErrors.checkOut} />
              </div>
            </div>

            {/* Guest Name */}
            <div>
              <label htmlFor="guest-name" className="mb-2 block text-sm font-semibold text-slate-700">
                Họ tên người nhận phòng <span className="text-rose-500">*</span>
              </label>
              <input
                id="guest-name"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={form.guestName}
                aria-invalid={!!fieldErrors.guestName}
                aria-describedby={fieldErrors.guestName ? 'guestname-error' : undefined}
                onChange={handleInputChange('guestName')}
                className={fieldClass(fieldErrors.guestName)}
              />
              <FieldError id="guestname-error" message={fieldErrors.guestName} />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="guest-phone" className="mb-2 block text-sm font-semibold text-slate-700">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                id="guest-phone"
                type="tel"
                required
                placeholder="0912 345 678"
                value={form.guestPhone}
                aria-invalid={!!fieldErrors.guestPhone}
                aria-describedby={fieldErrors.guestPhone ? 'guestphone-error' : undefined}
                onChange={handleInputChange('guestPhone')}
                className={fieldClass(fieldErrors.guestPhone)}
              />
              <FieldError id="guestphone-error" message={fieldErrors.guestPhone} />
            </div>

            {/* Guests */}
            <div>
              <label htmlFor="guest-count" className="mb-2 block text-sm font-semibold text-slate-700">
                Số lượng khách <span className="text-rose-500">*</span>
                <span className="font-normal text-slate-400 ml-1.5">(tối đa {room.capacity} khách)</span>
              </label>
              <input
                id="guest-count"
                type="number"
                required
                min={1}
                max={room.capacity}
                value={form.guests}
                aria-invalid={!!fieldErrors.guests}
                aria-describedby={fieldErrors.guests ? 'guests-error' : undefined}
                onChange={handleInputChange('guests')}
                className={fieldClass(fieldErrors.guests)}
              />
              <FieldError id="guests-error" message={fieldErrors.guests} />
            </div>

            {/* Note */}
            <div>
              <label htmlFor="booking-note" className="mb-2 block text-sm font-semibold text-slate-700">
                Ghi chú <span className="font-normal text-slate-400 ml-1">(không bắt buộc)</span>
              </label>
              <textarea
                id="booking-note"
                rows={3}
                placeholder="Yêu cầu đặc biệt (tầng cao, nhận phòng muộn, ...)"
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                className={fieldClass(false) + ' resize-none'}
              />
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              💳 Thanh toán <span className="font-bold">tại khách sạn</span> khi nhận phòng. Không thu phí trực tuyến.
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-sky-600 py-4 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-sky-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {busy ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
            </button>
          </form>
        </div>

        {/* Summary Card */}
        <aside className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tóm tắt đặt phòng</p>
            <div>
              <p className="font-extrabold text-slate-900 text-lg">{hotel.name}</p>
              <p className="text-xs text-slate-500 mt-1">{hotel.address}, {hotel.city}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Loại phòng</span>
                <span className="font-semibold text-slate-800">{room.roomType}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Sức chứa</span>
                <span className="font-semibold text-slate-800">{room.capacity} khách</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Giá phòng mỗi đêm</span>
                <span className="font-semibold text-slate-800">{formatVnd(room.pricePerNight)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ngày nhận phòng</span>
                <span className="font-semibold text-slate-800">{checkIn ? formatDate(checkIn) : '—'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ngày trả phòng</span>
                <span className="font-semibold text-slate-800">{checkOut ? formatDate(checkOut) : '—'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tổng số đêm</span>
                <span className="font-semibold text-slate-800">
                  {nights > 0 ? `${nights} đêm` : '—'}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-sky-700">
                <span>Tổng tiền</span>
                <span>{nights > 0 && room.pricePerNight ? formatVnd(total) : '—'}</span>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              💡 Tổng tiền được tính dựa trên số đêm thực tế: <b>{formatVnd(room.pricePerNight)}</b> × <b>{nights > 0 ? nights : 0} đêm</b>.
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
