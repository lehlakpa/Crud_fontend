import test from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest } from './api.js'
import { saveProduct, deleteProduct } from './products.js'

test('product upload sends multipart with bearer token and browser-generated boundary', async (t) => {
  const body = new FormData()
  body.set('title', 'Product')
  body.set('price', '0')
  body.set('description', 'Description')
  body.set('image', new Blob(['image'], { type: 'image/png' }), 'product.png')
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://backend.example/api/products')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.equal(options.headers['Content-Type'], undefined)
    assert.equal(options.body, body)
    assert.equal(options.credentials, 'omit')
    return new Response(JSON.stringify({ success: true }), { status: 201 })
  })
  await apiRequest('/api/products', { method: 'POST', body, token: 'test-token' }, 'https://backend.example')
})

test('update without an image sends the supplied fields only', async (t) => {
  const body = new FormData()
  body.set('title', 'Updated')
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.method, 'PUT')
    assert.equal(options.body.has('image'), false)
    return new Response(JSON.stringify({ success: true }))
  })
  await apiRequest('/api/products/123', { method: 'PUT', body, token: 'test-token' }, 'https://backend.example')
})

test('public product reads do not send authorization', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.method, 'GET')
    assert.equal(options.headers.Authorization, undefined)
    assert.equal(options.body, undefined)
    return new Response(JSON.stringify({ products: [] }))
  })
  assert.deepEqual(await apiRequest('/api/products', {}, 'https://backend.example'), { products: [] })
})

test('delete supports an empty response', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.method, 'DELETE')
    return new Response(null, { status: 204 })
  })
  assert.equal(await apiRequest('/api/products/123', { method: 'DELETE', token: 'test-token' }, 'https://backend.example'), null)
})

test('protected writes require a session', async () => {
  await assert.rejects(saveProduct(null, new FormData()), /session has expired/)
  await assert.rejects(deleteProduct('123'), /session has expired/)
})

import { productFormData } from './products.js'
function validForm() {
  const body = new FormData()
  for (const [key, value] of Object.entries({ title: 'Cup', description: 'Ceramic', price: '0', category: 'Home', stock: '0', lowStockThreshold: '5' })) body.set(key, value)
  return body
}
test('product validation allows zero price and retains the existing image on edit', () => {
  const data = productFormData(validForm(), true)
  assert.equal(data.get('price'), '0')
  assert.equal(data.has('image'), false)
})
test('product validation rejects invalid stock, image types and oversized files', () => {
  for (const value of ['-1', '1.5', '', 'Infinity']) {
    const data = validForm(); data.set('stock', value)
    assert.throws(() => productFormData(data, true), /whole numbers/)
  }
  const svg = validForm(); svg.set('image', new Blob(['svg'], { type: 'image/svg+xml' }), 'image.svg')
  assert.throws(() => productFormData(svg, true), /JPEG, PNG or WebP/)
  const big = validForm(); big.set('image', new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' }), 'big.png')
  assert.throws(() => productFormData(big, true), /5 MB/)
  assert.throws(() => productFormData(validForm(), false), /choose a product image/)
})
