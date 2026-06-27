'use client'

import { useState } from 'react'
import { ComposePost } from '@/components/feed/ComposePost'
import { Feed } from '@/components/feed/Feed'
import type { User } from '@/types'

export function FeedClient({ user }: { user: User }) {
  const [tab, setTab] = useState<'following' | 'global'>('following')
  const [feedKey, setFeedKey] = useState(0)

  function handleNewPost() {
    setFeedKey((k) => k + 1)
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-sky-void/90 backdrop-blur-md border-b border-sky-border">
        <div className="px-4 pt-4 pb-0">
          <h1 className="text-lg font-bold text-white mb-3">Home</h1>
          <div className="flex border-b border-sky-border -mx-4">
            <button
              onClick={() => setTab('following')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                tab === 'following'
                  ? 'text-white'
                  : 'text-sky-muted hover:text-white'
              }`}
            >
              Following
              {tab === 'following' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-vibe-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setTab('global')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                tab === 'global'
                  ? 'text-white'
                  : 'text-sky-muted hover:text-white'
              }`}
            >
              Discover
              {tab === 'global' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-vibe-500 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Compose */}
      <ComposePost user={user} onPost={handleNewPost} />

      {/* Feed */}
      <Feed key={`${tab}-${feedKey}`} type={tab} currentUser={user} />
    </div>
  )
}
