import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, todayIso } from '../lib/format'
import { useAuth } from '../store/authStore'
import { useVenue } from '../lib/venues'
import { Spinner } from '../components/ui'
import VenueReviews, { Stars } from '../components/VenueReviews'
import NearbyHotels from '../components/NearbyHotels'

const TIME_SLOTS = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']
const SEATING = [
  ['VIEW_DEP', 'Bàn view đẹp / cửa sổ'],
  ['NGOAI_TROI', 'Ngoài trời / sân vườn'],
  ['PHONG_VIP', 'Phòng riêng VIP'],
  ['KHONG_YEU_CAU', 'Để nhà hàng sắp xếp'],
]

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

function nowHHmm() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function RestaurantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { item: r, error, setItem } = useVenue('restaurants', id)
  const [form, setForm] = useState({ date: todayIso(1), time: '18:30', partySize: 2, seatingArea: 'VIEW_DEP', guestName: '', guestPhone: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [created, setCreated] = useState(null)

  // Hôm nay thì chỉ cho chọn giờ chưa qua
  const slots = useMemo(
    () => (form.date === todayIso(0) ? TIME_SLOTS.filter((s) => s > nowHHmm()) : TIME_SLOTS),
    [form.date],
  )

  if (error === 'not-found') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-bold text-slate-800 dark:text-white">Không tìm thấy nhà hàng</p>
        <Link to="/restaurants" className="mt-4 inline-block text-sm font-bold text-sky-600">← Xem tất cả nhà hàng</Link>
      </div>
    )
  }
  if (error) return <p className="mx-auto max-w-3xl px-4 py-20 text-center text-rose-600">{error}</p>
  if (!r) return <Spinner />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const mapQuery = encodeURIComponent([r.name, r.address, r.city, 'Vietnam'].filter(Boolean).join(', '))

  async function submit(e) {
    e.preventDefault()
    setFormError('')
    if (!user) {
      navigate('/login', { state: { from: `/restaurants/${id}` } })
      return
    }
    if (user.role !== 'CUSTOMER') {
      setFormError('Chỉ tài khoản khách hàng mới đặt bàn được.')
      return
    }
    if (!slots.includes(form.time)) {
      setFormError('Vui lòng chọn giờ đặt bàn còn trống.')
      return
    }
    setBusy(true)
    try {
      const res = await api(`/restaurants/${id}/reservations`, {
        method: 'POST',
        body: {
          ...form,
          partySize: Number(form.partySize),
          guestName: form.guestName.trim() || user.fullName || user.email,
          guestPhone: form.guestPhone.trim(),
          note: form.note.trim(),
        },
      })
      setCreated(res)
    } catch (err) {
      setFormError(err.message || 'Không gửi được yêu cầu đặt bàn.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-slate-600">Trang chủ</Link>
        <span>/</span>
        <Link to="/restaurants" className="hover:text-slate-600">Nhà hàng & Ẩm thực</Link>
        <span>/</span>
        <Link to={`/restaurants?city=${encodeURIComponent(r.city)}`} className="hover:text-slate-600">{r.city}</Link>
        <span>/</span>
        <span className="font-bold text-slate-800 dark:text-slate-100">{r.name}</span>
      </nav>

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
        {r.image && <img src={r.image} alt={r.name} className="absolute inset-0 h-full w-full object-cover opacity-60" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        <div className="relative z-10 flex min-h-[260px] flex-col justify-end p-6 sm:p-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">{r.cuisine}</span>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">{r.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-200">
            <span>📍 {r.address || r.city}</span>
            {r.hours && <span>🕒 {r.hours}</span>}
            {r.priceRange && <span>💰 {r.priceRange}</span>}
            {r.phone && (
              <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="hover:text-white">
                ☎ {r.phone}
              </a>
            )}
            {r.reviewCount > 0 && (
              <span>
                <Stars value={r.rating} /> {r.rating.toFixed(1)} ({r.reviewCount})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Giới thiệu</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{r.description || 'Đang cập nhật.'}</p>
            {r.specialties.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {r.specialties.map((s) => (
                  <span key={s} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    🍽️ {s}
                  </span>
                ))}
              </div>
            )}
          </section>

          {r.menu.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Thực đơn nổi bật</h2>
              <ul className="mt-3 divide-y divide-dashed divide-slate-200 dark:divide-slate-700">
                {r.menu.map((m) => (
                  <li key={m.name} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                    <span className="text-slate-800 dark:text-slate-100">{m.name}</span>
                    <span className="shrink-0 font-bold text-sky-700 dark:text-sky-400">{m.price != null ? formatVnd(m.price) : 'Theo thời giá'}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slate-400">Giá tham khảo, có thể thay đổi theo mùa.</p>
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Vị trí</h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-sky-600"
              >
                Mở Google Maps ↗
              </a>
            </div>
            <iframe
              title="Bản đồ nhà hàng"
              src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              className="mt-3 h-64 w-full rounded-2xl border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </section>

          <VenueReviews
            kind="restaurants"
            id={id}
            rating={r.rating}
            reviewCount={r.reviewCount}
            onReviewed={() => api(`/restaurants/${id}`).then(setItem).catch(() => {})}
          />

          <NearbyHotels city={r.city} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            {created ? (
              <div className="space-y-3 py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-black text-emerald-600">✓</div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Đã gửi yêu cầu đặt bàn #{created.id}</h3>
                <p className="text-sm text-slate-500">
                  {created.partySize} khách · {created.time} ngày {created.date}. Nhà hàng sẽ xác nhận qua SĐT {created.guestPhone}.
                </p>
                <Link to="/my-bookings" className="inline-block rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white">
                  Xem đơn của tôi
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Đặt bàn</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Ngày
                    <input type="date" required min={todayIso(0)} max={todayIso(365)} value={form.date} onChange={set('date')} className={`${inputCls} mt-1`} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Giờ
                    <select value={form.time} onChange={set('time')} className={`${inputCls} mt-1`}>
                      {slots.length === 0 && <option value="">Hết giờ hôm nay</option>}
                      {slots.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Số khách
                    <input type="number" min={1} max={50} required value={form.partySize} onChange={set('partySize')} className={`${inputCls} mt-1`} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Khu vực
                    <select value={form.seatingArea} onChange={set('seatingArea')} className={`${inputCls} mt-1`}>
                      {SEATING.map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Họ tên
                  <input value={form.guestName} onChange={set('guestName')} placeholder={user?.fullName || 'Nguyễn Văn A'} className={`${inputCls} mt-1`} />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Số điện thoại
                  <input type="tel" required value={form.guestPhone} onChange={set('guestPhone')} placeholder="0912 345 678" className={`${inputCls} mt-1`} />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Ghi chú
                  <input value={form.note} onChange={set('note')} maxLength={1000} placeholder="Dị ứng thực phẩm, kỷ niệm, ghế trẻ em..." className={`${inputCls} mt-1`} />
                </label>
                {formError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{formError}</p>}
                <button type="submit" disabled={busy} className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50">
                  {busy ? 'Đang gửi...' : user ? 'Gửi yêu cầu đặt bàn' : 'Đăng nhập để đặt bàn'}
                </button>
                <p className="text-center text-[11px] text-slate-400">Miễn phí đặt bàn · Huỷ được trước ngày dùng bữa</p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
