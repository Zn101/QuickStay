import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { useAuth } from './store/authStore'

const json = (data, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(data) })

const HOTELS = [
  { id: 1, name: 'Sunrise Da Nang Hotel', city: 'Da Nang', address: '12 Vo Nguyen Giap', description: 'Gan bien', minPrice: 650000 },
]

const ROOMS = [
  {
    id: 101,
    hotelId: 1,
    roomType: 'Deluxe Sea View',
    pricePerNight: 850000,
    capacity: 2,
    quantity: 5,
    description: 'Phong huong bien thoang dang',
    available: 3,
  },
  {
    id: 102,
    hotelId: 1,
    roomType: 'Family Suite',
    pricePerNight: 1500000,
    capacity: 4,
    quantity: 2,
    description: 'Phong gia dinh tien nghi',
    available: 0,
  },
]

const renderAt = (path, state) =>
  render(
    <MemoryRouter initialEntries={state !== undefined ? [{ pathname: path, state }] : [path]}>
      <App />
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
  useAuth.setState({ token: null, user: null })
  vi.stubGlobal('fetch', vi.fn((url, options) => {
    const s = String(url)
    const method = options?.method || 'GET'

    if (s.includes('/api/bookings') && method === 'POST') {
      const body = JSON.parse(options.body)
      return json({
        id: 999,
        roomId: body.roomId,
        roomType: 'Deluxe Sea View',
        hotelId: 1,
        hotelName: 'Sunrise Da Nang Hotel',
        userEmail: 'user@test.com',
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        guests: body.guests,
        guestName: body.guestName,
        guestPhone: body.guestPhone,
        totalPrice: 1700000,
        status: 'PENDING',
      }, 201)
    }

    if (s.includes('/api/bookings/me')) return json([])
    if (s.includes('/api/hotels/1/rooms')) return json(ROOMS)
    if (s.includes('/api/hotels/1')) {
      return json({
        id: 1,
        name: 'Sunrise Da Nang Hotel',
        city: 'Da Nang',
        address: '12 Vo Nguyen Giap',
        description: 'Khach san gan bien My Khe tuyet dep',
        imageUrl: 'https://example.com/hotel.jpg',
        amenities: 'Ho boi, Wifi mien phi, An sang',
        minPrice: 650000,
      })
    }
    if (s.includes('/api/hotels')) return json(HOTELS)
    return json([])
  }))
})

afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('shows hotels on the home page', async () => {
    renderAt('/')
    expect(await screen.findByText('Sunrise Da Nang Hotel')).toBeInTheDocument()
    expect(screen.getByText(/650\.000/)).toBeInTheDocument()
  })

  it('shows my-bookings page for anonymous user', async () => {
    renderAt('/my-bookings')
    expect(await screen.findByRole('heading', { name: 'Đặt phòng của tôi' })).toBeInTheDocument()
  })

  it('shows admin panel hotels page for admin user', async () => {
    useAuth.setState({ token: 't', user: { id: 1, email: 'a@b.c', role: 'ADMIN', fullName: 'A' } })
    renderAt('/admin/hotels')
    expect(await screen.findByText(/quản lý khách sạn/i)).toBeInTheDocument()
  })

  it('shows the backend error message when login fails', async () => {
    localStorage.setItem('quickstay_mock_mode', 'false')
    vi.stubGlobal('fetch', vi.fn(() => json({ message: 'Sai email hoac mat khau' }, 401)))
    renderAt('/login')
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Địa chỉ email'), 'x@y.z')
    await user.type(screen.getByLabelText('Mật khẩu'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sai email hoac mat khau'))
  })
})

