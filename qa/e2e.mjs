// Kiem thu E2E qua API: dang ky -> tim -> xem phong trong -> dat phong -> admin xac nhan -> khach xem lich su.
// Chay: node qa/e2e.mjs [BASE_URL]   (mac dinh http://localhost:8080)
const BASE = process.argv[2] || 'http://localhost:8080'
const results = []
let seq = 0

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  return { status: res.status, data }
}

function check(name, cond, detail = '') {
  results.push({ id: `E2E-${String(++seq).padStart(2, '0')}`, name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  E2E-${String(seq).padStart(2, '0')}  ${name}${cond ? '' : '  -> ' + detail}`)
}

const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const email = `e2e-${Date.now()}@test.com`

const reg = await call('POST', '/api/auth/register', { body: { email, password: 'secret123', fullName: 'E2E User', phone: '0900000001' } })
check('Dang ky tai khoan moi', reg.status === 201 && reg.data?.token, JSON.stringify(reg))
const cust = reg.data?.token

const search = await call('GET', '/api/hotels?q=Da%20Nang')
check('Tim kiem khach san theo thanh pho', search.status === 200 && search.data.length >= 1)
const hotel = search.data[0]

const rooms = await call('GET', `/api/hotels/${hotel.id}/rooms?checkIn=${day(200)}&checkOut=${day(202)}`)
check('Xem phong trong theo ngay', rooms.status === 200 && rooms.data.every((r) => r.available > 0))
const room = rooms.data[0]

const book = await call('POST', '/api/bookings', {
  token: cust,
  body: { roomId: room.id, checkIn: day(200), checkOut: day(202), guests: 2, guestName: 'E2E User', guestPhone: '0900000001', note: 'e2e' },
})
check('Dat phong -> PENDING, tong tien theo so dem', book.status === 201 && book.data.status === 'PENDING' && Number(book.data.totalPrice) === room.pricePerNight * 2, JSON.stringify(book))

const rooms2 = await call('GET', `/api/hotels/${hotel.id}/rooms?checkIn=${day(200)}&checkOut=${day(202)}`)
check('So phong trong giam sau khi dat', rooms2.data.find((r) => r.id === room.id).available === room.quantity - 1)

const admin = await call('POST', '/api/auth/login', { body: { email: 'admin@quickstay.local', password: 'Admin@123' } })
check('Admin dang nhap', admin.status === 200 && admin.data.user.role === 'ADMIN')
const at = admin.data.token

const list = await call('GET', '/api/admin/bookings', { token: at })
check('Admin thay dat phong cua khach', list.status === 200 && list.data.some((b) => b.id === book.data.id))

for (const s of ['CONFIRMED', 'CHECKED_IN', 'COMPLETED']) {
  const r = await call('PATCH', `/api/admin/bookings/${book.data.id}/status`, { token: at, body: { status: s } })
  check(`Admin chuyen trang thai -> ${s}`, r.status === 200 && r.data.status === s)
}

const hist = await call('GET', '/api/bookings/me', { token: cust })
check('Khach thay lich su voi trang thai COMPLETED', hist.status === 200 && hist.data[0]?.status === 'COMPLETED')

const desc = await call('POST', '/api/ai/describe', { token: at, body: { type: 'hotel', name: 'Hotel E2E', city: 'Hue', amenities: 'Ho boi, Wifi' } })
check('AI sinh mo ta khach san', desc.status === 200 && desc.data.description.length > 20)

const chat = await call('POST', '/api/ai/chat', { body: { message: 'Khach san o Da Nang gia bao nhieu?' } })
check('Chatbot tra loi cau hoi ve khach san', chat.status === 200 && chat.data.reply.length > 10)

const pass = results.filter((r) => r.pass).length
console.log(`\nKet qua: ${pass}/${results.length} dat (${Math.round((pass / results.length) * 100)}%)`)
process.exit(pass === results.length ? 0 : 1)
