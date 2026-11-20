import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd } from '../lib/format'

/** Khách sạn cùng thành phố (liên kết chéo từ trang nhà hàng / tour sang trang khách sạn). */
export default function NearbyHotels({ city }) {
  const [hotels, setHotels] = useState([])

  useEffect(() => {
    if (!city) return
    api('/hotels', { params: { city } })
      .then((list) => setHotels(Array.isArray(list) ? list.slice(0, 3) : []))
      .catch(() => setHotels([]))
  }, [city])

  if (hotels.length === 0) return null

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Lưu trú gần đây tại {city}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {hotels.map((h) => (
          <Link
            key={h.id}
            to={`/hotels/${h.id}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800"
          >
            {h.imageUrl && <img src={h.imageUrl} alt="" loading="lazy" className="h-28 w-full object-cover" />}
            <div className="p-3">
              <p className="line-clamp-1 text-sm font-bold text-slate-900 group-hover:text-sky-600 dark:text-white">{h.name}</p>
              <p className="line-clamp-1 text-xs text-slate-500">{h.address || h.city}</p>
              {h.minPrice != null && (
                <p className="mt-1 text-xs font-bold text-sky-700 dark:text-sky-400">Từ {formatVnd(h.minPrice)}/đêm</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
