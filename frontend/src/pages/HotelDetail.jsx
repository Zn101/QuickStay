import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, nightsBetween, todayIso } from '../lib/format'
import { useAuth } from '../store/authStore'
import { ErrorBox, HotelImage, Spinner } from '../components/ui'

export default function HotelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [dates, setDates] = useState({ checkIn: todayIso(1), checkOut: todayIso(2) })
  const [error, setError] = useState('')
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    api(`/hotels/${id}`).then(setHotel).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    if (nightsBetween(dates.checkIn, dates.checkOut) < 1) {
      setDateError('Ngày trả phòng phải sau ngày nhận phòng')
      return
    }
    setDateError('')
    api(`/hotels/${id}/rooms`, { params: dates }).then(setRooms).catch((e) => setError(e.message))
  }, [id, dates])

  if (error && !hotel) return <ErrorBox message={error} />
  if (!hotel) return <Spinner />

  const nights = nightsBetween(dates.checkIn, dates.checkOut)
  const book = (room) => {
    const qs = new URLSearchParams({ ...dates, hotelId: id }).toString()
    navigate(`/book/${room.id}?${qs}`)
  }

  return (
    <div>
      <Link to="/" className="text-sm text-brand-600 hover:underline">← Quay lại danh sách</Link>
      <div className="card mt-3 overflow-hidden md:flex">
        <HotelImage src={hotel.imageUrl} alt={hotel.name} className="h-56 w-full object-cover md:h-auto md:w-2/5" />
        <div className="p-5">
          <h1 className="text-2xl font-bold">{hotel.name}</h1>
          <p className="text-slate-500">{hotel.city}{hotel.address ? ` · ${hotel.address}` : ''}</p>
          <p className="mt-3 text-slate-700">{hotel.description}</p>
          {hotel.amenities && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hotel.amenities.split(',').map((a) => (
                <span key={a} className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700">{a.trim()}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Phòng và giá</h2>
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="checkIn">Ngày nhận phòng</label>
          <input id="checkIn" type="date" min={todayIso()} className="input" value={dates.checkIn}
                 onChange={(e) => setDates((d) => ({ ...d, checkIn: e.target.value }))} />
        </div>
        <div>
          <label className="label" htmlFor="checkOut">Ngày trả phòng</label>
          <input id="checkOut" type="date" min={dates.checkIn} className="input" value={dates.checkOut}
                 onChange={(e) => setDates((d) => ({ ...d, checkOut: e.target.value }))} />
        </div>
        {dateError && <div className="sm:col-span-2"><ErrorBox message={dateError} /></div>}
      </div>

      <div className="grid gap-4">
        {rooms.length === 0 && !dateError && <p className="text-slate-500">Khách sạn chưa có phòng.</p>}
        {rooms.map((r) => {
          const soldOut = r.available === 0
          return (
            <div key={r.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">{r.roomType}</h3>
                <p className="text-sm text-slate-500">Tối đa {r.capacity} khách</p>
                {r.description && <p className="mt-1 text-sm text-slate-600">{r.description}</p>}
                <p className={`mt-1 text-sm font-medium ${soldOut ? 'text-red-600' : 'text-green-700'}`}>
                  {soldOut ? 'Hết phòng trong khoảng ngày này' : `Còn ${r.available} phòng trống`}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-lg font-bold text-brand-600">{formatVnd(r.pricePerNight)}<span className="text-sm font-normal text-slate-500">/đêm</span></p>
                {nights > 0 && <p className="text-xs text-slate-500">{nights} đêm: {formatVnd(r.pricePerNight * nights)}</p>}
                {user?.role === 'ADMIN' ? (
                  <p className="mt-2 text-xs text-slate-400">Admin không đặt phòng</p>
                ) : (
                  <button className="btn-primary mt-2" disabled={soldOut || !!dateError}
                          onClick={() => (user ? book(r) : navigate('/login'))}>
                    {user ? 'Đặt phòng' : 'Đăng nhập để đặt'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
