// QuickStay Mock Database (Lưu trữ trong localStorage để lưu giữ thay đổi khi test UI)

const STORAGE_KEYS = {
  HOTELS: 'quickstay_mock_hotels',
  ROOMS: 'quickstay_mock_rooms',
  BOOKINGS: 'quickstay_mock_bookings',
  USERS: 'quickstay_mock_users',
}

const DEFAULT_USERS = [
  {
    id: 1,
    email: 'admin@quickstay.local',
    fullName: 'Quản Trị Viên QuickStay',
    phone: '0901234567',
    role: 'ADMIN',
  },
  {
    id: 2,
    email: 'user@quickstay.local',
    fullName: 'Nguyễn Văn An',
    phone: '0912345678',
    role: 'CUSTOMER',
  },
]

const DEFAULT_HOTELS = [
  {
    id: 1,
    name: 'Sunrise Da Nang Hotel',
    city: 'Đà Nẵng',
    address: '12 Võ Nguyên Giáp, Quận Sơn Trà, TP. Đà Nẵng',
    description:
      'Khách sạn 4 sao sát bờ biển Mỹ Khê xinh đẹp. Tầm nhìn hướng biển tuyệt mỹ, dịch vụ chuẩn quốc tế, hồ bơi vô cực trên tầng thượng và ẩm thực miền Trung đặc sắc.',
    imageUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop&q=80',
    amenities: 'Hồ bơi vô cực, Wifi miễn phí, Bữa sáng buffet, Gần biển, Gym & Spa, Đưa đón sân bay',
    minPrice: 650000,
  },
  {
    id: 2,
    name: 'Heritage Boutique Hotel Hanoi',
    city: 'Hà Nội',
    address: '28 Hàng Trống, Quận Hoàn Kiếm, TP. Hà Nội',
    description:
      'Không gian mang đậm dấu ấn kiến trúc Đông Dương giữa lòng Phố Cổ. Chỉ 2 phút đi bộ ra Hồ Gươm, không gian ấm cúng, sang trọng và thanh lịch cho chuyến khám phá thủ đô.',
    imageUrl:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&auto=format&fit=crop&q=80',
    amenities: 'Trung tâm Phố Cổ, Bữa sáng Á - Âu, Wifi tốc độ cao, Quầy bar tầng thượng, Dịch vụ phòng 24/7',
    minPrice: 850000,
  },
  {
    id: 3,
    name: 'Saigon Riverfront Palace',
    city: 'TP. Hồ Chí Minh',
    address: '8 Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    description:
      'Tọa lạc ngay ven sông Sài Gòn thơ mộng, đối diện phố đi bộ Nguyễn Huệ. Tiện nghi hiện đại bậc nhất, nhà hàng ẩm thực cao cấp và phong cách phục vụ tận tâm.',
    imageUrl:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1000&auto=format&fit=crop&q=80',
    amenities: 'View sông Sài Gòn, Hồ bơi ngoài trời, Spa thư giãn, Nhà hàng chuẩn 5 sao, Bãi đỗ xe miễn phí',
    minPrice: 1200000,
  },
  {
    id: 4,
    name: 'Pine Hill Resort & Spa Dalat',
    city: 'Đà Lạt',
    address: '10 Triệu Việt Vương, Phường 4, TP. Đà Lạt, Lâm Đồng',
    description:
      'Ẩn mình giữa đồi thông xanh ngát và sương mờ Đà Lạt. Không gian tĩnh lặng, khí hậu trong lành, các villa gỗ mộc mạc và ấm cúng cho kỳ nghỉ trọn vẹn bình yên.',
    imageUrl:
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1000&auto=format&fit=crop&q=80',
    amenities: 'Sân vườn đồi thông, Lò sưởi ấm, Trà chiều & Cafe, Bữa sáng cao nguyên, Cho thuê xe máy',
    minPrice: 750000,
  },
  {
    id: 5,
    name: 'Phu Quoc Emerald Bay Luxury',
    city: 'Phú Quốc',
    address: 'Bãi Khem, Phường An Thới, TP. Phú Quốc, Kiên Giang',
    description:
      'Khu nghỉ dưỡng biển đẳng cấp hàng đầu với bờ cát trắng mịn và làn nước xanh ngọc bích. Trải nghiệm ẩm thực thượng hạng, các hoạt động biển hấp dẫn và spa thư giãn tối đa.',
    imageUrl:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000&auto=format&fit=crop&q=80',
    amenities: 'Bãi biển riêng, Bể bơi nhiều tầng, Thể thao dưới nước, Kids Club, Spa cao cấp, Nhà hàng hải sản',
    minPrice: 1800000,
  },
  {
    id: 6,
    name: 'Nha Trang Bay Ocean Resort',
    city: 'Nha Trang',
    address: '72 Trần Phú, Phường Lộc Thọ, TP. Nha Trang, Khánh Hòa',
    description:
      'Tọa lạc trên cung đường ven biển Trần Phú sôi động. 100% phòng có ban công đón gió biển trong lành, hồ bơi vô cực ngắm vịnh Nha Trang tráng lệ cả ngày lẫn đêm.',
    imageUrl:
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1000&auto=format&fit=crop&q=80',
    amenities: 'Sát bãi tắm, Buffet hải sản, Gym & Yoga biển, Wifi tốc độ cao, Quầy tour du ngoạn đảo',
    minPrice: 900000,
  },
]

