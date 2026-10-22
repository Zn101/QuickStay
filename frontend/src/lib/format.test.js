import { describe, expect, it } from 'vitest'
import { NEXT_STATUS, formatDate, formatVnd, nightsBetween } from './format'

describe('format helpers', () => {
  it('formats VND with thousands separators', () => {
    expect(formatVnd(1500000)).toContain('1.500.000')
    expect(formatVnd(null)).toBe('')
  })

  it('formats ISO date as dd/mm/yyyy', () => {
    expect(formatDate('2026-10-23')).toBe('23/10/2026')
  })

  it('counts nights between two dates', () => {
    expect(nightsBetween('2026-10-21', '2026-10-24')).toBe(3)
    expect(nightsBetween('2026-10-24', '2026-10-21')).toBe(0)
    expect(nightsBetween('', '2026-10-21')).toBe(0)
  })

  it('follows the booking status flow', () => {
    expect(NEXT_STATUS.PENDING).toEqual(['CONFIRMED', 'CANCELLED'])
    expect(NEXT_STATUS.COMPLETED).toEqual([])
  })
})
