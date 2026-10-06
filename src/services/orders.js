import { apiRequest } from './api.js'
import { sessionClient } from './session.js'

export const ORDER_STATUSES = ['pending', 'confirmed']

export async function updateOrderStatus(id, status, request = sessionClient.authorizedRequest) {
  if (!id) throw new Error('The order ID is missing.')
  if (!ORDER_STATUSES.includes(status)) throw new Error('Choose a valid order status.')
  return request(`/api/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } })
}

export async function submitOrderAttempt(body, request = apiRequest) {
  savePendingOrder(body.productId, body)
  const response = await request('/api/orders', { method: 'POST', body })
  if (!response?.order) throw new Error('The server did not confirm the order. Retry with the same details.')
  savePendingOrder(body.productId, null)
  return response.order
}

export function readPendingOrder(productId) {
  try {
    const body = JSON.parse(sessionStorage.getItem(`everyday.order.${productId}`) || 'null')
    return body?.productId === productId && typeof body?.requestId === 'string' ? Object.freeze(body) : null
  } catch { return null }
}
export function savePendingOrder(productId, body) {
  try {
    if (body) sessionStorage.setItem(`everyday.order.${productId}`, JSON.stringify(body))
    else sessionStorage.removeItem(`everyday.order.${productId}`)
  } catch { /* In-memory retry remains available if tab storage is disabled. */ }
}

export function createOrderAttempt(productId, values, uuid = () => crypto.randomUUID()) {
  const quantity = Number(values.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) throw new Error('Quantity must be a whole number from 1 to 10000.')
  const body = { productId, quantity }
  for (const [key, limit] of Object.entries({ customerName: 100, phoneNumber: 25, email: 254, address: 500, notes: 1000 })) {
    const value = String(values[key] || '').trim()
    if (value.length > limit) throw new Error(`${key} is too long (maximum ${limit} characters).`)
    body[key] = value
  }
  if (!body.customerName) throw new Error('Please enter your full name.')
  if (!body.phoneNumber) throw new Error('Please enter your phone number.')
  if (!body.address) throw new Error('Please enter a delivery location.')
  if (body.phoneNumber && (!/^[\d\s+()-]+$/.test(body.phoneNumber) || !/^\d{7,15}$/.test(body.phoneNumber.replace(/\D/g, '')))) throw new Error('Enter a phone number with 7–15 digits.')
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) throw new Error('Please enter a valid email address.')
  body.requestId = uuid()
  return Object.freeze(body)
}
