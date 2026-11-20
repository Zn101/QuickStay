import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { todayIso, formatDate } from '../../lib/format'
import { ErrorBox } from '../ui'
import { inputCls, labelCls, cardCls } from './RowsEditor'

const DAYS = 14

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  const pad = (x) => String(x).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function cellTone(cell, quantity) {
  if (cell.available === 0) return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60'
  if (cell.available < quantity) return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/60'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60'
}

/**
 * Lịch phòng: số phòng còn trống mỗi ngày của từng loại phòng (đã trừ đơn đặt và phòng đóng),
 * kèm đóng phòng theo khoảng ngày (bảo trì, bán qua kênh khác). Phòng đóng không đặt được trên QuickStay.
 */
export default function PartnerCalendar({ hotelId, refreshKey }) {
  const [from, setFrom] = useState(todayIso())
  const [cal, setCal] = useState(null)
  const [closures, setClosures] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ roomId: '', startDate: todayIso(), endDate: todayIso(1), units: 1, reason: '' })
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const query = `hotelId=${hotelId}`

  const load = useCallback(() => {
    setError('')
    Promise.all([api(`/partner/calendar?${query}&from=${from}&days=${DAYS}`), api(`/partner/closures?${query}`)])
      .then(([c, cl]) => {
        setCal(c)
        setClosures(Array.isArray(cl) ? cl : [])
        setForm((f) => (f.roomId || !c?.rooms?.length ? f : { ...f, roomId: String(c.rooms[0].roomId) }))
      })
      .catch((err) => setError(err.message || 'Không tải được lịch phòng.'))
  }, [query, from])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function close(e) {
    e.preventDefault()
    if (!form.roomId) return setFormError('Chọn loại phòng cần đóng.')
    if (form.endDate <= form.startDate) return setFormError('Ngày mở lại phải sau ngày bắt đầu đóng.')
    setBusy(true)
    setFormError('')
    try {
      await api(`/partner/closures?${query}`, {
        method: 'POST',
        body: { roomId: Number(form.roomId), startDate: form.startDate, endDate: form.endDate, units: Number(form.units), reason: form.reason },
      })
      setForm((f) => ({ ...f, reason: '' }))
      load()
    } catch (err) {
      setFormError(err.message || 'Không đóng được phòng.')
    } finally {
      setBusy(false)
    }
  }

  async function reopen(id) {
    try {
      await api(`/partner/closures/${id}?${query}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err.message || 'Không mở lại được phòng.')
    }
  }

  const days = cal?.rooms?.[0]?.days || []

  return (
    <section id="lich-phong" className={`${cardCls} scroll-mt-24 space-y-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Lịch phòng trống</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Mỗi ô: phòng còn trống / tổng số phòng. Đã trừ đơn chưa huỷ và phòng bạn đóng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={from <= todayIso()}
            onClick={() => setFrom((f) => (addDays(f, -DAYS) < todayIso() ? todayIso() : addDays(f, -DAYS)))}
            className="cursor-pointer rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
          >
            ← {DAYS} ngày trước
          </button>
          <button
            type="button"
            onClick={() => setFrom((f) => addDays(f, DAYS))}
            className="cursor-pointer rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 dark:border-slate-700 dark:text-slate-200"
          >
            {DAYS} ngày sau →
          </button>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {cal && cal.rooms.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-700">
          Thêm loại phòng để xem lịch.
        </p>
      )}

      {cal && cal.rooms.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white py-1 pr-2 text-left text-[11px] uppercase tracking-wide text-slate-400 dark:bg-slate-900">
                  Loại phòng
                </th>
                {days.map((d) => {
                  const dt = new Date(`${d.date}T00:00:00`)
                  const weekend = dt.getDay() === 0 || dt.getDay() === 6
                  return (
                    <th key={d.date} className={`py-1 font-semibold ${weekend ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      <div className="text-[10px]">{WEEKDAY[dt.getDay()]}</div>
                      <div>{d.date.slice(8)}/{d.date.slice(5, 7)}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {cal.rooms.map((r) => (
                <tr key={r.roomId}>
                  <td className="sticky left-0 z-10 max-w-[160px] truncate bg-white py-1 pr-2 text-left font-bold text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                    {r.roomType}
                  </td>
                  {r.days.map((c) => (
                    <td
                      key={c.date}
                      title={`${c.date}: ${c.booked} đã đặt, ${c.closed} đóng, ${c.available} còn trống`}
                      className={`rounded-lg border px-1 py-1.5 font-bold ${cellTone(c, r.quantity)}`}
                    >
                      {c.available}/{r.quantity}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-emerald-400" />Còn đủ phòng</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-amber-400" />Đã có đơn / đóng một phần</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-red-400" />Hết phòng</span>
          </div>
        </div>
      )}

      {cal && cal.rooms.length > 0 && (
        <form onSubmit={close} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-6 dark:border-slate-800 dark:bg-slate-800/40">
          <h3 className="text-sm font-extrabold text-slate-900 sm:col-span-2 lg:col-span-6 dark:text-white">Đóng phòng theo ngày</h3>
          <label className="lg:col-span-2">
            <span className={labelCls}>Loại phòng</span>
            <select value={form.roomId} onChange={set('roomId')} className={inputCls}>
              {cal.rooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.roomType} ({r.quantity} phòng)
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelCls}>Từ ngày</span>
            <input type="date" min={todayIso()} value={form.startDate} onChange={set('startDate')} className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Mở lại ngày</span>
            <input type="date" min={addDays(form.startDate, 1)} value={form.endDate} onChange={set('endDate')} className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Số phòng</span>
            <input type="number" min="1" value={form.units} onChange={set('units')} className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Lý do</span>
            <input value={form.reason} maxLength={255} onChange={set('reason')} placeholder="Bảo trì..." className={inputCls} />
          </label>
          {formError && (
            <div className="sm:col-span-2 lg:col-span-6">
              <ErrorBox message={formError} />
            </div>
          )}
          <div className="flex justify-end sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              disabled={busy}
              className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Đang đóng...' : 'Đóng phòng'}
            </button>
          </div>
        </form>
      )}

      {closures.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-extrabold text-slate-900 dark:text-white">Lịch đóng phòng sắp tới</h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {closures.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-slate-700 dark:text-slate-200">
                  <strong>{c.roomType}</strong> · {c.units} phòng · {formatDate(c.startDate)} → mở lại {formatDate(c.endDate)}
                  {c.reason && <span className="text-slate-400"> · {c.reason}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => reopen(c.id)}
                  className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Mở lại
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
