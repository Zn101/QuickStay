import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, todayIso, nightsBetween } from '../lib/format'
import { HotelImage, Spinner, ErrorBox, FieldError } from '../components/ui'
import ConciergeModal from '../components/ConciergeModal'
import { useAuth } from '../store/authStore'

function getNextDay(isoDate) {
  if (!isoDate) return todayIso(1)
  const [y, m, d] = isoDate.split('-').map(Number)
  const next = new Date(y, m - 1, d + 1)
  const pad = (n) => String(n).padStart(2, '0')
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

function validateDates(inDate, outDate) {
  if (!inDate || !outDate) return 'Vui lòng chọn cả ngày nhận và ngày trả phòng.'
  const today = todayIso()
  if (inDate < today) return 'Ngày nhận phòng không được ở trong quá khứ.'
  if (outDate <= inDate) return 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.'
  return ''
}

export default function HotelDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const paramIn = searchParams.get('checkIn')
  const paramOut = searchParams.get('checkOut')

  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [extras, setExtras] = useState(null)
  const [reviews, setReviews] = useState([])
  const [questions, setQuestions] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roomError, setRoomError] = useState('')
  const [checkIn, setCheckIn] = useState(paramIn || todayIso(1))
  const [checkOut, setCheckOut] = useState(paramOut || todayIso(2))
  const [dateError, setDateError] = useState('')
  const [searching, setSearching] = useState(false)

  // Photo lightbox
  const [lightboxIdx, setLightboxIdx] = useState(-1)

  // Concierge modal
  const [conciergeModal, setConciergeModal] = useState({ open: false, type: 'AIRPORT_TRANSFER', title: '', fee: 0 })

  // Review form
  const [revRating, setRevRating] = useState(5)
  const [revComment, setRevComment] = useState('')
  const [revStayType, setRevStayType] = useState('Gia đình')
  const [revBusy, setRevBusy] = useState(false)
  const [revError, setRevError] = useState('')

  // Q&A form
  const [qaName, setQaName] = useState('')
  const [qaText, setQaText] = useState('')
  const [qaBusy, setQaBusy] = useState(false)
  const [qaError, setQaError] = useState('')
  const [replyMap, setReplyMap] = useState({})

  // Active info tab
  const [serviceTab, setServiceTab] = useState('transfer') // transfer | dining | attractions | policies

  useEffect(() => {
    setLoading(true)
    setError('')
    setRoomError('')
    const initIn = paramIn || todayIso(1)
    const initOut = paramOut || todayIso(2)
    setCheckIn(initIn)
    setCheckOut(initOut)

    Promise.all([
      api(`/hotels/${id}`),
      api(`/hotels/${id}/rooms`, { params: { checkIn: initIn, checkOut: initOut } }),
      api(`/hotels/${id}/extras`).catch(() => null),
      api(`/hotels/${id}/reviews`).catch(() => []),
      api(`/hotels/${id}/questions`).catch(() => []),
    ])
      .then(([h, r, ex, rev, qa]) => {
        setHotel(h)
        setRooms(r || [])
        setExtras(ex && Array.isArray(ex.photos) ? ex : null)
        setReviews(Array.isArray(rev) ? rev : [])
        setQuestions(Array.isArray(qa) ? qa : [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, paramIn, paramOut])

  function fetchRoomsAvailability(cIn, cOut) {
    setRoomError('')
    setSearching(true)
    api(`/hotels/${id}/rooms`, { params: { checkIn: cIn, checkOut: cOut } })
      .then((r) => setRooms(r || []))
      .catch((err) => setRoomError(err.message))
      .finally(() => setSearching(false))
  }

  function handleCheckInChange(val) {
    setCheckIn(val)
    const err = validateDates(val, checkOut)
    setDateError(err)
    if (!err && val && checkOut) {
      fetchRoomsAvailability(val, checkOut)
    }
  }

  function handleCheckOutChange(val) {
    setCheckOut(val)
    const err = validateDates(checkIn, val)
    setDateError(err)
    if (!err && checkIn && val) {
      fetchRoomsAvailability(checkIn, val)
    }
  }

  function searchRooms(e) {
    e?.preventDefault()
    const err = validateDates(checkIn, checkOut)
    if (err) {
      setDateError(err)
      return
    }
    setDateError('')
    fetchRoomsAvailability(checkIn, checkOut)
  }

  function handleBook(room) {
    const err = validateDates(checkIn, checkOut)
    if (err) {
      setDateError(err)
      return
    }
    if (typeof room.available !== 'number' || room.available <= 0) {
      setRoomError('Loại phòng này hiện không còn phòng trống trong khoảng thời gian đã chọn.')
      return
    }
    if (!user) {
      navigate('/login', {
        state: {
          from: `/hotels/${id}/rooms/${room.id}/book`,
          hotel,
          room,
          checkIn,
          checkOut,
        },
      })
      return
    }
    navigate(`/hotels/${id}/rooms/${room.id}/book`, {
      state: { hotel, room, checkIn, checkOut },
    })
  }

  async function submitReview(e) {
    e.preventDefault()
    setRevError('')
    if (!revComment.trim()) {
      setRevError('Vui lòng nhập nhận xét của bạn.')
      return
    }
    setRevBusy(true)
    try {
      const created = await api(`/hotels/${id}/reviews`, {
        method: 'POST',
        body: { rating: Number(revRating), comment: revComment.trim(), stayType: revStayType },
      })
      setReviews((prev) => [created, ...prev])
      setRevComment('')
      setRevRating(5)
    } catch (err) {
      setRevError(err.message || 'Không thể gửi đánh giá.')
    } finally {
      setRevBusy(false)
    }
  }

  async function submitQuestion(e) {
    e.preventDefault()
    setQaError('')
    if (!qaText.trim()) {
      setQaError('Vui lòng nhập câu hỏi của bạn.')
      return
    }
    setQaBusy(true)
    try {
      const created = await api(`/hotels/${id}/questions`, {
        method: 'POST',
        body: { authorName: qaName.trim() || undefined, question: qaText.trim() },
      })
      setQuestions((prev) => [created, ...prev])
      setQaText('')
    } catch (err) {
      setQaError(err.message || 'Không thể gửi câu hỏi.')
    } finally {
      setQaBusy(false)
    }
  }

  async function submitAnswer(qid) {
    const ans = (replyMap[qid] || '').trim()
    if (!ans) return
    try {
      const updated = await api(`/admin/questions/${qid}`, {
        method: 'PATCH',
        body: { answer: ans },
      })
      setQuestions((prev) => prev.map((q) => (q.id === qid ? updated : q)))
      setReplyMap((m) => ({ ...m, [qid]: '' }))
    } catch (err) {
      alert(err.message || 'Không thể trả lời câu hỏi.')
    }
  }

  if (loading) return <div className="py-20"><Spinner text="Đang tải thông tin khách sạn..." /></div>
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBox message={error} /></div>
  if (!hotel) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-400">
            <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" /><path d="M9 21v-7h6v7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy thông tin khách sạn</h2>
        <p className="mt-2 text-sm text-slate-500">Khách sạn bạn đang tìm kiếm không tồn tại hoặc đã ngừng hoạt động.</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition-colors">
          Quay lại trang chủ
        </Link>
      </div>
    )
  }

  const amenityList = hotel.amenities ? hotel.amenities.split(',').map((a) => a.trim()).filter(Boolean) : []
  const nights = nightsBetween(checkIn, checkOut)
  const galleryPhotos = extras?.photos || [{ url: hotel.imageUrl, caption: hotel.name }]
  const mapQuery = encodeURIComponent([hotel.name, hotel.address, hotel.city, 'Vietnam'].filter(Boolean).join(', '))
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : extras?.averageRating || '4.8'

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
        <div className="lg:col-span-3 space-y-10">
          {/* Photo Gallery */}
          <div>
            <div
              className="group relative cursor-pointer overflow-hidden rounded-2xl"
              onClick={() => setLightboxIdx(0)}
            >
              <HotelImage
                src={galleryPhotos[0]?.url || hotel.imageUrl}
                alt={hotel.name}
                className="h-72 w-full object-cover sm:h-96 transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-3 right-3 rounded-xl bg-slate-900/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                📷 Xem tất cả {galleryPhotos.length} ảnh
              </span>
            </div>

            {galleryPhotos.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2.5">
                {galleryPhotos.slice(1, 5).map((p, idx) => (
                  <button
                    key={p.url + idx}
                    type="button"
                    onClick={() => setLightboxIdx(idx + 1)}
                    className="group relative h-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    <HotelImage
                      src={p.url}
                      alt={p.caption}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info & Amenities */}
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
              <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2">
                <span className="text-lg font-black text-amber-600">★ {avgRating}</span>
                <span className="text-xs font-semibold text-amber-800">({reviews.length} đánh giá)</span>
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

            {extras?.categorizedAmenities && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {extras.categorizedAmenities.map((cat) => (
                  <div key={cat.category} className="rounded-2xl border border-slate-200/80 bg-white p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">{cat.category}</h3>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                      {cat.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rooms */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">Loại phòng</h2>

            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <form onSubmit={searchRooms} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="check-in-date" className="block text-xs font-semibold text-slate-500 mb-1">Ngày nhận</label>
                  <input
                    id="check-in-date"
                    type="date"
                    value={checkIn}
                    min={todayIso()}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="check-out-date" className="block text-xs font-semibold text-slate-500 mb-1">Ngày trả</label>
                  <input
                    id="check-out-date"
                    type="date"
                    value={checkOut}
                    min={getNextDay(checkIn)}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={searching}
                    className="w-full sm:w-auto rounded-lg bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-700 transition-colors disabled:opacity-60"
                  >
                    {searching ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </button>
                </div>
              </form>
              {dateError && (
                <div className="mt-2.5">
                  <FieldError message={dateError} />
                </div>
              )}
            </div>

            {nights > 0 && !dateError && (
              <p className="mb-4 text-xs text-slate-500">
                Thời gian lưu trú: <span className="font-semibold text-slate-700">{nights} đêm</span>
              </p>
            )}

            {roomError && (
              <div className="mb-4">
                <ErrorBox message={roomError} />
              </div>
            )}

            <div className="space-y-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  nights={nights}
                  disabled={!!dateError || !!roomError || nights <= 0}
                  searching={searching}
                  onBook={() => handleBook(room)}
                />
              ))}
              {rooms.length === 0 && !loading && (
                <p className="text-sm text-slate-400 py-6 text-center">Không có loại phòng nào phù hợp.</p>
              )}
            </div>
          </div>

          {/* Services: Airport Transfer, Dining, Attraction Transport, Policies */}
          {extras && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900">Dịch vụ hỗ trợ & Chính sách lưu trú</h2>
              <p className="mt-1 text-xs text-slate-500">
                Đặt trước xe đưa đón sân bay, nhà hàng tại chỗ, xe đi tham quan và xem quy định khách sạn.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                {[
                  { id: 'transfer', label: '✈️ Đưa đón sân bay' },
                  { id: 'dining', label: '🍽️ Ẩm thực & Nhà hàng' },
                  { id: 'attractions', label: '🗺️ Xe đi điểm tham quan' },
                  { id: 'policies', label: '📋 Chính sách lưu trú' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setServiceTab(tab.id)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      serviceTab === tab.id
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {serviceTab === 'transfer' && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-sky-800 bg-sky-50 rounded-xl px-3.5 py-2">
                    Điểm đón/trả: <strong>{extras.airportName}</strong> ⇄ {hotel.name} (Đón bảng tên & hỗ trợ hành lý)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {extras.airportTransfers.map((t) => (
                      <div key={t.code} className="flex flex-col justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{t.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{t.vehicle}</p>
                          <p className="mt-1 text-[11px] text-slate-400">Tối đa {t.capacity} khách · {t.duration}</p>
                        </div>
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <p className="text-base font-extrabold text-sky-700">{formatVnd(t.price)}</p>
                          <button
                            type="button"
                            onClick={() =>
                              setConciergeModal({ open: true, type: 'AIRPORT_TRANSFER', title: t.title, fee: t.price })
                            }
                            className="mt-2 w-full rounded-xl bg-sky-600 py-2 text-xs font-bold text-white hover:bg-sky-700"
                          >
                            Đặt xe đưa đón
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serviceTab === 'dining' && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {extras.diningOptions.map((d) => (
                    <div key={d.name} className="flex flex-col justify-between rounded-2xl border border-slate-200 p-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-extrabold text-slate-900">{d.name}</p>
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 shrink-0">
                            {d.hours}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-sky-700">{d.cuisine}</p>
                        <p className="mt-1.5 text-xs text-slate-500">{d.highlight}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs font-bold text-slate-700">{d.priceNote}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setConciergeModal({ open: true, type: 'DINING', title: d.name, fee: 0 })
                          }
                          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                        >
                          Đặt bàn
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {serviceTab === 'attractions' && (
                <div className="mt-4 space-y-3">
                  {extras.attractionTransports.map((a) => (
                    <div key={a.name} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">{a.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Cách {a.distance} (~{a.estimatedDuration}) · Phương tiện: <strong>{a.transportMode}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-sky-700">
                          {a.price > 0 ? formatVnd(a.price) : 'Miễn phí'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setConciergeModal({
                              open: true,
                              type: 'ATTRACTION_TRANSPORT',
                              title: `Di chuyển: ${a.name} (${a.transportMode})`,
                              fee: a.price,
                            })
                          }
                          className="rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-700"
                        >
                          Yêu cầu hỗ trợ xe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {serviceTab === 'policies' && (
                <div className="mt-4 space-y-3">
                  {extras.policies.map((p) => (
                    <div key={p.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="text-sm font-bold text-slate-900">{p.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{p.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Google Maps Integration */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Vị trí & Bản đồ Google Maps</h2>
                <p className="text-xs text-slate-500">Khu vực {hotel.city} · {hotel.address}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100"
              >
                Mở trên Google Maps ↗
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <iframe
                title={`Google Maps - ${hotel.name}`}
                src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>

          {/* Reviews */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Đánh giá từ khách lưu trú</h2>
                <p className="text-xs text-slate-500">Điểm trung bình {avgRating}/5 từ {reviews.length} đánh giá</p>
              </div>
            </div>

            {user ? (
              <form onSubmit={submitReview} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Viết đánh giá của bạn</p>
                {revError && <ErrorBox message={revError} />}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={revRating}
                    onChange={(e) => setRevRating(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>{'★'.repeat(r)} ({r}/5)</option>
                    ))}
                  </select>
                  <select
                    value={revStayType}
                    onChange={(e) => setRevStayType(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Gia đình">Gia đình</option>
                    <option value="Cặp đôi">Cặp đôi</option>
                    <option value="Công tác">Công tác</option>
                    <option value="Đi một mình">Đi một mình</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm về phòng, vị trí, dịch vụ đưa đón hoặc ẩm thực..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={revBusy}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {revBusy ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </form>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <Link to="/login" className="font-bold text-sky-600 hover:underline">Đăng nhập</Link> để chia sẻ đánh giá của bạn về khách sạn này.
              </p>
            )}

            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                        {rev.authorName?.charAt(0)?.toUpperCase() || 'K'}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{rev.authorName}</p>
                        <p className="text-[11px] text-slate-400">{rev.stayType || 'Khách lưu trú'}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-600">
                      {'★'.repeat(rev.rating)}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-6 text-slate-600">{rev.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-xs text-slate-400">Chưa có đánh giá nào.</p>
              )}
            </div>
          </section>

          {/* Q&A Section */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Hỏi & Đáp về {hotel.name} (Q&A)</h2>
              <p className="text-xs text-slate-500">Đặt câu hỏi trực tiếp cho quản lý khách sạn về phòng, đưa đón hoặc dịch vụ.</p>
            </div>

            <form onSubmit={submitQuestion} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              {qaError && <ErrorBox message={qaError} />}
              {!user && (
                <input
                  type="text"
                  value={qaName}
                  onChange={(e) => setQaName(e.target.value)}
                  placeholder="Tên của bạn (không bắt buộc)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-sky-500"
                />
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={qaText}
                  onChange={(e) => setQaText(e.target.value)}
                  placeholder="Đặt câu hỏi (VD: Có xuất hóa đơn VAT hoặc hỗ trợ nhận phòng muộn không?)"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={qaBusy}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {qaBusy ? 'Đang gửi...' : 'Gửi câu hỏi'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="rounded-2xl border border-slate-100 p-4 space-y-2">
                  <p className="text-sm font-bold text-slate-900">❓ {q.question}</p>
                  <p className="text-[11px] text-slate-400">Hỏi bởi {q.authorName}</p>
                  {q.answer ? (
                    <div className="rounded-xl bg-sky-50/80 p-3 text-xs leading-5 text-slate-700">
                      <strong className="text-sky-800">{q.answeredBy || 'Khách sạn'}:</strong> {q.answer}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400">Đang chờ quản lý phản hồi...</p>
                  )}

                  {user?.role === 'ADMIN' && !q.answer && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Nhập câu trả lời của Admin..."
                        value={replyMap[q.id] || ''}
                        onChange={(e) => setReplyMap((m) => ({ ...m, [q.id]: e.target.value }))}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => submitAnswer(q.id)}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                      >
                        Trả lời
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
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
                <span>Số đêm</span><span className="font-medium">{!dateError && nights > 0 ? nights : '—'}</span>
              </div>
            </div>

            {extras && (
              <div className="space-y-2 border-t pt-3 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Dịch vụ đi kèm có sẵn:</p>
                <p>✈️ Đón tiễn {extras.airportName}</p>
                <p>🍽️ {extras.diningOptions.length} lựa chọn ẩm thực & nhà hàng</p>
                <p>🗺️ Hỗ trợ xe tới {extras.attractionTransports.length} điểm tham quan</p>
              </div>
            )}

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

      {/* Photo Lightbox Modal */}
      {lightboxIdx >= 0 && galleryPhotos[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxIdx(-1)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxIdx(-1)}
              className="absolute -top-10 right-0 rounded-lg bg-white/15 px-3 py-1 text-sm font-bold text-white hover:bg-white/25"
            >
              Đóng ✕
            </button>
            <img
              src={galleryPhotos[lightboxIdx].url}
              alt={galleryPhotos[lightboxIdx].caption}
              className="max-h-[75vh] w-full rounded-2xl object-contain bg-black"
            />
            <div className="mt-3 flex items-center justify-between text-white">
              <button
                type="button"
                onClick={() => setLightboxIdx((i) => (i - 1 + galleryPhotos.length) % galleryPhotos.length)}
                className="rounded-xl bg-white/15 px-4 py-2 text-xs font-bold hover:bg-white/25"
              >
                ← Ảnh trước
              </button>
              <p className="text-xs font-medium text-slate-300">
                {galleryPhotos[lightboxIdx].caption} ({lightboxIdx + 1}/{galleryPhotos.length})
              </p>
              <button
                type="button"
                onClick={() => setLightboxIdx((i) => (i + 1) % galleryPhotos.length)}
                className="rounded-xl bg-white/15 px-4 py-2 text-xs font-bold hover:bg-white/25"
              >
                Ảnh sau →
              </button>
            </div>
          </div>
        </div>
      )}

      <ConciergeModal
        isOpen={conciergeModal.open}
        onClose={() => setConciergeModal((m) => ({ ...m, open: false }))}
        hotel={hotel}
        serviceType={conciergeModal.type}
        defaultTitle={conciergeModal.title}
        defaultFee={conciergeModal.fee}
      />
    </div>
  )
}

function RoomCard({ room, nights, disabled, searching, onBook }) {
  const hasAvailable = typeof room.available === 'number'
  const isAvailable = !disabled && !searching && hasAvailable && room.available > 0

  return (
    <div className={`rounded-xl border p-4 transition-all ${isAvailable ? 'border-slate-200 bg-white hover:border-sky-200 hover:shadow-md' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900">{room.roomType}</h3>
            {hasAvailable ? (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${room.available > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {room.available > 0 ? `Còn ${room.available} phòng` : 'Hết phòng'}
              </span>
            ) : (
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500">
                Chưa kiểm tra phòng
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
          {nights > 0 && room.pricePerNight && (
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
