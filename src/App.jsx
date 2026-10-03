import { useEffect, useState } from 'react'
import { sessionClient } from './services/session.js'
import LoginScreen from './screens/login_screen.jsx'
import RegisterScreen from './screens/register_screen.jsx'
import HomeScreen from './screens/home_screen.jsx'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('login')
  const [user, setUser] = useState(null)
  const [restoring, setRestoring] = useState(true)
  const [restoreError, setRestoreError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    const unsubscribe = sessionClient.subscribe(setUser)
    sessionClient.restore().then((session) => {
      if (active) setUser(session?.user ?? null)
    }).catch((error) => {
      if (active) setRestoreError(error.message)
    }).finally(() => {
      if (active) setRestoring(false)
    })
    return () => { active = false; unsubscribe() }
  }, [])
  function navigate(next, notice = '') {
    setScreen(next)
    setMessage(notice)
  }
  if (restoring || restoreError) {
    return (
      <main className="session-screen">
        <div className="form-content">
          <h2>{restoring ? 'Welcome back' : 'Unable to reconnect'}</h2>
          <p className="subtitle" role={restoreError ? 'alert' : 'status'}>{restoreError || 'Restoring your session...'}</p>
          {restoreError && <button className="primary" onClick={() => window.location.reload()}>Try again</button>}
        </div>
      </main>
    )
  }
  if (user) return <HomeScreen user={user} navigate={navigate} />
  return (
    <main className="app-shell">
      <section className="intro">
        <a className="brand" href="/">CRUD<span>space</span></a>
        <div>
          <p className="eyebrow">YOUR SPACE, SIMPLIFIED</p>
          <h1>A fresh start.<br />All in one place.</h1>
          <p className="intro-copy">Sign in to your account and pick up where you left off.</p>
        </div>
        <p className="intro-footer">Simple. Connected. Yours.</p>
      </section>
      <section className="form-panel" aria-label="Account">
        {screen === 'register'
          ? <RegisterScreen navigate={navigate} message={message} /> : <LoginScreen navigate={navigate} message={message} />}
      </section>
    </main>
  )
}