describe('UC05 - Hotel Detail, Date Validation & Room List', () => {
  it('T079: renders hotel detail with name, address, description and amenities', async () => {
    renderAt('/hotels/1')
    expect(await screen.findByRole('heading', { name: 'Sunrise Da Nang Hotel' })).toBeInTheDocument()
    expect(screen.getByText(/12 Vo Nguyen Giap, Da Nang/)).toBeInTheDocument()
    expect(screen.getByText('Khach san gan bien My Khe tuyet dep')).toBeInTheDocument()
    expect(screen.getByText('Ho boi')).toBeInTheDocument()
    expect(screen.getByText('Wifi mien phi')).toBeInTheDocument()
    expect(screen.getByText('An sang')).toBeInTheDocument()
  })

  it('T080: validates check-in and check-out dates and displays clear error', async () => {
    renderAt('/hotels/1')
    expect(await screen.findByRole('heading', { name: 'Sunrise Da Nang Hotel' })).toBeInTheDocument()

    const checkInInput = screen.getByLabelText('Ngày nhận')
    const checkOutInput = screen.getByLabelText('Ngày trả')
    const user = userEvent.setup()

    // Nhập ngày trả trước ngày nhận
    await user.clear(checkInInput)
    await user.type(checkInInput, '2026-12-10')
    await user.clear(checkOutInput)
    await user.type(checkOutInput, '2026-12-05')

    // Lỗi phải hiển thị ngay khi nhập hoặc khi bấm "Kiểm tra"
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.')

    // Các nút Đặt ngay phải bị vô hiệu hóa khi ngày không hợp lệ
    const bookButtons = screen.getAllByRole('button', { name: 'Đặt ngay' })
    expect(bookButtons[0]).toBeDisabled()
  })

  it('T081: renders room list with roomType, capacity, price and availability badges', async () => {
    renderAt('/hotels/1')
    expect(await screen.findByText('Deluxe Sea View')).toBeInTheDocument()
    expect(screen.getByText(/2 khách/)).toBeInTheDocument()
    expect(screen.getAllByText(/850\.000/)[0]).toBeInTheDocument()
    expect(screen.getByText('Còn 3 phòng')).toBeInTheDocument()

    // Phòng hết phòng (available: 0)
    expect(screen.getByText('Family Suite')).toBeInTheDocument()
    expect(screen.getByText(/4 khách/)).toBeInTheDocument()
    expect(screen.getByText('Hết phòng')).toBeInTheDocument()

    // Nút đặt phòng hết phòng phải bị disabled
    const bookButtons = screen.getAllByRole('button', { name: 'Đặt ngay' })
    // Nút thứ 2 là của Family Suite (hết phòng)
    expect(bookButtons[1]).toBeDisabled()
  })

  it('UC05: disables booking and shows error when availability API fails', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      const s = String(url)
      if (s.includes('/api/hotels/1/rooms')) {
        return json({ message: 'Không thể kết nối cơ sở dữ liệu phòng' }, 500)
      }
      if (s.includes('/api/hotels/1')) {
        return json({
          id: 1,
          name: 'Sunrise Da Nang Hotel',
          city: 'Da Nang',
          address: '12 Vo Nguyen Giap',
          minPrice: 650000,
        })
      }
      return json([])
    }))

    renderAt('/hotels/1')
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể kết nối cơ sở dữ liệu phòng')
  })
})

