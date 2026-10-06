import { AUTH_ENDPOINTS } from '../constants/auth.js'
import { apiRequest } from './api.js'
import { sessionClient } from './session.js'
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
  if ([...body.password].length < 6) throw new Error('Your password is too short. Use at least 6 characters.')
  if (new TextEncoder().encode(body.password).length > 72) throw new Error('Your password is too long. Please use a shorter password; some symbols and Nepali letters take extra space.')
  return body
}
export const register = (values) => sessionClient.authorizedRequest(AUTH_ENDPOINTS.register, { method: 'POST', body: credentials(values, true) })
export const login = (values) => authRequest(AUTH_ENDPOINTS.login, { body: credentials(values) })
