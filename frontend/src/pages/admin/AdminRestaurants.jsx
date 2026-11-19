import { useState, useMemo } from 'react'
import { ConfirmModal } from '../../components/ui'
import { useAdminVenues } from '../../lib/venues'

const EMPTY_REST = {
  name: '',
  city: 'Đà Nẵng',
  cuisine: 'Hải sản',
  address: '',
  hours: '11:00 – 22:30',
  priceRange: '200.000 ₫ - 500.000 ₫/khách',
  specialties: '',
  description: '',
  image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
}

export default function AdminRestaurants() {
  const { items: restaurants, save, remove, error: saveError, busy: saving } = useAdminVenues('restaurants')
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_REST)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const matchCity = selectedCity === 'ALL' || r.city.toLowerCase() === selectedCity.toLowerCase()
      const matchQ =
        !search.trim() ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.city.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(search.toLowerCase())
      return matchCity && matchQ
    })
  }, [restaurants, selectedCity, search])

  function handleOpenCreate() {
    setForm(EMPTY_REST)
    setEditId(null)
    setShowModal(true)
  }

  function handleOpenEdit(r) {
    setForm({
      name: r.name,
      city: r.city,
      cuisine: r.cuisine,
      address: r.address,
      hours: r.hours,
      priceRange: r.priceRange,
      specialties: r.specialties ? r.specialties.join(', ') : '',
      description: r.description || '',
      image: r.image,
    })
    setEditId(r.id)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const parsedSpecialties = form.specialties
      ? form.specialties.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const ok = await save(editId, {
      name: form.name,
      city: form.city,
      cuisine: form.cuisine,
      address: form.address,
      hours: form.hours,
      priceRange: form.priceRange,
      specialties: parsedSpecialties,
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Nhà hàng & Đặt Bàn</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách đối tác nhà hàng, menu đặc sản và thông tin ẩm thực các khu vực
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-sm cursor-pointer transition-colors"
        >
          + Thêm Nhà Hàng Mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo tên nhà hàng, loại ẩm thực, địa chỉ..."
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

      {/* Restaurants Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Nhà hàng / Ẩm thực</th>
                <th className="px-4 py-3">Thành phố</th>
                <th className="px-4 py-3">Giờ mở cửa</th>
                <th className="px-4 py-3">Khoảng giá</th>
                <th className="px-4 py-3">Đối tác</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={r.image} alt={r.name} className="h-12 w-14 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{r.name}</p>
                        <p className="text-[11px] text-sky-600 font-semibold">{r.cuisine}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{r.city}</td>
                  <td className="px-4 py-3">{r.hours}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{r.priceRange}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-slate-600">{r.ownerName || <span className="text-slate-400">Chưa gán</span>}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(r)}
                      className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100 cursor-pointer"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(r)}
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

      {/* Modal Thêm / Sửa Nhà Hàng */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-popup-in">
            <h3 className="text-base font-black text-slate-900 mb-4">
              {editId ? 'Chỉnh Sửa Thông Tin Nhà Hàng' : 'Thêm Nhà Hàng Mới'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Nhà Hàng</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phong cách ẩm thực</label>
                  <input
                    type="text"
                    value={form.cuisine}
                    onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ cụ thể</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giờ mở cửa</label>
                  <input
                    type="text"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Khoảng giá ước tính</label>
                  <input
                    type="text"
                    value={form.priceRange}
                    onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Món ăn đặc sắc (phân tách bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={form.specialties}
                  onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  placeholder="Tôm hùm nướng, Bò Wagyu, Nem cua bể..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL Ảnh nhà hàng</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
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
        title="Xác nhận xóa Nhà hàng"
        message={`Bạn có chắc chắn muốn xóa "${deleteTarget?.name}"?`}
        confirmText="Xác nhận xóa"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
