import { useRef, useState } from 'react'
import { register } from '../services/auth.js'


export default function RegisterScreen({ navigate, message }) {
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
      await register(values)
      navigate('/admin/login', 'Account बन्यो। Admin dashboard चलाउन store owner को approval चाहिन्छ।')
    } catch (error) {
      setError(error.message)
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  return (
    <div className="form-content">
      <p className="eyebrow">FOR STORE OWNERS</p>
      <h2>A home for your store.</h2>
      <p className="subtitle">Create an account. Store owner approval is required to access the admin dashboard.</p>
      <form onSubmit={submit} aria-busy={loading}>
        {message && <p className="notice success" role="status">{message}</p>}
        {error && <p className="notice error" role="alert">{error}</p>}
        <fieldset disabled={loading}>
          <label htmlFor="name">Full name<input id="name" name="name" type="text" maxLength={100} autoComplete="name" placeholder="Your full name" required /></label>
          <label htmlFor="username">Username<input id="username" name="username" type="text" maxLength={100} autoComplete="username" placeholder="Choose a username" required /></label>
          <label htmlFor="phoneNumber">Phone number<input id="phoneNumber" name="phoneNumber" type="tel" maxLength={25} autoComplete="tel" placeholder="Your phone number" required /></label>
          <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" required /></label>
          <p className="field-hint">Password: at least 6 characters, up to 72 UTF-8 bytes.</p>
          <button className="primary" type="submit">{loading ? 'Creating account...' : 'Create admin account'}</button>
        </fieldset>
      </form>
      <p className="switch-screen">Already have an account? <button disabled={loading} onClick={() => navigate('/admin/login')}>Sign in</button></p>
    </div>
  )
}
