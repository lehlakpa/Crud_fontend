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
  const data = new FormData(form)
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
  } else if (!image.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }
  return data
}
export function saveProduct(id, body) {
  return sessionClient.authorizedRequest(id ? path(id) : PRODUCTS_ENDPOINT, { method: id ? 'PUT' : 'POST', body })
}
export function deleteProduct(id) {
  return sessionClient.authorizedRequest(path(id), { method: 'DELETE' })
}
