import { useState } from 'react'
import styles from './AccessGate.module.css'

// Comma-separated list of valid passwords, e.g. "jason,sarah,mike"
const RAW = (import.meta.env.VITE_ACCESS_PASSWORD as string | undefined) ?? ''
const PASSWORDS = RAW.split(',').map(p => p.trim()).filter(Boolean)

interface Props {
  children: React.ReactNode
}

export function AccessGate({ children }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [granted, setGranted] = useState(() => {
    if (PASSWORDS.length === 0) return true
    const saved = sessionStorage.getItem('adg_access') ?? ''
    return PASSWORDS.includes(saved)
  })

  if (granted) return <>{children}</>

  function attempt(e: React.FormEvent) {
    e.preventDefault()
    if (PASSWORDS.includes(input.trim())) {
      sessionStorage.setItem('adg_access', input.trim())
      setGranted(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className={styles.screen}>
      <form className={styles.form} onSubmit={attempt}>
        <div className={styles.title}>ADG HANG PLANNER</div>
        <div className={styles.sub}>1741 SILVERLAKE BLVD</div>
        <div className={styles.rule} />
        <label className={styles.label}>ACCESS</label>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false) }}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          placeholder="Password"
          autoFocus
        />
        {error && <div className={styles.error}>Incorrect</div>}
        <button type="submit" className={styles.btn}>Enter →</button>
      </form>
    </div>
  )
}
