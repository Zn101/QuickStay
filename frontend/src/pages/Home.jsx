import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatMoney, todayIso, formatDateVi } from '../lib/format'
import { useSettings } from '../store/settingsStore'
import { HotelImage, Spinner, ErrorBox } from '../components/ui'

const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1800&q=85',
    thumb: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
    title: 'Amanoi Ocean Pool Villa',
    subtitle: 'Vịnh Vĩnh Hy, Ninh Thuận • Biệt thự hướng biển',
    city: 'Ninh Thuận',
    rating: '4.98',
    price: '12.500.000 ₫',
  },
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=85',
    thumb: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
    title: 'JW Marriott Emerald Bay',
    subtitle: 'Bãi Khem, Phú Quốc • Kiến trúc Pháp cổ điển',
    city: 'Phú Quốc',
    rating: '4.96',
    price: '7.800.000 ₫',
  },
  {
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1800&q=85',
    thumb: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
    title: 'Six Senses Ninh Vân Bay',
    subtitle: 'Nha Trang, Khánh Hòa • Khu nghỉ dưỡng biệt lập',
    city: 'Nha Trang',
    rating: '4.97',
    price: '10.200.000 ₫',
  },
  {
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=85',
    thumb: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
    title: 'InterContinental Sun Peninsula',
    subtitle: 'Bán đảo Sơn Trà, Đà Nẵng • Tuyệt tác nhiệt đới',
    city: 'Đà Nẵng',
    rating: '4.95',
    price: '8.900.000 ₫',
  },
]

const POPULAR_CITIES = [
  {
    name: 'Đà Nẵng',
    tagline: 'Thành phố biển đáng sống',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80',
    hotelsCount: '120+ khách sạn',
  },
  {
    name: 'Phú Quốc',
    tagline: 'Thiên đường đảo ngọc & biển xanh',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
    hotelsCount: '85+ resort biển',
  },
  {
    name: 'Nha Trang',
    tagline: 'Vịnh biển quyến rũ & rạn san hô',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    hotelsCount: '95+ khách sạn mặt biển',
  },
  {
    name: 'Đà Lạt',
    tagline: 'Sương mờ, đồi thông & biệt thự',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    hotelsCount: '110+ villa & homestay',
  },
  {
    name: 'Hà Nội',
    tagline: 'Nét đẹp ngàn năm văn hiến',
    image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=800&q=80',
    hotelsCount: '140+ khách sạn phố cổ',
  },
  {
    name: 'Hồ Chí Minh',
    tagline: 'Đô thị sầm uất & nhộn nhịp 24/7',
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80',
    hotelsCount: '180+ khách sạn trung tâm',
  },
  {
    name: 'Hội An',
    tagline: 'Phố cổ lung linh hoa đăng ven sông',
    image: 'https://images.unsplash.com/photo-1558005530-a7958896ec60?auto=format&fit=crop&w=900&q=80',
    hotelsCount: '70+ boutique & homestay',
  },
  {
    name: 'Huế',
    tagline: 'Cố đô di sản & sông Hương thơ mộng',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    hotelsCount: '60+ khách sạn cung đình',
  },
]

