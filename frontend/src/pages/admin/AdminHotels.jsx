import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { ErrorBox } from '../../components/ui'

const EMPTY = { name: '', city: '', address: '', description: '', imageUrl: '', amenities: '' }

export default function AdminHotels() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    api('/admin/hotels')
      .then(setHotels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(EMPTY)
    setEditId(null)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(h) {
    setForm({ name: h.name, city: h.city, address: h.address || '', description: h.description || '', imageUrl: h.imageUrl || '', amenities: h.amenities || '' })
    setEditId(h.id)
    setFormError('')
    setShowForm(true)
  }

  async function submit(e) {
    e.preventDefault()
    setFormError('')
    setBusy(true)
    try {
      if (editId) {
        const updated = await api(`/admin/hotels/${editId}`, { method: 'PUT', body: form })
        setHotels((hs) => hs.map((h) => (h.id === editId ? updated : h)))
      } else {
        const created = await api('/admin/hotels', { method: 'POST', body: form })
        setHotels((hs) => [...hs, created])
      }
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteHotel(id) {
    if (!confirm('Xóa khách sạn này?')) return
    try {
      await api(`/admin/hotels/${id}`, { method: 'DELETE' })
      setHotels((hs) => hs.filter((h) => h.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  async function generateDesc() {
    if (!form.name) return
    setAiLoading(true)
    try {
      const res = await api('/ai/describe', {
        method: 'POST',
        body: { name: form.name, city: form.city, amenities: form.amenities },
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Quản lý khách sạn</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 5v14M5 12h14"/></svg>
          Thêm khách sạn
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Sửa khách sạn' : 'Thêm khách sạn'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="m18 6-12 12M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <ErrorBox message={formError} />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Tên khách sạn *</label>
                  <input required type="text" value={form.name} onChange={setField('name')} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Thành phố *</label>
                  <input required type="text" value={form.city} onChange={setField('city')} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Địa chỉ</label>
                <input type="text" value={form.address} onChange={setField('address')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Tiện nghi (cách nhau bằng dấu phẩy)</label>
                <input type="text" value={form.amenities} onChange={setField('amenities')} placeholder="Hồ bơi, Wifi, Bãi đỗ xe" className={inputClass} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">Mô tả</label>
                  <button
                    type="button"
                    onClick={generateDesc}
                    disabled={aiLoading || !form.name}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-40 transition-colors"
                  >
                    {aiLoading ? '✨ Đang tạo...' : '✨ Sinh mô tả AI'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={setField('description')}
                  className={inputClass + ' resize-none'}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">URL ảnh</label>
                <input type="url" value={form.imageUrl} onChange={setField('imageUrl')} placeholder="https://..." className={inputClass} />
              </div>
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Hủy
                </button>
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
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Thành phố</th>
                <th className="px-4 py-3 text-left">Địa chỉ</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {hotels.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">#{h.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{h.name}</td>
                  <td className="px-4 py-3 text-slate-600">{h.city}</td>
                  <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{h.address}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(h)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteHotel(h.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {hotels.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Chưa có khách sạn nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
