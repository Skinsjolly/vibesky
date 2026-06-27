'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { User } from '@/types'

interface EditProfileModalProps {
  profile: User
  onClose: () => void
  onSave: (updated: Partial<User>) => void
}

export function EditProfileModal({ profile, onClose, onSave }: EditProfileModalProps) {
  const [form, setForm] = useState({
    displayName: profile.displayName,
    bio: profile.bio || '',
    avatarUrl: profile.avatarUrl || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.displayName.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch(`/api/users/${profile.username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl.trim() || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save')
      setLoading(false)
      return
    }

    onSave(data.user)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-sky-deep border border-sky-border rounded-2xl w-full max-w-md animate-float-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-sky-border">
          <h2 className="font-semibold text-white">Edit profile</h2>
          <button onClick={onClose} className="p-1.5 text-sky-muted hover:text-white rounded-full hover:bg-sky-elevated transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div className="flex justify-center mb-2">
            <Avatar
              src={form.avatarUrl || profile.avatarUrl}
              alt={form.displayName}
              size="xl"
            />
          </div>

          <div>
            <label className="text-sm text-sky-muted mb-1.5 block">Avatar URL</label>
            <input
              type="url"
              className="vibe-input w-full"
              placeholder="https://..."
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-sky-muted mb-1.5 block">Display name</label>
            <input
              type="text"
              className="vibe-input w-full"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="text-sm text-sky-muted mb-1.5 block">Bio</label>
            <textarea
              className="vibe-input w-full resize-none"
              rows={3}
              placeholder="Tell the world about yourself..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={200}
            />
            <p className="text-xs text-sky-muted mt-1 text-right">{form.bio.length}/200</p>
          </div>

          {error && (
            <p className="text-pulse-500 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="vibe-btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="vibe-btn-primary flex-1">
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
