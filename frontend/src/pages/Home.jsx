import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd } from '../lib/format'
import { HotelImage, Spinner, ErrorBox } from '../components/ui'

export default function Home() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = {}
    if (q) params.q = q
    if (city) params.city = city
    api('/hotels', { params })
      .then(setHotels)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [searchParams])

  function handleSearch(e) {
    e.preventDefault()
    const p = {}
    if (q) p.q = q
    if (city) p.city = city
    setSearchParams(p)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0f172a] py-20 px-4 text-white">
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-0 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Hàng trăm khách sạn trên khắp Việt Nam
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Tìm nơi lưu trú<br />
            <span className="text-cyan-300">hoàn hảo cho bạn</span>
          </h1>
          <p className="mt-6 text-lg text-sky-100/80">
            Đặt phòng nhanh chóng, giá tốt, trải nghiệm tuyệt vời.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-10 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Tên khách sạn..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"/><circle cx="12" cy="9" r="2.5"/>
              </svg>
              <input
                type="text"
                placeholder="Thành phố..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-sky-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-sky-400 transition-colors"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      {/* Hotel list */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {(searchParams.get('q') || searchParams.get('city')) && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Kết quả cho <span className="font-semibold text-slate-800">"{searchParams.get('q') || searchParams.get('city')}"</span>
              {' '}— {hotels.length} khách sạn
            </p>
            <button
              onClick={() => { setQ(''); setCity(''); setSearchParams({}) }}
              className="text-sm text-sky-600 hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {loading && <Spinner text="Đang tải danh sách khách sạn..." />}
        {error && <ErrorBox message={error} />}

        {!loading && !error && hotels.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-400">
                <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z"/><path d="M9 21v-7h6v7"/>
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-700">Không tìm thấy khách sạn</p>
            <p className="mt-1 text-sm text-slate-400">Thử tìm kiếm với từ khóa khác</p>
          </div>
        )}

        {!loading && !error && hotels.length > 0 && (
          <>
            {!searchParams.get('q') && !searchParams.get('city') && (
              <h2 className="mb-8 text-2xl font-bold text-slate-900">Khách sạn nổi bật</h2>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function HotelCard({ hotel }) {
  return (
    <Link
      to={`/hotels/${hotel.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative overflow-hidden h-48">
        <HotelImage
          src={hotel.imageUrl}
          alt={hotel.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-slate-700">
            {hotel.city}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold text-slate-900 leading-snug group-hover:text-sky-700 transition-colors line-clamp-2">
          {hotel.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{hotel.address}</p>
        {hotel.amenities && (
          <p className="mt-2 text-xs text-slate-400 line-clamp-1">{hotel.amenities}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-50">
          <div>
            <p className="text-xs text-slate-400">Giá từ</p>
            <p className="text-base font-extrabold text-sky-700">{formatVnd(hotel.minPrice)}</p>
            <p className="text-xs text-slate-400">/đêm</p>
          </div>
          <span className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
            Xem →
          </span>
        </div>
      </div>
    </Link>
  )
}
