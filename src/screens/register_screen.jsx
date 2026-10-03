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
      navigate('login', 'Account created. Sign in with your new username and password.')
    } catch (error) {
      setError(error.message)
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  return (
    <div className="form-content">
      <p className="eyebrow">MAKE YOURSELF AT HOME</p>
      <h2>Create your account</h2>
      <p className="subtitle">A few details, and you are ready to go.</p>
      <form onSubmit={submit} aria-busy={loading}>
        {message && <p className="notice success" role="status">{message}</p>}
        {error && <p className="notice error" role="alert">{error}</p>}
        <fieldset disabled={loading}>
          <label htmlFor="name">Full name<input id="name" name="name" type="text" autoComplete="name" placeholder="Your full name" required /></label>
          <label htmlFor="username">Username<input id="username" name="username" type="text" autoComplete="username" placeholder="Choose a username" required /></label>
          <label htmlFor="phoneNumber">Phone number<input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" placeholder="Your phone number" required /></label>
          <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" required /></label>
          <button className="primary" type="submit">{loading ? 'Creating account...' : 'Create account'}</button>
        </fieldset>
      </form>
      <p className="switch-screen">Already have an account? <button disabled={loading} onClick={() => navigate('login')}>Sign in</button></p>
    </div>
  )
}
