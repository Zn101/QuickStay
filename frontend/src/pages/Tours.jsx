import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatVnd } from '../lib/format'
import { useAuth } from '../store/authStore'
import { useTranslation } from '../lib/i18n'
import { useSiteContent } from '../lib/siteContent'

export const INITIAL_TOURS = [
  {
    id: 1,
    title: 'Tour Bà Nà Hills & Check-in Cầu Vàng',
    city: 'Đà Nẵng',
    category: 'Danh lam & Cảnh đẹp',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80',
    duration: '1 ngày (08:00 - 17:00)',
    price: 850000,
    transport: 'Xe đưa đón riêng 4-7 chỗ + Vé cáp treo',
    highlights: ['Cầu Vàng bàn tay khổng lồ', 'Làng Pháp cổ kính & Hầm rượu Debay', 'Khu vui chơi Fantasy Park'],
    rating: 4.9,
    reviewsCount: 142,
    description: 'Khám phá chốn bồng lai tiên cảnh Bà Nà Hills, tận hưởng khí hậu 4 mùa trong 1 ngày và chiêm ngưỡng kiến trúc tráng lệ của Cầu Vàng nổi tiếng toàn cầu.',
  },
  {
    id: 2,
    title: 'Tour Bán Đảo Sơn Trà & Ngũ Hành Sơn',
    city: 'Đà Nẵng',
    category: 'Văn hóa & Tâm linh',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
    duration: 'Nửa ngày (08:00 - 12:30)',
    price: 450000,
    transport: 'Xe du lịch máy lạnh có tài xế',
    highlights: ['Chùa Linh Ứng tượng Phật Bà 67m', 'Đỉnh Bàn Cờ ngắm trọn vịnh', 'Động Huyền Không kỳ ảo'],
    rating: 4.8,
    reviewsCount: 96,
    description: 'Chuyến tham quan kết hợp thiên nhiên hoang sơ của bán đảo Sơn Trà và cụm hang động kỳ vĩ của Ngũ Hành Sơn thiêng liêng.',
  },
  {
    id: 3,
    title: 'Tour Khám Phá 4 Đảo & Cáp Treo Hòn Thơm',
    city: 'Phú Quốc',
    category: 'Biển đảo & Lặn biển',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80',
    duration: '1 ngày (08:30 - 17:30)',
    price: 1050000,
    transport: 'Cano cao tốc & Cáp treo vượt biển',
    highlights: ['Hòn Mây Rút Trong & Ngoài', 'Lặn ngắm san hô tự nhiên', 'Cáp treo Hòn Thơm dài nhất thế giới'],
    rating: 5.0,
    reviewsCount: 215,
    description: 'Trải nghiệm cano lướt sóng qua những hòn đảo hoang sơ nhất quần đảo An Thới, tắm biển bãi cát trắng mịn và bay trên biển với cáp treo 3 dây kỳ vĩ.',
  },
  {
    id: 4,
    title: 'Tour Vịnh San Hô & Lặn Ngắm Biển Nha Trang',
    city: 'Nha Trang',
    category: 'Biển đảo & Lặn biển',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
    duration: '1 ngày (08:00 - 16:30)',
    price: 750000,
    transport: 'Tàu gỗ du lịch & Cano trung chuyển',
    highlights: ['Vịnh San Hô nước trong vắt', 'Bữa trưa hải sản tươi sống trên bè', 'Lặn bình khí với huấn luyện viên'],
    rating: 4.8,
    reviewsCount: 118,
    description: 'Thư giãn giữa làn nước ngọc bích của vịnh Nha Trang - một trong 29 vịnh biển đẹp nhất thế giới, thỏa sức ngắm nhìn rạn san hô rực rỡ.',
  },
  {
    id: 5,
    title: 'Tour Di Sản Tràng An - Bái Đính Từ Hà Nội',
    city: 'Hà Nội',
    category: 'Di sản & Lịch sử',
    image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=900&q=80',
    duration: '1 ngày (07:30 - 18:30)',
    price: 950000,
    transport: 'Limousine đón trả tại khách sạn',
    highlights: ['Ngồi thuyền chèo tay xuyên hang Tràng An', 'Quần thể chùa Bái Đính kỷ lục Châu Á', 'Bữa trưa đặc sản dê núi Ninh Bình'],
    rating: 4.9,
    reviewsCount: 180,
    description: 'Hành trình khám phá Di sản Văn hóa & Thiên nhiên Thế giới UNESCO Tràng An, nơi cảnh quan núi đá vôi non nước hữu tình giao hòa với tâm linh.',
  },
  {
    id: 6,
    title: 'City Tour Sài Gòn & Du Thuyền Sông Bạch Đằng',
    city: 'Hồ Chí Minh',
    category: 'Đô thị & Trải nghiệm',
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80',
    duration: 'Chiều - Tối (14:30 - 21:30)',
    price: 680000,
    transport: 'Xe buýt 2 tầng Hop-on Hop-off + Thuyền sông',
    highlights: ['Dinh Độc Lập & Bưu điện Trung tâm', 'Ngắm hoàng hôn sông Sài Gòn trên du thuyền', 'Ăn tối set menu Á - Âu sang trọng'],
    rating: 4.8,
    reviewsCount: 125,
    description: 'Cảm nhận nhịp đập sôi động của thành phố mang tên Bác từ tầng 2 xe buýt mui trần và thưởng ngoạn bữa tối lãng mạn ngắm nhìn tòa tháp Landmark 81 lung linh.',
  },
  {
    id: 7,
    title: 'Tour Thả Đèn Hoa Đăng & Rừng Dừa Bảy Mẫu',
    city: 'Hội An',
    category: 'Văn hóa & Sinh thái',
    image: 'https://images.unsplash.com/photo-1558005530-a7958896ec60?auto=format&fit=crop&w=900&q=80',
    duration: 'Nửa ngày (14:00 - 19:30)',
    price: 480000,
    transport: 'Thúng chai sinh thái & Xe đưa đón',
    highlights: ['Chèo thuyền thúng xoay múa điêu luyện', 'Thả hoa đăng cầu may trên sông Hoài', 'Thưởng thức cao lầu & chè bắp phố cổ'],
    rating: 4.9,
    reviewsCount: 164,
    description: 'Hóa thân thành ngư dân miền Trung trải nghiệm lắc thuyền thúng giữa rừng dừa bạt ngàn, sau đó ngắm nhìn phố cổ Hội An lên đèn lung linh.',
  },
  {
    id: 8,
    title: 'Tour Cố Đô Triều Nguyễn & Ca Huế Sông Hương',
    city: 'Huế',
    category: 'Di sản & Cung đình',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    duration: '1 ngày (08:00 - 20:30)',
    price: 820000,
    transport: 'Thuyền rồng sông Hương & Xe du lịch',
    highlights: ['Đại Nội Hoàng Thành & Ngọ Môn', 'Lăng Khải Định & Lăng Tự Đức tinh xảo', 'Thưởng thức ca Huế đêm trên thuyền rồng'],
    rating: 4.9,
    reviewsCount: 108,
    description: 'Chìm đắm trong không gian trầm mặc của kinh thành xưa, chiêm ngưỡng kiến trúc cung đình lộng lẫy và lắng nghe làn điệu dân ca Huế ngọt ngào.',
  },
  {
    id: 9,
    title: 'Tour Săn Mây Đồi Chè Cầu Đất & Vườn Hồng',
    city: 'Đà Lạt',
    category: 'Thiên nhiên & Sống ảo',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    duration: 'Nửa ngày sáng sớm (04:30 - 11:30)',
    price: 520000,
    transport: 'Xe 16 chỗ đón tận homestay/khách sạn',
    highlights: ['Săn biển mây bồng bềnh tại Cầu Đất', 'Check-in đồi chè xanh mướt & tuabin gió', 'Tham quan vườn hồng treo gió trĩu quả'],
    rating: 4.9,
    reviewsCount: 156,
    description: 'Đón bình minh rạng rỡ trên đỉnh đồi mây mờ ảo, hít thở không khí se lạnh trong veo của xứ sở ngàn hoa và lưu giữ những khung hình tuyệt đẹp.',
  },
]

