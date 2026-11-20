import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { formatVnd } from '../../lib/format'
import { ErrorBox, ConfirmModal } from '../ui'
import { inputCls, labelCls, cardCls } from './RowsEditor'

const EMPTY = {
  roomType: '',
  pricePerNight: '',
  capacity: 2,
  quantity: 1,
  areaSqm: '',
  bedInfo: '',
  amenities: '',
  imageUrls: '',
  description: '',
}

function toForm(r) {
  return {
    roomType: r.roomType || '',
    pricePerNight: r.pricePerNight ?? '',
    capacity: r.capacity ?? 2,
    quantity: r.quantity ?? 1,
    areaSqm: r.areaSqm ?? '',
    bedInfo: r.bedInfo || '',
    amenities: r.amenities || '',
    imageUrls: r.imageUrls || '',
    description: r.description || '',
  }
}

/** Đối tác tự quản lý loại phòng: tên, giá / đêm, sức chứa, số phòng, diện tích, giường, tiện nghi, ảnh. */
export default function PartnerRooms({ hotelId, onChanged }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | room
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const query = `?hotelId=${hotelId}`

  const load = useCallback(() => {
    setLoading(true)
    api(`/partner/rooms${query}`)
      .then((list) => setRooms(Array.isArray(list) ? list : []))
      .catch((err) => setError(err.message || 'Không tải được loại phòng.'))
      .finally(() => setLoading(false))
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  function openNew() {
    setEditing('new')
    setForm(EMPTY)
    setFormError('')
  }

  function openEdit(r) {
    setEditing(r)
    setForm(toForm(r))
    setFormError('')
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    if (!form.roomType.trim()) return setFormError('Vui lòng nhập tên loại phòng.')
    if (form.pricePerNight === '' || Number(form.pricePerNight) < 0) return setFormError('Giá mỗi đêm không hợp lệ.')
    setBusy(true)
    setFormError('')
    const body = {
      roomType: form.roomType.trim(),
      pricePerNight: Number(form.pricePerNight),
      capacity: Number(form.capacity),
      quantity: Number(form.quantity),
      areaSqm: form.areaSqm === '' ? null : Number(form.areaSqm),
      bedInfo: form.bedInfo,
      amenities: form.amenities,
      imageUrls: form.imageUrls,
      description: form.description,
    }
    try {
      if (editing === 'new') {
        await api(`/partner/rooms${query}`, { method: 'POST', body })
      } else {
        await api(`/partner/rooms/${editing.id}${query}`, { method: 'PUT', body })
      }
      setEditing(null)
      load()
      onChanged?.()
    } catch (err) {
      setFormError(err.message || 'Không lưu được loại phòng.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await api(`/partner/rooms/${target.id}${query}`, { method: 'DELETE' })
      load()
      onChanged?.()
    } catch (err) {
      setError(err.message || 'Không xoá được loại phòng.')
    }
  }

  return (
    <section id="loai-phong" className={`${cardCls} scroll-mt-24`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Loại phòng & Giá</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Giá, sức chứa và số phòng ở đây quyết định phòng trống và tổng tiền khách thấy khi đặt.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Thêm loại phòng
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <p className="py-6 text-center text-sm text-slate-400">Đang tải loại phòng...</p>
      ) : rooms.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
          Cơ sở chưa có loại phòng nào. Khách sẽ không đặt được cho tới khi bạn thêm loại phòng.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <th className="py-2 pr-3">Loại phòng</th>
                <th className="py-2 pr-3">Giá / đêm</th>
                <th className="py-2 pr-3">Sức chứa</th>
                <th className="py-2 pr-3">Số phòng</th>
                <th className="py-2 pr-3">Chi tiết</th>
                <th className="py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rooms.map((r) => {
                const imgCount = (r.imageUrls || '').split('\n').filter(Boolean).length
                return (
                  <tr key={r.id} className="text-slate-700 dark:text-slate-200">
                    <td className="py-3 pr-3 font-bold text-slate-900 dark:text-white">{r.roomType}</td>
                    <td className="py-3 pr-3 font-semibold text-blue-700 dark:text-blue-300">{formatVnd(r.pricePerNight)}</td>
                    <td className="py-3 pr-3">{r.capacity} khách</td>
                    <td className="py-3 pr-3">{r.quantity}</td>
                    <td className="py-3 pr-3 text-xs text-slate-500 dark:text-slate-400">
                      {[r.areaSqm ? `${r.areaSqm} m²` : null, r.bedInfo, `${imgCount} ảnh`].filter(Boolean).join(' · ')}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(r)}
                          className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="mt-5 space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {editing === 'new' ? 'Thêm loại phòng mới' : `Sửa: ${editing.roomType}`}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="sm:col-span-2">
              <span className={labelCls}>Tên loại phòng *</span>
              <input value={form.roomType} onChange={set('roomType')} maxLength={255} className={inputCls} placeholder="VD: Deluxe hướng biển" />
            </label>
            <label>
              <span className={labelCls}>Giá / đêm (VND) *</span>
              <input type="number" min="0" step="1000" value={form.pricePerNight} onChange={set('pricePerNight')} className={inputCls} />
            </label>
            <label>
              <span className={labelCls}>Diện tích (m²)</span>
              <input type="number" min="1" value={form.areaSqm} onChange={set('areaSqm')} className={inputCls} />
            </label>
            <label>
              <span className={labelCls}>Sức chứa (khách) *</span>
              <input type="number" min="1" max="50" value={form.capacity} onChange={set('capacity')} className={inputCls} />
            </label>
            <label>
              <span className={labelCls}>Số phòng loại này *</span>
              <input type="number" min="1" max="1000" value={form.quantity} onChange={set('quantity')} className={inputCls} />
            </label>
            <label className="sm:col-span-2">
              <span className={labelCls}>Giường</span>
              <input value={form.bedInfo} onChange={set('bedInfo')} maxLength={255} className={inputCls} placeholder="VD: 1 giường King hoặc 2 giường đơn" />
            </label>
            <label className="sm:col-span-2 lg:col-span-4">
              <span className={labelCls}>Tiện nghi phòng (cách nhau dấu phẩy)</span>
              <input value={form.amenities} onChange={set('amenities')} maxLength={1000} className={inputCls} placeholder="Ban công, Bồn tắm, Smart TV, Wifi miễn phí" />
            </label>
            <label className="sm:col-span-2 lg:col-span-4">
              <span className={labelCls}>Ảnh phòng (mỗi dòng một đường dẫn https://)</span>
              <textarea rows={3} value={form.imageUrls} onChange={set('imageUrls')} className={inputCls} />
            </label>
            <label className="sm:col-span-2 lg:col-span-4">
              <span className={labelCls}>Mô tả</span>
              <textarea rows={2} value={form.description} onChange={set('description')} maxLength={2000} className={inputCls} />
            </label>
          </div>
          {formError && <ErrorBox message={formError} />}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={busy}
              className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Đang lưu...' : 'Lưu loại phòng'}
            </button>
          </div>
        </form>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xoá loại phòng?"
        message={deleteTarget ? `Xoá "${deleteTarget.roomType}". Loại phòng đã có đơn đặt sẽ không xoá được để giữ lịch sử đơn.` : ''}
        confirmText="Xoá"
        cancelText="Giữ lại"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
