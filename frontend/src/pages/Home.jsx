import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatVnd } from '../lib/format'
import { HotelImage, ErrorBox } from '../components/ui'
import { HotelGridSkeleton } from '../components/HotelCardSkeleton'
import { useHotels, useDebounce } from '../hooks/useHotels'
import { ROOM_TYPES, validatePriceRange, buildHotelParams, hasActiveFilters } from '../lib/hotelFilters'

const DEBOUNCE_MS = 400

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const applied = {
    q: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    roomType: searchParams.get('roomType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  }

  // Giá trị đang gõ (draft); URL là nguồn sự thật cho filter đã áp dụng.
  const [q, setQ] = useState(applied.q)
  const [city, setCity] = useState(applied.city)
  const [minInput, setMinInput] = useState(applied.minPrice)
  const [maxInput, setMaxInput] = useState(applied.maxPrice)

  const debQ = useDebounce(q, DEBOUNCE_MS)
  const debCity = useDebounce(city, DEBOUNCE_MS)
  const debMin = useDebounce(minInput, DEBOUNCE_MS)
  const debMax = useDebounce(maxInput, DEBOUNCE_MS)
  const priceCheck = validatePriceRange(minInput, maxInput)

  function patchParams(patch) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(patch).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, String(v))))
      return next
    }, { replace: true })
  }

  // Live search (debounce) – chỉ cập nhật URL khi giá trị đã trim khác giá trị đang áp dụng.
  useEffect(() => {
    if (debQ.trim() !== applied.q) patchParams({ q: debQ.trim() })
  }, [debQ])
  useEffect(() => {
    if (debCity.trim() !== applied.city) patchParams({ city: debCity.trim() })
  }, [debCity])
  useEffect(() => {
    const check = validatePriceRange(debMin, debMax)
    if (check.error) return // không gửi request với khoảng giá sai
    if (String(check.min) !== applied.minPrice || String(check.max) !== applied.maxPrice) {
      patchParams({ minPrice: check.min, maxPrice: check.max })
    }
  }, [debMin, debMax])

  const params = buildHotelParams(applied)
  const filtered = hasActiveFilters(params)
  const { hotels, loading, error, retry } = useHotels(params)

  function handleSearch(e) {
    e.preventDefault() // Enter / nút Tìm kiếm áp dụng ngay, không chờ debounce
    patchParams({ q: q.trim(), city: city.trim() })
  }

  function clearSearch() {
    setQ(''); setCity('')
    patchParams({ q: '', city: '' }) // giữ nguyên roomType & giá
  }

  function clearPrice() {
    setMinInput(''); setMaxInput('')
    patchParams({ minPrice: '', maxPrice: '' })
  }

  function resetAll() {
    setQ(''); setCity(''); setMinInput(''); setMaxInput('')
    setSearchParams({}, { replace: true })
  }

  function selectRoomType(type) {
    patchParams({ roomType: type })
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
          <form onSubmit={handleSearch} role="search" className="mt-10 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                aria-label="Tên khách sạn"
                placeholder="Tên khách sạn..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl bg-white py-3.5 pl-12 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
              />
              {q && <ClearButton label="Xóa tên khách sạn" onClick={() => { setQ(''); patchParams({ q: '' }) }} />}
            </div>
            <div className="relative flex-1">
              <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"/><circle cx="12" cy="9" r="2.5"/>
              </svg>
              <input
                type="text"
                aria-label="Thành phố"
                placeholder="Thành phố..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl bg-white py-3.5 pl-12 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
              />
              {city && <ClearButton label="Xóa thành phố" onClick={() => { setCity(''); patchParams({ city: '' }) }} />}
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
        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p id="room-type-label" className="mb-2 text-sm font-semibold text-slate-700">Loại phòng</p>
              <div role="group" aria-labelledby="room-type-label" className="flex flex-wrap gap-2">
                {['', ...ROOM_TYPES].map((type) => {
                  const active = applied.roomType === type
                  return (
                    <button
                      key={type || 'all'}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectRoomType(type)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                        active ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'
                      }`}
                    >
                      {type || 'Tất cả'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p id="price-label" className="mb-2 text-sm font-semibold text-slate-700">Giá mỗi đêm (VND)</p>
              <div role="group" aria-labelledby="price-label" className="flex flex-wrap items-center gap-2">
                <input
                  type="number" inputMode="numeric" min="0" step="1000"
                  aria-label="Giá tối thiểu" aria-invalid={!!priceCheck.error} aria-describedby={priceCheck.error ? 'price-error' : undefined}
                  placeholder="Từ" value={minInput} onChange={(e) => setMinInput(e.target.value)}
                  className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400"
                />
                <span aria-hidden="true" className="text-slate-400">–</span>
                <input
                  type="number" inputMode="numeric" min="0" step="1000"
                  aria-label="Giá tối đa" aria-invalid={!!priceCheck.error} aria-describedby={priceCheck.error ? 'price-error' : undefined}
                  placeholder="Đến" value={maxInput} onChange={(e) => setMaxInput(e.target.value)}
                  className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400"
                />
                {(minInput || maxInput) && (
                  <button type="button" onClick={clearPrice} className="text-sm text-sky-600 hover:underline">Xóa giá</button>
                )}
              </div>
              {priceCheck.error && (
                <p id="price-error" role="alert" className="mt-1.5 text-sm font-medium text-red-600">{priceCheck.error}</p>
              )}
            </div>
          </div>
        </div>

        {filtered && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500" aria-live="polite">
              {loading ? 'Đang tìm kiếm...' : error ? 'Không thể tải kết quả' : `${hotels.length} khách sạn phù hợp`}
              {!loading && !error && (applied.q || applied.city) && (
                <> cho <span className="font-semibold text-slate-800">"{applied.q || applied.city}"</span></>
              )}
            </p>
            <div className="flex gap-4">
              {(applied.q || applied.city) && (
                <button type="button" onClick={clearSearch} className="text-sm text-sky-600 hover:underline">Xóa tìm kiếm</button>
              )}
              <button type="button" onClick={resetAll} className="text-sm text-sky-600 hover:underline">Đặt lại tất cả</button>
            </div>
          </div>
        )}

        {loading && <HotelGridSkeleton />}

        {!loading && error && (
          <div className="mx-auto max-w-md py-12 text-center">
            <ErrorBox message={error} />
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-500 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && hotels.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-400">
                <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z"/><path d="M9 21v-7h6v7"/>
              </svg>
            </div>
            {filtered ? (
              <>
                <p className="text-lg font-semibold text-slate-700">Không có khách sạn phù hợp</p>
                <p className="mt-1 text-sm text-slate-400">Hãy thử thay đổi từ khóa hoặc bộ lọc</p>
                <button
                  type="button"
                  onClick={resetAll}
                  className="mt-5 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-500 transition-colors"
                >
                  Đặt lại tất cả
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-slate-700">Chưa có khách sạn nào</p>
                <p className="mt-1 text-sm text-slate-400">Hiện chưa có khách sạn nào khả dụng, vui lòng quay lại sau</p>
              </>
            )}
          </div>
        )}

        {!loading && !error && hotels.length > 0 && (
          <>
            {!filtered && (
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


function ClearButton({ label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  )
}