const DEFAULT_ROOMS = [
  // Hotel 1 - Sunrise Da Nang
  {
    id: 1,
    hotelId: 1,
    roomType: 'Standard Queen',
    pricePerNight: 650000,
    capacity: 2,
    quantity: 6,
    available: 6,
    description: 'Phòng Standard ấm cúng, 1 giường Queen, cửa sổ thoáng mát, đầy đủ minibar và trà/cà phê miễn phí.',
  },
  {
    id: 2,
    hotelId: 1,
    roomType: 'Deluxe Ocean View',
    pricePerNight: 950000,
    capacity: 2,
    quantity: 4,
    available: 4,
    description: 'Phòng Deluxe có ban công riêng nhìn thẳng ra biển Mỹ Khê. Ngắm bình minh biển tuyệt đẹp ngay tại giường.',
  },
  {
    id: 3,
    hotelId: 1,
    roomType: 'Family Suite',
    pricePerNight: 1500000,
    capacity: 4,
    quantity: 2,
    available: 2,
    description: 'Suite rộng 65m² với 2 phòng ngủ riêng biệt, phòng khách sang trọng và bồn tắm nằm view biển.',
  },

  // Hotel 2 - Heritage Hanoi
  {
    id: 4,
    hotelId: 2,
    roomType: 'Boutique Classic',
    pricePerNight: 850000,
    capacity: 2,
    quantity: 5,
    available: 5,
    description: 'Phong cách Indochine hoài niệm với nội thất gỗ cao cấp, sàn lát gạch bông và ban công đón nắng phố cổ.',
  },
  {
    id: 5,
    hotelId: 2,
    roomType: 'Executive Balcony',
    pricePerNight: 1250000,
    capacity: 2,
    quantity: 3,
    available: 3,
    description: 'Tầm nhìn bao trọn phố Hoàn Kiếm, trang bị bồn tắm sục Jacuzzi và dịch vụ phòng trà chiều cao cấp.',
  },

  // Hotel 3 - Saigon Riverfront
  {
    id: 6,
    hotelId: 3,
    roomType: 'Superior City View',
    pricePerNight: 1200000,
    capacity: 2,
    quantity: 8,
    available: 8,
    description: 'Phòng hiện đại tầng cao ngắm nhìn toàn cảnh trung tâm TP.HCM lung linh ánh đèn đêm.',
  },
  {
    id: 7,
    hotelId: 3,
    roomType: 'Grand Riverfront Suite',
    pricePerNight: 2100000,
    capacity: 3,
    quantity: 2,
    available: 2,
    description: 'Cửa kính panorama trải dài nhìn thẳng ra bến Bạch Đằng và sông Sài Gòn, quầy bar cá nhân đầy đủ.',
  },

  // Hotel 4 - Pine Hill Dalat
  {
    id: 8,
    hotelId: 4,
    roomType: 'Pine Valley Deluxe',
    pricePerNight: 750000,
    capacity: 2,
    quantity: 5,
    available: 5,
    description: 'Cửa kính sát đất view rừng thông bảng lảng sương sớm, hiên ban công uống trà mộc mạc và thư thái.',
  },
  {
    id: 9,
    hotelId: 4,
    roomType: 'Cozy Wooden Bungalow',
    pricePerNight: 1350000,
    capacity: 4,
    quantity: 3,
    available: 3,
    description: 'Bungalow gỗ thông thơm nồng có lò sưởi ấm cúng, bếp nhỏ và khoảng sân riêng tổ chức BBQ.',
  },

  // Hotel 5 - Phu Quoc Emerald Bay
  {
    id: 10,
    hotelId: 5,
    roomType: 'Tropical Garden Villa',
    pricePerNight: 1800000,
    capacity: 2,
    quantity: 4,
    available: 4,
    description: 'Biệt thự giữa vườn cây nhiệt đới xanh mướt, lối đi riêng ra bãi cát và vòi tắm hoa sen ngoài trời.',
  },
  {
    id: 11,
    hotelId: 5,
    roomType: 'Oceanfront Luxury Villa',
    pricePerNight: 3200000,
    capacity: 4,
    quantity: 2,
    available: 2,
    description: 'Biệt thự sát biển với hồ bơi vô cực riêng, chỉ vài bước chân là chạm làn nước biển ngọc bích.',
  },

  // Hotel 6 - Nha Trang Bay
  {
    id: 12,
    hotelId: 6,
    roomType: 'Deluxe Ocean King',
    pricePerNight: 900000,
    capacity: 2,
    quantity: 6,
    available: 6,
    description: 'Giường King êm ái, bồn tắm kính nhìn ra vịnh biển Nha Trang và thiết bị thông minh hiện đại.',
  },
]

