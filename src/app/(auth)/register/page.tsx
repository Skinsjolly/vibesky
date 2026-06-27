'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
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
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-sky-muted">Join the community today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-sky-muted mb-1.5 block">Display name</label>
            <input
              type="text"
              className="vibe-input w-full"
              placeholder="Your Name"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-sky-muted mb-1.5 block">Username</label>
            <input
              type="text"
              className="vibe-input w-full"
              placeholder="handle"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
              }
              required
            />
          </div>
        </div>
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
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
        </div>

        {error && (
          <div className="bg-pulse-500/10 border border-pulse-500/30 text-pulse-500 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="vibe-btn-primary w-full py-3">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sky-muted text-sm mt-6">
        Already on VibeSky?{' '}
        <Link href="/login" className="text-vibe-400 hover:text-vibe-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
