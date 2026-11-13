import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

const GREETING = {
  from: 'bot',
  text: 'Xin chào! Mình là trợ lý QuickStay. Bạn muốn hỏi về khách sạn, phòng, giá hay tiện nghi?',
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}

const QUICK_PROMPTS = [
  'Khách sạn ở Đà Nẵng giá bao nhiêu?',
  'Giá phòng rẻ nhất hiện tại?',
  'Dịch vụ đưa đón sân bay thế nào?',
  'Chính sách hủy phòng và hoàn tiền?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView?.({ behavior: 'smooth' })
      inputRef.current?.focus?.()
    }
  }, [messages, open])

  const sendMessage = async (messageText) => {
    const msg = (messageText ?? text).trim()
    if (!msg || busy) return
    setText('')
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages((m) => [...m, { from: 'user', text: msg, time: now }])
    setBusy(true)
    try {
      const res = await api('/ai/chat', { method: 'POST', body: { message: msg } })
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setMessages((m) => [...m, { from: 'bot', text: res.reply, time: botTime }])
    } catch (err) {
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setMessages((m) => [
        ...m,
        { from: 'bot', text: 'Xin lỗi, trợ lý đang bận: ' + (err.message || 'Không thể phản hồi'), time: botTime },
      ])
    } finally {
      setBusy(false)
    }
  }

  const send = (e) => {
    e.preventDefault()
    sendMessage()
  }

  const handleReset = () => {
    setMessages([
      {
        ...GREETING,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-none">
      {/* Cửa sổ chat */}
      {open && (
        <div className="pointer-events-auto mb-3 flex h-[460px] sm:h-[500px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-3 text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-sm font-black text-white shadow-inner">
                Q
              </span>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-sm tracking-tight">Trợ lý QuickStay</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-sky-100/90 leading-none">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Trực tuyến · Hỗ trợ 24/7</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Làm mới cuộc trò chuyện"
                aria-label="Làm mới chat"
                className="rounded-lg p-1.5 text-sky-100 hover:bg-white/15 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Đóng chat"
                aria-label="Đóng cửa sổ chat"
                className="rounded-lg p-1.5 text-sky-100 hover:bg-white/15 hover:text-white transition-colors text-base leading-none font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick prompts chips */}
          <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
            <p className="mb-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Gợi ý câu hỏi nhanh:
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={busy}
                  className="whitespace-nowrap rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Message history */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-sm bg-slate-50/40">
            {messages.map((m, i) => {
              const isUser = m.from === 'user'
              return (
                <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-end gap-1.5 max-w-[88%]">
                    {!isUser && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-[10px] font-bold text-white shadow-xs">
                        Q
                      </span>
                    )}
                    <div
                      className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm shadow-xs leading-relaxed ${
                        isUser
                          ? 'bg-sky-600 text-white rounded-tr-xs font-normal'
                          : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                  {m.time && (
                    <span className={`mt-1 text-[10px] text-slate-400 ${isUser ? 'mr-1' : 'ml-8'}`}>
                      {m.time}
                    </span>
                  )}
                </div>
              )
            })}

            {busy && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-[10px] font-bold text-white">
                  Q
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs bg-white border border-slate-200/80 px-3.5 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px] text-slate-500 font-medium">Đang trả lời...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Form input */}
          <form onSubmit={send} className="flex gap-2 border-t border-slate-100 bg-white p-2.5">
            <input
              ref={inputRef}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Nhập câu hỏi..."
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              aria-label="Tin nhắn"
              disabled={busy}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-sky-700 disabled:opacity-50 transition-colors cursor-pointer"
              disabled={busy || !text.trim()}
              aria-label="Gửi tin nhắn"
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      {/* Floating button (2x size: 104px, eye-catching, modern, stays pinned at bottom-right) */}
      <button
        type="button"
        className="pointer-events-auto self-end group relative flex h-24 w-24 sm:h-[104px] sm:w-[104px] flex-col items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 via-sky-600 to-cyan-500 text-white shadow-2xl hover:shadow-sky-500/50 hover:from-sky-500 hover:to-cyan-400 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/40"
        aria-label={open ? 'Đóng chat' : 'Mở chat'}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-black leading-none drop-shadow">✕</span>
            <span className="mt-1 text-[11px] font-semibold tracking-wide text-white/90 uppercase drop-shadow-xs">Đóng</span>
          </div>
        ) : (
          <>
            <svg
              className="h-10 w-10 sm:h-11 sm:w-11 transition-transform duration-200 group-hover:scale-110 drop-shadow"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="mt-0.5 text-[11px] sm:text-xs font-bold tracking-tight text-white drop-shadow-sm">
              Chat Hỗ Trợ
            </span>
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
            </span>
          </>
        )}
      </button>
    </div>
  )
}
