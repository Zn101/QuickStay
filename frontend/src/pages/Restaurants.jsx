import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatVnd } from '../lib/format'
import { useAuth } from '../store/authStore'

export const INITIAL_RESTAURANTS = [
  {
    id: 1,
    name: 'Sunrise Bistro Seafood & Grill',
    city: 'Đà Nẵng',
    cuisine: 'Hải sản & Đồ nướng',
    address: '12 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    hours: '10:30 – 23:00',
    priceRange: '250.000 ₫ - 650.000 ₫/khách',
    rating: 4.9,
    reviewsCount: 184,
    specialties: ['Tôm hùm nướng bơ tỏi', 'Cua sốt me Cà Mau', 'Lẩu hải sản chua cay'],
    description: 'Không gian mở nhìn thẳng ra bãi biển Mỹ Khê lộng gió. Bể hải sản tươi sống chọn tại chỗ và chế biến ngay theo yêu cầu.',
  },
  {
    id: 2,
    name: 'Emerald Bay Ocean Grill',
    city: 'Phú Quốc',
    cuisine: 'Hải sản cao cấp & BBQ Biển',
    address: 'Bãi Khem, An Thới, TP. Phú Quốc',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80',
    hours: '11:00 – 22:30',
    priceRange: '380.000 ₫ - 950.000 ₫/khách',
    rating: 4.9,
    reviewsCount: 142,
    specialties: ['Nhum biển nướng mỡ hành', 'Gỏi cá trích đảo ngọc', 'Sò điệp Nhật nướng phô mai'],
    description: 'Nhà hàng sát bờ biển Bãi Khem với bàn ăn lãng mạn trên bãi cát trắng mịn, ngắm hoàng hôn vịnh biển tuyệt mỹ.',
  },
  {
    id: 3,
    name: 'Horizon Sky Dining & Cocktail Lounge',
    city: 'Nha Trang',
    cuisine: 'Á - Âu & Rooftop View Biển',
    address: '102 Trần Phú, Lộc Thọ, Nha Trang',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
    hours: '16:00 – 24:00',
    priceRange: '300.000 ₫ - 780.000 ₫/khách',
    rating: 4.8,
    reviewsCount: 165,
    specialties: ['Bò Wagyu nướng đá núi lửa', 'Cá hồi áp chảo sốt chanh leo', 'Cocktail Signature biển nhiệt đới'],
    description: 'Rooftop tầng 28 ngắm trọn toàn cảnh vịnh biển Nha Trang và cầu Trần Phú rực rỡ ánh đèn về đêm.',
  },
  {
    id: 4,
    name: 'Old Quarter Hanoi Gourmet',
    city: 'Hà Nội',
    cuisine: 'Ẩm thực Bắc Bộ truyền thống',
    address: '28 Hàng Bạc, Hoàn Kiếm, Hà Nội',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
    hours: '07:00 – 22:00',
    priceRange: '150.000 ₫ - 420.000 ₫/khách',
    rating: 4.8,
    reviewsCount: 220,
    specialties: ['Chả cá Lăng Hà Thành', 'Bún chả que tre nướng than hoa', 'Nem rán phố cổ gia truyền'],
    description: 'Không gian nhà cổ mái ngói trầm mặc giữa 36 phố phường, tái hiện hương vị tinh hoa ẩm thực truyền thống kinh kỳ.',
  },
  {
    id: 5,
    name: 'Saigon Landmark Bistro & Wine',
    city: 'Hồ Chí Minh',
    cuisine: 'Fine Dining & Rượu vang',
    address: '45 Lê Lợi, Bến Nghé, Quận 1, TP.HCM',
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80',
    hours: '11:00 – 23:30',
    priceRange: '450.000 ₫ - 1.200.000 ₫/khách',
    rating: 4.9,
    reviewsCount: 198,
    specialties: ['Thăn bò Úc nướng sốt nấm Truffle', 'Cừu đút lò thảo mộc', 'Hầm rượu vang hơn 200 nhãn hiệu'],
    description: 'Phong cách Pháp sang trọng ngay phố đi bộ sầm uất bậc nhất Sài Gòn, điểm hẹn lý tưởng cho đối tác và tiệc kỷ niệm.',
  },
  {
    id: 6,
    name: 'Hoài River Riverside Tavern',
    city: 'Hội An',
    cuisine: 'Đặc sản Quảng Nam & Cao Lầu',
    address: '8 Bạch Đằng, Minh An, Hội An',
    image: 'https://images.unsplash.com/photo-1558005530-a7958896ec60?auto=format&fit=crop&w=900&q=80',
    hours: '08:00 – 22:00',
    priceRange: '120.000 ₫ - 350.000 ₫/khách',
    rating: 4.9,
    reviewsCount: 175,
    specialties: ['Cao lầu thịt xíu giòn bì', 'Cơm gà Hội An da vàng', 'Bánh bao bánh vạc hoa hồng trắng'],
    description: 'Ban công ven sông Hoài thơ mộng, vừa thưởng thức các món ăn truyền thống xứ Quảng vừa ngắm thuyền thả hoa đăng.',
  },
  {
    id: 7,
    name: 'Imperial Royal Palace Feast',
    city: 'Huế',
    cuisine: 'Ẩm thực Cung đình Triều Nguyễn',
    address: '22 Lê Lợi, Vĩnh Ninh, TP. Huế',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    hours: '10:30 – 21:30',
    priceRange: '280.000 ₫ - 700.000 ₫/khách',
    rating: 4.8,
    reviewsCount: 110,
    specialties: ['Nem công chả phượng cung đình', 'Cơm sen hoàng cung', 'Chè hạt sen long nhãn bọc bột lọc'],
    description: 'Mỗi món ăn là một tác phẩm nghệ thuật tỉ mỉ, thưởng thức trong tiếng nhã nhạc cung đình Huế trang trọng.',
  },
  {
    id: 8,
    name: 'Pine Hill Wine & Steakhouse',
    city: 'Đà Lạt',
    cuisine: 'Bò Bít Tết & Rượu vang',
    address: '15 Khởi Nghĩa Bắc Sơn, Phường 10, Đà Lạt',
    image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=900&q=80',
    hours: '11:00 – 22:00',
    priceRange: '290.000 ₫ - 680.000 ₫/khách',
    rating: 4.9,
    reviewsCount: 146,
    specialties: ['Tomahawk Steak nướng than củi', 'Súp bí đỏ kem nấm', 'Salad rau củ quả hữu cơ Đà Lạt'],
    description: 'Nhà gỗ ấm áp giữa rừng thông reo rì rào, bếp sưởi củi tí tách mang đến không khí lãng mạn bậc nhất xứ sương mù.',
  },
]

