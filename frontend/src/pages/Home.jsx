import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatMoney, todayIso, formatDateVi } from '../lib/format'
import { useSettings } from '../store/settingsStore'
import { useAuth } from '../store/authStore'
import { useTranslation } from '../lib/i18n'
import { HotelImage, Spinner, ErrorBox } from '../components/ui'

// Ảnh nền trang trí của khu vực tìm kiếm (không gắn với cơ sở nào)
const HERO_BACKDROP = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1800&q=85'

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

const QUICK_CITIES = ['Đà Nẵng', 'Phú Quốc', 'Nha Trang', 'Đà Lạt', 'Hà Nội', 'Hồ Chí Minh']

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { currencyDisplay } = useSettings()
  const { t } = useTranslation()
  const [hotels, setHotels] = useState([])
  const [allHotels, setAllHotels] = useState([])
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

  // AI Natural-Language Search States
  const [searchMode, setSearchMode] = useState('STANDARD') // 'STANDARD' | 'AI'
  const [aiQuery, setAiQuery] = useState('')
  const [aiSearching, setAiSearching] = useState(false)
  const [aiSearchResult, setAiSearchResult] = useState(null)

  async function handleAiSearch(e, customQuery) {
    if (e) e.preventDefault()
    const queryToUse = customQuery || aiQuery
    if (!queryToUse.trim()) return
    setAiSearching(true)
    setError('')
    try {
      const res = await api('/ai/nl-search', {
        method: 'POST',
        body: { query: queryToUse.trim() },
      })
      setAiSearchResult(res)
      if (res?.filters) {
        const p = {}
        if (res.filters.city) {
          setCity(res.filters.city)
          p.city = res.filters.city
        }
        if (res.filters.checkIn && res.filters.checkOut) {
          setCheckIn(res.filters.checkIn)
          setCheckOut(res.filters.checkOut)
          p.checkIn = res.filters.checkIn
          p.checkOut = res.filters.checkOut
        }
        setSearchParams(p)
      }
    } catch (err) {
      setError(err.message || 'Không thể tìm kiếm bằng AI.')
    } finally {
      setAiSearching(false)
    }
  }

  // States bổ sung cho UI
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false)
  const [showAllCities, setShowAllCities] = useState(false)
  const sliderRef = useRef(null)
  const [isSliderPaused, setIsSliderPaused] = useState(false)

  // Danh sách toàn bộ khách sạn phục vụ thông tin thành phố & slide Hero (không bị co cụm khi lọc tìm kiếm)
  const globalHotels = allHotels.length > 0 ? allHotels : hotels

  // 1. Đồng bộ các thành phố thực tế từ danh sách khách sạn CSDL (Admin CRUD)
  const availableCities = useMemo(() => {
    return Array.from(new Set(globalHotels.map((h) => h.city?.trim()).filter(Boolean)))
  }, [globalHotels])

  const quickCitiesList = useMemo(() => {
    return availableCities.length > 0 ? availableCities : QUICK_CITIES
  }, [availableCities])

  // 2. Thống kê số lượng khách sạn & giá thấp nhất thực tế theo từng thành phố
  const cityStats = useMemo(() => {
    const counts = {}
    const minPrices = {}

    globalHotels.forEach((h) => {
      if (h.city) {
        const c = h.city.trim()
        counts[c] = (counts[c] || 0) + 1
        const p = Number(h.minPrice) || 0
        if (!minPrices[c] || (p > 0 && p < minPrices[c])) {
          minPrices[c] = p
        }
      }
    })

    return { counts, minPrices }
  }, [globalHotels])

  // 3. Đồng bộ danh mục Điểm đến: Luôn hiển thị khách sạn thực tế có trong hệ thống
  const dynamicDestinations = useMemo(() => {
    const knownNames = new Set(POPULAR_CITIES.map((c) => c.name.toLowerCase()))

    const baseList = POPULAR_CITIES.map((c) => {
      const realCount = cityStats.counts[c.name] || 0
      const realHotel = globalHotels.find((h) => h.city?.toLowerCase() === c.name.toLowerCase())
      return {
        ...c,
        realHotelName: realHotel?.name || `${c.name} Luxury Hotel`,
        realHotelAddress: realHotel?.address || c.name,
        realHotelId: realHotel?.id,
        hotelsCount: realCount > 0 ? `${realCount} khách sạn có sẵn` : 'Sắp khai trương cơ sở',
      }
    })

    // Nếu Admin thêm khách sạn ở các thành phố mới (Quy Nhơn, Vũng Tàu, Sapa,...)
    availableCities.forEach((cityItem) => {
      if (!knownNames.has(cityItem.toLowerCase())) {
        const count = cityStats.counts[cityItem] || 1
        const realHotel = globalHotels.find((h) => h.city?.toLowerCase() === cityItem.toLowerCase())
        baseList.push({
          name: cityItem,
          realHotelName: realHotel?.name || `${cityItem} Central Hotel`,
          realHotelAddress: realHotel?.address || cityItem,
          realHotelId: realHotel?.id,
          tagline: 'Điểm đến mới được kết nối hệ thống',
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          hotelsCount: `${count} khách sạn có sẵn`,
        })
      }
    })

    return baseList
  }, [cityStats, availableCities, globalHotels])

  // Cơ sở nổi bật lấy từ dữ liệu thật: có ảnh, ưu tiên điểm đánh giá cao rồi giá thấp
  const heroSlides = useMemo(
    () =>
      globalHotels
        .filter((h) => h.imageUrl)
        .slice()
        .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (Number(a.minPrice) || 0) - (Number(b.minPrice) || 0))
        .slice(0, 4)
        .map((h) => ({
          id: h.id,
          url: h.imageUrl,
          title: h.name,
          subtitle: [h.address, h.city].filter(Boolean).join(', '),
          city: h.city,
          rating: h.rating ? Number(h.rating).toFixed(1) : null,
          reviewCount: h.reviewCount || 0,
          price: h.minPrice ? formatMoney(h.minPrice, currencyDisplay) : null,
        })),
    [globalHotels, currencyDisplay],
  )
  const currentSlide = heroSlides.length ? heroSlides[activeSlide % heroSlides.length] : null

  // Danh sách lặp vô tận cho thanh cuộn Điểm đến (Seamless infinite loop ticker)
  const loopedDestinations = useMemo(() => {
    return [...dynamicDestinations, ...dynamicDestinations]
  }, [dynamicDestinations])

  // Slowly auto-scrolling slider for popular destinations with seamless infinite loop
  useEffect(() => {
    if (showAllCities || isSliderPaused) return
    const el = sliderRef.current
    if (!el) return

    const interval = setInterval(() => {
      if (!el) return
      const half = el.scrollWidth / 2
      if (el.scrollLeft >= half - 1) {
        el.scrollLeft = 0
      } else {
        el.scrollLeft += 1
      }
    }, 28)

    return () => clearInterval(interval)
  }, [showAllCities, isSliderPaused, dynamicDestinations])

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

  // Tải danh sách toàn bộ khách sạn 1 lần để duy trì các điểm đến và ảnh trình diễn không bị mất khi lọc
  useEffect(() => {
    api('/hotels')
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setAllHotels(res)
        }
      })
      .catch(() => {})
  }, [])

  // Tự động chuyển slide ảnh nền Hero mỗi 5.5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => prev + 1)
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
      .then((res) => {
        const list = Array.isArray(res) ? res : []
        setHotels(list)
        if (Object.keys(params).length === 0 && list.length > 0) {
          setAllHotels(list)
        }
      })
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

  const isFiltering = Boolean(
    searchParams.get('q') ||
      searchParams.get('city') ||
      searchParams.get('roomType') ||
      (searchParams.get('checkIn') && searchParams.get('checkOut')),
  )

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] transition-colors duration-200">
      {/* Thanh Thông Báo Quyền Quản Trị Viên (Admin Mode Sync) */}
      {user?.role === 'ADMIN' && (
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white px-4 py-2.5 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-blue-500/30 shadow-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-amber-300">👑 Quyền Quản trị viên (Admin Mode)</span>
            <span className="text-slate-300 hidden md:inline">
              — Thay đổi khách sạn & phòng tại trang Quản trị hiển thị ngay trên giao diện này
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="btn-liquid-glass rounded-lg px-3 py-1 text-xs font-bold text-white shadow-xs"
            >
              Mở Dashboard Admin →
            </Link>
            <Link
              to="/admin/hotels"
              className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 text-xs font-bold text-white transition-colors"
            >
              + Thêm Khách sạn mới
            </Link>
          </div>
        </div>
      )}

      {/* HERO SECTION VỚI SLIDESHOW CHUYỂN ĐỘNG & FLOATING CARDS */}
      <section className="relative overflow-hidden bg-slate-950 px-4 pt-16 pb-28 text-white sm:px-6 lg:pt-20 lg:pb-36">
        {/* Background Slideshow với hiệu ứng Ken Burns Zoom */}
        <div className="absolute inset-0 z-0">
          <img src={HERO_BACKDROP} alt="" aria-hidden="true" className="h-full w-full object-cover" />
        </div>

        {/* Lớp phủ Gradient xanh biển sâu */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/95 via-blue-950/85 to-slate-950/75" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

        {/* Gradient mờ chuyển tiếp êm ái sang nền phía dưới, không bị gắt cạnh */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[var(--color-bg-page)] via-[var(--color-bg-page)]/60 to-transparent z-10" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-10">
            {/* Cột trái: Tiêu đề + Thanh tìm kiếm nâng cao */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-slate-900/60 px-4 py-2 text-xs font-semibold tracking-wide text-cyan-200 backdrop-blur-md shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  {t('hero_badge')}
                </div>

                <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[44px] xl:text-[52px]">
                  Mỗi chuyến đi,
                  <br />
                  <span className="bg-gradient-to-r from-blue-200 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    một trải nghiệm
                  </span>{' '}
                  đáng nhớ.
                </h1>

                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200/90">
                  {t('hero_subtitle')}
                </p>
              </div>

              {/* Chế độ Tìm kiếm: Tiêu chuẩn vs AI Tự nhiên (Natural Language Search) */}
              <div className="mt-7 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchMode('STANDARD')}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    searchMode === 'STANDARD'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                      : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900/80 hover:text-white border border-white/10'
                  }`}
                >
                  🔍 Tìm kiếm tiêu chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('AI')}
                  className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    searchMode === 'AI'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                      : 'bg-slate-900/60 text-purple-200 hover:bg-slate-900/80 hover:text-white border border-purple-500/30'
                  }`}
                >
                  <span className="text-amber-300">✨</span>
                  <span>Tìm kiếm AI tự nhiên</span>
                  <span className="rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-1.5 py-0.2">
                    Mới
                  </span>
                </button>
              </div>

              {/* Giao diện Tìm kiếm AI Tự Nhiên (NL Search) */}
              {searchMode === 'AI' ? (
                <div className="mt-3 rounded-3xl border border-purple-400/30 bg-slate-900/80 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-3.5">
                  <form onSubmit={handleAiSearch} className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 text-sm">
                        ✨
                      </span>
                      <input
                        type="text"
                        placeholder="VD: '2 người, dưới 800k, cuối tuần này ở Đà Nẵng' hoặc 'Resort Phú Quốc cho 2 người'..."
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        className="w-full rounded-2xl bg-white dark:bg-slate-800 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 shadow-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={aiSearching || !aiQuery.trim()}
                      className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-600/40 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {aiSearching ? (
                        <>
                          <Spinner size="sm" />
                          <span>AI đang phân tích...</span>
                        </>
                      ) : (
                        <>
                          <span>AI Tìm phòng</span>
                          <span className="transition-transform group-hover:translate-x-1">→</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Kết quả phân tích AI */}
                  {aiSearchResult && (
                    <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-3.5 text-xs text-purple-100 space-y-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                        <span className="font-bold text-amber-300">🤖 AI đã trích xuất bộ lọc & gọi search_rooms:</span>
                        <span className="text-[10px] text-purple-300 font-mono">
                          {aiSearchResult.results?.length || 0} phòng thỏa mãn
                        </span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed font-medium">
                        {aiSearchResult.aiSummary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Thanh Tìm Kiếm Glassmorphism với Custom UI */
                <form
                  onSubmit={handleSearch}
                  className="mt-3 rounded-3xl border border-white/20 bg-slate-900/60 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                >
                {/* Hàng 1: Từ khóa tìm kiếm & Tên thành phố */}
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <div className="relative flex-1 min-w-0">
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
                      placeholder={t('search_keyword_placeholder')}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="w-full rounded-2xl bg-white dark:bg-slate-800 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>

                  <div className="relative sm:w-56 shrink-0">
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
                      placeholder={t('search_city_placeholder')}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-2xl bg-white dark:bg-slate-800 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-liquid-glass group shrink-0 flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/40 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>{t('search_btn')}</span>
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

                {/* Hàng 2: Bộ chọn Ngày & Hạng phòng */}
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-stretch">
                  {/* Custom Date Pickers */}
                  <div className="sm:col-span-7 flex flex-col sm:flex-row items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700">
                    {/* Thẻ Chọn Ngày Nhận */}
                    <div
                      onClick={() => {
                        const el = document.getElementById('home-checkin')
                        if (el) {
                          if (typeof el.showPicker === 'function') el.showPicker()
                          else el.focus()
                        }
                      }}
                      className="w-full sm:w-1/2 flex items-center gap-3 rounded-xl p-2 hover:bg-blue-50/70 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t('search_checkin_label')}
                        </span>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
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
                        aria-label="Ngày nhận"
                      />
                    </div>

                    <div className="hidden sm:flex items-center justify-center px-1 text-slate-400">
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
                      className="w-full sm:w-1/2 flex items-center gap-3 rounded-xl p-2 hover:bg-blue-50/70 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t('search_checkout_label')}
                        </span>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
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
                        aria-label="Ngày trả"
                      />
                    </div>
                  </div>

                  {/* Custom Room Type Selector */}
                  <div className="relative sm:col-span-5 flex">
                    <button
                      type="button"
                      onClick={() => setRoomDropdownOpen((v) => !v)}
                      className="w-full h-full flex items-center justify-between rounded-2xl bg-white dark:bg-slate-800 p-2.5 px-3.5 text-left shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-400 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-sm">
                          🛏️
                        </span>
                        <div className="truncate">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {t('search_room_type_label')}
                          </span>
                          <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                            {roomType || t('search_room_type_all')}
                          </span>
                        </div>
                      </div>
                      <svg
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                          roomDropdownOpen ? 'rotate-180 text-blue-500' : ''
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
                      <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-2xl animate-popup-in">
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
                            !roomType ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>🏢</span>
                            <span>{t('search_room_type_all')}</span>
                          </span>
                          {!roomType && <span className="text-blue-600 font-bold">✓</span>}
                        </button>

                        {roomTypes.map((rt) => {
                          const isSel = roomType === rt
                          return (
                            <button
                              key={rt}
                              type="button"
                              onClick={() => {
                                setRoomType(rt)
                                setRoomDropdownOpen(false)
                              }}
                              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                                isSel ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span>✨</span>
                                <span>{rt}</span>
                              </span>
                              {isSel && <span className="text-blue-600 font-bold">✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Các nút chọn nhanh thành phố: CHỈ 1 HÀNG DUY NHẤT (Single row, horizontal scroll) */}
                <div className="mt-3.5 flex items-center gap-2 px-1 pt-2.5 border-t border-white/10 overflow-x-auto no-scrollbar whitespace-nowrap">
                  <span className="text-xs font-semibold text-slate-300 shrink-0">{t('quick_destinations')}</span>
                  {quickCitiesList.map((item) => {
                    const active = city.toLowerCase() === item.toLowerCase()
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => selectQuickCity(active ? '' : item)}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-white/30'
                            : 'bg-white/10 text-slate-200 hover:bg-white/20'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
              </form>
            )}
          </div>

            {/* Cột phải: KHUNG ẢNH NỔI BẬT (Bigger, matching height with the left block, and wider) */}
            {currentSlide && (
            <div className="w-full lg:w-[350px] xl:w-[390px] shrink-0 hidden lg:flex flex-col justify-stretch">
              <div className="relative w-full h-full flex flex-col justify-stretch">
                <div className="animate-presentation-float relative flex-1 flex flex-col overflow-hidden rounded-[28px] border border-white/25 bg-slate-900/60 p-3 shadow-2xl backdrop-blur-md">
                  <div
                    onClick={() => navigate(`/hotels/${currentSlide.id}`)}
                    className="group relative flex-1 min-h-[460px] xl:min-h-[500px] overflow-hidden rounded-2xl cursor-pointer"
                    title="Xem chi tiết cơ sở"
                  >
                    <img
                      key={currentSlide.url}
                      src={currentSlide.url}
                      alt={currentSlide.title}
                      className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                    {/* Badge Đánh giá */}
                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-md border border-white/15">
                      {currentSlide.rating ? (
                        <>
                          <span className="text-amber-400">★ {currentSlide.rating}</span>
                          <span>·</span>
                          <span className="text-slate-200">{currentSlide.reviewCount} đánh giá</span>
                        </>
                      ) : (
                        <span className="text-slate-200">Chưa có đánh giá</span>
                      )}
                    </div>

                    {/* Badge Độc quyền */}
                    <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-md shadow-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      <span>Cơ sở nổi bật</span>
                    </div>

                    {/* Khối thông tin góc dưới ảnh */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 tracking-wide uppercase">
                          📍 {currentSlide.city}
                        </span>
                        <p className="text-lg sm:text-xl font-black text-white drop-shadow-md leading-snug group-hover:text-cyan-300 transition-colors">
                          {currentSlide.title}
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{currentSlide.subtitle}</p>
                      </div>
                      {currentSlide.price && (
                      <div className="shrink-0 text-right">
                        <span className="block text-[11px] text-slate-400">Giá phòng từ</span>
                        <span className="inline-block rounded-xl bg-white px-3 py-1 text-sm font-extrabold text-slate-900 shadow-lg group-hover:bg-cyan-300 group-hover:text-slate-950 transition-colors">
                          {currentSlide.price}
                        </span>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* ĐIỂM ĐẾN YÊU THÍCH (GỌN GÀNG, AUTO-SCROLL SLIDER & GRID XEM THÊM) */}
      {!isFiltering && (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/90 dark:bg-blue-950/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                Khám phá Việt Nam
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {t('section_destinations')}
              </h2>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                {t('section_destinations_desc')}
              </p>
            </div>
          </div>

          {/* Khi !showAllCities: Auto-scrolling Slider lặp vô tận; Khi showAllCities: Full Grid gốc */}
          {!showAllCities ? (
            <div
              ref={sliderRef}
              onMouseEnter={() => setIsSliderPaused(true)}
              onMouseLeave={() => setIsSliderPaused(false)}
              className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 cursor-grab"
            >
              {loopedDestinations.map((dest, i) => (
                <div
                  key={`${dest.name}-${i}`}
                  onClick={() => selectQuickCity(dest.name)}
                  className="group relative h-64 w-72 sm:w-80 shrink-0 overflow-hidden rounded-2xl text-left shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shimmer-card border border-slate-200/60 dark:border-slate-800"
                >
                  <img
                    src={dest.image}
                    alt={dest.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  {/* Blue gradient overlay instead of black */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/30 to-transparent transition-opacity duration-300 group-hover:opacity-95" />

                  <div className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-blue-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="inline-block rounded-md bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20">
                        {dest.hotelsCount}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-cyan-200 line-clamp-1 mb-0.5">
                      🏨 {dest.realHotelName}
                    </p>
                    <h3 className="text-xl font-extrabold text-white">{dest.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-popup-in">
              {dynamicDestinations.map((dest) => (
                <div
                  key={dest.name}
                  onClick={() => selectQuickCity(dest.name)}
                  className="group relative h-64 overflow-hidden rounded-2xl text-left shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shimmer-card border border-slate-200/60 dark:border-slate-800"
                >
                  <img
                    src={dest.image}
                    alt={dest.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/30 to-transparent transition-opacity duration-300 group-hover:opacity-95" />

                  <div className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-blue-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="inline-block rounded-md bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20">
                        {dest.hotelsCount}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-cyan-200 line-clamp-1 mb-0.5">
                      🏨 {dest.realHotelName}
                    </p>
                    <h3 className="text-xl font-extrabold text-white">{dest.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nút Xem Thêm / Thu Gọn Điểm Đến */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowAllCities((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-800 px-6 py-2.5 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 shadow-sm hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <span>
                {showAllCities
                  ? t('section_see_less_destinations')
                  : t('section_see_more_destinations')}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* DANH SÁCH KHÁCH SẠN */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {isFiltering && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 shadow-sm animate-popup-in">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Kết quả tìm kiếm cho{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <span>✕ {t('search_clear')}</span>
            </button>
          </div>
        )}

        {loading && <Spinner text="Đang tải danh sách khách sạn..." />}
        {error && <ErrorBox message={error} />}

        {!loading && !error && hotels.length === 0 && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
                <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
                <path d="M9 21v-7h6v7" />
              </svg>
            </div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">Không tìm thấy khách sạn phù hợp</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Thử thay đổi từ khóa hoặc khám phá các thành phố khác xem sao nhé.
            </p>
            {isFiltering && (
              <button
                onClick={clearFilters}
                className="btn-liquid-glass mt-5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm"
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
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {t('section_featured_hotels')}
                  </h2>
                </div>
                <span className="hidden text-xs font-semibold text-slate-400 sm:inline">
                  {t('section_featured_hotels_count', { count: hotels.length })}
                </span>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {hotels.map((hotel, idx) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  checkIn={searchParams.get('checkIn')}
                  checkOut={searchParams.get('checkOut')}
                  currency={currencyDisplay}
                  isAdmin={user?.role === 'ADMIN'}
                  index={idx}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

/** Điểm đánh giá thật (trung bình sao của khách); null khi cơ sở chưa có đánh giá. */
export function getHotelRating(hotel) {
  return hotel?.rating ? Number(hotel.rating).toFixed(1) : null
}

function HotelCard({ hotel, checkIn, checkOut, currency, isAdmin, index = 0 }) {
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
      style={{ animationDelay: `${(index % 8) * 75}ms` }}
      className="reveal-card group relative flex flex-col overflow-hidden rounded-[20px] border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 hover:border-blue-400"
    >
      {/* Khung ảnh khách sạn với hiệu ứng zoom mượt */}
      <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <HotelImage
          src={hotel.imageUrl}
          alt={hotel.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Blue gradient overlay instead of harsh black */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-950/20 to-transparent" />

        {/* Nút thao tác nhanh cho Admin (Đồng bộ CRUD Admin) */}
        {isAdmin && (
          <div className="absolute left-3 top-3 z-10">
            <Link
              to="/admin/hotels"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full bg-slate-950/85 hover:bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-amber-300 shadow-md backdrop-blur-md border border-amber-300/30 transition-all hover:scale-105"
              title="Đi tới quản lý sửa/xóa khách sạn trong Admin"
            >
              <span>⚙️ Sửa trong Admin</span>
            </Link>
          </div>
        )}

        {/* Huy hiệu Thành phố */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-slate-900/90 px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm backdrop-blur-md border border-white/20">
          <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span>{hotel.city}</span>
        </div>

        {/* Huy hiệu Đánh giá góc trên */}
        {getHotelRating(hotel) && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/60 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md">
            <span>★</span>
            <span>{getHotelRating(hotel)}</span>
            <span className="font-medium text-slate-300">({hotel.reviewCount})</span>
          </div>
        )}
      </div>

      {/* Nội dung thông tin khách sạn */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-base font-extrabold leading-snug text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {hotel.name}
        </h3>

        <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{hotel.address}</p>

        {/* Tiện ích dạng Tag nhỏ */}
        {amenityList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {amenityList.map((item) => (
              <span
                key={item}
                className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Giá & Nút Xem chi tiết */}
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <p className="text-[11px] font-medium text-slate-400">Giá mỗi đêm từ</p>
            <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
              {formatMoney(hotel.minPrice, currency)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20">
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
