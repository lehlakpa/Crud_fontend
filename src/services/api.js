import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../constants/auth.js'

export async function apiRequest(endpoint, { body, token, method = 'GET', signal } = {}, baseUrl = API_BASE_URL) {
  if (!baseUrl) throw new Error('Set VITE_API_BASE_URL in your .env file and restart the app.')
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const multipart = body instanceof FormData
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
      signal: controller.signal,
    })
    const text = await response.text()
    let data = null
    if (text) {
      try { data = JSON.parse(text) } catch {
        if (response.ok) throw new Error('The server returned an unexpected response. Please try again.')
      }
    }
    if (!response.ok || data?.success === false) {
      const message = data?.message || data?.error
      const error = new Error(typeof message === 'string' ? message : `Request failed (${response.status}). Please try again.`)
      error.status = response.status
      throw error
    }
    return data
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The server took too long to respond. Please try again.', { cause: error })
    if (error instanceof TypeError) throw new Error('Unable to reach the server. Check your connection and try again.', { cause: error })
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
