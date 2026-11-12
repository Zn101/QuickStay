import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatVnd, PAYMENT_METHOD_LABEL } from '../lib/format'
import { ErrorBox } from './ui'

const METHODS = [
  { id: 'BANK_TRANSFER', label: 'Chuyển khoản VietQR', sub: 'Quét mã QR 24/7' },
  { id: 'CREDIT_CARD', label: 'Thẻ Visa / Master', sub: 'Thanh toán quốc tế' },
  { id: 'E_WALLET', label: 'Ví MoMo / VNPay', sub: 'Xác thực OTP' },
]

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

export default function PaymentModal({ booking, initialMethod = 'BANK_TRANSFER', onClose, onPaid }) {
  const [method, setMethod] = useState(
    initialMethod && initialMethod !== 'PAY_AT_HOTEL' ? initialMethod : 'BANK_TRANSFER',
  )
  const [card, setCard] = useState({ number: '', holder: '', expiry: '', cvv: '' })
  const [wallet, setWallet] = useState({ provider: 'MoMo', phone: '', otp: '' })
  const [secondsLeft, setSecondsLeft] = useState(600)
  const [processing, setProcessing] = useState(false)
  const [stepText, setStepText] = useState('')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(booking?.paymentStatus === 'PAID' ? booking : null)

  useEffect(() => {
    if (!booking || receipt) return
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [booking, receipt])

  if (!booking) return null

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const qrPayload = `QUICKSTAY|MB|888899996666|${Math.round(booking.totalPrice)}|QS${booking.id}`
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`

  function fillTestCard() {
    setCard({ number: '4532 8910 2345 4242', holder: booking.guestName || 'NGUYEN VAN A', expiry: '12/29', cvv: '888' })
    setError('')
  }

  function validateForm() {
    if (method === 'CREDIT_CARD') {
      const digits = card.number.replace(/\s/g, '')
      if (digits.length !== 16) return 'Số thẻ phải gồm đúng 16 chữ số.'
      if (!card.holder.trim()) return 'Vui lòng nhập tên chủ thẻ in trên thẻ.'
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return 'Ngày hết hạn không hợp lệ (MM/YY).'
      if (!/^\d{3,4}$/.test(card.cvv)) return 'Mã bảo mật CVV gồm 3-4 chữ số.'
    }
    if (method === 'E_WALLET') {
      if (!/^(0|\+84)\d{9}$/.test(wallet.phone.replace(/\s/g, ''))) {
        return 'Vui lòng nhập số điện thoại ví hợp lệ (10 chữ số).'
      }
      if (!/^\d{4,6}$/.test(wallet.otp)) return 'Vui lòng nhập mã OTP xác nhận (4-6 chữ số).'
    }
    return ''
  }

  async function handlePay() {
    setError('')
    const msg = validateForm()
    if (msg) {
      setError(msg)
      return
    }

    setProcessing(true)
    setStepText('Đang kết nối cổng thanh toán an toàn...')
    try {
      await new Promise((r) => setTimeout(r, 700))
      setStepText('Đang xác thực giao dịch với ngân hàng...')
      await new Promise((r) => setTimeout(r, 800))

      const label =
        method === 'CREDIT_CARD'
          ? `Visa **** ${card.number.replace(/\s/g, '').slice(-4)}`
          : method === 'E_WALLET'
            ? `${wallet.provider} (${wallet.phone})`
            : 'VietQR MB Bank'

      const updated = await api(`/bookings/${booking.id}/pay`, {
        method: 'POST',
        body: { paymentMethod: method, accountLabel: label },
      })
      setReceipt(updated)
      onPaid?.(updated)
    } catch (err) {
      setError(err.message || 'Thanh toán không thành công. Vui lòng thử lại.')
    } finally {
      setProcessing(false)
      setStepText('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">QuickStay Checkout</p>
            <h2 className="text-base font-extrabold">
              {receipt ? `Biên lai thanh toán #${booking.id}` : `Thanh toán đơn #${booking.id}`}
            </h2>
          </div>
          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Receipt View */}
        {receipt ? (
          <div className="space-y-5 p-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Thanh toán thành công!</h3>
              <p className="mt-1 text-xs text-slate-500">Biên lai điện tử đã được gửi tới email {receipt.userEmail}</p>
            </div>

            <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã giao dịch</span>
                <span className="font-mono font-bold text-slate-900">{receipt.paymentRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách sạn</span>
                <span className="font-semibold text-slate-800">{receipt.hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức</span>
                <span className="font-semibold text-slate-800">{PAYMENT_METHOD_LABEL[receipt.paymentMethod]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian</span>
                <span className="font-semibold text-slate-800">
                  {receipt.paidAt ? new Date(receipt.paidAt).toLocaleString('vi-VN') : 'Vừa xong'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-extrabold text-emerald-700">
                <span>Số tiền đã thanh toán</span>
                <span>{formatVnd(receipt.totalPrice)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {/* Order Summary Bar */}
            <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-sky-900">{booking.hotelName}</p>
                <p className="text-xs text-sky-700">{booking.roomType}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-sky-700">Cần thanh toán</p>
                <p className="text-lg font-black text-sky-700">{formatVnd(booking.totalPrice)}</p>
              </div>
            </div>

            {/* Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setMethod(m.id)
                    setError('')
                  }}
                  className={`rounded-2xl border p-3 text-left transition ${
                    method === m.id
                      ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{m.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{m.sub}</p>
                </button>
              ))}
            </div>

            {error && <ErrorBox message={error} />}

            {/* VietQR Panel */}
            {method === 'BANK_TRANSFER' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    <img
                      src={qrImgUrl}
                      alt="VietQR Payment"
                      className="h-36 w-36 rounded-lg object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-700">MB Bank (Quân Đội)</span>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono font-bold text-amber-800">
                        {mm}:{ss}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Số tài khoản: <strong className="font-mono text-slate-900">8888 9999 6666</strong>
                    </p>
                    <p className="text-slate-600">
                      Chủ tài khoản: <strong className="text-slate-900">CONG TY CP QUICKSTAY</strong>
                    </p>
                    <p className="text-slate-600">
                      Nội dung CK: <strong className="font-mono text-sky-700">QS PAY {booking.id}</strong>
                    </p>
                    <p className="pt-1 text-[11px] text-slate-400">
                      Mở App Ngân hàng bất kỳ để quét mã, sau đó bấm nút xác nhận bên dưới.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Card Panel */}
            {method === 'CREDIT_CARD' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Thông tin thẻ thanh toán</span>
                  <button
                    type="button"
                    onClick={fillTestCard}
                    className="text-xs font-bold text-sky-600 hover:underline"
                  >
                    + Điền thẻ test Visa (4242)
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Số thẻ (16 số): 4532 xxxx xxxx 4242"
                  value={card.number}
                  onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Tên chủ thẻ (VD: NGUYEN VAN A)"
                  value={card.holder}
                  onChange={(e) => setCard((c) => ({ ...c, holder: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase outline-none focus:border-sky-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Hết hạn (MM/YY)"
                    value={card.expiry}
                    onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm outline-none focus:border-sky-500"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="CVV (3-4 số)"
                    value={card.cvv}
                    onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* E-Wallet Panel */}
            {method === 'E_WALLET' && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex gap-2">
                  {['MoMo', 'VNPay', 'ZaloPay'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWallet((p) => ({ ...p, provider: w }))}
                      className={`flex-1 rounded-xl border py-2 text-xs font-bold ${
                        wallet.provider === w
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <input
                  type="tel"
                  placeholder="Số điện thoại đăng ký ví (VD: 0912345678)"
                  value={wallet.phone}
                  onChange={(e) => setWallet((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Mã OTP xác thực (VD: 123456)"
                    value={wallet.otp}
                    onChange={(e) => setWallet((p) => ({ ...p, otp: e.target.value.replace(/\D/g, '') }))}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setWallet((p) => ({ ...p, phone: p.phone || '0912345678', otp: '123456' }))}
                    className="rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-sky-600 hover:bg-sky-50"
                  >
                    Lấy OTP mẫu
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={processing}
              onClick={handlePay}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-sky-500 hover:to-indigo-500 disabled:opacity-60"
            >
              {processing ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{stepText}</span>
                </>
              ) : (
                <span>
                  {method === 'BANK_TRANSFER'
                    ? `Tôi đã chuyển khoản ${formatVnd(booking.totalPrice)}`
                    : `Thanh toán ${formatVnd(booking.totalPrice)}`}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
