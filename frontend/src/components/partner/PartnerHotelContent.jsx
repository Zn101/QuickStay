import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ErrorBox } from '../ui'
import RowsEditor, { parseRows, serializeRows, inputCls, labelCls, cardCls } from './RowsEditor'

const GALLERY = [
  { key: 'url', label: 'Đường dẫn ảnh (https://...)' },
  { key: 'caption', label: 'Chú thích' },
]
const RULES = [
  { key: 'title', label: 'Tiêu đề (VD: Trẻ em & giường phụ)' },
  { key: 'detail', label: 'Nội dung quy định' },
]
const TRANSFERS = [
  { key: 'title', label: 'Tên dịch vụ' },
  { key: 'vehicle', label: 'Mẫu xe' },
  { key: 'seats', label: 'Số khách tối đa', type: 'number' },
  { key: 'duration', label: 'Thời gian' },
  { key: 'price', label: 'Giá (VND)', type: 'number' },
]
const DINING = [
  { key: 'name', label: 'Tên nhà hàng / quầy' },
  { key: 'cuisine', label: 'Loại ẩm thực' },
  { key: 'hours', label: 'Giờ mở cửa' },
  { key: 'highlight', label: 'Điểm nổi bật' },
  { key: 'priceNote', label: 'Ghi chú giá' },
]
const ATTRACTIONS = [
  { key: 'name', label: 'Địa điểm' },
  { key: 'distance', label: 'Khoảng cách' },
  { key: 'transport', label: 'Phương tiện' },
  { key: 'duration', label: 'Thời gian' },
  { key: 'price', label: 'Giá xe (VND)', type: 'number' },
]

function fromHotel(h) {
  return {
    checkInTime: h.checkInTime || '',
    checkOutTime: h.checkOutTime || '',
    airportName: h.airportName || '',
    gallery: parseRows(h.gallery, GALLERY),
    houseRules: parseRows(h.houseRules, RULES),
    transfers: parseRows(h.transfers, TRANSFERS),
    dining: parseRows(h.dining, DINING),
    attractions: parseRows(h.attractions, ATTRACTIONS),
  }
}

/** Nội dung trang chi tiết khách sạn do đối tác tự quản lý (thay cho dữ liệu cố định trước đây). */
export default function PartnerHotelContent({ hotel, onSaved }) {
  const [form, setForm] = useState(() => fromHotel(hotel))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(fromHotel(hotel))
  }, [hotel])

  const set = (key) => (value) => {
    setSaved(false)
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      const updated = await api(`/partner/hotel/${hotel.id}`, {
        method: 'PUT',
        body: {
          name: hotel.name,
          city: hotel.city,
          address: hotel.address,
          description: hotel.description,
          imageUrl: hotel.imageUrl,
          amenities: hotel.amenities,
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          airportName: form.airportName,
          gallery: serializeRows(form.gallery, GALLERY),
          houseRules: serializeRows(form.houseRules, RULES),
          transfers: serializeRows(form.transfers, TRANSFERS),
          dining: serializeRows(form.dining, DINING),
          attractions: serializeRows(form.attractions, ATTRACTIONS),
        },
      })
      setSaved(true)
      onSaved?.(updated)
    } catch (err) {
      setError(err.message || 'Không lưu được nội dung trang.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form id="noi-dung" onSubmit={save} className={`${cardCls} scroll-mt-24 space-y-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Nội dung trang khách sạn</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Ảnh, giờ nhận / trả phòng, quy định, dịch vụ đưa đón, ẩm thực và xe tham quan hiển thị cho khách. Mục để trống sẽ được ẩn.
          </p>
        </div>
        <Link
          to={`/hotels/${hotel.id}`}
          target="_blank"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200"
        >
          Xem trang khách ↗
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className={labelCls}>Giờ nhận phòng</span>
          <input type="time" value={form.checkInTime} onChange={(e) => set('checkInTime')(e.target.value)} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Giờ trả phòng</span>
          <input type="time" value={form.checkOutTime} onChange={(e) => set('checkOutTime')(e.target.value)} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Sân bay đón / trả</span>
          <input
            value={form.airportName}
            maxLength={255}
            placeholder="VD: Sân bay Quốc tế Đà Nẵng (DAD)"
            onChange={(e) => set('airportName')(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      <RowsEditor label="Thư viện ảnh" hint="Ảnh đại diện sửa ở mục Chỉnh sửa thông tin" columns={GALLERY} rows={form.gallery} onChange={set('gallery')} addLabel="+ Thêm ảnh" />
      <RowsEditor label="Quy định riêng của cơ sở" hint="Hiển thị cùng chính sách hủy / thanh toán của QuickStay" columns={RULES} rows={form.houseRules} onChange={set('houseRules')} addLabel="+ Thêm quy định" />
      <RowsEditor label="Đưa đón sân bay" hint="Phí khách thấy và được ghi vào yêu cầu dịch vụ" columns={TRANSFERS} rows={form.transfers} onChange={set('transfers')} addLabel="+ Thêm loại xe" />
      <RowsEditor label="Ẩm thực tại cơ sở" columns={DINING} rows={form.dining} onChange={set('dining')} addLabel="+ Thêm nhà hàng / quầy" />
      <RowsEditor label="Xe đi điểm tham quan" hint="Giá 0 = miễn phí" columns={ATTRACTIONS} rows={form.attractions} onChange={set('attractions')} addLabel="+ Thêm điểm tham quan" />

      {error && <ErrorBox message={error} />}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        {saved && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Đã lưu, trang khách đã cập nhật</span>}
        <button
          type="submit"
          disabled={busy}
          className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? 'Đang lưu...' : 'Lưu nội dung trang'}
        </button>
      </div>
    </form>
  )
}
