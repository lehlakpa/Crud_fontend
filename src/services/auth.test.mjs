import test from 'node:test'
import assert from 'node:assert/strict'
import { authRequest } from './auth.js'

const origin = 'https://backend.example'

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
