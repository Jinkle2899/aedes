import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function SignIn() {
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { kind: 'error'|'info', text }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) return // signed in immediately (confirmation disabled)
        setMsg({ kind: 'info', text: 'Check your email to confirm your account, then sign in.' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setMsg({ kind: 'error', text: err.message || 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dash auth-page">
      <nav className="dash-top">
        <Link className="logo" to="/">
          <span className="logo-mark">A</span>
          <span className="logo-word">Aedes</span>
        </Link>
      </nav>
      <div className="auth-card">
        <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-sub">
          {mode === 'signin'
            ? 'Sign in to open your sites.'
            : 'Free to start. Your sites, synced everywhere.'}
        </p>
        <form onSubmit={submit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {msg && <p className={`auth-msg ${msg.kind}`}>{msg.text}</p>}
          <button type="submit" className="btn auth-btn" disabled={busy}>
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'signin' ? (
            <>New here? <button type="button" onClick={() => { setMode('signup'); setMsg(null) }}>Create an account</button></>
          ) : (
            <>Already have an account? <button type="button" onClick={() => { setMode('signin'); setMsg(null) }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  )
}
