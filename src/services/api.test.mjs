import test from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest } from './api.js'
import { retryAfterDeadline } from './rateLimit.js'

test('Retry-After supports seconds, HTTP dates and safe fallback', () => {
  const now = Date.parse('2026-10-04T00:00:00Z')
  assert.equal(retryAfterDeadline('12', now), now + 12000)
  assert.equal(retryAfterDeadline('Sun, 04 Oct 2026 00:01:00 GMT', now), now + 60000)
  assert.equal(retryAfterDeadline('Sun, 04 Oct 2026 00:00:00 GMT', now + 1000), now + 1000)
  assert.equal(retryAfterDeadline(null, now), now + 60000)
  assert.equal(retryAfterDeadline('invalid', now), now + 60000)
})

test('429 blocks network requests across endpoints until deadline expires', async (t) => {
  let now = 1800000000000
  let calls = 0
  t.mock.method(Date, 'now', () => now)
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return calls === 1 ? new Response(JSON.stringify({ message: 'Slow down.' }), { status: 429, headers: { 'Retry-After': '5' } }) : new Response('{}')
  })
  const origin = 'https://rate-test.example'
  await assert.rejects(apiRequest('/login', {}, origin), { status: 429, retryAt: now + 5000, message: 'Slow down. Please wait 5 seconds before trying again.' })
  await assert.rejects(apiRequest('/register', {}, origin), { status: 429 })
  assert.equal(calls, 1)
  now += 5000
  await apiRequest('/login', {}, origin)
  assert.equal(calls, 2)
})

test('413 produces a useful size message even for an HTML response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Too big</html>', { status: 413 }))
  await assert.rejects(apiRequest('/upload', {}, 'https://size-test.example'), { status: 413, message: 'Your submission is too large. Reduce the upload or submitted details and try again.' })
})
