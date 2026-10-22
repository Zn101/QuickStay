import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd } from '../lib/format'
import { ErrorBox, HotelImage, Spinner } from '../components/ui'

const ROOM_TYPES = ['Standard', 'Deluxe', 'Family Suite']

export default function Home() {
  const [filters, setFilters] = useState({ q: '', roomType: '', minPrice: '', maxPrice: '' })
  const [applied, setApplied] = useState(filters)
  const [hotels, setHotels] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setHotels(null)
    api('/hotels', { params: applied })
      .then((data) => !cancelled && (setHotels(data), setError('')))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [applied])

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    setApplied(filters)
  }

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 p-6 text-white md:p-10">
        <h1 className="text-2xl font-bold md:text-4xl">Tìm khách sạn, đặt phòng trong vài phút</h1>
        <p className="mt-2 text-brand-100">Xem phòng trống theo ngày, thanh toán tại khách sạn.</p>
        <form onSubmit={submit} className="mt-5 grid gap-3 rounded-xl bg-white p-4 text-slate-800 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="label" htmlFor="q">Tên khách sạn hoặc thành phố</label>
            <input id="q" className="input" placeholder="VD: Đà Nẵng, Sunrise..." value={filters.q} onChange={set('q')} />
          </div>
          <div>
            <label className="label" htmlFor="roomType">Loại phòng</label>
            <select id="roomType" className="input" value={filters.roomType} onChange={set('roomType')}>
              <option value="">Tất cả</option>
              {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="minPrice">Giá từ (₫)</label>
            <input id="minPrice" type="number" min="0" className="input" value={filters.minPrice} onChange={set('minPrice')} />
          </div>
          <div>
            <label className="label" htmlFor="maxPrice">Đến (₫)</label>
            <input id="maxPrice" type="number" min="0" className="input" value={filters.maxPrice} onChange={set('maxPrice')} />
          </div>
          <button className="btn-primary md:col-span-5" type="submit">Tìm kiếm</button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Danh sách khách sạn</h2>
        <ErrorBox message={error} />
        {!hotels && !error && <Spinner />}
        {hotels && hotels.length === 0 && (
          <p className="py-10 text-center text-slate-500">Không tìm thấy khách sạn phù hợp.</p>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hotels?.map((h) => (
            <Link key={h.id} to={`/hotels/${h.id}`} className="card overflow-hidden transition hover:shadow-md">
              <HotelImage src={h.imageUrl} alt={h.name} className="h-44 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-semibold">{h.name}</h3>
                <p className="text-sm text-slate-500">{h.city}{h.address ? ` · ${h.address}` : ''}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{h.description}</p>
                <p className="mt-3 text-sm">
                  {h.minPrice != null ? (
                    <>Từ <span className="text-lg font-bold text-brand-600">{formatVnd(h.minPrice)}</span>/đêm</>
                  ) : (
                    <span className="text-slate-400">Chưa có phòng</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
