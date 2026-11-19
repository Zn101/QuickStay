import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatVnd, PAYMENT_METHOD_LABEL } from '../lib/format'
import { ErrorBox } from './ui'

const METHODS = [
  { id: 'BANK_TRANSFER', label: 'Chuyển khoản VietQR', sub: 'Quét mã Napas247' },
  { id: 'CREDIT_CARD', label: 'Thẻ Visa / Master', sub: 'Cổng thẻ quốc tế' },
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
  const [copiedKey, setCopiedKey] = useState('')

  useEffect(() => {
    if (!booking || receipt) return
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [booking, receipt])

  if (!booking) return null

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  // Real VietQR NAPAS247 Configuration
  const bankAccount = '0868888666'
  const bankCode = 'MB'
  const bankName = 'MBBank (Ngân hàng TMCP Quân Đội)'
  const accountHolder = 'CONG TY CONG NGHE QUICKSTAY VIET NAM'
  const transferContent = `QS${booking.id}`
  const totalAmount = Math.round(Number(booking.totalPrice) || 0)
  const qrImgUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`

  function copyText(key, text) {
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2500)
  }

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
    setStepText('Đang kiểm tra & xác nhận giao dịch qua hệ thống ngân hàng...')
    try {
      await new Promise((r) => setTimeout(r, 600))
      setStepText('Đang ghi nhận biên lai điện tử...')
      await new Promise((r) => setTimeout(r, 700))

      const label =
        method === 'CREDIT_CARD'
          ? `Visa **** ${card.number.replace(/\s/g, '').slice(-4)}`
          : method === 'E_WALLET'
            ? `${wallet.provider} (${wallet.phone})`
            : `VietQR MBBank (${bankAccount})`

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-6 py-4 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">Cổng thanh toán QuickStay Real</p>
            </div>
            <h2 className="text-base font-extrabold mt-0.5">
              {receipt ? `Biên lai thanh toán #${booking.id}` : `Thanh toán đơn #${booking.id}`}
            </h2>
          </div>
          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Receipt View */}
        {receipt ? (
          <div className="space-y-5 p-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Thanh toán hoàn tất thành công!</h3>
              <p className="mt-1 text-xs text-slate-500">
                Biên lai điện tử đã được ghi nhận vào hệ thống và gửi tới {receipt.userEmail || 'email của bạn'}.
              </p>
            </div>

            <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Mã giao dịch thực tế</span>
                <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                  {receipt.paymentRef}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách sạn / Cơ sở</span>
                <span className="font-semibold text-slate-800">{receipt.hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức</span>
                <span className="font-semibold text-slate-800">{PAYMENT_METHOD_LABEL[receipt.paymentMethod] || 'Chuyển khoản VietQR'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian giao dịch</span>
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
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 cursor-pointer shadow-md"
            >
              Hoàn tất & Quay lại
            </button>
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {/* Order Summary Bar */}
            <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3 border border-sky-100">
              <div>
                <p className="text-xs font-bold text-sky-950">{booking.hotelName}</p>
                <p className="text-xs text-sky-700">{booking.roomType}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-sky-600">Số tiền cần thanh toán</p>
                <p className="text-lg font-black text-sky-800">{formatVnd(booking.totalPrice)}</p>
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
                  className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                    method === m.id
                      ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{m.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{m.sub}</p>
                </button>
              ))}
            </div>

            {error && <ErrorBox message={error} />}

            {/* VietQR Panel (REAL NAPAS247 PAYMENT QR) */}
            {method === 'BANK_TRANSFER' && (
              <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/50 via-white to-sky-50/30 p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800">
                    <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-black text-white">NAPAS 247</span>
                    {bankName}
                  </span>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-xs font-bold text-amber-800">
                    ⏱ {mm}:{ss}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  {/* Real QR Code Image */}
                  <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm text-center">
                    <img
                      src={qrImgUrl}
                      alt="VietQR Payment"
                      className="h-36 w-36 rounded-lg object-contain"
                    />
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">Quét bằng mọi App Ngân hàng</p>
                  </div>

                  {/* Transfer Details with One-click Copy */}
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Số tài khoản:</span>
                        <strong className="font-mono text-sm text-slate-900">{bankAccount}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText('account', bankAccount)}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                      >
                        {copiedKey === 'account' ? '✓ Đã chép' : 'Sao chép'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Chủ tài khoản:</span>
                        <strong className="text-slate-800 text-[11px] block">{accountHolder}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nội dung chuyển khoản (Bắt buộc):</span>
                        <strong className="font-mono text-sm text-sky-700 font-bold">{transferContent}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText('content', transferContent)}
                        className="rounded-lg bg-sky-100 text-sky-800 px-2.5 py-1 text-[11px] font-bold hover:bg-sky-200 cursor-pointer"
                      >
                        {copiedKey === 'content' ? '✓ Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50/80 p-2.5 text-[11px] text-amber-800 border border-amber-200/60 flex items-start gap-2">
                  <span className="text-base shrink-0">💡</span>
                  <span>
                    Hệ thống sẽ tự động đối soát nội dung <strong>{transferContent}</strong>. Sau khi quét mã và chuyển tiền trên ứng dụng ngân hàng, vui lòng bấm nút xác nhận dưới đây.
                  </span>
                </div>
              </div>
            )}

            {/* Credit Card Panel */}
            {method === 'CREDIT_CARD' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Thông tin thẻ thanh toán quốc tế</span>
                  <button
                    type="button"
                    onClick={fillTestCard}
                    className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    + Điền thẻ mẫu Visa (4242)
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
                  placeholder="Tên in trên thẻ (VD: NGUYEN VAN A)"
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
                      onClick={() => setWallet((wl) => ({ ...wl, provider: w }))}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                        wallet.provider === w
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <input
                  type="tel"
                  placeholder="Số điện thoại liên kết ví"
                  value={wallet.phone}
                  onChange={(e) => setWallet((wl) => ({ ...wl, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Nhập mã OTP (VD: 888888)"
                    value={wallet.otp}
                    onChange={(e) => setWallet((wl) => ({ ...wl, otp: e.target.value }))}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setWallet((wl) => ({ ...wl, otp: '888888' }))}
                    className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 cursor-pointer"
                  >
                    Điền OTP
                  </button>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={processing || secondsLeft <= 0}
                onClick={handlePay}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-600/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {stepText || 'Đang xử lý giao dịch...'}
                  </span>
                ) : method === 'BANK_TRANSFER' ? (
                  `Tôi đã chuyển khoản thành công · ${formatVnd(booking.totalPrice)}`
                ) : (
                  `Xác nhận thanh toán ${formatVnd(booking.totalPrice)}`
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400">
                🔒 Giao dịch mã hóa SSL 256-bit chuẩn PCI-DSS · Xác nhận tự động tức thì
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