const PROMO_DEALS = [
  {
    id: 1,
    tag: '⚡ FLASH SALE 24H',
    title: 'Giảm 35% Resort Phú Quốc & Nha Trang',
    desc: 'Áp dụng cho phòng Deluxe view biển & Villa riêng tư.',
    code: 'BEACH35',
    discount: '-35%',
    badge: 'Còn 05:42:19',
    badgeColor: 'bg-rose-500 text-white animate-pulse',
    border: 'border-rose-200/90 hover:border-rose-400',
    bg: 'from-rose-500/10 via-amber-500/5 to-white',
  },
  {
    id: 2,
    tag: '🎁 THÀNH VIÊN MỚI',
    title: 'Voucher 20% cho lần đặt đầu tiên',
    desc: 'Áp dụng ngay cho mọi khách sạn trên toàn quốc.',
    code: 'QUICKSTAY20',
    discount: '-20%',
    badge: 'Đặc quyền',
    badgeColor: 'bg-emerald-600 text-white',
    border: 'border-emerald-200/90 hover:border-emerald-400',
    bg: 'from-emerald-500/10 via-teal-500/5 to-white',
  },
  {
    id: 3,
    tag: '🌅 ĐẶT PHÒNG SỚM',
    title: 'Tặng Buffet sáng & Đón sân bay miễn phí',
    desc: 'Đặt trước 15 ngày tại Đà Nẵng, Phú Quốc, Hà Nội.',
    code: 'EARLYBIRD',
    discount: 'FREE 100%',
    badge: 'Bao gồm xe đưa đón',
    badgeColor: 'bg-sky-600 text-white',
    border: 'border-sky-200/90 hover:border-sky-400',
    bg: 'from-sky-500/10 via-blue-500/5 to-white',
  },
  {
    id: 4,
    tag: '🌲 WEEKEND ĐÀ LẠT',
    title: 'Giảm 25% các Villa view đồi thông',
    desc: 'Tận hưởng khí hậu se lạnh và tiệc BBQ ấm cúng.',
    code: 'DALAT25',
    discount: '-25%',
    badge: 'Cuối tuần T6-CN',
    badgeColor: 'bg-purple-600 text-white',
    border: 'border-purple-200/90 hover:border-purple-400',
    bg: 'from-purple-500/10 via-indigo-500/5 to-white',
  },
  {
    id: 5,
    tag: '💼 CÔNG TÁC & DOANH NGHIỆP',
    title: 'Giảm 18% + Xuất VAT điện tử tức thì',
    desc: 'Dành cho khách công tác tại trung tâm Quận 1 & Hoàn Kiếm.',
    code: 'BIZSTAY',
    discount: '-18%',
    badge: 'Hóa đơn trong ngày',
    badgeColor: 'bg-slate-800 text-white',
    border: 'border-slate-300 hover:border-slate-500',
    bg: 'from-slate-500/10 via-slate-600/5 to-white',
  },
  {
    id: 6,
    tag: '⏳ GIỜ CHÓT HÔM NAY',
    title: 'Giảm thêm 15% khi nhận phòng hôm nay',
    desc: 'Dành cho chuyến đi ngẫu hứng, xác nhận phòng tức thì.',
    code: 'LAST15',
    discount: '-15%',
    badge: 'Xác nhận ngay',
    badgeColor: 'bg-orange-500 text-white',
    border: 'border-orange-200/90 hover:border-orange-400',
    bg: 'from-orange-500/10 via-amber-500/5 to-white',
  },
]

const QUICK_CITIES = ['Đà Nẵng', 'Phú Quốc', 'Nha Trang', 'Đà Lạt', 'Hà Nội', 'Hồ Chí Minh']

