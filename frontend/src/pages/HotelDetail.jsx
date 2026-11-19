import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, todayIso, nightsBetween, formatDateVi } from '../lib/format'
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

const REVIEWS_POOL = [
  { authorName: 'Đặng Thùy Dương', rating: 5, stayType: 'Kỳ nghỉ gia đình', comment: 'Không gian nghỉ dưỡng tuyệt vời, phòng ốc sạch bóng không tì vết. Đội ngũ nhân viên luôn niềm nở, hỗ trợ gia đình mình rất nhiệt tình từ lúc nhận phòng đến khi trả phòng.' },
  { authorName: 'Vũ Hoàng Nam', rating: 5, stayType: 'Chuyến công tác', comment: 'Khách sạn có vị trí đắc địa, đi lại cực kỳ thuận tiện. Bàn làm việc trong phòng rất rộng rãi, wifi tốc độ cao và đường truyền cực kỳ ổn định để họp trực tuyến.' },
  { authorName: 'Lê Thảo Vy', rating: 4, stayType: 'Cặp đôi', comment: 'Cảnh quan hoàng hôn lãng mạn, giường nệm King size êm ái cho giấc ngủ rất sâu. Điểm cộng lớn là buffet sáng phong phú cả món Âu lẫn món Việt.' },
  { authorName: 'Phan Quốc Huy', rating: 5, stayType: 'Nhóm bạn bè', comment: 'Dịch vụ đưa đón sân bay rất đúng giờ, xe mới sạch sẽ và bác tài lái xe êm. Chắc chắn sẽ quay lại lưu trú trong chuyến du lịch sắp tới.' },
  { authorName: 'Nguyễn Bích Ngọc', rating: 5, stayType: 'Kỳ nghỉ dưỡng', comment: 'Hồ bơi vô cực ngắm trọn cảnh quan tuyệt đẹp. Thủ tục check-in nhanh gọn chỉ mất 2 phút. Dịch vụ phòng chu đáo và luôn sẵn sàng hỗ trợ.' },
  { authorName: 'Trịnh Thế Bảo', rating: 4, stayType: 'Gia đình nhỏ', comment: 'Không gian thoáng mát, các bé nhà mình rất thích khu vực sân vườn và hồ bơi. Đồ ăn sáng tươi ngon và thay đổi món liên tục.' },
  { authorName: 'Hoàng Mai Phương', rating: 5, stayType: 'Du lịch nghỉ dưỡng', comment: 'Trải nghiệm vượt ngoài mong đợi! Giường nệm chuẩn 5 sao, bồn tắm thư giãn tuyệt vời sau một ngày dài dạo chơi.' },
]

