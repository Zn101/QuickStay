import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

/**
 * Nội dung Tours / Restaurants / News lưu trên backend (/api/content/{type}).
 * Chưa từng lưu (404) hoặc lỗi mạng: dùng dữ liệu mặc định đi kèm frontend.
 */
export function useSiteContent(type, initial) {
  const [items, setItems] = useState(initial)
  useEffect(() => {
    let alive = true
    api(`/content/${type}`)
      .then((res) => {
        if (alive && Array.isArray(res?.items)) setItems(res.items)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [type])
  return items
}

/**
 * Bản dùng cho trang admin: setItems(next | fn) cập nhật giao diện và lưu toàn bộ danh sách lên backend.
 * Lưu lỗi thì khôi phục danh sách trước đó và báo lỗi.
 */
export function useManagedSiteContent(type, initial) {
  const [items, setLocal] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const current = useRef(initial)

  useEffect(() => {
    let alive = true
    api(`/content/${type}`)
      .then((res) => {
        if (alive && Array.isArray(res?.items)) {
          current.current = res.items
          setLocal(res.items)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [type])

  const setItems = useCallback(
    (next) => {
      const prev = current.current
      const value = typeof next === 'function' ? next(prev) : next
      current.current = value
      setLocal(value)
      setSaving(true)
      setError('')
      api(`/admin/content/${type}`, { method: 'PUT', body: value })
        .catch((err) => {
          current.current = prev
          setLocal(prev)
          setError(err.message || 'Không lưu được nội dung, thay đổi đã được hoàn tác.')
        })
        .finally(() => setSaving(false))
    },
    [type],
  )

  return [items, setItems, { error, saving }]
}
