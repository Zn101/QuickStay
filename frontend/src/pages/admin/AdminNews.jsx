import { useState, useMemo } from 'react'
import { INITIAL_NEWS } from '../News'
import { ConfirmModal } from '../../components/ui'

const EMPTY_ARTICLE = {
  title: '',
  category: 'Điểm đến',
  author: 'Ban Biên Tập QuickStay',
  publishDate: '16/11/2026',
  summary: '',
  content: '',
  cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
  readTime: '3 phút đọc',
}

export default function AdminNews() {
  const [articles, setArticles] = useState(INITIAL_NEWS)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_ARTICLE)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory
      const matchQ =
        !search.trim() ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.author.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchQ
    })
  }, [articles, selectedCategory, search])

  function handleOpenCreate() {
    setForm(EMPTY_ARTICLE)
    setEditId(null)
    setShowModal(true)
  }

  function handleOpenEdit(a) {
    setForm({
      title: a.title,
      category: a.category,
      author: a.author,
      publishDate: a.publishDate,
      summary: a.summary,
      content: a.content,
      cover: a.cover,
      readTime: a.readTime,
    })
    setEditId(a.id)
    setShowModal(true)
  }

  function handleSave(e) {
    e.preventDefault()
    if (editId) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === editId
            ? {
                ...a,
                ...form,
              }
            : a
        )
      )
    } else {
      const newArt = {
        ...form,
        id: Date.now(),
        views: '1.240',
        featured: false,
      }
      setArticles((prev) => [newArt, ...prev])
    }
    setShowModal(false)
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Tin Tức & Cẩm Nang Du Lịch</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Biên tập bài viết, tin tức xu hướng và cẩm nang khám phá lữ hành
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-sm cursor-pointer transition-colors"
        >
          + Thêm Bài Viết Mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo tiêu đề bài viết, tác giả, danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
        >
          <option value="ALL">Tất cả chuyên mục</option>
          {['Điểm đến', 'Ẩm thực', 'Cẩm nang & Mẹo', 'Khách sạn', 'Xu hướng'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Articles Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Bài viết</th>
                <th className="px-4 py-3">Chuyên mục</th>
                <th className="px-4 py-3">Tác giả</th>
                <th className="px-4 py-3">Ngày đăng</th>
                <th className="px-4 py-3">Lượt đọc</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={a.cover} alt={a.title} className="h-12 w-16 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 line-clamp-1">{a.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{a.summary}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                      {a.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{a.author}</td>
                  <td className="px-4 py-3 text-slate-500">{a.publishDate}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{a.views}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(a)}
                      className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100 cursor-pointer"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(a)}
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

      {/* Modal Thêm / Sửa Bài Viết */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-popup-in custom-scrollbar">
            <h3 className="text-base font-black text-slate-900 mb-4">
              {editId ? 'Chỉnh Sửa Bài Viết' : 'Thêm Bài Viết Du Lịch Mới'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề bài viết</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chuyên mục</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  >
                    {['Điểm đến', 'Ẩm thực', 'Cẩm nang & Mẹo', 'Khách sạn', 'Xu hướng'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tác giả</label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL Ảnh bìa bài viết</label>
                <input
                  type="url"
                  value={form.cover}
                  onChange={(e) => setForm({ ...form, cover: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đoạn tóm tắt (Lead)</label>
                <textarea
                  rows={2}
                  required
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={6}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-sky-500 font-mono text-slate-800"
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
                  Lưu Bài Viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa bài viết"
        message={`Bạn có chắc chắn muốn xóa bài viết "${deleteTarget?.title}"?`}
        confirmText="Xác nhận xóa"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
