import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatVnd } from '../lib/format'
import { fold, useVenueList } from '../lib/venues'
import { Spinner } from '../components/ui'

const EMPTY = []

const SORTS = [
  ['popular', 'Phổ biến'],
  ['rating', 'Đánh giá cao'],
  ['price-asc', 'Giá thấp → cao'],
  ['price-desc', 'Giá cao → thấp'],
]

const PRICE_RANGES = [
  ['', 'Mọi mức giá'],
  ['0-500000', 'Dưới 500.000 ₫'],
  ['500000-1000000', '500.000 – 1.000.000 ₫'],
  ['1000000-', 'Trên 1.000.000 ₫'],
]

export default function Tours() {
  const { items: tours, loading, offline } = useVenueList('tours', EMPTY)
  const [params, setParams] = useSearchParams()
  const city = params.get('city') || ''
  const category = params.get('category') || ''
  const q = params.get('q') || ''
  const price = params.get('price') || ''
  const sort = params.get('sort') || 'popular'

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const cities = useMemo(() => [...new Set(tours.map((t) => t.city))].sort((a, b) => a.localeCompare(b, 'vi')), [tours])
  const categories = useMemo(
    () => [...new Set(tours.map((t) => t.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [tours],
  )

  const filtered = useMemo(() => {
    const needle = fold(q.trim())
    const [lo, hi] = price ? price.split('-').map((x) => (x === '' ? null : Number(x))) : [null, null]
    const list = tours.filter((t) => {
      if (city && fold(t.city) !== fold(city)) return false
      if (category && t.category !== category) return false
      const p = Number(t.price)
      if (lo != null && p < lo) return false
      if (hi != null && p > hi) return false
      if (!needle) return true
      return fold([t.title, t.city, t.category, t.description, ...(t.highlights || [])].join(' ')).includes(needle)
    })
    const byRating = (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount
    const sorters = {
      popular: (a, b) => b.reviewCount - a.reviewCount || byRating(a, b),
      rating: byRating,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
    }
    return [...list].sort(sorters[sort] || sorters.popular)
  }, [tours, city, category, q, price, sort])

  const chip = (active) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
      active
        ? 'bg-slate-900 text-white shadow-xs dark:bg-sky-600'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
    }`
  const selectCls = 'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white'

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] py-10 text-[var(--color-text-main)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="transition-colors hover:text-slate-600 dark:hover:text-slate-200">Trang chủ</Link>
          <span>/</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">Tour & Điểm đến</span>
        </nav>

        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 p-8 text-white shadow-2xl sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              Tour trong ngày & trải nghiệm địa phương
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">Tour & điểm đến nổi bật</h1>
            <p className="mt-3.5 text-sm leading-relaxed text-slate-200/90 sm:text-base">
              Xem lịch trình chi tiết, giá đã bao gồm, số chỗ còn lại theo ngày và đánh giá thật của khách đã đi.
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              placeholder="Tìm tour, địa danh (Bà Nà, Tràng An, lặn biển...)"
              value={q}
              onChange={(e) => update('q', e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <select value={price} onChange={(e) => update('price', e.target.value)} className={selectCls} aria-label="Khoảng giá">
              {PRICE_RANGES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => update('sort', e.target.value === 'popular' ? '' : e.target.value)} className={selectCls} aria-label="Sắp xếp">
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
            <span className="shrink-0 text-xs font-bold text-slate-400">Loại hình:</span>
            <button type="button" onClick={() => update('category', '')} className={chip(!category)}>Tất cả</button>
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => update('category', c)} className={chip(category === c)}>{c}</button>
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
              {filtered.length} tour{city ? ` tại ${city}` : ''}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <Link
                  key={t.id}
                  to={`/tours/${t.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {t.image && (
                      <img src={t.image} alt={t.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                      📍 {t.city}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black text-slate-950 shadow-sm">
                      {t.reviewCount > 0 ? `★ ${t.rating.toFixed(1)} (${t.reviewCount})` : 'Mới'}
                    </span>
                    {t.duration && (
                      <span className="absolute bottom-3 left-3 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">⏱ {t.duration}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">{t.category}</span>
                    <h3 className="mt-1 line-clamp-2 text-base font-extrabold text-slate-900 transition-colors group-hover:text-sky-600 dark:text-white">{t.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t.description}</p>
                    {t.highlights.length > 0 && (
                      <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                        {t.highlights.slice(0, 3).map((h) => (
                          <li key={h} className="truncate">✓ {h}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div>
                        <span className="block text-[10px] text-slate-400">Giá mỗi khách</span>
                        <span className="text-lg font-black text-sky-700 dark:text-sky-400">{formatVnd(t.price)}</span>
                      </div>
                      <span className="text-xs font-bold text-sky-600">Xem lịch trình →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-4xl">🧭</span>
                <p className="mt-3 text-base font-bold text-slate-800 dark:text-white">Không tìm thấy tour phù hợp</p>
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