const DEFAULT_BOOKINGS = [
  {
    id: 101,
    roomId: 2,
    roomType: 'Deluxe Ocean View',
    hotelId: 1,
    hotelName: 'Sunrise Da Nang Hotel',
    userEmail: 'user@quickstay.local',
    checkIn: '2026-11-10',
    checkOut: '2026-11-13',
    guests: 2,
    guestName: 'Nguyễn Văn An',
    guestPhone: '0912345678',
    note: 'Nhận phòng sớm sau 12h nếu có thể',
    totalPrice: 2850000,
    status: 'CONFIRMED',
    createdAt: '2026-10-25T08:30:00.000Z',
  },
  {
    id: 102,
    roomId: 4,
    roomType: 'Boutique Classic',
    hotelId: 2,
    hotelName: 'Heritage Boutique Hotel Hanoi',
    userEmail: 'user@quickstay.local',
    checkIn: '2026-11-20',
    checkOut: '2026-11-22',
    guests: 2,
    guestName: 'Nguyễn Văn An',
    guestPhone: '0912345678',
    note: 'Phòng yên tĩnh',
    totalPrice: 1700000,
    status: 'PENDING',
    createdAt: '2026-10-27T14:15:00.000Z',
  },
  {
    id: 103,
    roomId: 6,
    roomType: 'Superior City View',
    hotelId: 3,
    hotelName: 'Saigon Riverfront Palace',
    userEmail: 'admin@quickstay.local',
    checkIn: '2026-10-15',
    checkOut: '2026-10-17',
    guests: 1,
    guestName: 'Quản Trị Viên QuickStay',
    guestPhone: '0901234567',
    note: 'Chuyến công tác',
    totalPrice: 2400000,
    status: 'COMPLETED',
    createdAt: '2026-10-12T09:00:00.000Z',
  },
]

