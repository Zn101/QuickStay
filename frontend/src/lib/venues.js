import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

/**
 * Nhà hàng / tour lấy từ backend (/api/restaurants, /api/tours).
 * Lỗi mạng: dùng dữ liệu mặc định đi kèm frontend để trang vẫn hiển thị (khi đó không đặt được đơn).
 */
export function useVenueList(kind, fallback) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let alive = true
    api(`/${kind}`)
      .then((list) => {
        if (!alive) return
        setItems(Array.isArray(list) ? list : [])
        setOffline(false)
      })
      .catch(() => {
        if (!alive) return
        setItems(fallback)
        setOffline(true)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [kind, fallback])

  return { items, loading, offline }
}

/** Trang admin: danh sách + tạo / sửa / xoá qua /api/admin/{kind}. */
export function useAdminVenues(kind) {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(() => {
    api(`/${kind}`)
      .then((list) => setItems(Array.isArray(list) ? list : []))
      .catch((err) => setError(err.message || 'Không tải được dữ liệu.'))
  }, [kind])

  useEffect(() => {
    reload()
  }, [reload])

  async function save(id, payload) {
    setBusy(true)
    setError('')
    try {
      const saved = await api(id ? `/admin/${kind}/${id}` : `/admin/${kind}`, {
        method: id ? 'PUT' : 'POST',
        body: payload,
      })
      setItems((prev) => (id ? prev.map((x) => (x.id === id ? saved : x)) : [saved, ...prev]))
      return true
    } catch (err) {
      setError(err.message || 'Không lưu được.')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    setBusy(true)
    setError('')
    try {
      await api(`/admin/${kind}/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      setError(err.message || 'Không xoá được.')
    } finally {
      setBusy(false)
    }
  }

  return { items, error, busy, save, remove, reload }
}

export const ORDER_STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã huỷ',
}

export const ORDER_STATUS_CLASS = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-sky-100 text-sky-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-slate-200 text-slate-600',
}
