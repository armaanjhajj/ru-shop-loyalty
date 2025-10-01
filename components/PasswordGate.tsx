"use client"

import { useEffect, useMemo, useState } from 'react'
import { listCustomers } from '@/lib/api'
import { safeLocalStorageGet, safeLocalStorageSet } from '@/lib/utils'

type PasswordGateProps = {
  children: React.ReactNode
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authed, setAuthed] = useState(false)

  const devDefault = useMemo(() => process.env.APP_PASSWORD || '', [])

  useEffect(() => {
    const stored = safeLocalStorageGet('app_password')
    if (stored) {
      setAuthed(true)
    }
  }, [])

  async function attemptLogin(pass: string) {
    setLoading(true)
    setError(null)
    try {
      // minimal call to validate password
      await listCustomers('', pass)
      safeLocalStorageSet('app_password', pass)
      setAuthed(true)
    } catch (e: any) {
      const message = e?.message || 'Authentication failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (authed) return <>{children}</>

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="card w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold">R</div>
          <h1 className="text-lg font-semibold">RU Smoke Shop — Loyalty</h1>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void attemptLogin(password || devDefault)
          }}
          className="space-y-3"
        >
          <div>
            <label htmlFor="password" className="label">Store Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              aria-invalid={!!error}
              aria-describedby={error ? 'password-error' : undefined}
            />
          </div>
          {error && (
            <div id="password-error" role="alert" className="text-sm text-red-600" aria-live="assertive">
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Checking…' : 'Enter'}
          </button>
          <p className="muted">All actions require a valid password. It is never hardcoded.</p>
        </form>
      </div>
    </div>
  )
}

