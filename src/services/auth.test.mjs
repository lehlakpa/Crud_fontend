import test from 'node:test'
import assert from 'node:assert/strict'
import { authRequest, credentials, register } from './auth.js'
import { sessionClient } from './session.js'

const origin = 'https://backend.example'

test('admin registration uses the current authorized session', async (t) => {
  t.mock.method(sessionClient, 'authorizedRequest', async (endpoint, options) => {
    assert.equal(endpoint, '/api/auth/register')
    assert.deepEqual(options, { method: 'POST', body: {
      name: 'New Admin', username: 'newadmin', password: 'secret', phoneNumber: '9800000000',
    } })
    return { success: true }
  })
  assert.deepEqual(await register({ name: 'New Admin', username: 'newadmin', password: 'secret', phoneNumber: '9800000000' }), { success: true })
})

test('admin registration without a session is rejected', async () => {
  sessionClient.clear()
  await assert.rejects(register({ name: 'New Admin', username: 'newadmin', password: 'secret', phoneNumber: '9800000000' }), { status: 401 })
})

test('registration whitelists the four allowed fields', () => {
  assert.deepEqual(credentials({ name: ' Test ', username: ' tester ', password: 'secret', phoneNumber: ' 123 ', extra: 'discard' }, true), {
    name: 'Test', username: 'tester', password: 'secret', phoneNumber: '123',
  })
})

test('credential limits include UTF-8 password bytes and character minimum', () => {
  const valid = { name: 'n'.repeat(100), username: 'u'.repeat(100), phoneNumber: '1'.repeat(25), password: 'é'.repeat(36) }
  assert.doesNotThrow(() => credentials(valid, true))
  for (const change of [{ name: 'n'.repeat(101) }, { username: 'u'.repeat(101) }, { phoneNumber: '1'.repeat(26) }, { password: '12345' }, { password: '😀'.repeat(3) }, { password: 'é'.repeat(37) }]) {
    assert.throws(() => credentials({ ...valid, ...change }, true))
  }
  assert.doesNotThrow(() => credentials({ username: 'tester', password: 'a'.repeat(72) }))
  assert.throws(() => credentials({ username: 'tester', password: 'a'.repeat(73) }))
})

test('approval error from login is preserved', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ message: 'Store owner approval required.' }), { status: 403 }))
  await assert.rejects(authRequest('/api/auth/login', {}, origin), { status: 403, message: 'Store owner approval required.' })
})

test('sends JSON without cookie credentials for wildcard CORS', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, `${origin}/api/auth/login`)
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'omit')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), { username: 'test', password: 'example' })
    return new Response(JSON.stringify({ token: 'sample' }))
  })
  assert.deepEqual(await authRequest('/api/auth/login', {
    body: { username: 'test', password: 'example' },
  }, origin), { token: 'sample' })
})

test('logout sends bearer authorization and accepts an empty response', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer sample')
    assert.equal(options.body, undefined)
    return new Response(null, { status: 204 })
  })
  assert.equal(await authRequest('/api/auth/logout', { token: 'sample' }, origin), null)
})

test('preserves API errors and status for expired sessions', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(
    JSON.stringify({ message: 'Invalid credentials' }), { status: 401 },
  ))
  await assert.rejects(authRequest('/api/auth/login', {}, origin), {
    message: 'Invalid credentials', status: 401,
  })
})

test('handles application-level failure even with HTTP success', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(
    JSON.stringify({ success: false, message: 'Username already exists' }),
  ))
  await assert.rejects(authRequest('/api/auth/register', {}, origin), /Username already exists/)
})

test('does not expose an HTML server error as a message', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Error</html>', { status: 502 }))
  await assert.rejects(authRequest('/api/auth/login', {}, origin), /Request failed \(502\)/)
})

test('rejects malformed success responses', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Not an API</html>'))
  await assert.rejects(authRequest('/api/auth/login', {}, origin), /unexpected response/)
})

test('turns network failures into a useful message', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(authRequest('/api/auth/login', {}, origin), /Unable to reach the server/)
})

test('turns aborted requests into a timeout message', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Aborted', 'AbortError') })
  await assert.rejects(authRequest('/api/auth/login', {}, origin), /took too long/)
})

test('requires an API origin', async () => {
  await assert.rejects(authRequest('/api/auth/login', {}, ''), /VITE_API_BASE_URL/)
})
