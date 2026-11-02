import { handleMockApi } from './mockData'

const KEY = 'quickstay-auth'

// Bật chế độ Mock Data mặc định cho Frontend (có thể đổi qua localStorage nếu cần)
export const isMockEnabled = () => {
  const stored = localStorage.getItem('quickstay_mock_mode')
  return stored !== 'false' // Mặc định là true
}

export const setMockMode = (enabled) => {
  localStorage.setItem('quickstay_mock_mode', enabled ? 'true' : 'false')
}

export const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')?.token ?? null
  } catch {
    return null
  }
}

/** Gọi API; tự động dùng Mock Data nếu bật chế độ Mock hoặc khi backend không phản hồi. */
export async function api(path, { method = 'GET', body, params } = {}) {
  // 1. Nếu đang ở chế độ Mock Data
  if (isMockEnabled()) {
    try {
      const mockResult = await handleMockApi(path, { method, body, params })
      if (mockResult !== undefined) {
        return mockResult
      }
    } catch (mockErr) {
      throw mockErr
    }
  }

  // 2. Nếu tắt Mock Data, gọi backend thật
  const url = new URL('/api' + path, window.location.origin)
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== '' && v != null) url.searchParams.set(k, v)
  })
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    // Nếu kết nối backend thất bại và chưa dùng mock, tự động cứu bằng mock data
    console.warn('[QuickStay] Không kết nối được backend, chuyển sang Mock Data...')
    return handleMockApi(path, { method, body, params })
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // Nếu backend trả về 500 hoặc 502/504 do proxy từ chối kết nối, cứu bằng mock data
    if (res.status >= 500) {
      console.warn('[QuickStay] Backend lỗi hoặc proxy ngắt kết nối, chuyển sang Mock Data...')
      return handleMockApi(path, { method, body, params })
    }
    const err = new Error(data?.message || (res.status === 401 ? 'Vui lòng đăng nhập' : 'Có lỗi xảy ra'))
    err.status = res.status
    throw err
  }
  return data
}

export const AUTH_KEY = KEY
