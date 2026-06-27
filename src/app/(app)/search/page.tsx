'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { PostCard } from '@/components/feed/PostCard'
import { CommentModal } from '@/components/feed/CommentModal'
import type { Post, User } from '@/types'

type TabType = 'all' | 'users' | 'posts'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabType>('all')
  const [users, setUsers] = useState<(User & { isFollowing: boolean; _count: { followers: number } })[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [commentPost, setCommentPost] = useState<Post | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setCurrentUser(d.user))
  }, [])

  const doSearch = useCallback(async (q: string, t: TabType) => {
    if (!q.trim()) {
      setUsers([])
      setPosts([])
      return
    }
    setLoading(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${t}`)
    const data = await res.json()
    setUsers(data.users || [])
    setPosts(data.posts || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query, tab), 350)
    return () => clearTimeout(timer)
  }, [query, tab, doSearch])

  async function handleFollow(username: string) {
    setUsers((prev) =>
      prev.map((u) => u.username === username ? { ...u, isFollowing: !u.isFollowing } : u)
    )
    await fetch(`/api/users/${username}/follow`, { method: 'POST' })
  }

  return (
    <div>
      <div className="sticky top-0 z-20 bg-sky-void/90 backdrop-blur-md border-b border-sky-border px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search VibeSky..."
            className="vibe-input w-full pl-10"
            autoFocus
          />
        </div>

        <div className="flex gap-1">
          {(['all', 'users', 'posts'] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-vibe-500 text-white'
                  : 'text-sky-muted hover:text-white hover:bg-sky-elevated'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {!query.trim() ? (
        <div className="py-16 text-center">
          <Search className="w-12 h-12 text-sky-muted mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Search VibeSky</h3>
          <p className="text-sky-muted text-sm">Find people and posts</p>
        </div>
      ) : loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-vibe-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {/* Users */}
          {(tab === 'all' || tab === 'users') && users.length > 0 && (
            <div>
              {tab === 'all' && (
                <div className="px-4 py-3 border-b border-sky-border">
                  <h2 className="text-white font-semibold text-sm">People</h2>
                </div>
              )}
              {users.map((user) => (
                <div key={user.id} className="px-4 py-3 border-b border-sky-border flex items-center gap-3 hover:bg-sky-elevated/50 transition-colors">
                  <Link href={`/${user.username}`}>
                    <Avatar src={user.avatarUrl} alt={user.displayName} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/${user.username}`} className="font-semibold text-white hover:underline text-sm">
                        {user.displayName}
                      </Link>
                      {user.verified && <CheckCircle2 className="w-3.5 h-3.5 text-vibe-400" />}
                    </div>
                    <p className="text-sky-muted text-xs">@{user.username}</p>
                    {user.bio && <p className="text-sky-muted text-xs mt-0.5 truncate">{user.bio}</p>}
                  </div>
                  <button
                    onClick={() => handleFollow(user.username)}
                    className={
                      user.isFollowing
                        ? 'text-xs border border-sky-border text-sky-muted hover:border-pulse-500 hover:text-pulse-500 px-3 py-1 rounded-full transition-colors'
                        : 'text-xs bg-vibe-500 hover:bg-vibe-600 text-white px-3 py-1.5 rounded-full font-medium transition-colors'
                    }
                  >
                    {user.isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Posts */}
          {(tab === 'all' || tab === 'posts') && posts.length > 0 && (
            <div>
              {tab === 'all' && (
                <div className="px-4 py-3 border-b border-sky-border">
                  <h2 className="text-white font-semibold text-sm">Posts</h2>
                </div>
              )}
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onComment={setCommentPost} />
              ))}
            </div>
          )}

          {users.length === 0 && posts.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-white font-semibold mb-2">No results for "{query}"</h3>
              <p className="text-sky-muted text-sm">Try different keywords</p>
            </div>
          )}
        </div>
      )}

      {commentPost && currentUser && (
        <CommentModal
          post={commentPost}
          currentUser={currentUser}
          onClose={() => setCommentPost(null)}
          onComment={() => {}}
        />
      )}
    </div>
  )
}
