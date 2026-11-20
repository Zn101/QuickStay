import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate } from '../lib/format'
import { useAuth } from '../store/authStore'

function Stars({ value, size = 'text-sm' }) {
  return (
    <span className={`${size} tracking-tight text-amber-500`} aria-label={`${value} trên 5 sao`}>
      {'★'.repeat(Math.round(value))}
      <span className="text-slate-300 dark:text-slate-600">{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  )
}

export { Stars }

/**
 * Đánh giá thật của nhà hàng / tour. Chỉ khách đã hoàn tất đơn mới gửi được (backend kiểm tra);
 * kind: 'restaurants' | 'tours'.
 */
export default function VenueReviews({ kind, id, rating, reviewCount, onReviewed }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [form, setForm] = useState({ rating: 5, comment: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/${kind}/${id}/reviews`)
      .then((list) => setReviews(Array.isArray(list) ? list : []))
      .catch(() => setReviews([]))
  }, [kind, id])

  async function submit(e) {
    e.preventDefault()
    if (!form.comment.trim()) {
      setError('Vui lòng viết vài dòng nhận xét.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await api(`/${kind}/${id}/reviews`, {
        method: 'POST',
        body: { rating: Number(form.rating), comment: form.comment.trim() },
      })
      setReviews((list) => [created, ...list])
      setForm({ rating: 5, comment: '' })
      onReviewed?.()
    } catch (err) {
      setError(err.message || 'Không gửi được đánh giá.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Đánh giá của khách</h2>
        {reviewCount > 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{rating?.toFixed(1)}</span> / 5 ·{' '}
            {reviewCount} đánh giá
          </p>
        ) : (
          <p className="text-sm text-slate-400">Chưa có đánh giá</p>
        )}
      </div>

      {user?.role === 'CUSTOMER' ? (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Chấm điểm</label>
            <select
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} sao
                </option>
              ))}
            </select>
          </div>
          <textarea
            rows={3}
            maxLength={2000}
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">Chỉ khách đã hoàn tất đơn mới gửi được đánh giá, mỗi người một lần.</p>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      ) : !user ? (
        <p className="mt-4 text-xs text-slate-500">
          <Link to="/login" className="font-bold text-sky-600">Đăng nhập</Link> để đánh giá sau khi sử dụng dịch vụ.
        </p>
      ) : null}

      {reviews.length > 0 && (
        <ul className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          {reviews.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{r.authorName}</p>
                <span className="text-xs text-slate-400">{formatDate(String(r.createdAt).slice(0, 10))}</span>
              </div>
              <Stars value={r.rating} size="text-xs" />
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
