import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatVnd, todayIso } from '../lib/format'
import { useAuth } from '../store/authStore'
import { ErrorBox } from './ui'

const TYPE_TITLE = {
  AIRPORT_TRANSFER: 'Đặt xe đưa đón sân bay',
  DINING: 'Đặt bàn & Dịch vụ ẩm thực',
  ATTRACTION_TRANSPORT: 'Hỗ trợ xe đi điểm tham quan',
}

export default function ConciergeModal({ isOpen, onClose, hotel, serviceType, defaultTitle = '', defaultFee = 0, onCreated }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [serviceTitle, setServiceTitle] = useState(defaultTitle)
  const [serviceDate, setServiceDate] = useState(todayIso(1))
  const [serviceTime, setServiceTime] = useState('14:00')
  const [guests, setGuests] = useState(2)
  const [guestPhone, setGuestPhone] = useState(user?.phone || '')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  if (!isOpen || !hotel) return null

  const activeTitle = serviceTitle || defaultTitle

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!user) {
      navigate('/login')
      return
    }
    if (!guestPhone.trim()) {
      setError('Vui lòng nhập số điện thoại liên hệ để tài xế/lễ tân xác nhận.')
      return
    }
    setBusy(true)
    try {
      const res = await api(`/hotels/${hotel.id}/concierge`, {
        method: 'POST',
        body: {
          serviceType,
          serviceTitle: activeTitle,
          serviceDate,
          serviceTime,
          guests: Number(guests),
          guestPhone: guestPhone.trim(),
          details: details.trim(),
          estimatedFee: Number(defaultFee || 0),
        },
      })
      setCreated(res)
      onCreated?.(res)
    } catch (err) {
      setError(err.message || 'Không thể gửi yêu cầu dịch vụ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-300">{hotel.name}</p>
            <h2 className="text-base font-extrabold">{TYPE_TITLE[serviceType] || 'Đặt dịch vụ hỗ trợ'}</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreated(null)
              onClose()
            }}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {created ? (
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Đã xác nhận yêu cầu #{created.id}!</h3>
            <p className="text-xs leading-5 text-slate-500">
              Dịch vụ <strong>{created.serviceTitle}</strong> vào ngày <strong>{created.serviceDate}</strong> lúc{' '}
              <strong>{created.serviceTime}</strong> đã được ghi nhận. Email xác nhận đã gửi tới{' '}
              <strong>{created.guestEmail}</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setCreated(null)
                onClose()
              }}
              className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold text-white hover:bg-sky-700"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-6">
            {!user && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Bạn cần đăng nhập để gửi yêu cầu đặt dịch vụ.
              </div>
            )}
            <ErrorBox message={error} />

            <div className="rounded-xl bg-sky-50 px-4 py-3">
              <p className="text-xs font-bold text-sky-900">{activeTitle}</p>
              <p className="mt-0.5 text-xs text-sky-700">
                Chi phí dự kiến: <strong>{defaultFee > 0 ? formatVnd(defaultFee) : 'Miễn phí / Theo thực tế'}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Ngày sử dụng</label>
                <input
                  type="date"
                  required
                  min={todayIso()}
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Giờ dự kiến</label>
                <input
                  type="time"
                  value={serviceTime}
                  onChange={(e) => setServiceTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Số khách</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  placeholder="0912345678"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {serviceType === 'AIRPORT_TRANSFER'
                  ? 'Mã chuyến bay / Điểm đón'
                  : serviceType === 'DINING'
                    ? 'Yêu cầu món ăn / Dị ứng'
                    : 'Điểm tham quan / Ghi chú lịch trình'}
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="VD: Chuyến bay VN123 hạ cánh lúc 14:15, cần bảng tên..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-sky-700 disabled:opacity-50"
            >
              {busy ? 'Đang gửi yêu cầu...' : user ? 'Xác nhận đặt dịch vụ' : 'Đăng nhập để tiếp tục'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
