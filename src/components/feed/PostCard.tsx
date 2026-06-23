'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Repeat2, MessageCircle, MoreHorizontal, CheckCircle2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, formatCount, cn } from '@/lib/utils'
import type { Post } from '@/types'

interface PostCardProps {
  post: Post
  onLike?: (postId: string, liked: boolean) => void
  onRepost?: (postId: string, reposted: boolean) => void
  onComment?: (post: Post) => void
  compact?: boolean
}

export function PostCard({ post, onLike, onRepost, onComment, compact }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [reposted, setReposted] = useState(post.reposted)
  const [repostCount, setRepostCount] = useState(post._count.reposts)
  const [likeAnimating, setLikeAnimating] = useState(false)

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 400)

    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((c) => c + (newLiked ? 1 : -1))

    try {
      const res = await fetch(`/api/posts/${post.id}/likes`, { method: 'POST' })
      const data = await res.json()
      setLiked(data.liked)
      onLike?.(post.id, data.liked)
    } catch {
      setLiked(!newLiked)
      setLikeCount((c) => c + (newLiked ? -1 : 1))
    }
  }

  async function handleRepost(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const newReposted = !reposted
    setReposted(newReposted)
    setRepostCount((c) => c + (newReposted ? 1 : -1))

    try {
      const res = await fetch(`/api/posts/${post.id}/reposts`, { method: 'POST' })
      const data = await res.json()
      setReposted(data.reposted)
      onRepost?.(post.id, data.reposted)
    } catch {
      setReposted(!newReposted)
      setRepostCount((c) => c + (newReposted ? -1 : 1))
    }
  }

  function handleComment(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onComment?.(post)
  }

  return (
    <article className="group relative bg-sky-surface hover:bg-sky-elevated border-b border-sky-border transition-colors duration-150 cursor-pointer">
      <Link href={`/post/${post.id}`} className="absolute inset-0" />

      <div className="relative px-4 py-4 flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 z-10">
          <Link href={`/${post.author.username}`} onClick={(e) => e.stopPropagation()}>
            <Avatar
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              size="md"
              className="hover:ring-2 hover:ring-vibe-500/40 transition-all"
            />
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <Link
              href={`/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-white hover:underline z-10 relative text-sm"
            >
              {post.author.displayName}
            </Link>
            {post.author.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-vibe-400 flex-shrink-0" />
            )}
            <span className="text-sky-muted text-sm truncate">@{post.author.username}</span>
            <span className="text-sky-muted text-sm">·</span>
            <span className="text-sky-muted text-sm flex-shrink-0">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          {/* Post text */}
          <p className={cn('text-white leading-relaxed whitespace-pre-wrap break-words', compact ? 'text-sm line-clamp-3' : 'text-sm')} >
            {post.content}
          </p>

          {/* Image */}
          {post.imageUrl && !compact && (
            <div className="mt-3 rounded-xl overflow-hidden border border-sky-border max-h-80 relative">
              <Image
                src={post.imageUrl}
                alt="Post image"
                width={600}
                height={400}
                className="w-full object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5 mt-3 -ml-1.5">
            {/* Comment */}
            <button
              onClick={handleComment}
              className="flex items-center gap-1.5 text-sky-muted hover:text-aurora-400 transition-colors group/btn z-10 relative"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-aurora-400/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">{formatCount(post._count.comments + post._count.replies)}</span>
            </button>

            {/* Repost */}
            <button
              onClick={handleRepost}
              className={cn(
                'flex items-center gap-1.5 transition-colors group/btn z-10 relative',
                reposted ? 'text-aurora-400' : 'text-sky-muted hover:text-aurora-400'
              )}
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-aurora-400/10 transition-colors">
                <Repeat2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">{formatCount(repostCount)}</span>
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 transition-colors group/btn z-10 relative',
                liked ? 'text-pulse-500' : 'text-sky-muted hover:text-pulse-500'
              )}
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-pulse-500/10 transition-colors">
                <Heart
                  className={cn('w-4 h-4 transition-transform', likeAnimating && 'scale-125', liked && 'fill-current')}
                />
              </div>
              <span className="text-xs font-medium">{formatCount(likeCount)}</span>
            </button>

            <button className="ml-auto p-1.5 text-sky-muted hover:text-white opacity-0 group-hover:opacity-100 transition-all z-10 relative rounded-full hover:bg-sky-elevated">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