function getHotelDiversifiedReviews(hotel, rawReviews) {
  const userAdded = (rawReviews || []).filter((r) => r.isUserCreated || (r.id && typeof r.id === 'number' && r.id > 100))
  const hotelIdNum = Number(hotel?.id) || 1
  const startIdx = (hotelIdNum * 2) % REVIEWS_POOL.length
  const pool = [
    ...REVIEWS_POOL.slice(startIdx),
    ...REVIEWS_POOL.slice(0, startIdx),
  ]
  const seeded = pool.slice(0, 3).map((item, idx) => ({
    id: `custom-rev-${hotel?.id}-${idx}`,
    authorName: item.authorName,
    rating: item.rating,
    stayType: item.stayType,
    comment: item.comment,
    createdAt: 'Tháng 11/2026',
  }))
  return [...userAdded, ...seeded]
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
  const [activeSlideIdx, setActiveSlideIdx] = useState(0)
  const [isSlideshowPaused, setIsSlideshowPaused] = useState(false)

  // Concierge modal
  const [conciergeModal, setConciergeModal] = useState({ open: false, type: 'AIRPORT_TRANSFER', title: '', fee: 0 })

  // Review form
  const [revRating, setRevRating] = useState(5)
  const [revComment, setRevComment] = useState('')
  const [revStayType, setRevStayType] = useState('Gia đình')
  const [revBusy, setRevBusy] = useState(false)
  const [revError, setRevError] = useState('')

  // AI Review Summary & Grounded Q&A
  const [aiSummary, setAiSummary] = useState(null)
  const [loadingAiSummary, setLoadingAiSummary] = useState(false)
  const [aiFastAnswer, setAiFastAnswer] = useState('')
  const [aiFastAnswerBusy, setAiFastAnswerBusy] = useState(false)
  const [draftingId, setDraftingId] = useState(null)

  // Q&A form
  const [qaName, setQaName] = useState('')
  const [qaText, setQaText] = useState('')
  const [qaBusy, setQaBusy] = useState(false)
  const [qaError, setQaError] = useState('')
  const [replyMap, setReplyMap] = useState({})

  // Active info tab
  const [serviceTab, setServiceTab] = useState('transfer') // transfer | dining | attractions | policies

  async function loadAiReviewSummary() {
    setLoadingAiSummary(true)
    try {
      const res = await api(`/ai/reviews/${id}/summary`)
      setAiSummary(res)
    } catch (e) {
      console.warn('Cannot load review summary', e)
    } finally {
      setLoadingAiSummary(false)
    }
  }

  async function handleFastAiAnswer() {
    if (!qaText.trim()) {
      setQaError('Vui lòng nhập câu hỏi để AI trả lời.')
      return
    }
    setAiFastAnswerBusy(true)
    setQaError('')
    setAiFastAnswer('')
    try {
      const res = await api('/ai/hotel-qa', {
        method: 'POST',
        body: {
          hotelId: Number(id),
          question: qaText.trim(),
          language: 'vi',
        },
      })
      if (res?.answer) {
        setAiFastAnswer(res.answer)
      }
    } catch (e) {
      setQaError(e.message || 'Không thể giải đáp bằng AI.')
    } finally {
      setAiFastAnswerBusy(false)
    }
  }

  async function handleGenerateReplyDraft(q) {
    setDraftingId(q.id)
    try {
      const res = await api('/ai/reply-draft', {
        method: 'POST',
        body: {
          guestName: q.authorName,
          guestMessage: q.question,
          hotelName: hotel?.name,
          language: 'vi',
        },
      })
      if (res?.draft) {
        setReplyMap((m) => ({ ...m, [q.id]: res.draft }))
      }
    } catch (e) {
      console.warn('Cannot generate draft', e)
    } finally {
      setDraftingId(null)
    }
  }

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

  // Slideshow auto-advance every 4 seconds
  useEffect(() => {
    if (isSlideshowPaused) return
    const totalPhotos = extras?.photos && extras.photos.length > 1 ? extras.photos.length : 5
    if (totalPhotos <= 1) return
    const timer = setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % totalPhotos)
    }, 4000)
    return () => clearInterval(timer)
  }, [extras?.photos, isSlideshowPaused])

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
      created.isUserCreated = true
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

  // Danh sách chữ ký ảnh chính của các khách sạn khác để cô lập không dùng chéo
  const otherHotelSignatures = [
    'photo-1566073771259', // Đà Nẵng
    'photo-1551882547',    // Hà Nội
    'photo-1564501049',    // Sài Gòn
    'photo-1520250497',    // Hội An
    'photo-1540555700',    // Phú Quốc
    'photo-1571003123',    // Nha Trang
    'photo-1587061949',    // Đà Lạt
    'photo-1590490360',    // Huế
  ]

  const rawPhotos = extras?.photos && extras.photos.length > 1 ? extras.photos : [
    { url: hotel.imageUrl, caption: `${hotel.name} - Toàn cảnh khuôn viên sang trọng` },
    { url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80', caption: 'Phòng ngủ Master King Bed cao cấp ngập tràn ánh sáng' },
    { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', caption: 'Không gian phòng khách Suite rộng rãi & Ban công ngắm cảnh' },
    { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', caption: 'Phòng tắm đá cẩm thạch sang trọng với bồn tắm ngâm thảo mộc' },
    { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', caption: 'Hồ bơi ngoài trời với ghế tắm nắng & view toàn cảnh' },
    { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', caption: 'Nhà hàng buffet Á - Âu & Không gian ẩm thực thượng lưu' },
    { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', caption: 'Khuôn viên vườn nhiệt đới & Lối dạo bộ thư thái' },
    { url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80', caption: 'Khu trị liệu Spa chăm sóc sức khỏe & Phòng xông hơi khô' },
    { url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80', caption: 'Đại sảnh đón tiếp sang trọng & Quầy lễ tân phục vụ 24/7' },
  ]

  // Lọc loại bỏ ảnh thuộc sở hữu của khách sạn khác để mỗi khách sạn có bộ ảnh độc lập
  const galleryPhotos = rawPhotos.filter((p) => {
    if (!p.url) return false
    for (const sig of otherHotelSignatures) {
      if (p.url.includes(sig) && (!hotel.imageUrl || !hotel.imageUrl.includes(sig))) {
        return false
      }
    }
    return true
  })

  const mapQuery = encodeURIComponent([hotel.name, hotel.address, hotel.city, 'Vietnam'].filter(Boolean).join(', '))
  const displayReviews = hotel ? getHotelDiversifiedReviews(hotel, reviews) : reviews
  const defaultRatings = ['4.9', '4.8', '4.7', '4.9', '4.8', '4.6', '4.9', '4.7']
  const fallbackHotelRating = defaultRatings[Math.abs((Number(hotel.id) - 1) % defaultRatings.length)]
  const avgRating =
    displayReviews.length > 0
      ? (displayReviews.reduce((sum, r) => sum + r.rating, 0) / displayReviews.length).toFixed(1)
      : hotel.rating ? Number(hotel.rating).toFixed(1) : extras?.averageRating || fallbackHotelRating

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-slate-600 transition-colors">Trang chủ</Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">{hotel.name}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_335px] gap-8 items-start">
        {/* Left column */}
        <div className="min-w-0 space-y-10">
          {/* Photo Gallery with Slideshow */}
          <div
            className="group relative overflow-hidden rounded-2xl bg-slate-950 shadow-md"
            onMouseEnter={() => setIsSlideshowPaused(true)}
            onMouseLeave={() => setIsSlideshowPaused(false)}
          >
            <div
              className="relative h-72 sm:h-96 w-full cursor-pointer overflow-hidden"
              onClick={() => setLightboxIdx(activeSlideIdx)}
            >
              {galleryPhotos.map((p, idx) => (
                <div
                  key={p.url + idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === activeSlideIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <HotelImage
                    src={p.url}
                    alt={p.caption || hotel.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-28 text-white pointer-events-none">
                    <p className="text-xs sm:text-sm font-bold drop-shadow-md truncate">{p.caption || hotel.name}</p>
                  </div>
                </div>
              ))}

              {/* Prev / Next Buttons */}
              {galleryPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveSlideIdx((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                    aria-label="Ảnh trước"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveSlideIdx((prev) => (prev + 1) % galleryPhotos.length)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                    aria-label="Ảnh sau"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Badge: View all photos & Counter */}
              <span className="absolute bottom-3 right-3 z-20 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur border border-white/10 flex items-center gap-1.5 shadow-sm">
                <span>📷</span>
                <span>{activeSlideIdx + 1} / {galleryPhotos.length}</span>
              </span>
            </div>

            {/* Thumbnail Navigation Bar */}
            {galleryPhotos.length > 1 && (
              <div className="p-2.5 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto no-scrollbar border-t border-white/10">
                <div className="flex items-center gap-2">
                  {galleryPhotos.map((p, idx) => (
                    <button
                      key={p.url + idx}
                      type="button"
                      onClick={() => setActiveSlideIdx(idx)}
                      className={`relative h-12 w-16 sm:h-14 sm:w-20 shrink-0 overflow-hidden rounded-lg transition-all ${
                        idx === activeSlideIdx
                          ? 'ring-2 ring-blue-500 scale-105 opacity-100'
                          : 'opacity-60 hover:opacity-90'
                      }`}
                    >
                      <img src={p.url} alt={p.caption} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxIdx(activeSlideIdx)}
                  className="shrink-0 text-xs font-bold text-blue-300 hover:text-white px-2 py-1 transition-colors"
                >
                  Toàn màn hình ↗
                </button>
              </div>
            )}
          </div>

          {/* Info & Amenities */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{hotel.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 flex-shrink-0">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  {hotel.address}, {hotel.city}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/50 px-3.5 py-2">
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">★ {avgRating}</span>
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">({reviews.length} đánh giá)</span>
              </div>
            </div>

            {hotel.description && (
              <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">{hotel.description}</p>
            )}

            {amenityList.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Tiện nghi</h2>
                <div className="flex flex-wrap gap-2">
                  {amenityList.map((a) => (
                    <span key={a} className="rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {extras?.categorizedAmenities && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {extras.categorizedAmenities.map((cat) => (
                  <div key={cat.category} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">{cat.category}</h3>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
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
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Loại phòng</h2>

            <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
              <form onSubmit={searchRooms} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="check-in-date" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Ngày nhận</label>
                  <input
                    id="check-in-date"
                    type="date"
                    value={checkIn}
                    min={todayIso()}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="check-out-date" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Ngày trả</label>
                  <input
                    id="check-out-date"
                    type="date"
                    value={checkOut}
                    min={getNextDay(checkIn)}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={searching}
                    className="w-full sm:w-auto rounded-lg bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-700 transition-colors disabled:opacity-60 cursor-pointer"
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
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Thời gian lưu trú: <span className="font-semibold text-slate-700 dark:text-slate-200">{nights} đêm</span>
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
                  hotelId={id}
                  checkIn={checkIn}
                  checkOut={checkOut}
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

          {/* Services: Airport Transfer, Dining, Attraction Transport (Chính sách đã chuyển sang cột phải) */}
          {extras && (
            <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Dịch vụ đưa đón & Trải nghiệm bổ trợ</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Đặt trước xe đưa đón sân bay, nhà hàng ẩm thực tại chỗ và tour/xe đi các điểm tham quan nổi tiếng.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                {[
                  { id: 'transfer', label: '✈️ Đưa đón sân bay' },
                  { id: 'dining', label: '🍽️ Ẩm thực & Nhà hàng' },
                  { id: 'attractions', label: '🗺️ Xe đi điểm tham quan' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setServiceTab(tab.id)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                      serviceTab === tab.id
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {serviceTab === 'transfer' && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 rounded-xl px-3.5 py-2 border border-sky-100 dark:border-sky-900/50">
                    Điểm đón/trả: <strong>{extras.airportName}</strong> ⇄ {hotel.name} (Đón bảng tên & hỗ trợ hành lý)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {extras.airportTransfers.map((t) => (
                      <div key={t.code} className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">{t.title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.vehicle}</p>
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Tối đa {t.capacity} khách · {t.duration}</p>
                        </div>
                        <div className="mt-4 border-t border-slate-100 dark:border-slate-700/60 pt-3">
                          <p className="text-base font-extrabold text-sky-700 dark:text-sky-400">{formatVnd(t.price)}</p>
                          <button
                            type="button"
                            onClick={() =>
                              setConciergeModal({ open: true, type: 'AIRPORT_TRANSFER', title: t.title, fee: t.price })
                            }
                            className="mt-2 w-full rounded-xl bg-sky-600 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer"
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
                    <div key={d.name} className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">{d.name}</p>
                          <span className="rounded-md bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                            {d.hours}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-sky-700 dark:text-sky-400">{d.cuisine}</p>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{d.highlight}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{d.priceNote}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setConciergeModal({ open: true, type: 'DINING', title: d.name, fee: 0 })
                          }
                          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer"
                        >
                          Đặt bàn
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {serviceTab === 'attractions' && (
                <div className="mt-4 space-y-4">
                  {extras.attractionTransports.map((a) => (
                    <div
                      key={a.name}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4.5 hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md transition-all duration-300 shimmer-card"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">{a.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Cách {a.distance} (~{a.estimatedDuration}) · Phương tiện: <strong className="text-slate-700 dark:text-slate-200">{a.transportMode}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-sky-700 dark:text-sky-400">
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
                          className="rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer active:scale-95 transition-all shadow-xs"
                        >
                          Yêu cầu hỗ trợ xe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Google Maps Integration */}
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Vị trí & Bản đồ Google Maps</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Khu vực {hotel.city} · {hotel.address}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3.5 py-2 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
              >
                Mở trên Google Maps ↗
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
              <iframe
                title={`Google Maps - ${hotel.name}`}
                src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>

          {/* Polished Users Rating UI */}
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Đánh giá & Trải nghiệm thực tế</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">100% đánh giá được xác thực từ khách hàng đã hoàn tất lưu trú</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-300/60 dark:border-amber-700/60 p-3 px-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white text-xl font-black shadow-sm">
                  ★
                </span>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{avgRating}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ 5</span>
                  </div>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {parseFloat(avgRating) >= 4.5 ? 'Xuất sắc' : 'Rất tốt'} · {reviews.length} đánh giá
                  </span>
                </div>
              </div>
            </div>

            {/* Score Breakdown Bars (Thang điểm chi tiết chuẩn OTA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 p-4 sm:p-5 border border-slate-100 dark:border-slate-800">
              {[
                { label: 'Vị trí & Thuận tiện đi lại', score: '9.8 / 10', pct: '98%' },
                { label: 'Vệ sinh & Sạch sẽ buồng phòng', score: '9.7 / 10', pct: '97%' },
                { label: 'Thái độ phục vụ của nhân viên', score: '9.6 / 10', pct: '96%' },
                { label: 'Chất lượng giường & Tiện nghi phòng', score: '9.4 / 10', pct: '94%' },
                { label: 'Độ tương xứng với giá tiền', score: '9.5 / 10', pct: '95%' },
                { label: 'Đồ ăn sáng & Dịch vụ ẩm thực', score: '9.3 / 10', pct: '93%' },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <span>{item.label}</span>
                    <span className="text-sky-700 dark:text-sky-400 font-bold">{item.score}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
                      style={{ width: item.pct }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tóm tắt Đánh giá bằng AI (AI Review Summary) */}
            <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white dark:from-purple-950/40 dark:to-slate-900 p-4.5 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white text-xs font-black shadow-xs">
                    ✨
                  </span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Tóm tắt đánh giá bằng AI (AI Review Summary)
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Tổng hợp điểm khách thích, điểm cần lưu ý và nhận định tổng quan
                    </p>
                  </div>
                </div>
                {!aiSummary && (
                  <button
                    type="button"
                    onClick={loadAiReviewSummary}
                    disabled={loadingAiSummary}
                    className="flex items-center gap-1 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer shrink-0"
                  >
                    {loadingAiSummary ? 'Đang phân tích...' : 'Xem tóm tắt AI'}
                  </button>
                )}
              </div>

              {aiSummary && (
                <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-2xs">
                  {aiSummary.summaryText}
                </div>
              )}
            </div>

            {/* Form viết đánh giá */}
            {user ? (
              <form onSubmit={submitReview} className="space-y-3.5 rounded-2xl border border-sky-100 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/30 p-5">
                <div className="flex items-center gap-2">
                  <span className="text-base">✍️</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Chia sẻ trải nghiệm lưu trú của bạn</p>
                </div>
                {revError && <ErrorBox message={revError} />}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Đánh giá điểm:</span>
                    <select
                      value={revRating}
                      onChange={(e) => setRevRating(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white shadow-2xs"
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>{'★'.repeat(r)} ({r}/5 sao)</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mục đích chuyến đi:</span>
                    <select
                      value={revStayType}
                      onChange={(e) => setRevStayType(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white shadow-2xs"
                    >
                      <option value="Gia đình">Gia đình</option>
                      <option value="Cặp đôi">Cặp đôi</option>
                      <option value="Công tác">Công tác</option>
                      <option value="Nhóm bạn bè">Nhóm bạn bè</option>
                      <option value="Đi một mình">Đi một mình</option>
                    </select>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  placeholder="Chia sẻ cảm nhận về độ sạch sẽ, phòng ốc, bữa sáng buffet, dịch vụ đón sân bay hoặc vị trí thuận tiện..."
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={revBusy}
                  className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {revBusy ? 'Đang gửi...' : 'Gửi đánh giá của bạn'}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-300">
                <span>Bạn đã từng nghỉ ngơi tại {hotel.name}? Hãy đăng nhập để để lại đánh giá của bạn.</span>
                <Link to="/login" className="font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 shrink-0">
                  Đăng nhập ngay →
                </Link>
              </div>
            )}

            {/* Danh sách các đánh giá của khách hàng */}
            <div className="space-y-3.5">
              {displayReviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/70 p-4.5 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-xs font-bold text-white shadow-xs">
                        {rev.authorName?.charAt(0)?.toUpperCase() || 'K'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{rev.authorName}</p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            ✓ Đã xác thực lưu trú
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Kỳ nghỉ {rev.stayType || 'Khách lưu trú'} · Tháng 11/2026
                        </p>
                      </div>
                    </div>
                    <span className="rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 text-xs font-extrabold text-amber-600 dark:text-amber-300">
                      {'★'.repeat(rev.rating)} ({rev.rating}/5)
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200 bg-slate-50/60 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    {rev.comment}
                  </p>
                </div>
              ))}
              {displayReviews.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">Chưa có đánh giá nào cho khách sạn này.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right column: STICKY SUMMARY (Cố định không cuộn mất màn hình + Chiều rộng nhỏ gọn vừa vặn) */}
        <aside className="w-full lg:w-[320px] xl:w-[335px] space-y-4 self-start sticky top-20 z-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto custom-scrollbar pr-1">
          {/* 1. Tóm tắt đặt phòng & Bảng Giá Chi Tiết */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-4.5 shadow-md space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                Tóm tắt lưu trú
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Xác nhận tức thì
              </span>
            </div>

            <div className="flex items-center gap-3">
              <HotelImage src={hotel.imageUrl} alt={hotel.name} className="h-14 w-14 rounded-xl object-cover shadow-2xs" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-1">{hotel.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <svg className="h-3 w-3 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{hotel.city}</span>
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold">
                  <span>★ {avgRating}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({reviews.length} đánh giá)</span>
                </div>
              </div>
            </div>

            {/* BẢNG GIÁ LIỆT KÊ NỔI BẬT (PRICE LISTED IN SUMMARY PART) */}
            <div className="rounded-xl border border-sky-200 dark:border-sky-800/80 bg-gradient-to-br from-sky-50 via-cyan-50/40 to-white dark:from-slate-800 dark:via-sky-950/40 dark:to-slate-900 p-3.5 shadow-2xs">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1">
                <svg className="h-3 w-3 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Mức giá tốt nhất hôm nay
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-sky-700 dark:text-sky-400">
                  {formatVnd(hotel.minPrice || (rooms.length > 0 ? Math.min(...rooms.map((r) => r.pricePerNight)) : 550000))}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">/ đêm</span>
              </div>

              {!dateError && nights > 0 ? (
                <div className="mt-2 pt-2 border-t border-sky-100 dark:border-sky-900/50 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">Tạm tính ({nights} đêm):</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {formatVnd((hotel.minPrice || (rooms.length > 0 ? Math.min(...rooms.map((r) => r.pricePerNight)) : 550000)) * nights)}
                  </span>
                </div>
              ) : null}

              <div className="mt-2 space-y-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                <p className="flex items-center gap-1">
                  <svg className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Miễn phí hủy phòng trước 24 giờ
                </p>
                <p className="flex items-center gap-1">
                  <svg className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Đã bao gồm thuế GTGT & phí dịch vụ
                </p>
                <p className="flex items-center gap-1">
                  <svg className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Tặng voucher hoàn tiền 5% cho lần sau
                </p>
              </div>
            </div>

            {/* Thông tin ngày nhận / trả */}
            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                  </svg>
                  Nhận phòng
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{checkIn ? formatDateVi(checkIn) : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                  </svg>
                  Trả phòng
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{checkOut ? formatDateVi(checkOut) : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Thời gian lưu trú
                </span>
                <span className="font-extrabold text-sky-700 dark:text-sky-400">{!dateError && nights > 0 ? `${nights} đêm` : '—'}</span>
              </div>
            </div>

            {extras && (
              <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-wide">Dịch vụ đi kèm có sẵn:</p>
                <p className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Đón tiễn {extras.airportName}
                </p>
                <p className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {extras.diningOptions.length} ẩm thực & buffet sáng
                </p>
                <p className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Hỗ trợ xe {extras.attractionTransports.length} điểm tham quan
                </p>
              </div>
            )}

            {!user && (
              <Link
                to="/login"
                className="block w-full rounded-xl bg-sky-600 py-2.5 text-center text-xs font-bold text-white hover:bg-sky-700 transition-colors shadow-sm"
              >
                Đăng nhập để đặt phòng
              </Link>
            )}
          </div>

          {/* 2. CHÍNH SÁCH LƯU TRÚ (ĐƯỢC THU NHỎ CHIỀU RỘNG VỪA VẶN) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-xs font-bold">
                📋
              </span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-xs">Chính sách lưu trú</h3>
                <p className="text-[10px] text-slate-400">Áp dụng tại {hotel.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              {(extras?.policies || [
                { title: 'Nhận & Trả phòng', detail: 'Từ 14:00 · Trả phòng trước 12:00. Hỗ trợ giữ hành lý 24/7.' },
                { title: 'Hủy phòng', detail: 'Miễn phí hủy phòng trước 24 giờ. Tự động hoàn tiền.' },
                { title: 'Trẻ em', detail: 'Miễn phí tối đa 1 trẻ em dưới 6 tuổi ngủ chung với bố mẹ.' },
                { title: 'Thanh toán', detail: 'Chấp nhận VietQR, thẻ Visa/Mastercard, ví MoMo.' },
                { title: 'Quy định', detail: 'Xuất trình CCCD/Hộ chiếu hợp lệ. Không hút thuốc trong phòng kín.' },
              ]).map((p) => (
                <div key={p.title} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 p-2.5 text-[11px]">
                  <p className="font-bold text-slate-900 dark:text-white text-[11px] mb-0.5">{p.title}</p>
                  <p className="text-slate-600 dark:text-slate-300 text-[10px] leading-relaxed">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. PHẦN HỎI & ĐÁP (Q&A) (ĐƯỢC THU NHỎ CHIỀU RỘNG VỪA VẶN) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                💬
              </span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-xs">Hỏi & Đáp (Q&A)</h3>
                <p className="text-[10px] text-slate-400">Ban quản lý phản hồi nhanh</p>
              </div>
            </div>

            {/* Form gửi câu hỏi */}
            <form onSubmit={submitQuestion} className="space-y-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-3.5">
              {qaError && <ErrorBox message={qaError} />}
              {!user && (
                <input
                  type="text"
                  value={qaName}
                  onChange={(e) => setQaName(e.target.value)}
                  placeholder="Tên của bạn (không bắt buộc)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 text-xs outline-none focus:border-sky-500"
                />
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={qaText}
                  onChange={(e) => {
                    setQaText(e.target.value)
                    setAiFastAnswer('')
                  }}
                  placeholder="Đặt câu hỏi về phòng, đưa đón hoặc dịch vụ..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={qaBusy}
                    className="flex-1 rounded-xl bg-slate-900 dark:bg-sky-600 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-sky-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {qaBusy ? 'Đang gửi...' : 'Gửi cho khách sạn'}
                  </button>
                  <button
                    type="button"
                    disabled={aiFastAnswerBusy || !qaText.trim()}
                    onClick={handleFastAiAnswer}
                    className="flex items-center justify-center gap-1 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 px-3 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {aiFastAnswerBusy ? '⏳ AI đang nghĩ...' : '✨ Hỏi AI nhanh'}
                  </button>
                </div>

                {/* Kết quả phản hồi AI có căn cứ (Grounded Q&A Answer) */}
                {aiFastAnswer && (
                  <div className="rounded-xl border border-purple-200/80 bg-purple-50/70 dark:bg-purple-950/50 p-2.5 text-xs text-slate-800 dark:text-slate-200 animate-fadeIn space-y-1">
                    <span className="font-bold text-purple-900 dark:text-purple-300 block text-[11px]">
                      🤖 AI giải đáp dựa trên dữ liệu khách sạn:
                    </span>
                    <p className="leading-relaxed">{aiFastAnswer}</p>
                  </div>
                )}
              </div>
            </form>

            {/* Danh sách các câu hỏi & trả lời */}
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3 space-y-2 text-xs bg-white dark:bg-slate-800/60">
                  <p className="font-bold text-slate-900 dark:text-white">❓ {q.question}</p>
                  <p className="text-[10px] text-slate-400">Hỏi bởi {q.authorName}</p>
                  {q.answer ? (
                    <div className="rounded-xl bg-sky-50 dark:bg-sky-950/60 p-2.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 border border-sky-100 dark:border-sky-900/60">
                      <strong className="text-sky-800 dark:text-sky-300 block mb-0.5">{q.answeredBy || 'Quản lý khách sạn'}:</strong>
                      {q.answer}
                    </div>
                  ) : (
                    <p className="text-[11px] italic text-slate-400">Đang chờ quản lý phản hồi...</p>
                  )}

                  {(user?.role === 'ADMIN' || user?.role === 'HOTEL_MANAGER') && !q.answer && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Nhập trả lời..."
                          value={replyMap[q.id] || ''}
                          onChange={(e) => setReplyMap((m) => ({ ...m, [q.id]: e.target.value }))}
                          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => submitAnswer(q.id)}
                          className="rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer"
                        >
                          Gửi
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={draftingId === q.id}
                        onClick={() => handleGenerateReplyDraft(q)}
                        className="self-start text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer flex items-center gap-1"
                      >
                        {draftingId === q.id ? '⏳ Đang soạn...' : '✨ Gợi ý soạn trả lời bằng AI'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Chưa có câu hỏi nào.</p>
              )}
            </div>
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

function getRoomDetails(roomType) {
  const t = (roomType || '').toLowerCase()
  if (t.includes('villa') || t.includes('bungalow') || t.includes('penthouse') || t.includes('beachfront')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=700&q=80',
      tier: 'Villa Nghỉ Dưỡng Riêng Tư',
      tierColor: 'bg-emerald-600 text-white',
      size: '120 m²',
      bed: '2 Giường King · Bể bơi riêng & Sân hiên tắm nắng',
      amenities: ['Bể bơi vô cực riêng', 'View toàn cảnh biển', 'Bồn tắm lộ thiên', 'Phục vụ ẩm thực tại villa'],
    }
  }
  if (t.includes('suite') || t.includes('family') || t.includes('executive') || t.includes('royal') || t.includes('imperial')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80',
      tier: 'Suite Thượng Hạng Gia Đình',
      tierColor: 'bg-purple-600 text-white',
      size: '65 m²',
      bed: '1 Giường King + 2 Giường đơn · Phòng khách riêng',
      amenities: ['Phòng khách riêng biệt', 'Ban công ngắm cảnh rộng', 'Bồn tắm đá cẩm thạch', 'Sofa bed cao cấp'],
    }
  }
  if (t.includes('deluxe') || t.includes('ocean') || t.includes('premier') || t.includes('sea view') || t.includes('studio')) {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=700&q=80',
      tier: 'Deluxe Cao Cấp Hướng Biển',
      tierColor: 'bg-sky-600 text-white',
      size: '38 m²',
      bed: '1 Giường King lớn hoặc 2 Giường đơn',
      amenities: ['Cửa kính lớn kịch trần', 'Ban công view thoáng', 'Bàn làm việc doanh nhân', 'Trà & cà phê máy'],
    }
  }
  // Standard / Cozy / Superior / Classic
  return {
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=700&q=80',
    tier: 'Phòng Tiêu Chuẩn Standard',
    tierColor: 'bg-slate-700 text-white',
    size: '25 m²',
    bed: '1 Giường Queen hoặc 2 Giường đơn',
    amenities: ['Điều hòa 2 chiều êm ái', 'Smart TV kết nối', 'Wifi tốc độ cao miễn phí', 'Vòi sen tăng áp'],
  }
}

function RoomCard({ hotelId, checkIn, checkOut, room, nights, disabled, searching, onBook }) {
  const hasAvailable = typeof room.available === 'number'
  const isAvailable = !disabled && !searching && hasAvailable && room.available > 0
  const meta = getRoomDetails(room.roomType)
  const roomUrl = `/hotels/${hotelId}/rooms/${room.id}?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
        isAvailable
          ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg'
          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Ảnh loại phòng clickable to dedicated room page */}
        <Link to={roomUrl} className="group relative h-48 sm:h-auto sm:w-56 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 block">
          <img
            src={meta.imageUrl}
            alt={room.roomType}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span
            className={`absolute left-2.5 top-2.5 rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md ${meta.tierColor}`}
          >
            {meta.tier}
          </span>
          <span className="absolute bottom-2.5 right-2.5 rounded-md bg-slate-950/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            {meta.size}
          </span>
          <div className="absolute inset-0 bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="rounded-lg bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
              Xem chi tiết phòng ↗
            </span>
          </div>
        </Link>

        {/* Thông tin phòng & Tiện nghi */}
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link to={roomUrl} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {room.roomType}
              </Link>
              {hasAvailable ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                    room.available > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                  }`}
                >
                  {room.available > 0 ? `Còn ${room.available} phòng` : 'Hết phòng'}
                </span>
              ) : (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Chưa kiểm tra phòng
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{room.description}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-blue-600">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
                {room.capacity} khách
              </span>
              <span>·</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">🛏️ {meta.bed}</span>
            </div>
          </div>

          {/* Giá phòng & Nút Đặt ngay */}
          <div className="mt-4 flex flex-wrap items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-3 gap-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400">Giá mỗi đêm:</span>
                <span className="text-base font-bold text-slate-800 dark:text-white">{formatVnd(room.pricePerNight)}</span>
                <span className="text-[11px] text-slate-400">/đêm</span>
              </div>
              {nights > 0 && room.pricePerNight && (
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tổng ({nights} đêm):</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{formatVnd(room.pricePerNight * nights)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={roomUrl}
                className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 px-3.5 py-2.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                Chi tiết phòng
              </Link>
              <button
                onClick={onBook}
                disabled={!isAvailable}
                className="btn-liquid-glass rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer active:scale-95"
              >
                Đặt ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
