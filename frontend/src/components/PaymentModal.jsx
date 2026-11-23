import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatVnd, PAYMENT_METHOD_LABEL } from '../lib/format'
import { ErrorBox } from './ui'

export default function PaymentModal({ booking, onClose, onPaid }) {
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

  // Real VietQR NAPAS247 Configuration (NGUYEN THAC HUNG - MBBank)
  const bankAccount = '0966969106'
  const bankCode = 'MB'
  const bankName = 'MBBank (Ngân hàng TMCP Quân Đội)'
  const accountHolder = 'NGUYEN THAC HUNG'
  const transferContent = `QS${booking.id}`
  const totalAmount = Math.round(Number(booking.totalPrice) || 0)
  const qrImgUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`

  function copyText(key, text) {
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2500)
  }

  async function handlePay() {
    setError('')
    setProcessing(true)
    setStepText('Đang kiểm tra & ghi nhận thanh toán...')
    try {
      await new Promise((r) => setTimeout(r, 600))
      setStepText('Đang tạo biên lai điện tử...')
      await new Promise((r) => setTimeout(r, 600))

      const updated = await api(`/bookings/${booking.id}/pay`, {
        method: 'POST',
        body: {
          paymentMethod: 'BANK_TRANSFER',
          accountLabel: `VietQR MBBank (${bankAccount})`,
        },
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
              <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">Cổng thanh toán VietQR Napas247</p>
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
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Thanh toán hoàn tất thành công!</h3>
              <p className="mt-1 text-xs text-slate-500">
                Biên lai điện tử đã được ghi nhận vào hệ thống và gửi tới {receipt.userEmail || 'email của bạn'}.
              </p>
            </div>

            <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Mã giao dịch</span>
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

            {error && <ErrorBox message={error} />}

            {/* VietQR Panel (REAL NAPAS247 PAYMENT QR) */}
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
                  Hệ thống đối soát theo nội dung <strong>{transferContent}</strong>. Sau khi chuyển tiền trên app ngân hàng, vui lòng bấm nút xác nhận dưới đây.
                </span>
              </div>
            </div>

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
                ) : (
                  `Tôi đã chuyển khoản thành công · ${formatVnd(booking.totalPrice)}`
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400">
                Chuyển khoản liên ngân hàng 24/7 qua Napas247 / VietQR
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
