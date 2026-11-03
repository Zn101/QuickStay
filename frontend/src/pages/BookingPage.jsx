import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, formatVnd, nightsBetween } from '../lib/format'
import { useAuth } from '../store/authStore'
import { ErrorBox, Spinner } from '../components/ui'

export default function BookingPage() {
  const { roomId } = useParams()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const hotelId = sp.get('hotelId')
  const checkIn = sp.get('checkIn')
  const checkOut = sp.get('checkOut')

  const [room, setRoom] = useState(null)
  const [hotel, setHotel] = useState(null)
  const [form, setForm] = useState({ guests: 1, guestName: user?.fullName || '', guestPhone: user?.phone || '', note: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    if (!hotelId || !checkIn || !checkOut) return setError('Thiếu thông tin ngày đặt phòng')
    Promise.all([api(`/hotels/${hotelId}`), api(`/hotels/${hotelId}/rooms`, { params: { checkIn, checkOut } })])
      .then(([h, rooms]) => {
        const r = rooms.find((x) => String(x.id) === roomId)
        if (!r) throw new Error('Không tìm thấy phòng')
        setHotel(h)
        setRoom(r)
      })
      .catch((e) => setError(e.message))
  }, [roomId, hotelId, checkIn, checkOut])

  const nights = nightsBetween(checkIn, checkOut)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const booking = await api('/bookings', {
        method: 'POST',
        body: { roomId: Number(roomId), checkIn, checkOut, ...form, guests: Number(form.guests) },
      })
      setDone(booking)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-lg space-y-3 p-6 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="text-xl font-bold">Đặt phòng thành công</h1>
        <p className="text-slate-600">
          Mã đặt phòng <b>#{done.id}</b> – {done.hotelName}, {done.roomType}, {formatDate(done.checkIn)} → {formatDate(done.checkOut)}.
        </p>
        <p>Tổng tiền: <b className="text-brand-600">{formatVnd(done.totalPrice)}</b> (thanh toán tại khách sạn)</p>
        <p className="text-sm text-slate-500">Trạng thái: chờ khách sạn xác nhận.</p>
        <button className="btn-primary" onClick={() => navigate('/history')}>Xem lịch sử đặt phòng</button>
      </div>
    )
  }

  if (!room || !hotel) return error ? <ErrorBox message={error} /> : <Spinner />

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/hotels/${hotelId}`} className="text-sm text-brand-600 hover:underline">← Quay lại khách sạn</Link>
      <div className="card mt-3 space-y-1 p-5">
        <h1 className="text-xl font-bold">Xác nhận đặt phòng</h1>
        <p className="font-medium">{hotel.name} – {room.roomType}</p>
        <p className="text-sm text-slate-600">
          {formatDate(checkIn)} → {formatDate(checkOut)} ({nights} đêm) · {formatVnd(room.pricePerNight)}/đêm
        </p>
        <p className="text-lg">Tổng tiền: <b className="text-brand-600">{formatVnd(room.pricePerNight * nights)}</b></p>
        <p className="text-xs text-slate-500">Thanh toán tại khách sạn, không thanh toán trực tuyến.</p>
      </div>

      <form onSubmit={submit} className="card mt-4 space-y-4 p-5">
        <ErrorBox message={error} />
        <div>
          <label className="label" htmlFor="guestName">Họ tên người nhận phòng</label>
          <input id="guestName" required className="input" value={form.guestName} onChange={set('guestName')} />
        </div>
        <div>
          <label className="label" htmlFor="guestPhone">Số điện thoại</label>
          <input id="guestPhone" required className="input" value={form.guestPhone} onChange={set('guestPhone')} />
        </div>
        <div>
          <label className="label" htmlFor="guests">Số khách (tối đa {room.capacity})</label>
          <input id="guests" type="number" min="1" max={room.capacity} required className="input"
                 value={form.guests} onChange={set('guests')} />
        </div>
        <div>
          <label className="label" htmlFor="note">Ghi chú</label>
          <textarea id="note" rows="3" className="input" value={form.note} onChange={set('note')} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang đặt phòng...' : 'Xác nhận đặt phòng'}</button>
      </form>
    </div>
  )
}
