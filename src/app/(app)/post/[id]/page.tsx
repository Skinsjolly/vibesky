'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Heart, Repeat2, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { PostCard } from '@/components/feed/PostCard'
import { ComposePost } from '@/components/feed/ComposePost'
import { formatRelativeTime, formatCount } from '@/lib/utils'
import type { Post, User, Comment } from '@/types'

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [reposted, setReposted] = useState(false)
  const [repostCount, setRepostCount] = useState(0)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setCurrentUser(d.user))
  }, [])

  useEffect(() => {
    Promise.all([
      fetch(`/api/posts/${id}`).then(r => r.json()),
      fetch(`/api/posts/${id}/comments`).then(r => r.json()),
    ]).then(([postData, commentData]) => {
      if (postData.post) {
        setPost(postData.post)
        setLiked(postData.post.liked)
        setLikeCount(postData.post._count.likes)
        setReposted(postData.post.reposted)
        setRepostCount(postData.post._count.reposts)
      }
      setComments(commentData.comments || [])
      setLoading(false)
    })
  }, [id])

  async function handleLike() {
    if (!post) return
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(c => c + (newLiked ? 1 : -1))
    const res = await fetch(`/api/posts/${id}/likes`, { method: 'POST' })
    const data = await res.json()
    setLiked(data.liked)
  }

  async function handleRepost() {
    const newReposted = !reposted
    setReposted(newReposted)
    setRepostCount(c => c + (newReposted ? 1 : -1))
    await fetch(`/api/posts/${id}/reposts`, { method: 'POST' })
  }

  function handleNewComment(comment: Comment) {
    setComments(prev => [...prev, comment])
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-6 h-6 border-2 border-vibe-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <div className="text-5xl mb-4">🌊</div>
        <h3 className="text-white font-semibold text-lg mb-2">Post not found</h3>
        <Link href="/feed" className="text-vibe-400 text-sm hover:underline">Back to feed</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-20 bg-sky-void/90 backdrop-blur-md border-b border-sky-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-1.5 text-sky-muted hover:text-white rounded-full hover:bg-sky-elevated transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-base">Post</h1>
      </div>

      {/* Main post expanded view */}
      <div className="px-4 py-5 border-b border-sky-border">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/${post.author.username}`}>
            <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="lg" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link href={`/${post.author.username}`} className="font-bold text-white hover:underline">
                {post.author.displayName}
              </Link>
              {post.author.verified && <CheckCircle2 className="w-4 h-4 text-vibe-400" />}
            </div>
            <p className="text-sky-muted text-sm">@{post.author.username}</p>
          </div>
        </div>

        <p className="text-white text-xl leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

        {post.imageUrl && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-sky-border">
            <img src={post.imageUrl} alt="Post image" className="w-full object-cover max-h-96" />
          </div>
        )}

        <p className="text-sky-muted text-sm mb-4">
          {new Date(post.createdAt).toLocaleString('en-US', {
            hour: 'numeric', minute: '2-digit', month: 'long', day: 'numeric', year: 'numeric'
          })}
        </p>

        <div className="flex items-center gap-5 py-4 border-t border-b border-sky-border mb-4 text-sm">
          <div>
            <span className="font-bold text-white">{formatCount(repostCount)}</span>
            <span className="text-sky-muted ml-1.5">Reposts</span>
          </div>
          <div>
            <span className="font-bold text-white">{formatCount(likeCount)}</span>
            <span className="text-sky-muted ml-1.5">Likes</span>
          </div>
          <div>
            <span className="font-bold text-white">{formatCount(comments.length)}</span>
            <span className="text-sky-muted ml-1.5">Comments</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${liked ? 'text-pulse-500' : 'text-sky-muted hover:text-pulse-500'}`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleRepost}
            className={`flex items-center gap-2 transition-colors ${reposted ? 'text-aurora-400' : 'text-sky-muted hover:text-aurora-400'}`}
          >
            <Repeat2 className="w-5 h-5" />
          </button>
          <button className="text-sky-muted hover:text-vibe-400 transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Compose reply */}
      {currentUser && (
        <ComposePost
          user={currentUser}
          replyToId={post.id}
          placeholder={`Reply to @${post.author.username}...`}
          onPost={handleNewComment as (post: unknown) => void}
          compact
        />
      )}

      {/* Comments */}
      <div>
        {comments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sky-muted text-sm">No replies yet</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="px-4 py-4 border-b border-sky-border flex gap-3 hover:bg-sky-elevated/30 transition-colors">
              <Link href={`/${comment.user.username}`}>
                <Avatar src={comment.user.avatarUrl} alt={comment.user.displayName} size="md" />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Link href={`/${comment.user.username}`} className="font-semibold text-white text-sm hover:underline">
                    {comment.user.displayName}
                  </Link>
                  {comment.user.verified && <CheckCircle2 className="w-3 h-3 text-vibe-400" />}
                  <span className="text-sky-muted text-xs">· {formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-white text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
