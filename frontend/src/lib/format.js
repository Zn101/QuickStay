export const formatVnd = (n) =>
  n == null ? '' : new Intl.NumberFormat('vi-VN').format(Number(n)) + ' ₫'

export const formatDate = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const todayIso = (offsetDays = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const ms = new Date(checkOut) - new Date(checkIn)
  return Math.max(0, Math.round(ms / 86400000))
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