export default function Tours() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const tours = useSiteContent('tours', INITIAL_TOURS)
  const [selectedCity, setSelectedCity] = useState('Tất cả')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')

  // Booking Modal State
  const [bookingTour, setBookingTour] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingGuests, setBookingGuests] = useState(2)
  const [bookingVehicle, setBookingVehicle] = useState('SEDAN_4')
  const [guestName, setGuestName] = useState(user?.fullName || '')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestNote, setGuestNote] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const cities = ['Tất cả', 'Đà Nẵng', 'Phú Quốc', 'Nha Trang', 'Hà Nội', 'Hồ Chí Minh', 'Hội An', 'Huế', 'Đà Lạt']
  const categories = ['Tất cả', 'Biển đảo & Lặn biển', 'Di sản & Lịch sử', 'Danh lam & Cảnh đẹp', 'Văn hóa & Tâm linh', 'Thiên nhiên & Sống ảo']

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const matchCity = selectedCity === 'Tất cả' || tour.city.toLowerCase() === selectedCity.toLowerCase()
      const matchCat = selectedCategory === 'Tất cả' || tour.category === selectedCategory
      const matchQ =
        !searchKeyword.trim() ||
        tour.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        tour.city.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        tour.description.toLowerCase().includes(searchKeyword.toLowerCase())
      return matchCity && matchCat && matchQ
    })
  }, [tours, selectedCity, selectedCategory, searchKeyword])

  function handleOpenBooking(tour) {
    setBookingTour(tour)
    setBookingSuccess(false)
    setBookingGuests(2)
    setBookingVehicle('SEDAN_4')
    if (user) {
      setGuestName(user.fullName || user.email)
    }
  }

  function handleConfirmBooking(e) {
    e.preventDefault()
    if (!guestPhone.trim() || !bookingDate) {
      alert('Vui lòng điền đầy đủ số điện thoại và ngày khởi hành.')
      return
    }
    setBookingSuccess(true)
    setTimeout(() => {
      setBookingTour(null)
      setBookingSuccess(false)
      setGuestPhone('')
      setGuestNote('')
    }, 2800)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-main)] py-10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-100 font-bold">Tour & Điểm đến tham quan</span>
        </nav>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 p-8 sm:p-12 text-white shadow-2xl mb-10 border border-white/10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Trải nghiệm bản địa đặc sắc
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Tour Tham Quan & Xe Điểm Đến Hấp Dẫn
            </h1>
            <p className="mt-3.5 text-sm sm:text-base text-slate-200/90 leading-relaxed">
              Đặt tour tham quan các điểm du lịch nổi tiếng tại Việt Nam với xe riêng đón tận khách sạn, hướng dẫn viên nhiệt tình và lịch trình linh hoạt.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm mb-8 space-y-4">
          {/* Search Input & Category */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm tên tour, địa danh (Cầu Vàng, Hòn Thơm, Tràng An...)"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* City Pills */}
          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 shrink-0">Điểm đến:</span>
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  selectedCity === city
                    ? 'bg-slate-900 dark:bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Tour Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTours.map((tour) => (
            <div
              key={tour.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                <span className="absolute left-3 top-3 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-bold text-white">
                  📍 {tour.city}
                </span>

                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 px-2.5 py-0.5 text-xs font-black shadow-sm">
                  <span>★</span>
                  <span>{tour.rating}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                    ⏱️ {tour.duration}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
                  {tour.category}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                  {tour.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {tour.description}
                </p>

                {/* Highlights */}
                <div className="mt-3.5 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] text-slate-600 dark:text-slate-300">
                  {tour.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Footer & CTA */}
                <div className="mt-auto flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Giá tour trọn gói</span>
                    <span className="text-lg font-black text-sky-600 dark:text-sky-400">
                      {formatVnd(tour.price)}
                    </span>
                    <span className="text-[10px] text-slate-400"> /khách</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBooking(tour)}
                    className="btn-liquid-glass rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    Đặt tour ngay →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTours.length === 0 && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center shadow-sm">
            <span className="text-4xl">🗺️</span>
            <p className="mt-3 text-base font-bold text-slate-800 dark:text-white">Không tìm thấy tour phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">Thử chọn thành phố khác hoặc xóa từ khóa tìm kiếm.</p>
            <button
              onClick={() => {
                setSelectedCity('Tất cả')
                setSelectedCategory('Tất cả')
                setSearchKeyword('')
              }}
              className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700"
            >
              Xem tất cả tour
            </button>
          </div>
        )}

        {/* Booking Concierge Modal */}
        {bookingTour && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl animate-popup-in">
              <button
                type="button"
                onClick={() => setBookingTour(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>

              {bookingSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-2xl font-black">
                    ✓
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Yêu Cầu Đặt Tour Thành Công!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Đội ngũ Concierge của QuickStay đã tiếp nhận yêu cầu đặt tour <strong>{bookingTour.title}</strong> vào ngày {bookingDate}. Chúng tôi sẽ liên hệ qua SĐT <strong>{guestPhone}</strong> trong vòng 15 phút để xác nhận.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      ĐẶT TOUR THAM QUAN
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{bookingTour.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">📍 {bookingTour.city} · {bookingTour.duration}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày khởi hành</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số lượng khách</label>
                      <select
                        value={bookingGuests}
                        onChange={(e) => setBookingGuests(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 15].map((n) => (
                          <option key={n} value={n}>{n} khách</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Họ và tên</label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số điện thoại liên hệ</label>
                      <input
                        type="tel"
                        required
                        placeholder="0912 345 678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phương tiện di chuyển</label>
                    <select
                      value={bookingVehicle}
                      onChange={(e) => setBookingVehicle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                    >
                      <option value="SEDAN_4">Xe Sedan 4 chỗ (Tiết kiệm & Tiện lợi)</option>
                      <option value="SUV_7">Xe SUV 7 chỗ (Rộng rãi cho gia đình)</option>
                      <option value="LIMO_VIP">Limousine 9 chỗ VIP (Ghế massage cao cấp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Điểm đón & Ghi chú thêm</label>
                    <input
                      type="text"
                      placeholder="Tên khách sạn lưu trú hoặc yêu cầu riêng..."
                      value={guestNote}
                      onChange={(e) => setGuestNote(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div>
                      <span className="block text-[10px] text-slate-400">Tạm tính dự kiến:</span>
                      <span className="text-base font-black text-sky-600 dark:text-sky-400">
                        {formatVnd(bookingTour.price * bookingGuests)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="btn-liquid-glass rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer"
                    >
                      Xác nhận gửi yêu cầu
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
