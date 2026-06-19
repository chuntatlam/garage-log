import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'

export function Auth() {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    const result =
      mode === 'signin' ? await signInWithPassword(email, password) : await signUpWithPassword(email, password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
    } else if (mode === 'signup') {
      setInfo('Check your inbox to confirm your email, then sign in.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-plate shadow-[inset_0_2px_5px_rgba(0,0,0,0.45)]">
            <span className="font-numeric text-xl font-semibold text-plate-digit">GL</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Garage Log</h1>
          <p className="mt-1 text-sm text-ink-soft">Service history and reminders, synced to every device.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-good">{info}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-ink-soft">
          <div className="h-px flex-1 bg-line" />
          or
          <div className="h-px flex-1 bg-line" />
        </div>

        <Button variant="secondary" className="w-full" onClick={() => signInWithGoogle()}>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-ink-soft">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="font-medium text-accent"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setInfo(null)
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
