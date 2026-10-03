import { AUTH_ENDPOINTS } from '../constants/auth.js'
import { apiRequest } from './api.js'
export const authRequest = (endpoint, options, baseUrl) => apiRequest(endpoint, { ...options, method: 'POST' }, baseUrl)
export const register = (body) => authRequest(AUTH_ENDPOINTS.register, { body })
export const login = (body) => authRequest(AUTH_ENDPOINTS.login, { body })
