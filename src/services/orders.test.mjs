import test from 'node:test'
import assert from 'node:assert/strict'
import { createOrderAttempt, readPendingOrder, submitOrderAttempt, updateOrderStatus } from './orders.js'
const uuid = () => 'ac739f61-65bd-40db-b391-7c5b50579198'
const contact = { customerName: 'Test Customer', phoneNumber: '9800000000', address: 'Kathmandu' }

test('failed orders retain identical payload and request ID across reload and retry', async (t) => {
  const values = new Map()
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } })
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous); else delete globalThis.sessionStorage })
  const body = createOrderAttempt('product', { ...contact, quantity: 2 }, uuid)
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
  const values = { ...contact, quantity: '2', address: ' Kathmandu ', price: 1, phoneNumber: '+977 980-000-0000' }
  const body = createOrderAttempt('product', values, uuid)
  values.quantity = '3'
  assert.equal(body.quantity, 2)
  assert.equal(body.address, 'Kathmandu')
  assert.equal(body.requestId, uuid())
  assert.equal(body.price, undefined)
  assert.ok(Object.isFrozen(body))
})
test('orders validate quantity, required contact fields, email and length', () => {
  for (const values of [{ quantity: 0 }, { quantity: 1.5 }, { quantity: 10001 }, { customerName: ' ' }, { customerName: undefined }, { address: ' ' }, { phoneNumber: '' }, { phoneNumber: 'abc1234567' }, { email: 'bad' }, { notes: 'x'.repeat(1001) }]) {
    assert.throws(() => createOrderAttempt('product', { ...contact, quantity: 1, ...values }, uuid))
  }
})
test('optional order fields may be blank', () => {
  const body = createOrderAttempt('product', { ...contact, quantity: 1 }, uuid)
  assert.equal(body.email, '')
  assert.equal(body.notes, '')
})

test('status edits PATCH the order status endpoint with only the selected status', async () => {
  for (const status of ['pending', 'confirmed']) {
    await updateOrderStatus('order/id', status, async (endpoint, options) => {
      assert.equal(endpoint, '/api/orders/order%2Fid/status')
      assert.deepEqual(options, { method: 'PATCH', body: { status } })
    })
  }
})

test('status edits reject invalid values and propagate backend failures', async () => {
  const unexpectedRequest = async () => assert.fail('Invalid input must not send a request')
  await assert.rejects(updateOrderStatus('', 'pending', unexpectedRequest), /ID/)
  await assert.rejects(updateOrderStatus('order', 'invalid', unexpectedRequest), /valid order status/)
  await assert.rejects(updateOrderStatus('order', 'confirmed', async () => { throw new Error('Access denied') }), /Access denied/)
})
