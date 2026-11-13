export const formatVnd = (n) =>
  n == null || isNaN(n) ? '' : new Intl.NumberFormat('vi-VN').format(Number(n)) + ' ₫'

export const formatMoney = (n, currency = 'VND') => {
  if (n == null || isNaN(n)) return ''
  if (currency === 'USD') {
    const usd = Number(n) / 25000
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(usd)
  }
  return formatVnd(n)
}

export const formatDate = (iso) => {
  if (!iso) return ''
  const parts = String(iso).split('-')
  if (parts.length !== 3) return ''
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

export const formatDateVi = (isoDate) => {
  if (!isoDate) return ''
  try {
    const parts = String(isoDate).split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return String(isoDate)
    const [y, m, d] = parts
    const date = new Date(y, m - 1, d)
    const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7']
    return `${days[date.getDay()]}, ${d} thg ${m}`
  } catch {
    return String(isoDate)
  }
}

export const todayIso = (offsetDays = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const parts1 = String(checkIn).split('-').map(Number)
  const parts2 = String(checkOut).split('-').map(Number)
  if (parts1.length !== 3 || parts2.length !== 3) return 0
  const [y1, m1, d1] = parts1
  const [y2, m2, d2] = parts2
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0
  const utc1 = Date.UTC(y1, m1 - 1, d1)
  const utc2 = Date.UTC(y2, m2 - 1, d2)
  const diffDays = Math.round((utc2 - utc1) / 86400000)
  return Math.max(0, diffDays)
}

export const STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận phòng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-slate-200 text-slate-600',
}

export const NEXT_STATUS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export const PAYMENT_METHOD_LABEL = {
  PAY_AT_HOTEL: 'Thanh toán tại khách sạn',
  BANK_TRANSFER: 'Chuyển khoản VietQR',
  CREDIT_CARD: 'Thẻ Visa / Mastercard',
  E_WALLET: 'Ví điện tử (MoMo / VNPay)',
}

export const PAYMENT_STATUS_LABEL = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
}

export const PAYMENT_STATUS_STYLE = {
  UNPAID: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REFUNDED: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
}

export const EMAIL_TYPE_LABEL = {
  EMAIL_VERIFICATION: 'Xác thực email',
  PASSWORD_RESET: 'Khôi phục mật khẩu',
  PASSWORD_CHANGED: 'Đổi mật khẩu',
  BOOKING_CONFIRMATION: 'Xác nhận đặt phòng',
  PAYMENT_RECEIPT: 'Biên lai thanh toán',
  BOOKING_STATUS: 'Cập nhật đơn đặt phòng',
}
