import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

/**
 * Lấy danh sách khách sạn qua shared `api` client (JWT tự gắn).
 * Chỉ gọi lại khi nội dung params thay đổi; bỏ qua response cũ (stale) khi params đổi nhanh.
 */
export function useHotels(params) {
  const [state, setState] = useState({ hotels: [], loading: true, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const key = JSON.stringify(params)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: '' }))
    api('/hotels', { params: JSON.parse(key) })
      .then((data) => {
        if (!cancelled) setState({ hotels: Array.isArray(data) ? data : [], loading: false, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setState({ hotels: [], loading: false, error: err?.message || 'Có lỗi xảy ra' })
      })
    return () => { cancelled = true }
  }, [key, reloadKey])

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])
  return { ...state, retry }
}

/** Trả về value sau `delay` ms không đổi. */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
