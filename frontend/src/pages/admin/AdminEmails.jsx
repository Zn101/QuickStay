import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { EMAIL_TYPE_LABEL } from '../../lib/format'
import { ErrorBox, Spinner } from '../../components/ui'

export default function AdminEmails() {
  const [emails, setEmails] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api('/admin/emails')
      const list = Array.isArray(data) ? data : []
      setEmails(list)
      setSelected((prev) => list.find((m) => m.id === prev?.id) || list[0] || null)
    } catch (err) {
      setError(err.message || 'Không thể tải nhật ký email.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-6 text-white shadow-xl">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Transactional Email Logs</p>
          <h1 className="mt-1 text-2xl font-extrabold">Nhật ký Email hệ thống</h1>
          <p className="mt-1 text-xs text-slate-300">
            Theo dõi toàn bộ email xác thực, khôi phục mật khẩu, xác nhận đặt phòng & biên lai thanh toán đã gửi.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
        >
          Làm mới ({emails.length})
        </button>
      </div>

      {error && <ErrorBox message={error} />}
      {loading && <Spinner text="Đang tải nhật ký email..." />}

      {!loading && !error && (
        <div className="grid min-h-[540px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-12">
          <div className="max-h-[600px] overflow-y-auto border-b border-slate-100 bg-slate-50/70 lg:col-span-5 lg:border-b-0 lg:border-r">
            {emails.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">Chưa có email nào được ghi nhận.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {emails.map((mail) => (
                  <button
                    key={mail.id}
                    type="button"
                    onClick={() => setSelected(mail)}
                    className={`w-full p-4 text-left transition ${
                      selected?.id === mail.id ? 'bg-sky-50 border-l-4 border-l-sky-600' : 'hover:bg-white'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                        {EMAIL_TYPE_LABEL[mail.emailType] || mail.emailType}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(mail.sentAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm font-bold text-slate-900">{mail.subject}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">Tới: {mail.recipient}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col lg:col-span-7">
            {selected ? (
              <>
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">{selected.subject}</h2>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      {selected.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Người nhận: <strong className="text-slate-700">{selected.recipient}</strong> · Lúc{' '}
                    {new Date(selected.sentAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 p-4">
                  <iframe
                    title="Admin email preview"
                    srcDoc={selected.bodyHtml}
                    sandbox=""
                    className="h-[460px] w-full rounded-2xl border border-slate-200 bg-white"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-400">
                Chọn một email để xem nội dung.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
