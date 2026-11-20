import { useState, useMemo } from 'react'
import { formatVnd } from '../../lib/format'
import { ConfirmModal } from '../../components/ui'
import { useAdminVenues, itineraryToText, textToItinerary, linesToText, textToLines } from '../../lib/venues'

const EMPTY_TOUR = {
  title: '',
  city: 'Đà Nẵng',
  category: 'Danh lam & Cảnh đẹp',
  duration: '1 ngày',
  price: 500000,
  transport: 'Xe 4-7 chỗ riêng tư',
  highlights: '',
  itinerary: '',
  includes: '',
  excludes: '',
  meetingPoint: '',
  maxGuestsPerDay: 30,
  description: '',
  image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80',
}

export default function AdminTours() {
  const { items: tours, save, remove, error: saveError, busy: saving } = useAdminVenues('tours')
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_TOUR)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    return tours.filter((t) => {
      const matchCity = selectedCity === 'ALL' || t.city.toLowerCase() === selectedCity.toLowerCase()
      const matchQ =
        !search.trim() ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.city.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      return matchCity && matchQ
    })
  }, [tours, selectedCity, search])

  function handleOpenCreate() {
    setForm(EMPTY_TOUR)
    setEditId(null)
    setShowModal(true)
  }

  function handleOpenEdit(tour) {
    setForm({
      title: tour.title,
      city: tour.city,
      category: tour.category,
      duration: tour.duration,
      price: tour.price,
      transport: tour.transport,
      highlights: tour.highlights ? tour.highlights.join(', ') : '',
      itinerary: itineraryToText(tour.itinerary),
      includes: linesToText(tour.includes),
      excludes: linesToText(tour.excludes),
      meetingPoint: tour.meetingPoint || '',
      maxGuestsPerDay: tour.maxGuestsPerDay || 30,
      description: tour.description || '',
      image: tour.image,
    })
    setEditId(tour.id)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const parsedHighlights = form.highlights
      ? form.highlights.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const ok = await save(editId, {
      title: form.title,
      city: form.city,
      category: form.category,
      duration: form.duration,
      price: Number(form.price),
      transport: form.transport,
      highlights: parsedHighlights,
      itinerary: textToItinerary(form.itinerary),
      includes: textToLines(form.includes),
      excludes: textToLines(form.excludes),
      meetingPoint: form.meetingPoint,
      maxGuestsPerDay: Number(form.maxGuestsPerDay) || 30,
      description: form.description,
      image: form.image,
    })
    if (ok) setShowModal(false)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {saveError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveError}</div>
      )}
      {saving && <div className="text-xs font-semibold text-slate-400">Đang lưu...</div>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Tour & Điểm đến</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thêm, sửa đổi lịch trình và quản lý các gói tour tham quan, xe đưa đón theo thành phố
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-sm cursor-pointer transition-colors"
        >
          + Thêm Tour Mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên tour, điểm đến hoặc danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
        >
          <option value="ALL">Tất cả thành phố</option>
          {['Đà Nẵng', 'Phú Quốc', 'Nha Trang', 'Hà Nội', 'Hồ Chí Minh', 'Hội An', 'Huế', 'Đà Lạt'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tours Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Tour / Trải nghiệm</th>
                <th className="px-4 py-3">Địa điểm</th>
                <th className="px-4 py-3">Thời lượng</th>
                <th className="px-4 py-3">Giá tour</th>
                <th className="px-4 py-3">Đối tác</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={t.image} alt={t.title} className="h-12 w-14 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{t.title}</p>
                        <p className="text-[11px] text-sky-600 font-semibold">{t.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{t.city}</td>
                  <td className="px-4 py-3">{t.duration}</td>
                  <td className="px-4 py-3 font-black text-sky-700">{formatVnd(t.price)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-slate-600">{t.ownerName || <span className="text-slate-400">Chưa gán</span>}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100 cursor-pointer"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(t)}
                      className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 cursor-pointer"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa Tour */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-popup-in">
            <h3 className="text-base font-black text-slate-900 mb-4">
              {editId ? 'Chỉnh Sửa Thông Tin Tour' : 'Thêm Tour Mới'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Tour</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thành phố</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  >
                    {['Đà Nẵng', 'Phú Quốc', 'Nha Trang', 'Hà Nội', 'Hồ Chí Minh', 'Hội An', 'Huế', 'Đà Lạt'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Danh mục</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá tour (VNĐ/khách)</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thời lượng</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL Ảnh bìa</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Điểm nổi bật (phân tách bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={form.highlights}
                  onChange={(e) => setForm({ ...form, highlights: e.target.value })}
                  placeholder="Cầu Vàng, Làng Pháp, Cáp treo..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Điểm đón / tập trung</label>
                  <input
                    type="text"
                    value={form.meetingPoint}
                    onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
                    placeholder="Sảnh khách sạn trung tâm"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số khách tối đa / ngày</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={form.maxGuestsPerDay}
                    onChange={(e) => setForm({ ...form, maxGuestsPerDay: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lịch trình (mỗi dòng: Giờ | Hoạt động)</label>
                <textarea
                  rows={4}
                  value={form.itinerary}
                  onChange={(e) => setForm({ ...form, itinerary: e.target.value })}
                  placeholder={'07:30 | Đón khách tại khách sạn\n08:30 | Đi cáp treo'}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá đã bao gồm (mỗi dòng một ý)</label>
                  <textarea
                    rows={3}
                    value={form.includes}
                    onChange={(e) => setForm({ ...form, includes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chưa bao gồm (mỗi dòng một ý)</label>
                  <textarea
                    rows={3}
                    value={form.excludes}
                    onChange={(e) => setForm({ ...form, excludes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa Tour"
        message={`Bạn có chắc chắn muốn xóa tour "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
