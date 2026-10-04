import { API_BASE_URL } from '../constants/auth.js'

const deadlines = new Map()
const listeners = new Set()
const storageKey = baseUrl => `everyday.retryAfter.${baseUrl}`

export function retryAfterDeadline(value, now = Date.now()) {
  if (value && /^\d+(\.\d+)?$/.test(value.trim())) return now + Number(value) * 1000
  const date = value ? Date.parse(value) : NaN
  return Number.isFinite(date) ? Math.max(now, date) : now + 60000
}

export function getRetryAt(baseUrl = API_BASE_URL) {
  let saved = 0
  try { saved = Number(globalThis.sessionStorage?.getItem(storageKey(baseUrl))) || 0 } catch { /* Storage is optional. */ }
  return Math.max(deadlines.get(baseUrl) || 0, saved)
}

export function setRetryAt(baseUrl, deadline) {
  const next = Math.max(getRetryAt(baseUrl), deadline)
  deadlines.set(baseUrl, next)
  try { globalThis.sessionStorage?.setItem(storageKey(baseUrl), String(next)) } catch { /* In-memory protection remains active. */ }
  listeners.forEach(listener => listener())
}

export function rateLimitError(deadline, message = 'Too many requests.') {
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
  return Object.assign(new Error(`${message} Please wait ${seconds} seconds before trying again.`), { status: 429, retryAt: deadline })
}

export function subscribeRateLimit(listener) {
  listeners.add(listener)
  const timer = setInterval(listener, 1000)
  return () => { listeners.delete(listener); clearInterval(timer) }
}

export function getRetrySeconds() {
  return Math.max(0, Math.ceil((getRetryAt() - Date.now()) / 1000))
}
