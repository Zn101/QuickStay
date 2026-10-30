import { describe, it, expect } from 'vitest'
import { validatePriceRange, buildHotelParams, hasActiveFilters } from './hotelFilters'

describe('validatePriceRange', () => {
  it('chấp nhận rỗng', () => expect(validatePriceRange('', '')).toEqual({ min: '', max: '', error: '' }))
  it('chỉ min hoặc chỉ max', () => {
    expect(validatePriceRange('100', '').min).toBe(100)
    expect(validatePriceRange('', '500').max).toBe(500)
  })
  it('từ chối giá âm', () => expect(validatePriceRange('-1', '').error).toBeTruthy())
  it('từ chối min > max', () => expect(validatePriceRange('900', '100').error).toBeTruthy())
  it('cho phép min = max', () => expect(validatePriceRange('100', '100').error).toBe(''))
  it('từ chối giá không phải số', () => expect(validatePriceRange('abc', '').error).toBeTruthy())
})

describe('buildHotelParams', () => {
  it('trim và bỏ giá trị rỗng', () => {
    expect(buildHotelParams({ q: '  da nang ', roomType: '', minPrice: '' })).toEqual({ q: 'da nang' })
  })
  it('kết hợp đủ filter', () => {
    const p = buildHotelParams({ q: 'sun', roomType: 'Deluxe', minPrice: 100, maxPrice: 900 })
    expect(p).toEqual({ q: 'sun', roomType: 'Deluxe', minPrice: 100, maxPrice: 900 })
    expect(hasActiveFilters(p)).toBe(true)
    expect(hasActiveFilters({})).toBe(false)
  })
})
