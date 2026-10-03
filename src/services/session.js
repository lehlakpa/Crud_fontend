import { AUTH_ENDPOINTS, SESSION_STORAGE_KEY } from '../constants/auth.js'
import { apiRequest } from './api.js'

// Injectable dependencies keep session behavior testable without browser storage.
export function createSessionClient(request = apiRequest, storage = () => globalThis.sessionStorage) {
  let session = null
  let refreshPromise = null
  let version = 0
  const listeners = new Set()

  function read() {
    try {
      const value = JSON.parse(storage()?.getItem(SESSION_STORAGE_KEY) || 'null')
      return typeof value?.refreshToken === 'string' && value?.user ? value : null
    } catch { return null }
  }

  function publish(next) {
    session = next
    listeners.forEach((listener) => listener(next?.user ?? null))
  }

  function persist(next) {
    try {
      storage()?.setItem(SESSION_STORAGE_KEY, JSON.stringify({ refreshToken: next.refreshToken, user: next.user }))
    } catch {
      throw new Error('Allow browser session storage to keep your account signed in.')
    }
  }

  function clear() {
    version += 1
    try { storage()?.removeItem(SESSION_STORAGE_KEY) } catch { /* Storage may be unavailable. */ }
    publish(null)
  }

  function normalize(response, previous = {}) {
    const data = response?.data ?? response
    const accessToken = data?.accessToken ?? data?.token ?? response?.accessToken ?? response?.token
    const refreshToken = data?.refreshToken ?? response?.refreshToken ?? previous.refreshToken
    if (typeof accessToken !== 'string' || !accessToken || typeof refreshToken !== 'string' || !refreshToken) {
      throw new Error('The server must return accessToken and refreshToken to keep you signed in.')
    }
    const profile = data?.user ?? response?.user ?? previous.user
    const user = { name: profile?.name || '', username: profile?.username || previous.user?.username || '' }
    return { accessToken, refreshToken, user }
  }

  function acceptLogin(response, username) {
    const next = normalize(response, { user: { username } })
    persist(next)
    version += 1
    publish(next)
  }

  async function refresh() {
    if (refreshPromise) return refreshPromise
    const previous = session ?? read()
    if (!previous) { clear(); return null }
    const startedAt = version
    refreshPromise = (async () => {
      try {
        const response = await request(AUTH_ENDPOINTS.refresh, {
          method: 'POST', body: { refreshToken: previous.refreshToken },
        })
        if (version !== startedAt) return null
        const next = normalize(response, previous)
        persist(next)
        publish(next)
        return next
      } catch (error) {
        if (version === startedAt && [400, 401, 403].includes(error.status)) clear()
        throw error
      } finally {
        refreshPromise = null
      }
    })()
    return refreshPromise
  }

  async function restore() {
    if (session) return session
    if (!read()) return null
    try { return await refresh() } catch (error) {
      if ([400, 401, 403].includes(error.status)) return null
      throw error
    }
  }

  async function authorizedRequest(endpoint, options = {}) {
    const current = session ?? await restore()
    if (!current) throw new Error('Your session has expired. Please sign in again.')
    try {
      return await request(endpoint, { ...options, token: current.accessToken })
    } catch (error) {
      if (error.status !== 401) throw error
      // Concurrent 401 responses share a refresh; late responses reuse the new token.
      const renewed = session && session.accessToken !== current.accessToken ? session : await refresh()
      if (!renewed) throw new Error('Your session has expired. Please sign in again.', { cause: error })
      try {
        return await request(endpoint, { ...options, token: renewed.accessToken })
      } catch (retryError) {
        if (retryError.status === 401) clear()
        throw retryError
      }
    }
  }

  async function logout() {
    const current = session ?? read()
    try {
      await request(AUTH_ENDPOINTS.logout, {
        method: 'POST', token: current?.accessToken,
        ...(current?.refreshToken ? { body: { refreshToken: current.refreshToken } } : {}),
      })
    } catch (error) {
      if (error.status !== 401) throw error
    }
    clear()
  }

  return {
    acceptLogin, restore, refresh, authorizedRequest, logout, clear,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
  }
}

export const sessionClient = createSessionClient()