export default function Restaurants() {
  const { user } = useAuth()
  const [restaurants] = useState(INITIAL_RESTAURANTS)
  const [selectedCity, setSelectedCity] = useState('Tất cả')
  const [selectedCuisine, setSelectedCuisine] = useState('Tất cả')
  const [searchKeyword, setSearchKeyword] = useState('')

  // Reservation Modal State
  const [resModal, setResModal] = useState(null)
  const [guestName, setGuestName] = useState(user?.fullName || '')
  const [guestPhone, setGuestPhone] = useState('')
  const [resDate, setResDate] = useState('')
  const [resTime, setResTime] = useState('18:30')
  const [partySize, setPartySize] = useState(2)
  const [seatingArea, setSeatingArea] = useState('VIEW_DEP')
  const [specialRequest, setSpecialRequest] = useState('')
  const [resSuccess, setResSuccess] = useState(false)

  const cities = ['Tất cả', 'Đà Nẵng', 'Phú Quốc', 'Nha Trang', 'Hà Nội', 'Hồ Chí Minh', 'Hội An', 'Huế', 'Đà Lạt']
  const cuisines = ['Tất cả', 'Hải sản', 'Bò Bít Tết', 'Ẩm thực Bắc Bộ', 'Ẩm thực Cung đình', 'Rooftop', 'Fine Dining']

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const matchCity = selectedCity === 'Tất cả' || r.city.toLowerCase() === selectedCity.toLowerCase()
      const matchCuisine = selectedCuisine === 'Tất cả' || r.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase())
      const matchQ =
        !searchKeyword.trim() ||
        r.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        r.city.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(searchKeyword.toLowerCase())
      return matchCity && matchCuisine && matchQ
    })
  }, [restaurants, selectedCity, selectedCuisine, searchKeyword])

  function handleOpenReserve(restaurant) {
    setResModal(restaurant)
    setResSuccess(false)
    if (user) {
      setGuestName(user.fullName || user.email)
    }
  }

  function handleConfirmReservation(e) {
    e.preventDefault()
    if (!guestPhone.trim() || !resDate) {
      alert('Vui lòng điền đầy đủ số điện thoại và ngày giờ đặt bàn.')
      return
    }
    setResSuccess(true)
    setTimeout(() => {
      setResModal(null)
      setResSuccess(false)
      setGuestPhone('')
      setSpecialRequest('')
    }, 2800)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-main)] py-10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-100 font-bold">Nhà hàng & Ẩm thực</span>
        </nav>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 p-8 sm:p-12 text-white shadow-2xl mb-10 border border-white/10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Ẩm thực thượng lưu & Bản địa
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Khám Phá Nhà Hàng & Đặt Bàn Ưu Tiên
            </h1>
            <p className="mt-3.5 text-sm sm:text-base text-slate-200/90 leading-relaxed">
              Trải nghiệm ẩm thực hải sản biển tươi ngon, tiệc nướng BBQ hoàng hôn lãng mạn và ẩm thực cung đình truyền thống với dịch vụ giữ bàn ưu tiên từ QuickStay.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm tên nhà hàng, món ăn đặc sản (Hải sản, Bò bít tết, Chả cá...)"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {cuisines.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCuisine(c)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    selectedCuisine === c
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 shrink-0">Thành phố:</span>
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

        {/* Restaurant Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                <span className="absolute left-3 top-3 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[10px] font-bold text-white">
                  📍 {item.city}
                </span>

                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 px-2 py-0.5 text-xs font-black shadow-sm">
                  <span>★</span>
                  <span>{item.rating}</span>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <span className="rounded-md bg-white/20 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white">
                    🕒 {item.hours}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
                  {item.cuisine}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                  {item.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Specialties */}
                <div className="mt-3 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Món đặc trưng:</p>
                  <p className="truncate text-slate-700 dark:text-slate-200 font-medium">
                    🍽️ {item.specialties.join(' · ')}
                  </p>
                </div>

                {/* Footer & CTA */}
                <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-3">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    Mức giá: <strong className="text-sky-700 dark:text-sky-400">{item.priceRange}</strong>
                  </p>

                  <button
                    type="button"
                    onClick={() => handleOpenReserve(item)}
                    className="w-full btn-liquid-glass rounded-xl py-2 text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Đặt bàn giữ chỗ ngay ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center shadow-sm">
            <span className="text-4xl">🍽️</span>
            <p className="mt-3 text-base font-bold text-slate-800 dark:text-white">Không tìm thấy nhà hàng phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">Thử chọn thành phố hoặc danh mục ẩm thực khác.</p>
            <button
              onClick={() => {
                setSelectedCity('Tất cả')
                setSelectedCuisine('Tất cả')
                setSearchKeyword('')
              }}
              className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700"
            >
              Xem tất cả nhà hàng
            </button>
          </div>
        )}

        {/* Reservation Modal */}
        {resModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl animate-popup-in">
              <button
                type="button"
                onClick={() => setResModal(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>

              {resSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-2xl font-black">
                    ✓
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Đặt Bàn Thành Công!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Yêu cầu đặt bàn tại <strong>{resModal.name}</strong> cho {partySize} khách vào lúc {resTime} ngày {resDate} đã được gửi tới quản lý nhà hàng. Chúng tôi sẽ gửi tin nhắn SMS xác nhận tới <strong>{guestPhone}</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConfirmReservation} className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      ĐẶT BÀN ƯU TIÊN
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{resModal.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">📍 {resModal.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày dùng bữa</label>
                      <input
                        type="date"
                        required
                        value={resDate}
                        onChange={(e) => setResDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Giờ đặt bàn</label>
                      <select
                        value={resTime}
                        onChange={(e) => setResTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                      >
                        {['11:30', '12:00', '12:30', '13:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map((time) => (
                          <option key={time} value={time}>{time}</option>
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
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số điện thoại</label>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số khách</label>
                      <select
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20].map((n) => (
                          <option key={n} value={n}>{n} khách</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Khu vực ngồi</label>
                      <select
                        value={seatingArea}
                        onChange={(e) => setSeatingArea(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                      >
                        <option value="VIEW_DEP">Bàn view đẹp / Cửa sổ</option>
                        <option value="NGOAI_TROI">Khu vực ngoài trời / Sân vườn</option>
                        <option value="PHONG_VIP">Phòng riêng VIP (Có tính phí)</option>
                        <option value="KHONG_YEU_CAU">Tùy nhà hàng sắp xếp</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Yêu cầu đặc biệt (Ghi chú)</label>
                    <input
                      type="text"
                      placeholder="Dị ứng thực phẩm, kỷ niệm ngày cưới, ghế trẻ em..."
                      value={specialRequest}
                      onChange={(e) => setSpecialRequest(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[11px] text-slate-400">
                      ⚡ Miễn phí đặt bàn & Giữ chỗ 15 phút
                    </span>

                    <button
                      type="submit"
                      className="btn-liquid-glass rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer"
                    >
                      Xác nhận đặt bàn
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
