import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatMoney, todayIso } from '../lib/format'
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
    span: 'sm:col-span-2 lg:col-span-2',
  },
  {
    name: 'Phú Quốc',
    tagline: 'Thiên đường đảo ngọc',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
    span: 'sm:col-span-1 lg:col-span-1',
  },
  {
    name: 'Nha Trang',
    tagline: 'Vịnh biển xanh quyến rũ',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    span: 'sm:col-span-1 lg:col-span-1',
  },
  {
    name: 'Đà Lạt',
    tagline: 'Sương mờ & rừng thông',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    span: 'sm:col-span-1 lg:col-span-1',
  },
  {
    name: 'Hà Nội',
    tagline: 'Nét đẹp ngàn năm văn hiến',
    image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=800&q=80',
    span: 'sm:col-span-1 lg:col-span-1',
  },
  {
    name: 'Hội An',
    tagline: 'Phố cổ lung linh đèn lồng',
    image: 'https://images.unsplash.com/photo-1558005530-a7958896ec60?auto=format&fit=crop&w=900&q=80',
    span: 'sm:col-span-2 lg:col-span-2',
  },
]

const QUICK_CITIES = ['Đà Nẵng', 'Phú Quốc', 'Nha Trang', 'Đà Lạt', 'Hà Nội', 'TP. Hồ Chí Minh']

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
      {/* CSS Keyframes cho các thẻ ảnh nổi chuyển động */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(8px); }
        }
        .animate-float-slow { animation: floatSlow 6s ease-in-out infinite; }
        .animate-float-reverse { animation: floatReverse 5.5s ease-in-out 1s infinite; }
      `}</style>

      {/* HERO SECTION VỚI SLIDESHOW CHUYỂN ĐỘNG & FLOATING CARDS */}
      <section className="relative overflow-hidden bg-[#061826] px-4 py-16 text-white sm:px-6 lg:py-24">
        {/* Background Slideshow với hiệu ứng Ken Burns Zoom */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeSlide
          return (
            <div
              key={slide.url}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'z-0 opacity-100' : '-z-10 opacity-0'
                }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className={`h-full w-full object-cover transition-transform duration-[9000ms] ease-out ${isActive ? 'scale-110' : 'scale-100'
                  }`}
              />
            </div>
          )
        })}

        {/* Lớp phủ Gradient xanh biển sâu */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#04121d]/95 via-[#072134]/85 to-[#061826]/70" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#04121d] via-transparent to-[#04121d]/40" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Cột trái: Tiêu đề + Thanh tìm kiếm */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-slate-900/50 px-4 py-2 text-xs font-semibold tracking-wide text-cyan-100 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                Hàng trăm khách sạn & resort trên khắp Việt Nam
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[56px]">
                Mỗi chuyến đi,
                <br />
                <span className="bg-gradient-to-r from-sky-200 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                  một trải nghiệm
                </span>{' '}
                đáng nhớ.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200/90 sm:text-lg">
                Khám phá nơi lưu trú phù hợp, đặt phòng nhanh chóng với mức giá ưu đãi nhất và tận hưởng hành trình theo cách riêng của bạn.
              </p>

              {/* Thanh Tìm Kiếm Glassmorphism */}
              <form
                onSubmit={handleSearch}
                className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-3"
              >
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  {/* Ô nhập tên khách sạn */}
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
                      placeholder="Tên khách sạn, khu nghỉ dưỡng..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  {/* Ô nhập thành phố */}
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
                      placeholder="Thành phố..."
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  {/* Nút Tìm kiếm */}
                  <button
                    type="submit"
                    className="group flex items-center justify-center gap-2 rounded-xl bg-[#0284c7] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-[#0369a1] active:scale-[0.99]"
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

                {/* Bộ lọc nâng cao: Ngày nhận/trả & Loại phòng */}
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/95 px-3 py-2 text-slate-900">
                    <label htmlFor="home-checkin" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ngày nhận phòng
                    </label>
                    <input
                      id="home-checkin"
                      type="date"
                      min={todayIso()}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>
                  <div className="rounded-xl bg-white/95 px-3 py-2 text-slate-900">
                    <label htmlFor="home-checkout" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ngày trả phòng
                    </label>
                    <input
                      id="home-checkout"
                      type="date"
                      min={checkIn || todayIso()}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>
                  <div className="rounded-xl bg-white/95 px-3 py-2 text-slate-900">
                    <label htmlFor="home-roomtype" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Loại phòng
                    </label>
                    <select
                      id="home-roomtype"
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
                    >
                      <option value="">Tất cả loại phòng</option>
                      {roomTypes.map((rt) => (
                        <option key={rt} value={rt}>{rt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Các nút chọn nhanh thành phố */}
                <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
                  <span className="text-xs font-medium text-slate-300">Phổ biến:</span>
                  {QUICK_CITIES.map((item) => {
                    const active = city.toLowerCase() === item.toLowerCase()
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => selectQuickCity(active ? '' : item)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${active
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

            {/* Cột phải: Cụm thẻ ảnh chuyển động lơ lửng (Đã bỏ thanh bar đen bên dưới) */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto max-w-md pb-6">
                {/* Khung ảnh động chính */}
                <div className="animate-float-slow relative overflow-hidden rounded-[28px] border border-white/20 bg-slate-900/50 p-3 shadow-2xl backdrop-blur-md">
                  <div className="relative h-80 overflow-hidden rounded-2xl">
                    <img
                      key={currentSlide.url}
                      src={currentSlide.url}
                      alt={currentSlide.title}
                      className="h-full w-full object-cover transition-all duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
                      ★ {currentSlide.rating} Tuyệt hảo
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <p className="text-xs font-medium text-sky-300">{currentSlide.city}</p>
                        <p className="text-base font-bold text-white">{currentSlide.title}</p>
                      </div>
                      <span className="rounded-xl bg-white/95 px-3 py-1.5 text-xs font-extrabold text-slate-900 shadow">
                        {currentSlide.price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thẻ ảnh phụ nổi góc trái dưới */}
                <div className="animate-float-reverse absolute -bottom-2 -left-8 flex items-center gap-3.5 rounded-2xl border border-white/20 bg-slate-950/80 p-3 pr-5 shadow-2xl backdrop-blur-xl">
                  <img
                    src={currentSlide.thumb}
                    alt="Preview"
                    className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/20"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">Ưu đãi thành viên</p>
                    <p className="mt-0.5 text-[11px] text-slate-300">Giảm tới 25% khi đặt hôm nay</p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <span>● Xác nhận đặt phòng tức thì</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ĐIỂM ĐẾN YÊU THÍCH (BENTO GRID ẢNH CHUYỂN ĐỘNG HOVER) */}
      {!isFiltering && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0284c7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0284c7]" />
                Khám phá Việt Nam
              </span>
              <h2 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Điểm đến được yêu thích nhất
              </h2>
            </div>
            <p className="text-xs text-slate-500 sm:text-sm">
              Chạm vào điểm đến bất kỳ để lọc khách sạn ngay lập tức
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR_CITIES.map((dest) => (
              <button
                key={dest.name}
                type="button"
                onClick={() => selectQuickCity(dest.name)}
                className={`group relative h-52 overflow-hidden rounded-3xl text-left shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${dest.span}`}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent transition-opacity duration-300 group-hover:opacity-95" />
                <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#0284c7]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17 17 7M7 7h10v10" />
                  </svg>
                </div>
                <div className="absolute bottom-4 left-5 right-5">
                  <p className="text-xs font-medium text-sky-300">{dest.tagline}</p>
                  <h3 className="mt-0.5 text-xl font-extrabold text-white">{dest.name}</h3>
                </div>
              </button>
            ))}
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