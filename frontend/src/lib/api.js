const KEY = 'quickstay-auth'

export const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')?.token ?? null
  } catch {
    return null
  }
}

/** Gọi backend qua proxy /api. Lỗi ném ra luôn mang `message` lấy từ backend ({"message": "..."}). */
export async function api(path, { method = 'GET', body, params } = {}) {
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
    const err = new Error('Không kết nối được máy chủ. Vui lòng kiểm tra backend và thử lại.')
    err.status = 0
    throw err
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.message || defaultMessage(res.status))
    err.status = res.status
    err.errors = data?.errors || null
    throw err
  }
  return data
}

function defaultMessage(status) {
  if (status === 401) return 'Vui lòng đăng nhập'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này'
  if (status === 404) return 'Không tìm thấy dữ liệu'
  if (status >= 500) return 'Lỗi máy chủ, vui lòng thử lại sau'
  return 'Có lỗi xảy ra'
}

export const AUTH_KEY = KEY
