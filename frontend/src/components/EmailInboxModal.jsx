import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { EMAIL_TYPE_LABEL } from '../lib/format'

function extractTokenLink(bodyHtml) {
  if (!bodyHtml) return null
  const verifyMatch = bodyHtml.match(/\/verify-email\?token=([a-zA-Z0-9-]+)/)
  if (verifyMatch) return { path: `/verify-email?token=${verifyMatch[1]}`, label: 'Mở trang xác thực Email' }
  const resetMatch = bodyHtml.match(/\/reset-password\?token=([a-zA-Z0-9-]+)/)
  if (resetMatch) return { path: `/reset-password?token=${resetMatch[1]}`, label: 'Mở trang đặt lại mật khẩu' }
  return null
}

export default function EmailInboxModal({ isOpen, onClose, initialEmail = null }) {
  const navigate = useNavigate()
  const [emails, setEmails] = useState(initialEmail ? [initialEmail] : [])
  const [selected, setSelected] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (initialEmail) {
      setEmails([initialEmail])
      setSelected(initialEmail)
      return
    }
    setLoading(true)
    setError('')
    api('/emails/me')
      .then((list) => {
        const items = Array.isArray(list) ? list : []
        setEmails(items)
        setSelected(items[0] || null)
      })
      .catch((err) => setError(err.message || 'Không thể tải hộp thư.'))
      .finally(() => setLoading(false))
  }, [isOpen, initialEmail])

  if (!isOpen) return null

  const quickAction = selected ? extractTokenLink(selected.bodyHtml) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex h-[82vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Hộp thư QuickStay (Email đã gửi)</h2>
              <p className="text-xs text-slate-400">Xem trực tiếp các email xác thực, đặt phòng & biên lai thanh toán</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Đóng hộp thư"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="grid flex-1 overflow-hidden md:grid-cols-12">
          {/* Email list */}
          <div className="overflow-y-auto border-b border-slate-100 bg-slate-50/70 md:col-span-4 md:border-b-0 md:border-r">
            {loading && <p className="p-6 text-center text-sm text-slate-500">Đang tải hộp thư...</p>}
            {error && <p className="p-4 text-sm text-red-600">{error}</p>}
            {!loading && !error && emails.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">
                Chưa có email nào được gửi đến tài khoản của bạn.
              </div>
            )}
            <div className="divide-y divide-slate-100">
              {emails.map((mail, idx) => {
                const active = selected && (selected.id ? selected.id === mail.id : idx === 0)
                return (
                  <button
                    key={mail.id || idx}
                    type="button"
                    onClick={() => setSelected(mail)}
                    className={`w-full p-4 text-left transition ${active ? 'bg-sky-50 border-l-4 border-l-sky-600' : 'hover:bg-white'}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {EMAIL_TYPE_LABEL[mail.emailType] || mail.emailType || 'EMAIL'}
                      </span>
                      {mail.sentAt && (
                        <span className="text-[11px] text-slate-400">
                          {new Date(mail.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs font-bold text-slate-900">{mail.subject}</p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">Tới: {mail.recipient}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Email preview */}
          <div className="flex flex-col overflow-hidden bg-white md:col-span-8">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-extrabold text-slate-900">{selected.subject}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Người nhận: <span className="font-semibold text-slate-700">{selected.recipient}</span>
                      {selected.status && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {selected.status === 'SENT_SMTP' ? 'Đã gửi SMTP' : 'Demo Outbox'}
                        </span>
                      )}
                    </p>
                  </div>
                  {quickAction && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(quickAction.path)
                      }}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700"
                    >
                      {quickAction.label} →
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-auto bg-slate-50 p-4">
                  <iframe
                    title="Email preview"
                    srcDoc={selected.bodyHtml}
                    sandbox=""
                    className="h-full min-h-[380px] w-full rounded-2xl border border-slate-200 bg-white"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-400">
                Chọn một email bên trái để xem nội dung chi tiết.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
