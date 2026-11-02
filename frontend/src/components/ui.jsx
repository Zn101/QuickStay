import { STATUS_LABEL, STATUS_STYLE } from '../lib/format'

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status] || ''}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

export function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  )
}

export function Spinner({ text = 'Đang tải...' }) {
  return <p className="py-10 text-center text-sm text-slate-500">{text}</p>
}

export const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#dbeafe"/><text x="50%" y="50%" fill="#2563eb" font-size="42" font-family="sans-serif" text-anchor="middle">QuickStay</text></svg>',
  )

export function HotelImage({ src, alt, className }) {
  return (
    <img
      src={src || FALLBACK_IMG}
      alt={alt}
      loading="lazy"
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null
        e.currentTarget.src = FALLBACK_IMG
      }}
    />
  )
}
