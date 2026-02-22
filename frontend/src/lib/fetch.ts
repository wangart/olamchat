import { toast } from 'sonner'

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (res.status === 429) {
    const retryAfter = res.headers.get('retry-after')
    toast.error(
      retryAfter
        ? `Too many requests. Try again in ${retryAfter}s.`
        : 'Too many requests. Please slow down.',
    )
  }

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return res
}
