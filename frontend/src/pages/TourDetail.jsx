import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, todayIso } from '../lib/format'
import { useAuth } from '../store/authStore'
import { useVenue } from '../lib/venues'
import { Spinner } from '../components/ui'
import VenueReviews, { Stars } from '../components/VenueReviews'
import NearbyHotels from '../components/NearbyHotels'

const VEHICLES = [
  ['SEDAN_4', 'Xe 4 chỗ'],
  ['SUV_7', 'Xe 7 chỗ gia đình'],
  ['LIMO_VIP', 'Limousine 9 chỗ VIP'],
]

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

export default function TourDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { item: t, error, setItem } = useVenue('tours', id)
  const [form, setForm] = useState({ date: todayIso(1), guests: 2, vehicle: 'SEDAN_4', guestName: '', guestPhone: '', note: '' })
  const [availability, setAvailability] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [created, setCreated] = useState(null)

  // Số chỗ còn lại theo ngày khởi hành đã chọn
  useEffect(() => {
    if (!form.date) return
    let alive = true
    api(`/tours/${id}/availability`, { params: { date: form.date } })
      .then((a) => alive && setAvailability(a))
      .catch(() => alive && setAvailability(null))
    return () => {
      alive = false
    }
  }, [id, form.date, created])

  if (error === 'not-found') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-bold text-slate-800 dark:text-white">Không tìm thấy tour</p>
        <Link to="/tours" className="mt-4 inline-block text-sm font-bold text-sky-600">← Xem tất cả tour</Link>
      </div>
    )
  }
  if (error) return <p className="mx-auto max-w-3xl px-4 py-20 text-center text-rose-600">{error}</p>
  if (!t) return <Spinner />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const guests = Number(form.guests) || 0
  const remaining = availability?.remaining
  const soldOut = remaining === 0
  const tooMany = remaining != null && guests > remaining

  async function submit(e) {
    e.preventDefault()
    setFormError('')
    if (!user) {
      navigate('/login', { state: { from: `/tours/${id}` } })
      return
    }
    if (user.role !== 'CUSTOMER') {
      setFormError('Chỉ tài khoản khách hàng mới đặt được tour.')
      return
    }
    setBusy(true)
    try {
      const res = await api(`/tours/${id}/bookings`, {
        method: 'POST',
        body: {
          ...form,
          guests,
          guestName: form.guestName.trim() || user.fullName || user.email,
          guestPhone: form.guestPhone.trim(),
          note: form.note.trim(),
        },
      })
      setCreated(res)
    } catch (err) {
      setFormError(err.message || 'Không gửi được yêu cầu đặt tour.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-slate-600">Trang chủ</Link>
        <span>/</span>
        <Link to="/tours" className="hover:text-slate-600">Tour & Điểm đến</Link>
        <span>/</span>
        <Link to={`/tours?city=${encodeURIComponent(t.city)}`} className="hover:text-slate-600">{t.city}</Link>
        <span>/</span>
        <span className="font-bold text-slate-800 dark:text-slate-100">{t.title}</span>
      </nav>

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
        {t.image && <img src={t.image} alt={t.title} className="absolute inset-0 h-full w-full object-cover opacity-60" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        <div className="relative z-10 flex min-h-[260px] flex-col justify-end p-6 sm:p-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">{t.category}</span>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">{t.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-200">
            <span>📍 {t.city}</span>
            {t.duration && <span>⏱ {t.duration}</span>}
            {t.transport && <span>🚐 {t.transport}</span>}
            <span>👥 Tối đa {t.maxGuestsPerDay} khách / ngày</span>
            {t.reviewCount > 0 && (
              <span>
                <Stars value={t.rating} /> {t.rating.toFixed(1)} ({t.reviewCount})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Tổng quan</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t.description || 'Đang cập nhật.'}</p>
            {t.highlights.length > 0 && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {t.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <span className="text-cyan-600">★</span> {h}
                  </li>
                ))}
              </ul>
            )}
            {t.meetingPoint && (
              <p className="mt-4 rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                Điểm đón / tập trung: {t.meetingPoint}
              </p>
            )}
          </section>

          {t.itinerary.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Lịch trình</h2>
              <ol className="mt-4 space-y-0 border-l-2 border-sky-200 dark:border-sky-900">
                {t.itinerary.map((s, i) => (
                  <li key={i} className="relative pb-5 pl-6 last:pb-0">
                    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-sky-600 dark:border-slate-900" />
                    {s.time && <p className="text-xs font-black text-sky-700 dark:text-sky-400">{s.time}</p>}
                    <p className="text-sm text-slate-700 dark:text-slate-200">{s.activity}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(t.includes.length > 0 || t.excludes.length > 0) && (
            <section className="grid gap-4 sm:grid-cols-2">
              {t.includes.length > 0 && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-300">Giá đã bao gồm</h3>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-900 dark:text-emerald-200">
                    {t.includes.map((x) => <li key={x}>✓ {x}</li>)}
                  </ul>
                </div>
              )}
              {t.excludes.length > 0 && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900 dark:bg-rose-950/30">
                  <h3 className="text-sm font-extrabold text-rose-900 dark:text-rose-300">Chưa bao gồm</h3>
                  <ul className="mt-2 space-y-1 text-sm text-rose-900 dark:text-rose-200">
                    {t.excludes.map((x) => <li key={x}>✕ {x}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}

          <VenueReviews
            kind="tours"
            id={id}
            rating={t.rating}
            reviewCount={t.reviewCount}
            onReviewed={() => api(`/tours/${id}`).then(setItem).catch(() => {})}
          />

          <NearbyHotels city={t.city} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-400">Giá mỗi khách</p>
            <p className="text-2xl font-black text-sky-700 dark:text-sky-400">{formatVnd(t.price)}</p>
            {created ? (
              <div className="mt-4 space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-black text-emerald-600">✓</div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Đã gửi yêu cầu đặt tour #{created.id}</h3>
                <p className="text-sm text-slate-500">
                  {created.guests} khách · ngày {created.date} · tạm tính {formatVnd(created.totalPrice)}. Đơn vị tổ chức sẽ xác nhận qua SĐT {created.guestPhone}.
                </p>
                <Link to="/my-bookings" className="inline-block rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white">
                  Xem đơn của tôi
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Ngày khởi hành
                    <input type="date" required min={todayIso(1)} max={todayIso(365)} value={form.date} onChange={set('date')} className={`${inputCls} mt-1`} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Số khách
                    <input type="number" min={1} max={50} required value={form.guests} onChange={set('guests')} className={`${inputCls} mt-1`} />
                  </label>
                </div>
                {availability && (
                  <p className={`text-xs font-semibold ${soldOut || tooMany ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {soldOut ? 'Ngày này đã hết chỗ, vui lòng chọn ngày khác.' : `Còn ${remaining} / ${availability.maxGuests} chỗ cho ngày này.`}
                  </p>
                )}
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Phương tiện
                  <select value={form.vehicle} onChange={set('vehicle')} className={`${inputCls} mt-1`}>
                    {VEHICLES.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Họ tên
                  <input value={form.guestName} onChange={set('guestName')} placeholder={user?.fullName || 'Nguyễn Văn A'} className={`${inputCls} mt-1`} />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Số điện thoại
                  <input type="tel" required value={form.guestPhone} onChange={set('guestPhone')} placeholder="0912 345 678" className={`${inputCls} mt-1`} />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Điểm đón & ghi chú
                  <input value={form.note} onChange={set('note')} maxLength={1000} placeholder="Tên khách sạn, yêu cầu riêng..." className={`${inputCls} mt-1`} />
                </label>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                  <span className="text-slate-500">Tạm tính ({guests} khách)</span>
                  <span className="font-black text-slate-900 dark:text-white">{formatVnd(t.price * guests)}</span>
                </div>
                {formError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{formError}</p>}
                <button
                  type="submit"
                  disabled={busy || soldOut || tooMany}
                  className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {busy ? 'Đang gửi...' : user ? 'Gửi yêu cầu đặt tour' : 'Đăng nhập để đặt tour'}
                </button>
                <p className="text-center text-[11px] text-slate-400">Gửi yêu cầu chưa thu tiền · Huỷ được trước ngày khởi hành</p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
