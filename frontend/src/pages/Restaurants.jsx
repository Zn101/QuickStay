import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatVnd } from '../lib/format'
import { fold, useVenueList } from '../lib/venues'
import { Spinner } from '../components/ui'

const ALL = ''

/** "Hải sản & Đồ nướng" -> ["Hải sản", "Đồ nướng"] để làm bộ lọc theo loại ẩm thực. */
const cuisineTags = (c) =>
  String(c || '')
    .split(/&|,|\//)
    .map((s) => s.trim())
    .filter(Boolean)

const minMenuPrice = (r) => {
  const prices = (r.menu || []).map((m) => m.price).filter((p) => p != null)
  return prices.length ? Math.min(...prices) : null
}

const SORTS = [
  ['popular', 'Phổ biến'],
  ['rating', 'Đánh giá cao'],
  ['price', 'Giá món từ thấp'],
  ['name', 'Tên A → Z'],
]

export default function Restaurants() {
  const { items: restaurants, loading, offline } = useVenueList('restaurants', EMPTY)
  const [params, setParams] = useSearchParams()
  const city = params.get('city') || ALL
  const cuisine = params.get('cuisine') || ALL
  const q = params.get('q') || ''
  const sort = params.get('sort') || 'popular'

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const cities = useMemo(() => [...new Set(restaurants.map((r) => r.city))].sort((a, b) => a.localeCompare(b, 'vi')), [restaurants])
  const cuisines = useMemo(
    () => [...new Set(restaurants.flatMap((r) => cuisineTags(r.cuisine)))].sort((a, b) => a.localeCompare(b, 'vi')),
    [restaurants],
  )

  const filtered = useMemo(() => {
    const needle = fold(q.trim())
    const list = restaurants.filter((r) => {
      if (city && fold(r.city) !== fold(city)) return false
      if (cuisine && !cuisineTags(r.cuisine).some((t) => fold(t) === fold(cuisine))) return false
      if (!needle) return true
      const hay = fold([r.name, r.city, r.cuisine, r.address, ...(r.specialties || []), ...(r.menu || []).map((m) => m.name)].join(' '))
      return hay.includes(needle)
    })
    const byRating = (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount
    const sorters = {
      popular: (a, b) => b.reviewCount - a.reviewCount || byRating(a, b),
      rating: byRating,
      price: (a, b) => (minMenuPrice(a) ?? Infinity) - (minMenuPrice(b) ?? Infinity),
      name: (a, b) => a.name.localeCompare(b.name, 'vi'),
    }
    return [...list].sort(sorters[sort] || sorters.popular)
  }, [restaurants, city, cuisine, q, sort])

  const chip = (active) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
      active
        ? 'bg-slate-900 text-white shadow-xs dark:bg-sky-600'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
    }`

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] py-10 text-[var(--color-text-main)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="transition-colors hover:text-slate-600 dark:hover:text-slate-200">Trang chủ</Link>
          <span>/</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">Nhà hàng & Ẩm thực</span>
        </nav>

        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 p-8 text-white shadow-2xl sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              Ẩm thực địa phương & đặt bàn trực tuyến
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">Khám phá nhà hàng & đặt bàn</h1>
            <p className="mt-3.5 text-sm leading-relaxed text-slate-200/90 sm:text-base">
              Xem thực đơn, giờ mở cửa và đánh giá thật của thực khách. Gửi yêu cầu đặt bàn, nhà hàng xác nhận trực tiếp với bạn.
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              placeholder="Tìm tên nhà hàng, món ăn (cao lầu, bún bò, hải sản...)"
              value={q}
              onChange={(e) => update('q', e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <select
              value={sort}
              onChange={(e) => update('sort', e.target.value === 'popular' ? '' : e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              aria-label="Sắp xếp"
            >
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-xs font-bold text-slate-400">Thành phố:</span>
            <button type="button" onClick={() => update('city', '')} className={chip(!city)}>Tất cả</button>
            {cities.map((c) => (
              <button key={c} type="button" onClick={() => update('city', c)} className={chip(fold(city) === fold(c))}>{c}</button>
            ))}
          </div>
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="shrink-0 text-xs font-bold text-slate-400">Ẩm thực:</span>
            <button type="button" onClick={() => update('cuisine', '')} className={chip(!cuisine)}>Tất cả</button>
            {cuisines.map((c) => (
              <button key={c} type="button" onClick={() => update('cuisine', c)} className={chip(fold(cuisine) === fold(c))}>{c}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : offline ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Không kết nối được máy chủ, vui lòng tải lại trang.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {filtered.length} nhà hàng{city ? ` tại ${city}` : ''}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((r) => {
                const from = minMenuPrice(r)
                return (
                  <Link
                    key={r.id}
                    to={`/restaurants/${r.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {r.image && (
                        <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                        📍 {r.city}
                      </span>
                      <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black text-slate-950 shadow-sm">
                        {r.reviewCount > 0 ? `★ ${r.rating.toFixed(1)} (${r.reviewCount})` : 'Mới'}
                      </span>
                      {r.hours && (
                        <span className="absolute bottom-2.5 left-3 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">🕒 {r.hours}</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <span className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">{r.cuisine}</span>
                      <h3 className="line-clamp-1 text-base font-extrabold text-slate-900 transition-colors group-hover:text-sky-600 dark:text-white">{r.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{r.description}</p>
                      {r.specialties.length > 0 && (
                        <p className="mt-3 truncate border-t border-slate-100 pt-2.5 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                          🍽️ {r.specialties.join(' · ')}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800">
                        <span className="text-slate-500">{from != null ? <>Món từ <strong className="text-sky-700 dark:text-sky-400">{formatVnd(from)}</strong></> : r.priceRange}</span>
                        <span className="font-bold text-sky-600">Xem & đặt bàn →</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-4xl">🍽️</span>
                <p className="mt-3 text-base font-bold text-slate-800 dark:text-white">Không tìm thấy nhà hàng phù hợp</p>
                <button onClick={() => setParams({}, { replace: true })} className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700">
                  Xoá bộ lọc
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const EMPTY = []
