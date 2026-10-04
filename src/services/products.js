import { apiRequest } from './api.js'
import { sessionClient } from './session.js'
import { PRODUCTS_ENDPOINT } from '../constants/products.js'

const path = (id) => `${PRODUCTS_ENDPOINT}/${encodeURIComponent(id)}`
export async function getProducts(signal) {
  const response = await apiRequest(PRODUCTS_ENDPOINT, { signal })
  const products = response?.products ?? response?.data?.products ?? response?.data ?? response
  if (!Array.isArray(products)) throw new Error('The server returned an unexpected products list.')
  return products
}
export async function getProduct(id, signal) {
  const response = await apiRequest(path(id), { signal })
  const product = response?.product ?? response?.data?.product ?? response?.data ?? response
  if (!product || typeof product.title !== 'string') throw new Error('The server returned an unexpected product.')
  return product
}
export function productFormData(form, editing) {
  const data = form instanceof FormData ? form : new FormData(form)
  for (const key of ['title', 'description']) {
    const value = String(data.get(key) ?? '').trim()
    if (!value) throw new Error('Please enter a title and description.')
    data.set(key, value)
  }
  const price = String(data.get('price') ?? '').trim()
  if (!price || !Number.isFinite(Number(price)) || Number(price) < 0) throw new Error('Price must be a number greater than or equal to zero.')
  const image = data.get('image')
  if (!image?.size) {
    if (!editing) throw new Error('Please choose a product image.')
    data.delete('image')
  } else if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024) {
    throw new Error('Choose a JPEG, PNG or WebP image no larger than 5 MB.')
  }
  const category = String(data.get('category') ?? '').trim()
  if (!category) throw new Error('Please enter a category.')
  data.set('category', category)
  for (const key of ['stock', 'lowStockThreshold']) {
    const value = String(data.get(key) ?? '').trim()
    if (!value || !Number.isSafeInteger(Number(value)) || Number(value) < 0) throw new Error('Stock and low-stock limit must be whole numbers of zero or more.')
  }
  return data
}
export function saveProduct(id, body) {
  return sessionClient.authorizedRequest(id ? path(id) : PRODUCTS_ENDPOINT, { method: id ? 'PUT' : 'POST', body })
}
export function deleteProduct(id) {
  return sessionClient.authorizedRequest(path(id), { method: 'DELETE' })
}
