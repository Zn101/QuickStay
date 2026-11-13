import { describe, expect, it } from 'vitest'
import { NEXT_STATUS, formatDate, formatDateVi, formatVnd, nightsBetween } from './format'

describe('format helpers', () => {
  it('formats VND with thousands separators', () => {
    expect(formatVnd(1500000)).toContain('1.500.000')
    expect(formatVnd(null)).toBe('')
    expect(formatVnd(undefined)).toBe('')
    expect(formatVnd(NaN)).toBe('')
  })

  it('formats ISO date as dd/mm/yyyy', () => {
    expect(formatDate('2026-10-23')).toBe('23/10/2026')
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
  })

  it('formats ISO date with Vietnamese weekday and day/month', () => {
    // 2026-11-13 is Friday (Th 6)
    expect(formatDateVi('2026-11-13')).toBe('Th 6, 13 thg 11')
    expect(formatDateVi('')).toBe('')
    expect(formatDateVi(null)).toBe('')
  })

  it('counts nights between two dates', () => {
    expect(nightsBetween('2026-10-21', '2026-10-24')).toBe(3)
    expect(nightsBetween('2026-10-21', '2026-10-22')).toBe(1)
    expect(nightsBetween('2026-10-24', '2026-10-21')).toBe(0)
    expect(nightsBetween('2026-10-21', '2026-10-21')).toBe(0)
    expect(nightsBetween('', '2026-10-21')).toBe(0)
    expect(nightsBetween('2026-10-21', '')).toBe(0)
  })

  it('counts nights across month boundary correctly', () => {
    expect(nightsBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(nightsBetween('2026-02-28', '2026-03-01')).toBe(1)
  })

  it('counts nights across year boundary correctly', () => {
    expect(nightsBetween('2026-12-30', '2027-01-02')).toBe(3)
  })

  it('follows the booking status flow', () => {
    expect(NEXT_STATUS.PENDING).toEqual(['CONFIRMED', 'CANCELLED'])
    expect(NEXT_STATUS.COMPLETED).toEqual([])
  })
})
