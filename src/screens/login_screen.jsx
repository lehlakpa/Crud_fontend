import { useRef, useState } from 'react'
import { login } from '../services/auth.js'
import { sessionClient } from '../services/session.js'

export default function LoginScreen({ navigate, message }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)

  async function submit(event) {
    event.preventDefault()
    if (busy.current) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    for (const key of Object.keys(values)) {
      if (key !== 'password') values[key] = values[key].trim()
    }
    if (Object.values(values).some((value) => !value.trim())) {
      setError('Please complete every field.')
      return
    }
    busy.current = true
    setLoading(true)
    setError('')
    try {
      const response = await login(values)
      sessionClient.acceptLogin(response, values.username)
    } catch (error) {
      setError(error.message)
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  return (
    <div className="form-content">
      <p className="eyebrow">WELCOME BACK</p>
      <h2>Sign in to your account</h2>
      <p className="subtitle">Enter your details to get started.</p>
      <form onSubmit={submit} aria-busy={loading}>
        {message && <p className="notice success" role="status">{message}</p>}
        {error && <p className="notice error" role="alert">{error}</p>}
        <fieldset disabled={loading}>
          <label htmlFor="username">Username<input id="username" name="username" type="text" autoComplete="username" placeholder="Enter your username" required /></label>
          <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></label>
          <button className="primary" type="submit">{loading ? 'Signing in...' : 'Sign in'}</button>
        </fieldset>
      </form>
      <p className="switch-screen">New here? <button disabled={loading} onClick={() => navigate('register')}>Create an account</button></p>
    </div>
  )
}
