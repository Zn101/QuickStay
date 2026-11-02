import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { useAuth } from './store/authStore'

const json = (data, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(data) })

const HOTELS = [
  { id: 1, name: 'Sunrise Da Nang Hotel', city: 'Da Nang', description: 'Gan bien', minPrice: 650000 },
]

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
  useAuth.setState({ token: null, user: null })
  vi.stubGlobal('fetch', vi.fn((url) => (String(url).includes('/api/hotels') ? json(HOTELS) : json({}))))
})
afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('shows hotels on the home page', async () => {
    renderAt('/')
    expect(await screen.findByText('Sunrise Da Nang Hotel')).toBeInTheDocument()
    expect(screen.getByText(/650\.000/)).toBeInTheDocument()
  })

  it('shows my-bookings page for anonymous user (mock mode shows data)', async () => {
    renderAt('/my-bookings')
    expect(await screen.findByRole('heading', { name: 'Đặt phòng của tôi' })).toBeInTheDocument()
  })

  it('shows admin panel hotels page for admin user', async () => {
    useAuth.setState({ token: 't', user: { id: 1, email: 'a@b.c', role: 'ADMIN', fullName: 'A' } })
    renderAt('/admin/hotels')
    expect(await screen.findByText('Quản lý khách sạn')).toBeInTheDocument()
  })

  it('shows the backend error message when login fails', async () => {
    // Tắt Mock Data để fetch() thật được gọi và vi.fn() mock có hiệu lực
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

