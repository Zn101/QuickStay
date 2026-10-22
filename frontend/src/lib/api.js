const KEY = 'quickstay-auth'

export const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')?.token ?? null
  } catch {
    return null
  }
}

/** Gọi API, tự gắn JWT; lỗi trả về Error có message từ backend. */
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
    throw new Error('Không kết nối được máy chủ')
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.message || (res.status === 401 ? 'Vui lòng đăng nhập' : 'Có lỗi xảy ra'))
    err.status = res.status
    throw err
  }
  return data
}

export const AUTH_KEY = KEY
