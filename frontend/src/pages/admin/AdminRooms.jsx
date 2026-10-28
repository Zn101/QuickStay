import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { formatVnd } from '../../lib/format'
import { ErrorBox } from '../../components/ui'

const EMPTY = { hotelId: '', roomType: '', pricePerNight: '', capacity: '', quantity: '', description: '' }

export default function AdminRooms() {
  const [rooms, setRooms] = useState([])
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterHotelId, setFilterHotelId] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    Promise.all([api('/admin/hotels'), api('/admin/rooms')])
      .then(([h, r]) => { setHotels(h); setRooms(r) })
      .finally(() => setLoading(false))
  }, [])

  async function loadRooms(hotelId) {
    const r = await api('/admin/rooms', { params: hotelId ? { hotelId } : {} })
    setRooms(r)
  }

  function openCreate() {
    setForm(EMPTY)
    setEditId(null)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(r) {
    setForm({
      hotelId: String(r.hotelId),
      roomType: r.roomType,
      pricePerNight: String(r.pricePerNight),
      capacity: String(r.capacity),
      quantity: String(r.quantity),
      description: r.description || '',
    })
    setEditId(r.id)
    setFormError('')
    setShowForm(true)
  }

  async function submit(e) {
    e.preventDefault()
    setFormError('')
    setBusy(true)
    const body = {
      hotelId: Number(form.hotelId),
      roomType: form.roomType,
      pricePerNight: Number(form.pricePerNight),
      capacity: Number(form.capacity),
      quantity: Number(form.quantity),
      description: form.description,
    }
    try {
      if (editId) {
        const updated = await api(`/admin/rooms/${editId}`, { method: 'PUT', body })
        setRooms((rs) => rs.map((r) => (r.id === editId ? updated : r)))
      } else {
        const created = await api('/admin/rooms', { method: 'POST', body })
        setRooms((rs) => [...rs, created])
      }
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteRoom(id) {
    if (!confirm('Xóa loại phòng này?')) return
    try {
      await api(`/admin/rooms/${id}`, { method: 'DELETE' })
      setRooms((rs) => rs.filter((r) => r.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  async function generateDesc() {
    const hotel = hotels.find((h) => h.id === Number(form.hotelId))
    setAiLoading(true)
    try {
      const res = await api('/ai/describe', {
        method: 'POST',
        body: { type: 'room', name: hotel?.name || '', city: hotel?.city || '', roomType: form.roomType },
      })
      setForm((f) => ({ ...f, description: res.description }))
    } catch (err) {
      setFormError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 transition'
  const filteredRooms = filterHotelId ? rooms.filter((r) => r.hotelId === Number(filterHotelId)) : rooms

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Quản lý loại phòng</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 5v14M5 12h14"/></svg>
          Thêm phòng
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterHotelId}
          onChange={(e) => setFilterHotelId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        >
          <option value="">Tất cả khách sạn</option>
          {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Sửa loại phòng' : 'Thêm loại phòng'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="m18 6-12 12M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <ErrorBox message={formError} />
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Khách sạn *</label>
                <select required value={form.hotelId} onChange={setField('hotelId')} className={inputClass}>
                  <option value="">Chọn khách sạn...</option>
                  {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Loại phòng *</label>
                  <input required type="text" placeholder="Standard, Deluxe..." value={form.roomType} onChange={setField('roomType')} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Giá/đêm (VND) *</label>
                  <input required type="number" min="0" value={form.pricePerNight} onChange={setField('pricePerNight')} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Sức chứa (khách) *</label>
                  <input required type="number" min="1" value={form.capacity} onChange={setField('capacity')} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Số phòng *</label>
                  <input required type="number" min="1" value={form.quantity} onChange={setField('quantity')} className={inputClass} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">Mô tả</label>
                  <button
                    type="button"
                    onClick={generateDesc}
                    disabled={aiLoading || !form.roomType}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-40 transition-colors"
                  >
                    {aiLoading ? '✨ Đang tạo...' : '✨ Sinh mô tả AI'}
                  </button>
                </div>
                <textarea rows={3} value={form.description} onChange={setField('description')} className={inputClass + ' resize-none'} />
              </div>
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
                <button type="submit" disabled={busy} className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60">
                  {busy ? 'Đang lưu...' : editId ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Khách sạn</th>
                <th className="px-4 py-3 text-left">Loại phòng</th>
                <th className="px-4 py-3 text-right">Giá/đêm</th>
                <th className="px-4 py-3 text-right">Sức chứa</th>
                <th className="px-4 py-3 text-right">Số phòng</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRooms.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">#{r.id}</td>
                  <td className="px-4 py-3 text-slate-600">{hotels.find((h) => h.id === r.hotelId)?.name || `#${r.hotelId}`}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.roomType}</td>
                  <td className="px-4 py-3 text-right font-semibold text-sky-700">{formatVnd(r.pricePerNight)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{r.capacity}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{r.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(r)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Sửa</button>
                      <button onClick={() => deleteRoom(r.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRooms.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Chưa có phòng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
