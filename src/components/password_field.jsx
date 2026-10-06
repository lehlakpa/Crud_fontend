import { useId, useState } from 'react'

export default function PasswordField({ newPassword = false }) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return <div className="password-field">
    <label htmlFor={id}>Password</label>
    <div className="password-control">
      <input id={id} name="password" type={visible ? 'text' : 'password'}
        autoComplete={newPassword ? 'new-password' : 'current-password'}
        placeholder={newPassword ? 'Create a password' : 'Enter your password'}
        aria-describedby={`${id}-hint`} required />
      <button type="button" className="password-toggle" aria-controls={id}
        aria-label="Show password" aria-pressed={visible}
        onClick={() => setVisible(value => !value)}>{visible ? 'Hide' : 'Show'}</button>
    </div>
    <p id={`${id}-hint`} className="field-hint">
      {newPassword ? 'Use at least 6 characters. ' : 'Enter the password for your admin account. '}
      Select Show to check what you typed, or Hide to keep it private.
    </p>
  </div>
}
