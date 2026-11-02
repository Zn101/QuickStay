import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, nightsBetween } from '../lib/format'
import { useAuth } from '../store/authStore'
import { ErrorBox } from '../components/ui'

export default function BookingForm() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const hotel = state?.hotel
  const room = state?.room
  const [checkIn, setCheckIn] = useState(state?.checkIn || '')
  const [checkOut, setCheckOut] = useState(state?.checkOut || '')

  const [form, setForm] = useState({
    guestName: user?.fullName || '',
    guestPhone: user?.phone || '',
    guests: 1,
    note: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!hotel || !room) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-slate-500">Thông tin đặt phòng không hợp lệ.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-sky-600 hover:underline">Về trang chủ</Link>
      </div>
    )
  }

  const nights = nightsBetween(checkIn, checkOut)
  const total = room.pricePerNight * nights

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (nights <= 0) return setError('Ngày trả phòng phải sau ngày nhận phòng')
    if (Number(form.guests) < 1 || Number(form.guests) > room.capacity)
      return setError(`Số khách từ 1 đến ${room.capacity}`)
    setBusy(true)
    try {
      const booking = await api('/bookings', {
        method: 'POST',
        body: {
          roomId: room.id,
          checkIn,
          checkOut,
          guests: Number(form.guests),
          guestName: form.guestName,
          guestPhone: form.guestPhone,
          note: form.note,
        },
      })
      navigate('/my-bookings', { state: { newBookingId: booking.id } })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100'

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-slate-600">Trang chủ</Link>
        <span>/</span>
        <Link to={`/hotels/${hotel.id}`} className="hover:text-slate-600">{hotel.name}</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">Đặt phòng</span>
      </nav>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Form */}
        <div className="lg:col-span-3">
          <h1 className="mb-7 text-2xl font-extrabold tracking-tight text-slate-900">Thông tin đặt phòng</h1>

          <form onSubmit={submit} className="space-y-5">
            <ErrorBox message={error} />

            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Ngày nhận phòng <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Ngày trả phòng <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Họ tên người nhận phòng <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={form.guestName}
                onChange={set('guestName')}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại <span className="text-rose-500">*</span></label>
              <input
                type="tel"
                required
                placeholder="0912 345 678"
                value={form.guestPhone}
                onChange={set('guestPhone')}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Số khách <span className="text-rose-500">*</span>
                <span className="font-normal text-slate-400 ml-1">(tối đa {room.capacity})</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={room.capacity}
                value={form.guests}
                onChange={set('guests')}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú</label>
              <textarea
                rows={3}
                placeholder="Yêu cầu đặc biệt (tầng cao, giường đôi, ...)"
                value={form.note}
                onChange={set('note')}
                className={inputClass + ' resize-none'}
              />
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              💳 Thanh toán <span className="font-bold">tại khách sạn</span>. Không thu phí trực tuyến.
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-sky-600 py-4 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-sky-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {busy ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
            </button>
          </form>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chi tiết đặt phòng</p>
            <div>
              <p className="font-extrabold text-slate-900">{hotel.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{hotel.city} · {hotel.address}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Loại phòng</span><span className="font-semibold">{room.roomType}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Giá/đêm</span><span className="font-semibold">{formatVnd(room.pricePerNight)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Số đêm</span><span className="font-semibold">{nights || '—'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-sky-700">
                <span>Tổng tiền</span>
                <span>{nights > 0 ? formatVnd(total) : '—'}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
