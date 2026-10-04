import test from 'node:test'
import assert from 'node:assert/strict'
import { createOrderAttempt, readPendingOrder, submitOrderAttempt } from './orders.js'
const uuid = () => 'ac739f61-65bd-40db-b391-7c5b50579198'

test('failed orders retain identical payload and request ID across reload and retry', async (t) => {
  const values = new Map()
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } })
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous); else delete globalThis.sessionStorage })
  const body = createOrderAttempt('product', { quantity: 2, address: 'Kathmandu' }, uuid)
  for (const status of [429, 413, 409, 500, undefined]) {
    await assert.rejects(submitOrderAttempt(body, async () => { throw Object.assign(new Error('Failed'), { status }) }))
    assert.deepEqual(readPendingOrder('product'), body)
  }
  const restored = readPendingOrder('product')
  const receipt = await submitOrderAttempt(restored, async (endpoint, options) => {
    assert.equal(endpoint, '/api/orders')
    assert.deepEqual(options.body, body)
    return { order: { id: 'existing-order' } }
  })
  assert.equal(receipt.id, 'existing-order')
  assert.equal(readPendingOrder('product'), null)
})
test('order payload is an immutable retry snapshot without client prices', () => {
  const values = { quantity: '2', address: ' Kathmandu ', price: 1, phoneNumber: '+977 980-000-0000' }
  const body = createOrderAttempt('product', values, uuid)
  values.quantity = '3'
  assert.equal(body.quantity, 2)
  assert.equal(body.address, 'Kathmandu')
  assert.equal(body.requestId, uuid())
  assert.equal(body.price, undefined)
  assert.ok(Object.isFrozen(body))
})
test('orders validate quantity, address, phone, email and length', () => {
  for (const values of [{ quantity: 0 }, { quantity: 1.5 }, { quantity: 10001 }, { address: ' ' }, { phoneNumber: 'abc1234567' }, { email: 'bad' }, { notes: 'x'.repeat(1001) }]) {
    assert.throws(() => createOrderAttempt('product', { quantity: 1, address: 'Kathmandu', ...values }, uuid))
  }
})
test('optional order fields may be blank', () => {
  const body = createOrderAttempt('product', { quantity: 1, address: 'Kathmandu' }, uuid)
  assert.equal(body.email, '')
  assert.equal(body.phoneNumber, '')
})
