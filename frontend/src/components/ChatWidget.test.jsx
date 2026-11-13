import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChatWidget from './ChatWidget'

const json = (data, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(data) })

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url, options) => {
    const s = String(url)
    if (s.includes('/api/ai/chat')) {
      const body = options?.body ? JSON.parse(options.body) : {}
      return json({ reply: `Câu trả lời cho: ${body.message}` })
    }
    return json({})
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ChatWidget Component', () => {
  it('renders the floating chat button and toggles chat window', async () => {
    render(<ChatWidget />)
    const openBtn = screen.getByRole('button', { name: 'Mở chat' })
    expect(openBtn).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(openBtn)

    expect(screen.getByText('Trợ lý QuickStay')).toBeInTheDocument()
    expect(screen.getByText(/Bạn muốn hỏi về khách sạn, phòng, giá hay tiện nghi/)).toBeInTheDocument()
    expect(screen.getByLabelText('Tin nhắn')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi tin nhắn' })).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'Đóng cửa sổ chat' })
    await user.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByText('Trợ lý QuickStay')).not.toBeInTheDocument()
    })
  })

  it('sends user message and displays bot response', async () => {
    render(<ChatWidget />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Mở chat' }))

    const input = screen.getByLabelText('Tin nhắn')
    await user.type(input, 'Khách sạn ở Đà Nẵng giá thế nào?')
    await user.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }))

    expect(await screen.findByText('Khách sạn ở Đà Nẵng giá thế nào?')).toBeInTheDocument()
    expect(await screen.findByText('Câu trả lời cho: Khách sạn ở Đà Nẵng giá thế nào?')).toBeInTheDocument()
  })

  it('triggers quick prompt chip when clicked', async () => {
    render(<ChatWidget />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Mở chat' }))

    const chip = screen.getByRole('button', { name: 'Khách sạn ở Đà Nẵng giá bao nhiêu?' })
    await user.click(chip)

    expect((await screen.findAllByText('Khách sạn ở Đà Nẵng giá bao nhiêu?')).length).toBeGreaterThanOrEqual(2)
    expect(await screen.findByText('Câu trả lời cho: Khách sạn ở Đà Nẵng giá bao nhiêu?')).toBeInTheDocument()
  })
})
