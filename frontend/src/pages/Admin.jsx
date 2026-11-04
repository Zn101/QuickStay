import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { NEXT_STATUS, STATUS_LABEL, formatDate, formatVnd } from '../lib/format'
import { ErrorBox, Spinner, StatusBadge } from '../components/ui'

const TABS = [
  ['bookings', 'Đặt phòng'],
  ['hotels', 'Khách sạn'],
  ['rooms', 'Phòng'],
]

export default function Admin() {
  const [tab, setTab] = useState('bookings')
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Quản trị</h1>
      <div className="mb-5 flex gap-2 border-b">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === key ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'bookings' && <BookingsTab />}
      {tab === 'hotels' && <HotelsTab />}
      {tab === 'rooms' && <RoomsTab />}
    </div>
  )
}

/* ---------- Đặt phòng ---------- */
function BookingsTab() {
  const [items, setItems] = useState(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(() => api('/admin/bookings').then(setItems).catch((e) => setError(e.message)), [])
  useEffect(() => {
    load()
  }, [load])

  const change = async (b, status) => {
    try {
      await api(`/admin/bookings/${b.id}/status`, { method: 'PATCH', body: { status } })
      setError('')
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!items) return error ? <ErrorBox message={error} /> : <Spinner />
  const shown = filter ? items.filter((b) => b.status === filter) : items

  return (
    <div>
      <ErrorBox message={error} />
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm" htmlFor="statusFilter">Lọc trạng thái:</label>
        <select id="statusFilter" className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tất cả</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">Mã</th><th className="p-3">Khách</th><th className="p-3">Khách sạn / Phòng</th>
              <th className="p-3">Ngày</th><th className="p-3">Tổng tiền</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3">#{b.id}</td>
                <td className="p-3">{b.guestName}<br /><span className="text-xs text-slate-500">{b.guestPhone} · {b.userEmail}</span></td>
                <td className="p-3">{b.hotelName}<br /><span className="text-xs text-slate-500">{b.roomType}</span></td>
                <td className="p-3">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</td>
                <td className="p-3">{formatVnd(b.totalPrice)}</td>
                <td className="p-3"><StatusBadge status={b.status} /></td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {NEXT_STATUS[b.status].map((s) => (
                      <button key={s} className={s === 'CANCELLED' ? 'btn-outline px-2 py-1 text-xs text-red-600' : 'btn-primary px-2 py-1 text-xs'}
                              onClick={() => change(b, s)}>
                        {s === 'CANCELLED' ? 'Hủy' : '→ ' + STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-slate-500">Không có đặt phòng.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- Khách sạn ---------- */
const EMPTY_HOTEL = { name: '', city: '', address: '', imageUrl: '', amenities: '', description: '' }

function HotelsTab() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(null) // null = đóng form
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [aiBusy, setAiBusy] = useState(false)

  const load = useCallback(() => api('/admin/hotels').then(setItems).catch((e) => setError(e.message)), [])
  useEffect(() => {
    load()
  }, [load])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editingId) await api(`/admin/hotels/${editingId}`, { method: 'PUT', body: form })
      else await api('/admin/hotels', { method: 'POST', body: form })
      setForm(null)
      setEditingId(null)
      setError('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (h) => {
    if (!window.confirm(`Xóa khách sạn "${h.name}" và các phòng của nó?`)) return
    try {
      await api(`/admin/hotels/${h.id}`, { method: 'DELETE' })
      setError('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const generate = async () => {
    if (!form.name) return setError('Nhập tên khách sạn trước khi tạo mô tả')
    setAiBusy(true)
    try {
      const res = await api('/ai/describe', {
        method: 'POST',
        body: { type: 'hotel', name: form.name, city: form.city, amenities: form.amenities },
      })
      setForm((f) => ({ ...f, description: res.description }))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setAiBusy(false)
    }
  }

  const edit = (h) => {
    setEditingId(h.id)
    setForm({ name: h.name, city: h.city, address: h.address || '', imageUrl: h.imageUrl || '', amenities: h.amenities || '', description: h.description || '' })
  }

  if (!items) return error ? <ErrorBox message={error} /> : <Spinner />

  return (
    <div>
      <ErrorBox message={error} />
      {!form && <button className="btn-primary mb-3" onClick={() => { setForm(EMPTY_HOTEL); setEditingId(null) }}>+ Thêm khách sạn</button>}
      {form && (
        <form onSubmit={save} className="card mb-5 grid gap-3 p-4 md:grid-cols-2">
          <h2 className="font-semibold md:col-span-2">{editingId ? 'Sửa khách sạn' : 'Thêm khách sạn'}</h2>
          <div><label className="label" htmlFor="h-name">Tên</label><input id="h-name" required className="input" value={form.name} onChange={set('name')} /></div>
          <div><label className="label" htmlFor="h-city">Thành phố</label><input id="h-city" required className="input" value={form.city} onChange={set('city')} /></div>
          <div><label className="label" htmlFor="h-address">Địa chỉ</label><input id="h-address" className="input" value={form.address} onChange={set('address')} /></div>
          <div><label className="label" htmlFor="h-img">Link ảnh</label><input id="h-img" className="input" value={form.imageUrl} onChange={set('imageUrl')} /></div>
          <div className="md:col-span-2"><label className="label" htmlFor="h-amen">Tiện nghi (cách nhau bằng dấu phẩy)</label><input id="h-amen" className="input" value={form.amenities} onChange={set('amenities')} /></div>
          <div className="md:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="label !mb-0" htmlFor="h-desc">Mô tả</label>
              <button type="button" className="btn-outline px-2 py-1 text-xs" disabled={aiBusy} onClick={generate}>
                {aiBusy ? 'Đang tạo...' : '✨ Tạo mô tả bằng AI'}
              </button>
            </div>
            <textarea id="h-desc" rows="4" className="input" value={form.description} onChange={set('description')} />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button className="btn-primary">Lưu</button>
            <button type="button" className="btn-outline" onClick={() => { setForm(null); setEditingId(null) }}>Hủy</button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Tên</th><th className="p-3">Thành phố</th><th className="p-3">Giá từ</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="p-3 font-medium">{h.name}</td>
                <td className="p-3">{h.city}</td>
                <td className="p-3">{h.minPrice != null ? formatVnd(h.minPrice) : '—'}</td>
                <td className="p-3 text-right">
                  <button className="btn-outline mr-2 px-2 py-1 text-xs" onClick={() => edit(h)}>Sửa</button>
                  <button className="btn-outline px-2 py-1 text-xs text-red-600" onClick={() => remove(h)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- Phòng ---------- */
const EMPTY_ROOM = { hotelId: '', roomType: 'Standard', pricePerNight: 500000, capacity: 2, quantity: 1, description: '' }

function RoomsTab() {
  const [hotels, setHotels] = useState([])
  const [rooms, setRooms] = useState(null)
  const [form, setForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [aiBusy, setAiBusy] = useState(false)

  const load = useCallback(() => {
    api('/admin/hotels').then(setHotels).catch((e) => setError(e.message))
    api('/admin/rooms').then(setRooms).catch((e) => setError(e.message))
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const hotelName = (id) => hotels.find((h) => h.id === id)?.name || id
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    const body = { ...form, hotelId: Number(form.hotelId), pricePerNight: Number(form.pricePerNight), capacity: Number(form.capacity), quantity: Number(form.quantity) }
    try {
      if (editingId) await api(`/admin/rooms/${editingId}`, { method: 'PUT', body })
      else await api('/admin/rooms', { method: 'POST', body })
      setForm(null)
      setEditingId(null)
      setError('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (r) => {
    if (!window.confirm(`Xóa phòng ${r.roomType} của ${hotelName(r.hotelId)}?`)) return
    try {
      await api(`/admin/rooms/${r.id}`, { method: 'DELETE' })
      setError('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const generate = async () => {
    const hotel = hotels.find((h) => String(h.id) === String(form.hotelId))
    if (!hotel) return setError('Chọn khách sạn trước khi tạo mô tả')
    setAiBusy(true)
    try {
      const res = await api('/ai/describe', {
        method: 'POST',
        body: { type: 'room', name: hotel.name, city: hotel.city, amenities: hotel.amenities, roomType: form.roomType },
      })
      setForm((f) => ({ ...f, description: res.description }))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setAiBusy(false)
    }
  }

  if (!rooms) return error ? <ErrorBox message={error} /> : <Spinner />

  return (
    <div>
      <ErrorBox message={error} />
      {!form && (
        <button className="btn-primary mb-3" onClick={() => { setForm({ ...EMPTY_ROOM, hotelId: hotels[0]?.id ?? '' }); setEditingId(null) }}>
          + Thêm phòng
        </button>
      )}
      {form && (
        <form onSubmit={save} className="card mb-5 grid gap-3 p-4 md:grid-cols-2">
          <h2 className="font-semibold md:col-span-2">{editingId ? 'Sửa phòng' : 'Thêm phòng'}</h2>
          <div>
            <label className="label" htmlFor="r-hotel">Khách sạn</label>
            <select id="r-hotel" required className="input" value={form.hotelId} onChange={set('hotelId')}>
              {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div><label className="label" htmlFor="r-type">Loại phòng</label><input id="r-type" required className="input" value={form.roomType} onChange={set('roomType')} /></div>
          <div><label className="label" htmlFor="r-price">Giá / đêm (₫)</label><input id="r-price" type="number" min="0" required className="input" value={form.pricePerNight} onChange={set('pricePerNight')} /></div>
          <div><label className="label" htmlFor="r-cap">Sức chứa (khách)</label><input id="r-cap" type="number" min="1" required className="input" value={form.capacity} onChange={set('capacity')} /></div>
          <div><label className="label" htmlFor="r-qty">Số phòng</label><input id="r-qty" type="number" min="1" required className="input" value={form.quantity} onChange={set('quantity')} /></div>
          <div className="md:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="label !mb-0" htmlFor="r-desc">Mô tả</label>
              <button type="button" className="btn-outline px-2 py-1 text-xs" disabled={aiBusy} onClick={generate}>
                {aiBusy ? 'Đang tạo...' : '✨ Tạo mô tả bằng AI'}
              </button>
            </div>
            <textarea id="r-desc" rows="3" className="input" value={form.description} onChange={set('description')} />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button className="btn-primary">Lưu</button>
            <button type="button" className="btn-outline" onClick={() => { setForm(null); setEditingId(null) }}>Hủy</button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Khách sạn</th><th className="p-3">Loại</th><th className="p-3">Giá/đêm</th><th className="p-3">Sức chứa</th><th className="p-3">SL</th><th className="p-3"></th></tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{hotelName(r.hotelId)}</td>
                <td className="p-3 font-medium">{r.roomType}</td>
                <td className="p-3">{formatVnd(r.pricePerNight)}</td>
                <td className="p-3">{r.capacity}</td>
                <td className="p-3">{r.quantity}</td>
                <td className="p-3 text-right">
                  <button className="btn-outline mr-2 px-2 py-1 text-xs"
                          onClick={() => { setEditingId(r.id); setForm({ hotelId: r.hotelId, roomType: r.roomType, pricePerNight: r.pricePerNight, capacity: r.capacity, quantity: r.quantity, description: r.description || '' }) }}>
                    Sửa
                  </button>
                  <button className="btn-outline px-2 py-1 text-xs text-red-600" onClick={() => remove(r)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
