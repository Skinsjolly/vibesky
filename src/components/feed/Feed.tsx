'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PostCard } from './PostCard'
import { PostSkeleton } from './PostSkeleton'
import { CommentModal } from './CommentModal'
import type { Post, User } from '@/types'

interface FeedProps {
  type?: 'following' | 'global'
  currentUser: User
}

export function Feed({ type = 'following', currentUser }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [commentPost, setCommentPost] = useState<Post | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const fetchPosts = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ type })
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(`/api/feed?${params}`)
    const data = await res.json()
    return data
  }, [type])

  useEffect(() => {
    setLoading(true)
    setPosts([])
    setNextCursor(null)
    setHasMore(true)

    fetchPosts().then((data) => {
      setPosts(data.posts || [])
      setNextCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
      setLoading(false)
    })
  }, [fetchPosts])

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && nextCursor) {
          setLoadingMore(true)
          const data = await fetchPosts(nextCursor)
          setPosts((prev) => [...prev, ...(data.posts || [])])
          setNextCursor(data.nextCursor)
          setHasMore(!!data.nextCursor)
          setLoadingMore(false)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)

    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, nextCursor, fetchPosts])

  function handleNewPost(post: Post) {
    setPosts((prev) => [post, ...prev])
  }

  if (loading) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl mb-4">🌌</div>
        <h3 className="text-white font-semibold text-lg mb-2">Nothing here yet</h3>
        <p className="text-sky-muted text-sm">
          {type === 'following'
            ? 'Follow some people to see their posts here'
            : 'Be the first to post something'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onComment={setCommentPost}
          />
        ))}
      </div>

      <div ref={loadMoreRef} className="py-4">
        {loadingMore && (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-vibe-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-sky-muted text-sm py-4">You're all caught up ✨</p>
        )}
      </div>

      {commentPost && (
        <CommentModal
          post={commentPost}
          currentUser={currentUser}
          onClose={() => setCommentPost(null)}
          onComment={() => {}}
        />
      )}
    </>
  )
}

// Export for external use (e.g., from layout)
export type { FeedProps }
