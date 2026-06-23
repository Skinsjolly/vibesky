'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, formatCount } from '@/lib/utils'
import type { Post, User, Comment } from '@/types'

interface CommentModalProps {
  post: Post
  currentUser: User
  onClose: () => void
  onComment: (comment: Comment) => void
}

export function CommentModal({ post, currentUser, onClose, onComment }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`/api/posts/${post.id}/comments`)
      .then((r) => r.json())
      .then((d) => {
        setComments(d.comments || [])
        setFetching(false)
      })
  }, [post.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setComments((prev) => [...prev, data.comment])
      setContent('')
      onComment(data.comment)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-sky-deep border border-sky-border rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-float-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sky-border">
          <h2 className="font-semibold text-white">Replies</h2>
          <button onClick={onClose} className="p-1.5 text-sky-muted hover:text-white rounded-full hover:bg-sky-elevated transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original post */}
        <div className="px-4 py-4 border-b border-sky-border">
          <div className="flex gap-3">
            <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-semibold text-white text-sm">{post.author.displayName}</span>
                {post.author.verified && <CheckCircle2 className="w-3.5 h-3.5 text-vibe-400" />}
                <span className="text-sky-muted text-sm">· {formatRelativeTime(post.createdAt)}</span>
              </div>
              <p className="text-white text-sm leading-relaxed">{post.content}</p>
              <div className="flex gap-4 mt-2 text-sky-muted text-xs">
                <span>{formatCount(post._count.likes)} likes</span>
                <span>{formatCount(post._count.comments)} comments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto">
          {fetching ? (
            <div className="p-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-vibe-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="p-8 text-center text-sky-muted text-sm">
              No replies yet. Be the first!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="px-4 py-3 border-b border-sky-border flex gap-3">
                <Avatar src={comment.user.avatarUrl} alt={comment.user.displayName} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-white text-sm">{comment.user.displayName}</span>
                    <span className="text-sky-muted text-xs">· {formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Compose */}
        <div className="px-4 py-3 border-t border-sky-border">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="sm" />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-sky-mid border border-sky-border rounded-xl px-3 py-2 text-white text-sm placeholder-sky-muted resize-none focus:outline-none focus:border-vibe-500 min-h-[60px]"
                maxLength={300}
              />
            </div>
            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="vibe-btn-primary text-sm px-4 py-2"
            >
              {loading ? '...' : 'Reply'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
