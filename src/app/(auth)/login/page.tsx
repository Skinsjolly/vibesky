'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign in failed')
        return
      }

      router.push('/feed')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="vibe-card p-8 glow-vibe">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vibe-500 to-aurora-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-white">VibeSky</span>
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-sky-muted">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-sky-muted mb-1.5 block">Email</label>
          <input
            type="email"
            className="vibe-input w-full"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm text-sky-muted mb-1.5 block">Password</label>
          <input
            type="password"
            className="vibe-input w-full"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {error && (
          <div className="bg-pulse-500/10 border border-pulse-500/30 text-pulse-500 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="vibe-btn-primary w-full py-3">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sky-muted text-sm mt-6">
        No account?{' '}
        <Link href="/register" className="text-vibe-400 hover:text-vibe-300 font-medium">
          Join VibeSky
        </Link>
      </p>

      <div className="mt-6 pt-6 border-t border-sky-border">
        <p className="text-xs text-sky-muted text-center mb-3">Demo accounts (password: <code className="font-mono text-aurora-400">password123</code>)</p>
        <div className="grid grid-cols-3 gap-2">
          {['aurora@vibesky.app', 'nova@vibesky.app', 'cosmo@vibesky.app'].map((email) => (
            <button
              key={email}
              type="button"
              onClick={() => setForm({ email, password: 'password123' })}
              className="text-xs bg-sky-mid border border-sky-border hover:border-vibe-500/40 text-sky-muted hover:text-white rounded-lg px-2 py-1.5 transition-all truncate"
            >
              {email.split('@')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