describe('UC06 - Booking Form, Validation & Total Price Calculation', () => {
  const initialHotel = HOTELS[0]
  const initialRoom = ROOMS[0]

  it('T092: renders booking form and summary card with room details', async () => {
    useAuth.setState({
      token: 'jwt-token-123',
      user: { id: 2, email: 'customer@test.com', fullName: 'Nguyen Van B', phone: '0901234567' },
    })

    renderAt('/hotels/1/rooms/101/book', {
      hotel: initialHotel,
      room: initialRoom,
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
    })

    expect(await screen.findByRole('heading', { name: 'Thông tin đặt phòng' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Nguyen Van B')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0901234567')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()

    // Summary Card
    expect(screen.getByText('Tóm tắt đặt phòng')).toBeInTheDocument()
    expect(screen.getAllByText('Sunrise Da Nang Hotel').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Deluxe Sea View')).toBeInTheDocument()
    expect(screen.getByText('01/12/2026')).toBeInTheDocument()
    expect(screen.getByText('03/12/2026')).toBeInTheDocument()
    expect(screen.getAllByText('2 đêm').length).toBeGreaterThanOrEqual(1)
    // 850,000 * 2 = 1,700,000
    expect(screen.getByText('1.700.000 ₫')).toBeInTheDocument()
  })

  it('T092: validates empty fields, invalid phone, and guest capacity', async () => {
    useAuth.setState({
      token: 'jwt-token-123',
      user: { id: 2, email: 'customer@test.com', fullName: '', phone: '' },
    })

    renderAt('/hotels/1/rooms/101/book', {
      hotel: initialHotel,
      room: initialRoom,
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
    })

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText(/Họ tên người nhận phòng/)
    const phoneInput = screen.getByLabelText(/Số điện thoại liên hệ/)
    const guestsInput = screen.getByLabelText(/Số lượng khách/)

    // Xóa trắng họ tên, nhập phone sai định dạng, nhập khách quá tải
    await user.clear(nameInput)
    await user.type(phoneInput, '123')
    await user.clear(guestsInput)
    await user.type(guestsInput, '5')

    await user.click(screen.getByRole('button', { name: 'Xác nhận đặt phòng' }))

    // Kiểm tra các thông báo lỗi hiển thị cho từng trường
    expect(await screen.findByText('Vui lòng nhập họ và tên người nhận phòng.')).toBeInTheDocument()
    expect(screen.getByText(/Số điện thoại không hợp lệ/)).toBeInTheDocument()
    expect(screen.getByText('Số khách không được vượt quá sức chứa tối đa (2 khách).')).toBeInTheDocument()
  })

  it('T093: dynamically updates total price when changing dates and handles invalid dates', async () => {
    useAuth.setState({
      token: 'jwt-token-123',
      user: { id: 2, email: 'customer@test.com', fullName: 'Nguyen Van A', phone: '0912345678' },
    })

    renderAt('/hotels/1/rooms/101/book', {
      hotel: initialHotel,
      room: initialRoom,
      checkIn: '2026-12-01',
      checkOut: '2026-12-02', // 1 đêm: 850,000
    })

    expect(await screen.findByRole('heading', { name: 'Thông tin đặt phòng' })).toBeInTheDocument()
    expect(screen.getAllByText('1 đêm').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('850.000 ₫').length).toBeGreaterThanOrEqual(1)

    const user = userEvent.setup()
    const checkOutInput = screen.getByLabelText(/Ngày trả phòng/)

    // Đổi sang 4 đêm: 01/12 đến 05/12 -> 4 * 850,000 = 3,400,000
    await user.clear(checkOutInput)
    await user.type(checkOutInput, '2026-12-05')

    expect(screen.getAllByText('4 đêm').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('3.400.000 ₫')).toBeInTheDocument()

    // Đổi sang ngày không hợp lệ: ngày trả trước ngày nhận
    await user.clear(checkOutInput)
    await user.type(checkOutInput, '2026-11-20')

    expect(screen.getByText('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.')).toBeInTheDocument()
    // Khi ngày trả phòng không hợp lệ, số đêm và tổng tiền hiển thị '—'
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
  })

  it('T092: successfully submits booking and navigates to my-bookings', async () => {
    useAuth.setState({
      token: 'jwt-token-123',
      user: { id: 2, email: 'customer@test.com', fullName: 'Nguyen Van A', phone: '0912345678' },
    })

    renderAt('/hotels/1/rooms/101/book', {
      hotel: initialHotel,
      room: initialRoom,
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
    })

    const user = userEvent.setup()
    const submitBtn = screen.getByRole('button', { name: 'Xác nhận đặt phòng' })
    await user.click(submitBtn)

    // Điều hướng tới MyBookings và hiển thị mã đơn mới
    expect(await screen.findByText(/Đặt phòng thành công! Mã đơn #999/)).toBeInTheDocument()
  })
})
