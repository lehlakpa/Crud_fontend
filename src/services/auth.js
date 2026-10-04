import { AUTH_ENDPOINTS } from '../constants/auth.js'
import { apiRequest } from './api.js'
export const authRequest = (endpoint, options, baseUrl) => apiRequest(endpoint, { ...options, method: 'POST' }, baseUrl)
export function credentials(values, signup = false) {
  const body = { username: String(values.username ?? '').trim(), password: String(values.password ?? '') }
  if (signup) {
    body.name = String(values.name ?? '').trim()
    body.phoneNumber = String(values.phoneNumber ?? '').trim()
  }
  if (Object.values(body).some(value => !value.trim())) throw new Error('Please complete every field.')
  for (const [key, limit] of Object.entries({ name: 100, username: 100, phoneNumber: 25 })) {
    if (body[key]?.length > limit) throw new Error(`${key} must be at most ${limit} characters.`)
  }
  if ([...body.password].length < 6 || new TextEncoder().encode(body.password).length > 72) {
    throw new Error('Password must be at least 6 characters and at most 72 UTF-8 bytes.')
  }
  return body
}
export const register = (values) => authRequest(AUTH_ENDPOINTS.register, { body: credentials(values, true) })
export const login = (values) => authRequest(AUTH_ENDPOINTS.login, { body: credentials(values) })