export default function Home() {
  const { currencyDisplay } = useSettings()
  const [hotels, setHotels] = useState([])
  const [roomTypes, setRoomTypes] = useState(['Standard', 'Deluxe', 'Family Suite'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [roomType, setRoomType] = useState(searchParams.get('roomType') || '')
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '')
  const [activeSlide, setActiveSlide] = useState(0)

  // States bổ sung cho UI mới
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false)
  const [showAllCities, setShowAllCities] = useState(false)
  const [copiedCoupon, setCopiedCoupon] = useState('')

  function copyCoupon(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {})
    }
    setCopiedCoupon(code)
    setTimeout(() => setCopiedCoupon(''), 3000)
  }

  function applyDatePreset(daysAhead, stayNights = 1) {
    const today = new Date()
    const inD = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysAhead)
    const outD = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysAhead + stayNights)
    const pad = (n) => String(n).padStart(2, '0')
    const inIso = `${inD.getFullYear()}-${pad(inD.getMonth() + 1)}-${pad(inD.getDate())}`
    const outIso = `${outD.getFullYear()}-${pad(outD.getMonth() + 1)}-${pad(outD.getDate())}`
    setCheckIn(inIso)
    setCheckOut(outIso)
    setError('')
  }

  useEffect(() => {
    api('/hotels/room-types')
      .then((list) => {
        if (Array.isArray(list) && list.length > 0 && typeof list[0] === 'string') {
          setRoomTypes(list)
        }
      })
      .catch(() => {})
  }, [])

  // Tự động chuyển slide ảnh nền Hero mỗi 5.5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  // Đồng bộ state input khi URL searchParams thay đổi
  useEffect(() => {
    const currentQ = searchParams.get('q') || ''
    const currentCity = searchParams.get('city') || ''
    const currentRoomType = searchParams.get('roomType') || ''
    const currentCheckIn = searchParams.get('checkIn') || ''
    const currentCheckOut = searchParams.get('checkOut') || ''
    setQ(currentQ)
    setCity(currentCity)
    setRoomType(currentRoomType)
    setCheckIn(currentCheckIn)
    setCheckOut(currentCheckOut)

    setLoading(true)
    setError('')
    const params = {}
    if (currentQ) params.q = currentQ
    if (currentCity) params.city = currentCity
    if (currentRoomType) params.roomType = currentRoomType
    if (currentCheckIn && currentCheckOut) {
      params.checkIn = currentCheckIn
      params.checkOut = currentCheckOut
    }

    api('/hotels', { params })
      .then((res) => setHotels(Array.isArray(res) ? res : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [searchParams])

  function handleSearch(e) {
    e.preventDefault()
    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      setError('Vui lòng chọn cả ngày nhận và ngày trả phòng để lọc phòng trống.')
      return
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      setError('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.')
      return
    }
    setError('')
    const p = {}
    if (q.trim()) p.q = q.trim()
    if (city.trim()) p.city = city.trim()
    if (roomType) p.roomType = roomType
    if (checkIn && checkOut) {
      p.checkIn = checkIn
      p.checkOut = checkOut
    }
    setSearchParams(p)
  }

  function selectQuickCity(selectedCity) {
    setCity(selectedCity)
    const p = {}
    if (q.trim()) p.q = q.trim()
    if (selectedCity) p.city = selectedCity
    if (roomType) p.roomType = roomType
    if (checkIn && checkOut) {
      p.checkIn = checkIn
      p.checkOut = checkOut
    }
    setSearchParams(p)
  }

  function clearFilters() {
    setQ('')
    setCity('')
    setRoomType('')
    setCheckIn('')
    setCheckOut('')
    setError('')
    setSearchParams({})
  }

  const currentSlide = HERO_SLIDES[activeSlide]
  const isFiltering = Boolean(
    searchParams.get('q') ||
      searchParams.get('city') ||
      searchParams.get('roomType') ||
      (searchParams.get('checkIn') && searchParams.get('checkOut')),
  )

  return (
    <div className="min-h-screen bg-[#f4f9fd]">
      {/* CSS Keyframes cho hiệu ứng chuyển động sống động */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.4deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-0.4deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(14, 165, 233, 0.25); }
          50% { box-shadow: 0 0 35px rgba(6, 182, 212, 0.5); }
        }
        .animate-float-slow { animation: floatSlow 7s ease-in-out infinite; }
        .animate-float-reverse { animation: floatReverse 6s ease-in-out 1s infinite; }
        .animate-glow-pulse { animation: glowPulse 4s ease-in-out infinite; }
      `}</style>

      {/* HERO SECTION VỚI SLIDESHOW CHUYỂN ĐỘNG & FLOATING CARDS */}
      <section className="relative overflow-hidden bg-[#061826] px-4 py-16 text-white sm:px-6 lg:py-20">
        {/* Background Slideshow với hiệu ứng Ken Burns Zoom */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeSlide
          return (
            <div
              key={slide.url}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'z-0 opacity-100' : '-z-10 opacity-0'
              }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className={`h-full w-full object-cover transition-transform duration-[9000ms] ease-out ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
              />
            </div>
          )
        })}

        {/* Lớp phủ Gradient xanh biển sâu */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#04121d]/95 via-[#072134]/85 to-[#061826]/75" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#04121d] via-transparent to-[#04121d]/40" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
            {/* Cột trái: Tiêu đề + Thanh tìm kiếm nâng cao */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-slate-900/60 px-4 py-2 text-xs font-semibold tracking-wide text-cyan-200 backdrop-blur-md shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                Hơn 500+ khách sạn & khu nghỉ dưỡng cao cấp khắp Việt Nam
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[54px]">
                Mỗi chuyến đi,
                <br />
                <span className="bg-gradient-to-r from-sky-200 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                  một trải nghiệm
                </span>{' '}
                đáng nhớ.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200/90 sm:text-base">
                Khám phá nơi lưu trú phù hợp, đặt phòng nhanh chóng với mức giá ưu đãi nhất và tận hưởng hành trình trọn vẹn theo cách của bạn.
              </p>

              {/* Thanh Tìm Kiếm Glassmorphism với Custom UI */}
              <form
                onSubmit={handleSearch}
                className="mt-7 rounded-2xl border border-white/25 bg-white/10 p-3 sm:p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              >
                {/* Hàng 1: Từ khóa tìm kiếm & Tên thành phố */}
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <div className="relative flex-1">
                    <svg
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Tên khách sạn, resort, biệt thự..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  <div className="relative sm:w-56">
                    <svg
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Thành phố / Điểm đến..."
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/40 transition-all hover:from-sky-400 hover:to-sky-500 active:scale-[0.99] cursor-pointer"
                  >
                    <span>Tìm kiếm</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </button>
                </div>

                {/* Hàng 2: Bộ chọn Ngày & Hạng phòng với Giao diện Custom UI độc quyền */}
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  {/* Custom Date Pickers: Ngày nhận & Ngày trả phòng */}
                  <div className="sm:col-span-8 flex flex-col sm:flex-row items-center gap-2 rounded-xl bg-white p-2 text-slate-900 shadow-sm border border-slate-100">
                    {/* Thẻ Chọn Ngày Nhận */}
                    <div
                      onClick={() => {
                        const el = document.getElementById('home-checkin')
                        if (el) {
                          if (typeof el.showPicker === 'function') el.showPicker()
                          else el.focus()
                        }
                      }}
                      className="w-full sm:w-1/2 flex items-center gap-3 rounded-lg p-2 hover:bg-sky-50/70 transition-colors cursor-pointer group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Ngày nhận phòng
                        </span>
                        <span className="block text-xs font-bold text-slate-900 truncate">
                          {checkIn ? formatDateVi(checkIn) : 'Chọn ngày nhận'}
                        </span>
                      </div>
                      <input
                        id="home-checkin"
                        type="date"
                        min={todayIso()}
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="sr-only"
                        aria-label="Ngày nhận phòng"
                      />
                    </div>

                    {/* Mũi tên ngăn cách / Số đêm */}
                    <div className="hidden sm:flex items-center justify-center px-1 text-slate-300">
                      <span className="text-xs">→</span>
                    </div>

                    {/* Thẻ Chọn Ngày Trả */}
                    <div
                      onClick={() => {
                        const el = document.getElementById('home-checkout')
                        if (el) {
                          if (typeof el.showPicker === 'function') el.showPicker()
                          else el.focus()
                        }
                      }}
                      className="w-full sm:w-1/2 flex items-center gap-3 rounded-lg p-2 hover:bg-sky-50/70 transition-colors cursor-pointer group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Ngày trả phòng
                        </span>
                        <span className="block text-xs font-bold text-slate-900 truncate">
                          {checkOut ? formatDateVi(checkOut) : 'Chọn ngày trả'}
                        </span>
                      </div>
                      <input
                        id="home-checkout"
                        type="date"
                        min={checkIn || todayIso()}
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="sr-only"
                        aria-label="Ngày trả phòng"
                      />
                    </div>
                  </div>

                  {/* Custom Room Type Selector (Thay thế hoàn toàn thẻ select cơ bản) */}
                  <div className="relative sm:col-span-4">
                    <button
                      type="button"
                      onClick={() => setRoomDropdownOpen((v) => !v)}
                      className="w-full flex items-center justify-between rounded-xl bg-white p-2.5 px-3 text-left shadow-sm border border-slate-100 hover:border-sky-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                          🛏️
                        </span>
                        <div className="truncate">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Loại phòng
                          </span>
                          <span className="block text-xs font-bold text-slate-900 truncate">
                            {roomType || 'Tất cả loại phòng'}
                          </span>
                        </div>
                      </div>
                      <svg
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                          roomDropdownOpen ? 'rotate-180 text-sky-600' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Menu Popover Custom cho Hạng phòng */}
                    {roomDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Chọn hạng phòng phù hợp:
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRoomType('')
                            setRoomDropdownOpen(false)
                          }}
                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                            !roomType ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>🏢</span>
                            <span>Tất cả loại phòng</span>
                          </span>
                          {!roomType && <span className="text-sky-600 font-bold">✓</span>}
                        </button>

                        {roomTypes.map((rt) => {
                          const isSel = roomType === rt
                          const icon =
                            rt.toLowerCase().includes('suite')
                              ? '👨‍👩‍👧‍👦'
                              : rt.toLowerCase().includes('deluxe')
                              ? '✨'
                              : rt.toLowerCase().includes('villa')
                              ? '🏖️'
                              : '🛏️'
                          return (
                            <button
                              key={rt}
                              type="button"
                              onClick={() => {
                                setRoomType(rt)
                                setRoomDropdownOpen(false)
                              }}
                              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                                isSel ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span>{icon}</span>
                                <span>{rt}</span>
                              </span>
                              {isSel && <span className="text-sky-600 font-bold">✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Các nút chọn ngày nhanh tiện ích */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 px-1">
                  <span className="text-[11px] font-medium text-slate-300">Chọn nhanh ngày:</span>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(0, 1)}
                    className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-200 hover:bg-white/20 transition-colors"
                  >
                    Hôm nay (1 đêm)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(1, 1)}
                    className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-200 hover:bg-white/20 transition-colors"
                  >
                    Ngày mai (1 đêm)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(2, 2)}
                    className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-200 hover:bg-white/20 transition-colors"
                  >
                    Cuối tuần này (2 đêm)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(0, 3)}
                    className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-200 hover:bg-white/20 transition-colors"
                  >
                    Kỳ nghỉ 3 đêm
                  </button>
                </div>

                {/* Các nút chọn nhanh thành phố */}
                <div className="mt-3 flex flex-wrap items-center gap-2 px-1 pt-2 border-t border-white/10">
                  <span className="text-xs font-medium text-slate-300">Điểm đến phổ biến:</span>
                  {QUICK_CITIES.map((item) => {
                    const active = city.toLowerCase() === item.toLowerCase()
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => selectQuickCity(active ? '' : item)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                          active
                            ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
                            : 'bg-white/10 text-slate-200 hover:bg-white/20'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
              </form>
            </div>

            {/* Cột phải: KHUNG ẢNH NỔI BẬT (Ảnh thu nhỏ vừa vặn, thanh lịch) */}
            <div className="relative hidden lg:block w-full">
              <div className="relative mx-auto max-w-lg pb-2">
                {/* Khung ảnh động chính với hiệu ứng Presentation */}
                <div className="animate-presentation-float relative overflow-hidden rounded-[28px] border border-white/25 bg-slate-900/60 p-3 shadow-2xl backdrop-blur-md">
                  <div className="relative h-[340px] sm:h-[370px] overflow-hidden rounded-2xl">
                    <img
                      key={currentSlide.url}
                      src={currentSlide.url}
                      alt={currentSlide.title}
                      className="h-full w-full object-cover transition-all duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                    {/* Badge góc trái trên: Đánh giá */}
                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-md border border-white/15">
                      <span className="text-amber-400">★ {currentSlide.rating}</span>
                      <span>·</span>
                      <span className="text-slate-200">Tuyệt hảo</span>
                    </div>

                    {/* Badge góc phải trên: Độc quyền */}
                    <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-rose-600/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-md shadow-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      <span>Được đặt nhiều nhất</span>
                    </div>

                    {/* Khối thông tin góc dưới ảnh */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 tracking-wide uppercase">
                          📍 {currentSlide.city}
                        </span>
                        <p className="text-lg sm:text-xl font-black text-white drop-shadow-md leading-snug">
                          {currentSlide.title}
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{currentSlide.subtitle}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block text-[11px] text-slate-400">Giá phòng từ</span>
                        <span className="inline-block rounded-xl bg-white px-3 py-1 text-sm font-extrabold text-slate-900 shadow-lg">
                          {currentSlide.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KHAY KHUYẾN MÃI & FLASH SALE (BOOKING SALES TRAY) - NỀN ĐEN GLASSMORPHISM CÙNG STYLE ĐẶC QUYỀN */}
      <section className="relative z-20 mx-auto -mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/20 bg-slate-950/90 py-3.5 px-4 sm:px-6 shadow-2xl backdrop-blur-xl text-white">
          <div className="mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 text-rose-400 text-sm font-bold border border-rose-500/30">
                🔥
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                    Ưu Đãi Đặc Quyền & Voucher Giờ Chót
                  </h2>
                  <span className="hidden sm:inline-flex rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Tiết kiệm tới 30%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">Nhập mã ưu đãi độc quyền khi đặt phòng · Áp dụng tức thì</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>✓ Đưa đón sân bay & Buffet sáng</span>
            </div>
          </div>

          {/* Dải Khay Ưu Đãi Kéo Ngang (Horizontal Scroll Tray) */}
          <div className="flex gap-3 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
            {PROMO_DEALS.map((deal) => (
              <div
                key={deal.id}
                className="flex-none w-64 sm:w-72 rounded-2xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.14] p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-cyan-400/40 backdrop-blur-md flex flex-col justify-between shimmer-card"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                    {deal.tag}
                  </span>
                  <span className="rounded-full bg-emerald-400/20 border border-emerald-400/30 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                    {deal.badge}
                  </span>
                </div>

                <div className="my-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-rose-400 tracking-tight">{deal.discount}</span>
                    <h3 className="text-xs font-bold text-white line-clamp-1">{deal.title}</h3>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-300 line-clamp-1 leading-snug">{deal.desc}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase">Mã:</span>
                    <span className="rounded-lg bg-black/70 px-2 py-0.5 font-mono text-[11px] font-black text-cyan-300 border border-cyan-400/30 shadow-inner">
                      {deal.code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyCoupon(deal.code)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1 text-[11px] font-bold text-white transition-all cursor-pointer border border-white/20 active:scale-95 shadow-2xs"
                  >
                    {copiedCoupon === deal.code ? (
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        ✓ Đã chép
                      </span>
                    ) : (
                      <span>Sao chép mã</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DẢI TIỆN ÍCH PRESENTATION EYE-CANDY VỚI CÁC ICON WEB CHUYÊN NGHIỆP */}
      <section className="mx-auto mt-7 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4.5">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 backdrop-blur-sm shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md shimmer-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Xác nhận tức thì</p>
              <p className="text-[10px] text-slate-500">Giữ phòng trong 30 giây</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 backdrop-blur-sm shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md shimmer-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Cam kết giá tốt</p>
              <p className="text-[10px] text-slate-500">Hoàn tiền chênh lệch 100%</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 backdrop-blur-sm shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md shimmer-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Hỗ trợ 24/7</p>
              <p className="text-[10px] text-slate-500">Đội ngũ CSKH chuyên nghiệp</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 backdrop-blur-sm shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md shimmer-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V4a2 2 0 10-2 2h2zm0 13a2 2 0 100-4 2 2 0 000 4zm0 0a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Đặc quyền QuickStay</p>
              <p className="text-[10px] text-slate-500">Tích điểm & Ưu đãi xe đưa đón</p>
            </div>
          </div>
        </div>
      </section>

      {/* ĐIỂM ĐẾN YÊU THÍCH (CÓ KHOẢNG CÁCH RÕ RÀNG GIỮA CÁC Ô ĐIỂM ĐẾN, KHÔNG DÍNH NHAU) */}
      {!isFiltering && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0284c7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0284c7] animate-pulse" />
                Khám phá Việt Nam
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Điểm đến được yêu thích nhất
              </h2>
            </div>
            <p className="text-xs text-slate-500 sm:text-sm">
              Chọn điểm đến để xem các khách sạn và ưu đãi tốt nhất ngay lập tức
            </p>
          </div>

          {/* Grid điểm đến: KHOẢNG CÁCH RỘNG RÃI (gap-6 sm:gap-7 lg:gap-8) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
            {(showAllCities ? POPULAR_CITIES : POPULAR_CITIES.slice(0, 4)).map((dest) => (
              <button
                key={dest.name}
                type="button"
                onClick={() => selectQuickCity(dest.name)}
                className="group relative h-64 overflow-hidden rounded-3xl text-left shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer shimmer-card"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent transition-opacity duration-300 group-hover:opacity-95" />

                <div className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#0284c7]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M7 17 17 7M7 7h10v10" />
                  </svg>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block rounded-md bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white mb-1.5 border border-white/20">
                    {dest.hotelsCount}
                  </span>
                  <p className="text-xs font-medium text-sky-200 line-clamp-1">{dest.tagline}</p>
                  <h3 className="text-xl font-extrabold text-white">{dest.name}</h3>
                </div>
              </button>
            ))}
          </div>

          {/* Nút Xem Thêm / Thu Gọn Điểm Đến */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowAllCities((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-6 py-2.5 text-xs sm:text-sm font-bold text-sky-700 shadow-sm hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer active:scale-95"
            >
              <span>
                {showAllCities
                  ? 'Thu gọn điểm đến ↑'
                  : 'Xem thêm 4 điểm đến hấp dẫn khác (Hà Nội, TP.HCM, Hội An, Huế) ↓'}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* DANH SÁCH KHÁCH SẠN */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {isFiltering && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <div>
                <p className="text-sm text-slate-600">
                  Kết quả tìm kiếm cho{' '}
                  <span className="font-bold text-slate-900">
                    "
                    {[
                      searchParams.get('q'),
                      searchParams.get('city'),
                      searchParams.get('roomType'),
                      searchParams.get('checkIn') && searchParams.get('checkOut')
                        ? `${searchParams.get('checkIn')} → ${searchParams.get('checkOut')}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                    "
                  </span>
                </p>
                <p className="text-xs text-slate-400">Tìm thấy {hotels.length} nơi lưu trú phù hợp</p>
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <span>✕ Xóa bộ lọc</span>
            </button>
          </div>
        )}

        {loading && <Spinner text="Đang tải danh sách khách sạn..." />}
        {error && <ErrorBox message={error} />}

        {!loading && !error && hotels.length === 0 && (
          <div className="rounded-3xl border border-slate-100 bg-white py-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-[#0284c7]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
                <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
                <path d="M9 21v-7h6v7" />
              </svg>
            </div>
            <p className="text-lg font-extrabold text-slate-800">Không tìm thấy khách sạn phù hợp</p>
            <p className="mt-1 text-sm text-slate-500">
              Thử thay đổi từ khóa hoặc khám phá các thành phố khác xem sao nhé.
            </p>
            {isFiltering && (
              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-[#0284c7] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#0369a1]"
              >
                Xem tất cả khách sạn
              </button>
            )}
          </div>
        )}

        {!loading && !error && hotels.length > 0 && (
          <>
            {!isFiltering && (
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0284c7]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0284c7]" />
                    Được đề xuất cho bạn
                  </span>
                  <h2 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                    Khách sạn & Resort nổi bật
                  </h2>
                </div>
                <span className="hidden text-xs font-semibold text-slate-400 sm:inline">
                  Hiển thị {hotels.length} chỗ nghỉ
                </span>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {hotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  checkIn={searchParams.get('checkIn')}
                  checkOut={searchParams.get('checkOut')}
                  currency={currencyDisplay}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function HotelCard({ hotel, checkIn, checkOut, currency }) {
  const amenityList = hotel.amenities
    ? hotel.amenities
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3)
    : []

  const detailUrl =
    checkIn && checkOut
      ? `/hotels/${hotel.id}?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
      : `/hotels/${hotel.id}`

  return (
    <Link
      to={detailUrl}
      className="group flex flex-col overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-[0_10px_30px_-15px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_22px_50px_-15px_rgba(2,132,199,0.18)]"
    >
      {/* Khung ảnh khách sạn với hiệu ứng zoom mượt */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <HotelImage
          src={hotel.imageUrl}
          alt={hotel.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/20" />

        {/* Huy hiệu Thành phố */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-md">
          <svg className="h-3.5 w-3.5 text-[#0284c7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span>{hotel.city}</span>
        </div>

        {/* Huy hiệu Đánh giá góc trên */}
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/60 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md">
          <span>★</span>
          <span>{hotel.rating || '4.9'}</span>
        </div>
      </div>

      {/* Nội dung thông tin khách sạn */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-base font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#0284c7]">
          {hotel.name}
        </h3>

        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{hotel.address}</p>

        {/* Tiện ích dạng Tag nhỏ */}
        {amenityList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {amenityList.map((item) => (
              <span
                key={item}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Giá & Nút Xem chi tiết */}
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-[11px] font-medium text-slate-400">Giá mỗi đêm từ</p>
            <p className="text-lg font-extrabold text-[#0284c7]">
              {formatMoney(hotel.minPrice, currency)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-xl bg-sky-50 px-3.5 py-2 text-xs font-bold text-[#0284c7] transition-all duration-200 group-hover:bg-[#0284c7] group-hover:text-white group-hover:shadow-md group-hover:shadow-sky-500/20">
            Xem phòng
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}