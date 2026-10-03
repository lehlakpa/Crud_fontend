export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '')
export const AUTH_ENDPOINTS = Object.freeze({
  register: '/api/auth/register',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  refresh: '/api/auth/refresh-token',
})
export const REQUEST_TIMEOUT_MS = 60000
export const SESSION_STORAGE_KEY = 'crudspace.session'
