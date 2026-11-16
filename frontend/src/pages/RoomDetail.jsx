import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, todayIso, nightsBetween, formatDateVi } from '../lib/format'
import { Spinner, ErrorBox, HotelImage } from '../components/ui'
import { useTranslation } from '../lib/i18n'
import { useAuth } from '../store/authStore'

// Multi-photo galleries tailored by room category
const ROOM_GALLERIES = {
  villa: [
    { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=85', caption: 'Bể bơi vô cực & Sân hiên riêng biệt' },
    { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', caption: 'Không gian phòng ngủ Master King' },
    { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', caption: 'Phòng tắm cẩm thạch bồn tắm lộ thiên' },
    { url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80', caption: 'Phòng khách mở đón gió biển' },
  ],
  suite: [
    { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85', caption: 'Phòng ngủ gia đình cao cấp' },
    { url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80', caption: 'Khu vực tiếp khách & Bàn làm việc' },
    { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', caption: 'Phòng tắm vách kính vòi sen tăng áp' },
    { url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', caption: 'Ban công ngắm cảnh thành phố' },
  ],
  deluxe: [
    { url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=85', caption: 'Phòng Deluxe Hướng biển thoáng đãng' },
    { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', caption: 'Giường đệm lò xo cao cấp King Size' },
    { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', caption: 'Phòng tắm tiện nghi đồ dùng cao cấp' },
    { url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', caption: 'Góc thư giãn trà & cà phê' },
  ],
  standard: [
    { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=85', caption: 'Phòng Standard tiêu chuẩn ấm cúng' },
    { url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', caption: 'Không gian nghỉ ngơi yên tĩnh' },
    { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', caption: 'Vòi sen sảng khoái' },
    { url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80', caption: 'Bàn làm việc và Smart TV' },
  ],
}

function getGalleryForRoom(roomType) {
  const t = (roomType || '').toLowerCase()
  if (t.includes('villa') || t.includes('bungalow') || t.includes('beachfront')) return ROOM_GALLERIES.villa
  if (t.includes('suite') || t.includes('family') || t.includes('executive')) return ROOM_GALLERIES.suite
  if (t.includes('deluxe') || t.includes('ocean') || t.includes('premier')) return ROOM_GALLERIES.deluxe
  return ROOM_GALLERIES.standard
}

export default function RoomDetail() {
  const { hotelId, roomId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()

  const [hotel, setHotel] = useState(null)
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const paramIn = searchParams.get('checkIn')
  const paramOut = searchParams.get('checkOut')
  const [checkIn, setCheckIn] = useState(paramIn || todayIso(1))
  const [checkOut, setCheckOut] = useState(paramOut || todayIso(2))
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      api(`/hotels/${hotelId}`),
      api(`/hotels/${hotelId}/rooms`, {
        params: checkIn && checkOut ? { checkIn, checkOut } : undefined,
      }),
    ])
      .then(([h, rooms]) => {
        setHotel(h)
        const target = (rooms || []).find((r) => String(r.id) === String(roomId))
        if (!target) {
          setError('Không tìm thấy thông tin hạng phòng này.')
        } else {
          setRoom(target)
        }
      })
      .catch((err) => setError(err.message || 'Lỗi tải dữ liệu phòng.'))
      .finally(() => setLoading(false))
  }, [hotelId, roomId, checkIn, checkOut])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Spinner text="Đang tải thông tin hạng phòng cao cấp..." />
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <ErrorBox message={error || 'Phòng không tồn tại'} />
        <Link
          to={`/hotels/${hotelId}`}
          className="btn-liquid-glass mt-6 inline-block rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm"
        >
          {t('room_back_hotel')}
        </Link>
      </div>
    )
  }

  const gallery = getGalleryForRoom(room.roomType)
  const nights = nightsBetween(checkIn, checkOut)
  const totalPrice = nights > 0 ? room.pricePerNight * nights : room.pricePerNight
  const isAvailable = typeof room.available === 'number' ? room.available > 0 : true

  function proceedToBooking() {
    navigate(
      `/hotels/${hotelId}/rooms/${roomId}/book?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`,
      { state: { hotel, room, checkIn, checkOut } }
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-main)] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-8 animate-popup-in">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {t('nav_home')}
          </Link>
          <span>/</span>
          <Link to={`/hotels/${hotelId}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {hotel?.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">{room.roomType}</span>
        </div>

        {/* Header Title & Badges */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                ⭐ Hạng phòng nổi bật
              </span>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                {isAvailable ? `Còn ${room.available ?? 3} phòng trống` : 'Hết phòng'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {room.roomType}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {hotel?.name} · {hotel?.address}, {hotel?.city}
            </p>
          </div>

          <div className="text-left md:text-right shrink-0">
            <span className="text-xs text-slate-400 block">{t('price_per_night_from')}</span>
            <div className="flex items-baseline md:justify-end gap-1.5">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {formatVnd(room.pricePerNight)}
              </span>
              <span className="text-xs text-slate-500 font-bold">/ đêm</span>
            </div>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 relative h-[340px] sm:h-[440px] overflow-hidden rounded-3xl bg-slate-900 shadow-card">
            <img
              src={gallery[activePhotoIdx]?.url || gallery[0].url}
              alt={gallery[activePhotoIdx]?.caption}
              className="h-full w-full object-cover transition-all duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold backdrop-blur-md bg-slate-950/40 p-3 rounded-2xl border border-white/10">
              <span>{gallery[activePhotoIdx]?.caption}</span>
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px]">
                {activePhotoIdx + 1} / {gallery.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {gallery.map((photo, idx) => (
              <button
                key={photo.url}
                type="button"
                onClick={() => setActivePhotoIdx(idx)}
                className={`group relative h-28 sm:h-32 lg:h-[98px] overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
                  activePhotoIdx === idx
                    ? 'border-blue-600 shadow-md ring-2 ring-blue-500/30'
                    : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content Layout: Left Specs & Perks, Right Booking Sticky Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            {/* Room Specifications Bento Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-card space-y-6">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t('room_specs')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 p-4 border border-blue-100/60 dark:border-slate-700/60">
                  <span className="text-xl">👥</span>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sức chứa</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">{room.capacity} Khách</p>
                </div>
                <div className="rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 p-4 border border-blue-100/60 dark:border-slate-700/60">
                  <span className="text-xl">📐</span>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Diện tích</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">45 - 65 m²</p>
                </div>
                <div className="rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 p-4 border border-blue-100/60 dark:border-slate-700/60">
                  <span className="text-xl">🛏️</span>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Giường ngủ</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">King Size</p>
                </div>
                <div className="rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 p-4 border border-blue-100/60 dark:border-slate-700/60">
                  <span className="text-xl">🌅</span>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Tầm nhìn</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">View thoáng đãng</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Mô tả phòng</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {room.description ||
                    'Phòng nghỉ được thiết kế tinh tế với sàn gỗ cao cấp, cửa kính lớn kịch trần đón ánh sáng tự nhiên, bàn làm việc doanh nhân và phòng tắm đá cẩm thạch sang trọng.'}
                </p>
              </div>
            </div>

            {/* Why Guests Love This Room (Upsell Highlights) */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-card space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t('room_features_title')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Miễn phí hủy phòng', desc: 'Linh hoạt hủy phòng miễn phí trước 24 giờ nhận phòng.', icon: '🛡️' },
                  { title: 'Buffet sáng hảo hạng', desc: 'Lựa chọn bao gồm bữa sáng Á - Âu đa dạng mỗi ngày.', icon: '🍳' },
                  { title: 'Nước suối, trà & cà phê máy', desc: 'Máy pha cà phê viên nén phục vụ tại phòng 24/7.', icon: '☕' },
                  { title: 'Phòng tắm bồn & vòi sen', desc: 'Bồn tắm ngâm thư giãn cùng bộ đồ dùng hữu cơ cao cấp.', icon: '🛁' },
                  { title: 'Wifi tốc độ cao không giới hạn', desc: 'Đường truyền cáp quang riêng biệt đáp ứng làm việc trực tuyến.', icon: '📶' },
                  { title: 'Hỗ trợ đưa đón sân bay', desc: 'Dịch vụ đón tiễn chuẩn giờ với xe du lịch cao cấp.', icon: '🚗' },
                ].map((perk) => (
                  <div key={perk.title} className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-700">
                    <span className="text-2xl shrink-0">{perk.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{perk.title}</h4>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Booking Summary & Action Box */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card space-y-5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {t('booking_summary')}
              </h3>

              {/* Date pickers */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    {t('search_checkin_label')}
                  </label>
                  <input
                    type="date"
                    min={todayIso()}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    {t('search_checkout_label')}
                  </label>
                  <input
                    type="date"
                    min={checkIn || todayIso(1)}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Price Calculation breakdown */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{formatVnd(room.pricePerNight)} x {nights > 0 ? nights : 1} đêm</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatVnd(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Phí dịch vụ & Thuế VAT (8%)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã bao gồm</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{t('booking_total')}</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatVnd(totalPrice)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={proceedToBooking}
                disabled={!isAvailable}
                className="btn-liquid-glass w-full rounded-2xl py-3.5 text-center text-sm font-bold text-white shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAvailable ? 'Tiến hành đặt phòng này →' : 'Hết phòng'}
              </button>

              <Link
                to={`/hotels/${hotelId}`}
                className="block text-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors pt-1"
              >
                {t('room_back_hotel')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
