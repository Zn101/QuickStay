import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, todayIso, nightsBetween } from '../lib/format'
import { HotelImage, Spinner, ErrorBox } from '../components/ui'
import { useAuth } from '../store/authStore'

export default function HotelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkIn, setCheckIn] = useState(todayIso(1))
  const [checkOut, setCheckOut] = useState(todayIso(2))
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    Promise.all([api(`/hotels/${id}`), api(`/hotels/${id}/rooms`)])
      .then(([h, r]) => { setHotel(h); setRooms(r) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function searchRooms(e) {
    e.preventDefault()
    if (!checkIn || !checkOut || checkIn >= checkOut) return
    setSearching(true)
    api(`/hotels/${id}/rooms`, { params: { checkIn, checkOut } })
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setSearching(false))
  }

  function handleBook(room) {
    if (!user) { navigate('/login'); return }
    navigate(`/hotels/${id}/rooms/${room.id}/book`, {
      state: { hotel, room, checkIn, checkOut },
    })
  }

  if (loading) return <div className="py-20"><Spinner text="Đang tải thông tin khách sạn..." /></div>
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBox message={error} /></div>
  if (!hotel) return null

  const amenityList = hotel.amenities ? hotel.amenities.split(',').map((a) => a.trim()) : []
  const nights = nightsBetween(checkIn, checkOut)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-slate-600 transition-colors">Trang chủ</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{hotel.name}</span>
      </nav>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-8">
          {/* Image */}
          <div className="overflow-hidden rounded-2xl">
            <HotelImage
              src={hotel.imageUrl}
              alt={hotel.name}
              className="h-72 w-full object-cover sm:h-96"
            />
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{hotel.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 flex-shrink-0">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  {hotel.address}, {hotel.city}
                </p>
              </div>
            </div>

            {hotel.description && (
              <p className="mt-5 text-sm leading-7 text-slate-600">{hotel.description}</p>
            )}

            {amenityList.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">Tiện nghi</h2>
                <div className="flex flex-wrap gap-2">
                  {amenityList.map((a) => (
                    <span key={a} className="rounded-full bg-sky-50 border border-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rooms */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">Loại phòng</h2>

            {/* Date picker */}
            <form onSubmit={searchRooms} className="mb-6 flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày nhận</label>
                <input
                  type="date"
                  value={checkIn}
                  min={todayIso()}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày trả</label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || todayIso()}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={searching}
                  className="w-full sm:w-auto rounded-lg bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-700 transition-colors disabled:opacity-60"
                >
                  {searching ? 'Đang tìm...' : 'Kiểm tra'}
                </button>
              </div>
            </form>

            {nights > 0 && (
              <p className="mb-4 text-xs text-slate-500">
                Thời gian lưu trú: <span className="font-semibold text-slate-700">{nights} đêm</span>
              </p>
            )}

            <div className="space-y-4">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} nights={nights} onBook={() => handleBook(room)} />
              ))}
              {rooms.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">Không có phòng nào.</p>}
            </div>
          </div>
        </div>

        {/* Right: sticky summary */}
        <aside className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tóm tắt</p>
            <div className="flex items-center gap-3">
              <HotelImage src={hotel.imageUrl} alt={hotel.name} className="h-14 w-14 rounded-xl object-cover" />
              <div>
                <p className="font-bold text-slate-900 text-sm leading-snug">{hotel.name}</p>
                <p className="text-xs text-slate-500">{hotel.city}</p>
              </div>
            </div>
            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Nhận phòng</span><span className="font-medium">{checkIn || '—'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Trả phòng</span><span className="font-medium">{checkOut || '—'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Số đêm</span><span className="font-medium">{nights || '—'}</span>
              </div>
            </div>
            {!user && (
              <Link
                to="/login"
                className="block w-full rounded-xl bg-sky-600 py-3 text-center text-sm font-bold text-white hover:bg-sky-700 transition-colors"
              >
                Đăng nhập để đặt phòng
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function RoomCard({ room, nights, onBook }) {
  const isAvailable = room.available == null || room.available > 0
  return (
    <div className={`rounded-xl border p-4 transition-all ${isAvailable ? 'border-slate-200 bg-white hover:border-sky-200 hover:shadow-md' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900">{room.roomType}</h3>
            {room.available != null && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${room.available > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {room.available > 0 ? `Còn ${room.available} phòng` : 'Hết phòng'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{room.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
              </svg>
              {room.capacity} khách
            </span>
            <span>{formatVnd(room.pricePerNight)}/đêm</span>
          </div>
        </div>
        <div className="text-right">
          {nights > 0 && (
            <p className="text-lg font-extrabold text-sky-700">{formatVnd(room.pricePerNight * nights)}</p>
          )}
          <button
            onClick={onBook}
            disabled={!isAvailable}
            className="mt-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            Đặt ngay
          </button>
        </div>
      </div>
    </div>
  )
}