// Hàm đọc/ghi localStorage để mô phỏng Database
function getStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('Mock storage write error', err)
  }
}

// Khởi tạo database nếu chưa có
export function initMockStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.HOTELS)) {
    setStorage(STORAGE_KEYS.HOTELS, DEFAULT_HOTELS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    setStorage(STORAGE_KEYS.ROOMS, DEFAULT_ROOMS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    setStorage(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStorage(STORAGE_KEYS.USERS, DEFAULT_USERS)
  }
}

// Helper tính minPrice cho khách sạn
function computeHotelMinPrice(hotelId, rooms) {
  const hotelRooms = rooms.filter((r) => r.hotelId === hotelId)
  if (hotelRooms.length === 0) return 0
  return Math.min(...hotelRooms.map((r) => r.pricePerNight))
}

// Giả lập network delay ngắn cho trải nghiệm mượt mà
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

// Bộ định tuyến xử lý Mock API
export async function handleMockApi(path, { method = 'GET', body, params } = {}) {
  initMockStorage()
  await delay(100)

  let hotels = getStorage(STORAGE_KEYS.HOTELS, DEFAULT_HOTELS)
  let rooms = getStorage(STORAGE_KEYS.ROOMS, DEFAULT_ROOMS)
  let bookings = getStorage(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS)
  let users = getStorage(STORAGE_KEYS.USERS, DEFAULT_USERS)

  // 1. Auth: Đăng nhập
  if (path === '/auth/login' && method === 'POST') {
    const { email } = body || {}
    let user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase())
    if (!user) {
      // Tự động tạo user nếu chưa có hoặc cho phép login bất kỳ
      const isAdmin = (email || '').toLowerCase().includes('admin')
      user = {
        id: Date.now(),
        email: email || 'user@quickstay.local',
        fullName: isAdmin ? 'Quản Trị Viên QuickStay' : 'Khách Hàng QuickStay',
        phone: '0912345678',
        role: isAdmin ? 'ADMIN' : 'CUSTOMER',
      }
      users.push(user)
      setStorage(STORAGE_KEYS.USERS, users)
    }
    return {
      token: 'mock-jwt-token-' + user.id + '-' + Date.now(),
      user,
    }
  }

  // 2. Auth: Đăng ký
  if (path === '/auth/register' && method === 'POST') {
    const { email, fullName, phone } = body || {}
    const existing = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase())
    if (existing) {
      const err = new Error('Email đã được sử dụng')
      err.status = 409
      throw err
    }
    const newUser = {
      id: Date.now(),
      email,
      fullName: fullName || 'Người dùng mới',
      phone: phone || '',
      role: 'CUSTOMER',
    }
    users.push(newUser)
    setStorage(STORAGE_KEYS.USERS, users)
    return {
      token: 'mock-jwt-token-' + newUser.id,
      user: newUser,
    }
  }

  // 3. Profile
  if (path === '/users/me') {
    if (method === 'GET') {
      return users[0]
    }
    if (method === 'PUT') {
      const current = users[0]
      const updated = { ...current, ...body }
      users = users.map((u) => (u.id === current.id ? updated : u))
      setStorage(STORAGE_KEYS.USERS, users)
      return updated
    }
  }

  // 4. Danh sách khách sạn (GET /hotels hoặc GET /admin/hotels)
  if ((path === '/hotels' || path === '/admin/hotels') && method === 'GET') {
    let list = hotels.map((h) => ({
      ...h,
      minPrice: computeHotelMinPrice(h.id, rooms) || h.minPrice || 500000,
    }))

    if (params?.q) {
      const q = params.q.toLowerCase()
      list = list.filter(
        (h) => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
      )
    }
    if (params?.city) {
      const city = params.city.toLowerCase()
      list = list.filter((h) => h.city.toLowerCase().includes(city))
    }
    return list
  }

  // 5. Chi tiết 1 khách sạn (GET /hotels/:id)
  const hotelMatch = path.match(/^\/hotels\/(\d+)$/)
  if (hotelMatch && method === 'GET') {
    const id = Number(hotelMatch[1])
    const found = hotels.find((h) => h.id === id)
    if (!found) {
      const err = new Error('Không tìm thấy khách sạn')
      err.status = 404
      throw err
    }
    return {
      ...found,
      minPrice: computeHotelMinPrice(found.id, rooms) || found.minPrice || 500000,
    }
  }

  // 6. Danh sách phòng của khách sạn (GET /hotels/:id/rooms)
  const hotelRoomsMatch = path.match(/^\/hotels\/(\d+)\/rooms$/)
  if (hotelRoomsMatch && method === 'GET') {
    const hotelId = Number(hotelRoomsMatch[1])
    return rooms.filter((r) => r.hotelId === hotelId)
  }

  // 7. Đặt phòng (POST /bookings)
  if (path === '/bookings' && method === 'POST') {
    const { roomId, checkIn, checkOut, guests, guestName, guestPhone, note } = body || {}
    const room = rooms.find((r) => r.id === Number(roomId))
    const hotel = hotels.find((h) => h.id === room?.hotelId)

    // Tính số đêm
    const nights = Math.max(
      1,
      Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) || 1
    )
    const totalPrice = (room?.pricePerNight || 800000) * nights

    const newBooking = {
      id: Date.now() % 100000,
      roomId: Number(roomId),
      roomType: room?.roomType || 'Phòng Tiêu Chuẩn',
      hotelId: hotel?.id || 1,
      hotelName: hotel?.name || 'Khách sạn QuickStay',
      userEmail: 'user@quickstay.local',
      checkIn,
      checkOut,
      guests: Number(guests) || 1,
      guestName: guestName || 'Khách Hàng',
      guestPhone: guestPhone || '0912345678',
      note: note || '',
      totalPrice,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }

    bookings.unshift(newBooking)
    setStorage(STORAGE_KEYS.BOOKINGS, bookings)
    return newBooking
  }

  // 8. Đặt phòng của tôi (GET /bookings/me)
  if (path === '/bookings/me' && method === 'GET') {
    return bookings
  }

  // 9. Hủy đặt phòng (PATCH /bookings/:id/cancel)
  const cancelMatch = path.match(/^\/bookings\/(\d+)\/cancel$/)
  if (cancelMatch && method === 'PATCH') {
    const id = Number(cancelMatch[1])
    let target = bookings.find((b) => b.id === id)
    if (!target) {
      const err = new Error('Không tìm thấy đơn đặt phòng')
      err.status = 404
      throw err
    }
    target.status = 'CANCELLED'
    bookings = bookings.map((b) => (b.id === id ? target : b))
    setStorage(STORAGE_KEYS.BOOKINGS, bookings)
    return target
  }

  // 10. Admin: Tạo khách sạn (POST /admin/hotels)
  if (path === '/admin/hotels' && method === 'POST') {
    const newHotel = {
      id: Date.now() % 100000,
      name: body.name || 'Khách sạn mới',
      city: body.city || 'Việt Nam',
      address: body.address || '',
      description: body.description || '',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      amenities: body.amenities || 'Wifi miễn phí, Máy lạnh, Bữa sáng',
      minPrice: 500000,
    }
    hotels.push(newHotel)
    setStorage(STORAGE_KEYS.HOTELS, hotels)
    return newHotel
  }

  // 11. Admin: Cập nhật khách sạn (PUT /admin/hotels/:id)
  const adminHotelUpdateMatch = path.match(/^\/admin\/hotels\/(\d+)$/)
  if (adminHotelUpdateMatch && method === 'PUT') {
    const id = Number(adminHotelUpdateMatch[1])
    hotels = hotels.map((h) => (h.id === id ? { ...h, ...body } : h))
    setStorage(STORAGE_KEYS.HOTELS, hotels)
    return hotels.find((h) => h.id === id)
  }

  // 12. Admin: Xóa khách sạn (DELETE /admin/hotels/:id)
  if (adminHotelUpdateMatch && method === 'DELETE') {
    const id = Number(adminHotelUpdateMatch[1])
    hotels = hotels.filter((h) => h.id !== id)
    setStorage(STORAGE_KEYS.HOTELS, hotels)
    return null
  }

  // 13. Admin: Danh sách phòng (GET /admin/rooms)
  if (path === '/admin/rooms' && method === 'GET') {
    if (params?.hotelId) {
      return rooms.filter((r) => r.hotelId === Number(params.hotelId))
    }
    return rooms
  }

  // 14. Admin: Tạo phòng (POST /admin/rooms)
  if (path === '/admin/rooms' && method === 'POST') {
    const newRoom = {
      id: Date.now() % 100000,
      hotelId: Number(body.hotelId),
      roomType: body.roomType,
      pricePerNight: Number(body.pricePerNight),
      capacity: Number(body.capacity),
      quantity: Number(body.quantity),
      available: Number(body.quantity),
      description: body.description || '',
    }
    rooms.push(newRoom)
    setStorage(STORAGE_KEYS.ROOMS, rooms)
    return newRoom
  }

  // 15. Admin: Sửa phòng (PUT /admin/rooms/:id)
  const adminRoomUpdateMatch = path.match(/^\/admin\/rooms\/(\d+)$/)
  if (adminRoomUpdateMatch && method === 'PUT') {
    const id = Number(adminRoomUpdateMatch[1])
    rooms = rooms.map((r) => (r.id === id ? { ...r, ...body } : r))
    setStorage(STORAGE_KEYS.ROOMS, rooms)
    return rooms.find((r) => r.id === id)
  }

  // 16. Admin: Xóa phòng (DELETE /admin/rooms/:id)
  if (adminRoomUpdateMatch && method === 'DELETE') {
    const id = Number(adminRoomUpdateMatch[1])
    rooms = rooms.filter((r) => r.id !== id)
    setStorage(STORAGE_KEYS.ROOMS, rooms)
    return null
  }

  // 17. Admin: Danh sách đơn (GET /admin/bookings)
  if (path === '/admin/bookings' && method === 'GET') {
    return bookings
  }

  // 18. Admin: Đổi trạng thái đơn (PATCH /admin/bookings/:id/status)
  const adminBookingStatusMatch = path.match(/^\/admin\/bookings\/(\d+)\/status$/)
  if (adminBookingStatusMatch && method === 'PATCH') {
    const id = Number(adminBookingStatusMatch[1])
    const { status } = body || {}
    let target = bookings.find((b) => b.id === id)
    if (target) {
      target.status = status
      bookings = bookings.map((b) => (b.id === id ? target : b))
      setStorage(STORAGE_KEYS.BOOKINGS, bookings)
      return target
    }
  }

  // 19. AI: Sinh mô tả khách sạn / phòng (POST /ai/describe)
  if (path === '/ai/describe' && method === 'POST') {
    const { name, city, amenities, roomType, type } = body || {}
    if (type === 'room' || roomType) {
      return {
        description: `Không gian phòng ${roomType || 'tiêu chuẩn'} được bài trí trang nhã và ấm cúng. Trang bị giường nệm cao cấp, ban công thoáng đãng đón ánh sáng tự nhiên và phòng tắm hiện đại với đầy đủ tiện nghi, mang đến giấc ngủ sâu và trọn vẹn cho kỳ nghỉ của quý khách.`,
      }
    }
    return {
      description: `Tọa lạc tại vị trí đắc địa ở ${city || 'trung tâm thành phố'}, ${name || 'khách sạn'} mang đến không gian nghỉ dưỡng lý tưởng kết hợp giữa nét kiến trúc hiện đại và sự tiện nghi tinh tế. Khách sạn sở hữu các tiện ích nổi bật như ${amenities || 'hồ bơi, wifi tốc độ cao, bữa sáng buffet phong phú'}, đáp ứng hoàn hảo nhu cầu du lịch nghỉ dưỡng lẫn công tác.`,
    }
  }

  // Mặc định fallback
  return null
}
