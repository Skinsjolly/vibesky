'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Calendar, ArrowLeft, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { PostCard } from '@/components/feed/PostCard'
import { PostSkeleton } from '@/components/feed/PostSkeleton'
import { CommentModal } from '@/components/feed/CommentModal'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { formatCount } from '@/lib/utils'
import type { Post, User } from '@/types'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [commentPost, setCommentPost] = useState<Post | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setCurrentUser(d.user))
  }, [])

  useEffect(() => {
    setLoading(true)
    setPostsLoading(true)
    setPosts([])
    setNextCursor(null)

    fetch(`/api/users/${username}`)
      .then(r => r.json())
      .then(d => {
        setProfile(d.user)
        setLoading(false)
      })

    fetch(`/api/users/${username}/posts`)
      .then(r => r.json())
      .then(d => {
        setPosts(d.posts || [])
        setNextCursor(d.nextCursor)
        setPostsLoading(false)
      })
  }, [username])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const res = await fetch(`/api/users/${username}/posts?cursor=${nextCursor}`)
    const data = await res.json()
    setPosts((prev: Post[]) => [...prev, ...(data.posts || [])])
    setNextCursor(data.nextCursor)
    setLoadingMore(false)
  }, [username, nextCursor, loadingMore])

  async function handleFollow() {
    if (!profile || followLoading) return
    setFollowLoading(true)
    const wasFollowing = profile.isFollowing
    setProfile(p => p ? { ...p, isFollowing: !p.isFollowing, _count: p._count ? { ...p._count, followers: (p._count.followers ?? 0) + (wasFollowing ? -1 : 1) } : p._count } : p)
    await fetch(`/api/users/${username}/follow`, { method: 'POST' })
    setFollowLoading(false)
  }

  function handleProfileUpdate(updated: Partial<User>) {
    setProfile((p: User | null) => p ? { ...p, ...updated } : p)
    setShowEdit(false)
  }

  if (loading) {
    return (
      <div>
        <div className="h-32 bg-sky-elevated shimmer-loading" />
        <div className="px-4 pb-4 border-b border-sky-border">
          <div className="flex justify-between items-end -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full bg-sky-elevated shimmer-loading border-4 border-sky-void" />
            <div className="w-24 h-9 bg-sky-elevated shimmer-loading rounded-xl mt-10" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-32 bg-sky-elevated shimmer-loading rounded-full" />
            <div className="h-4 w-24 bg-sky-elevated shimmer-loading rounded-full" />
            <div className="h-4 w-full bg-sky-elevated shimmer-loading rounded-full mt-3" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <div className="text-5xl mb-4">👻</div>
        <h3 className="text-white font-semibold text-lg mb-2">User not found</h3>
        <p className="text-sky-muted text-sm">@{username} doesn't exist</p>
      </div>
    )
  }

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div>
      {/* Back nav header */}
      <div className="sticky top-0 z-20 bg-sky-void/90 backdrop-blur-md border-b border-sky-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-1.5 text-sky-muted hover:text-white rounded-full hover:bg-sky-elevated transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">{profile.displayName}</h1>
          <p className="text-sky-muted text-xs">{formatCount(profile._count?.posts || 0)} posts</p>
        </div>
      </div>

      {/* Banner */}
      <div className="h-32 bg-gradient-to-br from-vibe-900/60 via-sky-elevated to-aurora-900/40 relative overflow-hidden">
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-vibe-500/20 to-aurora-500/20" />
        )}
      </div>

      {/* Profile info */}
      <div className="px-4 pb-4 border-b border-sky-border">
        <div className="flex justify-between items-end -mt-10 mb-4">
          <div className="border-4 border-sky-void rounded-full">
            <Avatar src={profile.avatarUrl} alt={profile.displayName} size="xl" />
          </div>
          {profile.isOwn ? (
            <button
              onClick={() => setShowEdit(true)}
              className="vibe-btn-secondary text-sm flex items-center gap-2 mt-10"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit profile
            </button>
          ) : (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`mt-10 text-sm font-semibold px-5 py-2 rounded-xl transition-all ${
                profile.isFollowing
                  ? 'border border-sky-border text-white hover:border-pulse-500 hover:text-pulse-500 hover:bg-pulse-500/5'
                  : 'bg-white text-sky-void hover:bg-white/90'
              }`}
            >
              {profile.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-white font-bold text-xl">{profile.displayName}</h2>
            {profile.verified && <CheckCircle2 className="w-5 h-5 text-vibe-400" />}
          </div>
          <p className="text-sky-muted text-sm">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="text-white text-sm leading-relaxed mb-3 whitespace-pre-wrap">{profile.bio}</p>
        )}

        {joinDate && (
          <div className="flex items-center gap-1.5 text-sky-muted text-sm mb-4">
            <Calendar className="w-4 h-4" />
            <span>Joined {joinDate}</span>
          </div>
        )}

        <div className="flex gap-5">
          <Link href={`/${username}/following`} className="text-sm hover:underline">
            <span className="text-white font-semibold">{formatCount(profile._count?.following || 0)}</span>
            <span className="text-sky-muted ml-1">Following</span>
          </Link>
          <Link href={`/${username}/followers`} className="text-sm hover:underline">
            <span className="text-white font-semibold">{formatCount(profile._count?.followers || 0)}</span>
            <span className="text-sky-muted ml-1">Followers</span>
          </Link>
        </div>
      </div>

      {/* Posts */}
      <div>
        {postsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-white font-semibold mb-2">No posts yet</h3>
            <p className="text-sky-muted text-sm">
              {profile.isOwn ? 'Share your first thought!' : `@${username} hasn't posted yet`}
            </p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onComment={setCommentPost} />
            ))}
            {nextCursor && (
              <div className="py-4 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="vibe-btn-secondary text-sm px-6"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {commentPost && currentUser && (
        <CommentModal
          post={commentPost}
          currentUser={currentUser}
          onClose={() => setCommentPost(null)}
          onComment={() => {}}
        />
      )}

      {showEdit && profile && currentUser && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  )
}
