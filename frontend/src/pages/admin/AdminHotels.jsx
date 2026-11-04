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

  // States cho tìm kiếm và lọc theo thành phố
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('ALL')

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    api('/admin/hotels')
      .then((data) => setHotels(data || []))
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
    setForm({
      name: h.name,
      city: h.city,
      address: h.address || '',
      description: h.description || '',
      imageUrl: h.imageUrl || '',
      amenities: h.amenities || '',
    })
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
    if (!confirm('Bạn có chắc chắn muốn xóa khách sạn này khỏi hệ thống?')) return
    try {
      await api(`/admin/hotels/${id}`, { method: 'DELETE' })
      setHotels((hs) => hs.filter((h) => h.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  // Tách danh sách tiện nghi từ chuỗi cách nhau bằng dấu phẩy
  const parseAmenities = (str) => {
    if (!str) return []
    return str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // Lấy danh sách các thành phố duy nhất để lọc
  const cities = ['ALL', ...Array.from(new Set(hotels.map((h) => h.city).filter(Boolean)))]

  // Lọc danh sách khách sạn theo từ khóa và thành phố
  const filteredHotels = hotels.filter((h) => {
    const matchSearch =
      h.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.city?.toLowerCase().includes(search.toLowerCase()) ||
      h.address?.toLowerCase().includes(search.toLowerCase())
    const matchCity = selectedCity === 'ALL' || h.city === selectedCity
    return matchSearch && matchCity
  })

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all'

  return (
    <div className="space-y-6 pb-10">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản lý Khách sạn</h1>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-extrabold text-sky-700 ring-1 ring-sky-600/10">
              {hotels.length} cơ sở
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý danh sách cơ sở lưu trú, thông tin địa điểm, hình ảnh và tiện ích đi kèm.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 hover:from-sky-500 hover:to-indigo-500 active:scale-95 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Thêm khách sạn mới
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {/* Toolbar: Search & City Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên khách sạn, thành phố, địa chỉ..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* City Filter */}
          {cities.length > 2 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ALL">📍 Tất cả thành phố ({hotels.length})</option>
              {cities
                .filter((c) => c !== 'ALL')
                .map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
            </select>
          )}
        </div>

        <div className="text-xs font-medium text-slate-400 self-end sm:self-center">
          Hiển thị <span className="font-bold text-slate-700">{filteredHotels.length}</span> / {hotels.length} khách sạn
        </div>
      </div>

      {/* Grid Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-24 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-500">Đang tải danh sách khách sạn...</p>
        </div>
      ) : filteredHotels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            {hotels.length === 0 ? 'Chưa có khách sạn nào' : 'Không tìm thấy kết quả phù hợp'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {hotels.length === 0
              ? 'Hãy bắt đầu xây dựng hệ thống lưu trú của bạn bằng cách thêm khách sạn đầu tiên.'
              : 'Thử thay đổi từ khóa tìm kiếm hoặc chọn lại bộ lọc thành phố.'}
          </p>
          {hotels.length === 0 && (
            <button
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700"
            >
              + Thêm khách sạn ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHotels.map((h) => {
            const amenityList = parseAmenities(h.amenities)
            return (
              <div
                key={h.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-sky-200"
              >
                <div>
                  {/* Card Thumbnail */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    {h.imageUrl ? (
                      <img
                        src={h.imageUrl}
                        alt={h.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                      <span className="rounded-lg bg-slate-900/75 px-2.5 py-1 font-mono text-xs font-bold text-white backdrop-blur-md">
                        #{h.id}
                      </span>
                      <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-md">
                        📍 {h.city}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">
                      {h.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 line-clamp-1">
                      <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{h.address || 'Chưa cập nhật địa chỉ cụ thể'}</span>
                    </p>

                    <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {h.description || 'Chưa có bài viết mô tả chi tiết cho cơ sở lưu trú này.'}
                    </p>

                    {/* Amenities Badges */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {amenityList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {amenityList.slice(0, 4).map((item, idx) => (
                            <span
                              key={idx}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                            >
                              {item}
                            </span>
                          ))}
                          {amenityList.length > 4 && (
                            <span className="rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-600">
                              +{amenityList.length - 4}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] italic text-slate-400">Chưa thiết lập tiện nghi</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
                  <button
                    onClick={() => openEdit(h)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-sm hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => deleteHotel(h.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 shadow-sm hover:bg-rose-50 hover:border-rose-300 transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {editId ? 'Chỉnh sửa thông tin khách sạn' : 'Thêm khách sạn mới'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Điền đầy đủ các thông tin bên dưới để hiển thị trên trang đặt phòng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={submit} className="p-6 space-y-5">
              {formError && <ErrorBox message={formError} />}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tên khách sạn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Melia Vinpearl..."
                    value={form.name}
                    onChange={setField('name')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Đà Nẵng, Phú Quốc..."
                    value={form.city}
                    onChange={setField('city')}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Địa chỉ chi tiết
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={form.address}
                  onChange={setField('address')}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tiện nghi đi kèm <span className="font-normal text-slate-400">(ngăn cách bằng dấu phẩy)</span>
                </label>
                <input
                  type="text"
                  value={form.amenities}
                  onChange={setField('amenities')}
                  placeholder="Hồ bơi vô cực, Wifi tốc độ cao, Spa, Đưa đón sân bay..."
                  className={inputClass}
                />
                {parseAmenities(form.amenities).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parseAmenities(form.amenities).map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-100"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mô tả giới thiệu
                </label>
                <textarea
                  rows={4}
                  placeholder="Nhập mô tả không gian, điểm nhấn kiến trúc và dịch vụ nổi bật..."
                  value={form.description}
                  onChange={setField('description')}
                  className={inputClass + ' resize-none leading-relaxed'}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Đường dẫn hình ảnh (URL)
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={setField('imageUrl')}
                  placeholder="https://images.unsplash.com/..."
                  className={inputClass}
                />
                {form.imageUrl && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="h-16 w-24 rounded-lg object-cover bg-white border border-slate-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="text-xs text-slate-500">
                      <p className="font-semibold text-slate-700">Xem trước ảnh đại diện</p>
                      <p className="text-[11px] text-slate-400">Ảnh sẽ hiển thị trên thẻ khách sạn</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-60 transition-all"
                >
                  {busy ? 'Đang lưu...' : editId ? 'Lưu thay đổi' : 'Tạo khách sạn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}