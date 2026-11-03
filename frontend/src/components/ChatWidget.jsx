import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

const GREETING = { from: 'bot', text: 'Xin chào! Mình là trợ lý QuickStay. Bạn muốn hỏi về khách sạn, phòng, giá hay tiện nghi?' }

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (e) => {
    e.preventDefault()
    const msg = text.trim()
    if (!msg || busy) return
    setText('')
    setMessages((m) => [...m, { from: 'user', text: msg }])
    setBusy(true)
    try {
      const res = await api('/ai/chat', { method: 'POST', body: { message: msg } })
      setMessages((m) => [...m, { from: 'bot', text: res.reply }])
    } catch (err) {
      setMessages((m) => [...m, { from: 'bot', text: 'Xin lỗi, trợ lý đang bận: ' + err.message }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-3 flex h-96 w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border bg-white shadow-xl">
          <div className="flex items-center justify-between bg-brand-500 px-4 py-2 text-white">
            <span className="font-medium">Trợ lý QuickStay</span>
            <button aria-label="Đóng chat" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 ${m.from === 'user' ? 'bg-brand-500 text-white' : 'bg-slate-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-slate-400">Đang trả lời...</p>}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t p-2">
            <input className="input" placeholder="Nhập câu hỏi..." value={text} maxLength={500}
                   onChange={(e) => setText(e.target.value)} aria-label="Tin nhắn" />
            <button className="btn-primary" disabled={busy}>Gửi</button>
          </form>
        </div>
      )}
      <button className="btn-primary h-12 w-12 rounded-full text-xl shadow-lg" aria-label="Mở chat" onClick={() => setOpen((o) => !o)}>
        💬
      </button>
    </div>
  )
}
