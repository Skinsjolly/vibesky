'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { User } from '@/types'

export function SuggestedUsers() {
  const [users, setUsers] = useState<(User & { isFollowing: boolean })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/search?q=a&type=users')
      .then((r) => r.json())
      .then((d) => {
        setUsers((d.users || []).slice(0, 5))
        setLoading(false)
      })
  }, [])

  async function handleFollow(username: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.username === username ? { ...u, isFollowing: !u.isFollowing } : u
      )
    )
    await fetch(`/api/users/${username}/follow`, { method: 'POST' })
  }

  if (loading) return null
  if (users.length === 0) return null

  return (
    <div className="vibe-card p-4">
      <h3 className="font-semibold text-white text-sm mb-4">People to follow</h3>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Link href={`/${user.username}`}>
              <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Link href={`/${user.username}`} className="text-white text-sm font-medium hover:underline truncate">
                  {user.displayName}
                </Link>
                {user.verified && <CheckCircle2 className="w-3 h-3 text-vibe-400 flex-shrink-0" />}
              </div>
              <p className="text-sky-muted text-xs truncate">@{user.username}</p>
            </div>
            <button
              onClick={() => handleFollow(user.username)}
              className={
                user.isFollowing
                  ? 'text-xs border border-sky-border text-sky-muted hover:border-pulse-500 hover:text-pulse-500 px-3 py-1 rounded-full transition-colors'
                  : 'text-xs bg-vibe-500 hover:bg-vibe-600 text-white px-3 py-1 rounded-full transition-colors font-medium'
              }
            >
              {user.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
