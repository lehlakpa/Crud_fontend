import test from 'node:test'
import assert from 'node:assert/strict'
import { createSessionClient } from './session.js'
import { AUTH_ENDPOINTS, SESSION_STORAGE_KEY } from '../constants/auth.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
}
const login = { accessToken: 'access-old', refreshToken: 'refresh-old', user: { username: 'test' } }
const unauthorized = () => Object.assign(new Error('Unauthorized'), { status: 401 })

test('reload restores a session, persisting rotated refresh tokens but not access tokens', async () => {
  const storage = memoryStorage()
  createSessionClient(null, () => storage).acceptLogin(login, 'test')
  const client = createSessionClient(async (endpoint, options) => {
    assert.equal(endpoint, AUTH_ENDPOINTS.refresh)
    assert.deepEqual(options.body, { refreshToken: 'refresh-old' })
    return { accessToken: 'access-new', refreshToken: 'refresh-new' }
  }, () => storage)
  const restored = await client.restore()
  assert.equal(restored.user.username, 'test')
  const saved = JSON.parse(storage.getItem(SESSION_STORAGE_KEY))
  assert.equal(saved.refreshToken, 'refresh-new')
  assert.equal(saved.accessToken, undefined)
})

test('concurrent expired requests share one refresh and retry with the new token', async () => {
  let refreshes = 0
  let retries = 0
  const storage = memoryStorage()
  const client = createSessionClient(async (endpoint, options) => {
    if (endpoint === AUTH_ENDPOINTS.refresh) {
      refreshes += 1
      await Promise.resolve()
      return { accessToken: 'access-new' }
    }
    if (options.token === 'access-old') throw unauthorized()
    assert.equal(options.token, 'access-new')
    retries += 1
    return { success: true }
  }, () => storage)
  client.acceptLogin(login, 'test')
  await Promise.all([client.authorizedRequest('/a'), client.authorizedRequest('/b')])
  assert.equal(refreshes, 1)
  assert.equal(retries, 2)
})

test('invalid refresh token clears the saved session', async () => {
  const storage = memoryStorage()
  const client = createSessionClient(async () => { throw unauthorized() }, () => storage)
  client.acceptLogin(login, 'test')
  await assert.rejects(client.refresh(), /Unauthorized/)
  assert.equal(storage.getItem(SESSION_STORAGE_KEY), undefined)
})

test('failed refresh clears the session even on network errors', async () => {
  const storage = memoryStorage()
  createSessionClient(null, () => storage).acceptLogin(login, 'test')
  const client = createSessionClient(async () => { throw new Error('Offline') }, () => storage)
  await assert.rejects(client.restore(), /Offline/)
  assert.equal(storage.getItem(SESSION_STORAGE_KEY), undefined)
})

test('a second unauthorized response does not loop', async () => {
  let attempts = 0
  const storage = memoryStorage()
  const client = createSessionClient(async (endpoint) => {
    if (endpoint === AUTH_ENDPOINTS.refresh) return { accessToken: 'access-new' }
    attempts += 1
    throw unauthorized()
  }, () => storage)
  client.acceptLogin(login, 'test')
  await assert.rejects(client.authorizedRequest('/products'), /Unauthorized/)
  assert.equal(attempts, 2)
  assert.equal(storage.getItem(SESSION_STORAGE_KEY), undefined)
})

test('logout sends only the bearer header and removes local session', async () => {
  const storage = memoryStorage()
  const client = createSessionClient(async (endpoint, options) => {
    assert.equal(endpoint, AUTH_ENDPOINTS.logout)
    assert.equal(options.body, undefined)
    assert.equal(options.token, 'access-old')
    return null
  }, () => storage)
  client.acceptLogin(login, 'test')
  await client.logout()
  assert.equal(storage.getItem(SESSION_STORAGE_KEY), undefined)
})

test('a refresh finishing after local logout cannot restore the session', async () => {
  let finish
  const storage = memoryStorage()
  const client = createSessionClient(() => new Promise((resolve) => { finish = resolve }), () => storage)
  client.acceptLogin(login, 'test')
  const pending = client.refresh()
  client.clear()
  finish({ accessToken: 'late-token' })
  assert.equal(await pending, null)
  assert.equal(storage.getItem(SESSION_STORAGE_KEY), undefined)
})

test('403 access denial does not refresh or retry', async () => {
  let calls = 0
  const client = createSessionClient(async () => {
    calls++
    throw Object.assign(new Error('Denied'), { status: 403 })
  }, memoryStorage)
  client.acceptLogin(login, 'test')
  await assert.rejects(client.authorizedRequest('/api/admin/me'), /Denied/)
  assert.equal(calls, 1)
})
test('logout clears local tokens even when server logout fails', async () => {
  const storage = memoryStorage()
  const client = createSessionClient(async () => { throw new Error('Offline') }, () => storage)
  client.acceptLogin(login, 'test')
  await assert.rejects(client.logout(), /Offline/)
  assert.equal(storage.getItem(SESSION_STORAGE_KEY), undefined)
})
