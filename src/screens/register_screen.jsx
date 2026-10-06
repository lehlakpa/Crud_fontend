import { useRef, useState } from 'react'
import { register } from '../services/auth.js'
import PasswordField from '../components/password_field.jsx'


export default function RegisterScreen({ navigate }) {
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
      navigate('/admin', 'Admin account created. Store owner approval is required for the new account.')
    } catch (error) {
      setError(error.message)
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  return (
    <section className="panel product-editor">
      <div className="form-content">
      <p className="eyebrow">ADMIN MANAGEMENT</p>
      <h2>Register admin</h2>
      <p className="subtitle">Create another admin account. The new account requires store owner approval.</p>
      <form onSubmit={submit} aria-busy={loading}>
        {error && <p className="notice error" role="alert">{error}</p>}
        <fieldset disabled={loading}>
          <label htmlFor="name">Full name<input id="name" name="name" type="text" maxLength={100} autoComplete="name" placeholder="Your full name" required /></label>
          <label htmlFor="username">Username<input id="username" name="username" type="text" maxLength={100} autoComplete="username" placeholder="Choose a username" required /></label>
          <label htmlFor="phoneNumber">Phone number<input id="phoneNumber" name="phoneNumber" type="tel" maxLength={25} autoComplete="tel" placeholder="Your phone number" required /></label>
          <PasswordField newPassword />
          <button className="primary" type="submit">{loading ? 'Creating account...' : 'Create admin account'}</button>
        </fieldset>
      </form>
      <p className="switch-screen"><button disabled={loading} onClick={() => navigate('/admin')}>Back to dashboard</button></p>
      </div>
    </section>
  )
}
