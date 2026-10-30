/**
 * Logic lọc danh sách khách sạn cho Homepage (UC04).
 * Query params theo docs/QuickStay-API.md: GET /hotels?q&city&roomType&minPrice&maxPrice
 */

/** Loại phòng theo dữ liệu mẫu của hệ thống (SampleDataSeeder). API không có endpoint liệt kê loại phòng. */
export const ROOM_TYPES = ['Standard', 'Deluxe', 'Family Suite']

/** Trả về { min, max, error } — error là chuỗi rỗng nếu hợp lệ. Giá trị rỗng = không lọc. */
export function validatePriceRange(minRaw, maxRaw) {
  const parse = (raw) => {
    const s = String(raw ?? '').trim()
    if (s === '') return { empty: true }
    const n = Number(s)
    if (!Number.isFinite(n)) return { invalid: true }
    return { value: n }
  }
  const min = parse(minRaw)
  const max = parse(maxRaw)
  if (min.invalid || max.invalid) return { min: '', max: '', error: 'Giá không hợp lệ' }
  if ((min.value ?? 0) < 0 || (max.value ?? 0) < 0) return { min: '', max: '', error: 'Giá không được âm' }
  if (min.value != null && max.value != null && min.value > max.value) {
    return { min: '', max: '', error: 'Giá tối thiểu không được lớn hơn giá tối đa' }
  }
  return { min: min.value ?? '', max: max.value ?? '', error: '' }
}

/** Chuẩn hóa filters thành params gửi API (bỏ giá trị rỗng, trim chuỗi). */
export function buildHotelParams({ q = '', city = '', roomType = '', minPrice = '', maxPrice = '' }) {
  const params = {}
  if (q.trim()) params.q = q.trim()
  if (city.trim()) params.city = city.trim()
  if (roomType) params.roomType = roomType
  if (minPrice !== '' && minPrice != null) params.minPrice = minPrice
  if (maxPrice !== '' && maxPrice != null) params.maxPrice = maxPrice
  return params
}

export const hasActiveFilters = (params) => Object.keys(params).length > 0
