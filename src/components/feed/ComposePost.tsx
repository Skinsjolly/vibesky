'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, X, Send } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { User } from '@/types'
import { cn } from '@/lib/utils'

interface ComposePostProps {
  user: User
  onPost?: (post: unknown) => void
  replyToId?: string
  placeholder?: string
  compact?: boolean
}

export function ComposePost({ user, onPost, replyToId, placeholder, compact }: ComposePostProps) {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charCount = content.length
  const maxChars = 500
  const remaining = maxChars - charCount
  const isOverLimit = remaining < 0
  const isNearLimit = remaining < 50

  function autoResize() {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || isOverLimit || loading) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: imageUrl.trim() || null,
          replyToId: replyToId || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to post')
        return
      }

      setContent('')
      setImageUrl('')
      setShowImageInput(false)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      onPost?.(data.post)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('bg-sky-surface border-b border-sky-border', compact ? 'p-3' : 'p-4')}>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar src={user.avatarUrl} alt={user.displayName} size={compact ? 'sm' : 'md'} />

          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                autoResize()
              }}
              placeholder={placeholder || "What's on your mind?"}
              className={cn(
                'w-full bg-transparent text-white placeholder-sky-muted resize-none focus:outline-none leading-relaxed',
                compact ? 'text-sm min-h-[60px]' : 'text-base min-h-[80px]'
              )}
              maxLength={520}
            />

            {showImageInput && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="vibe-input flex-1 text-sm py-2"
                />
                <button
                  type="button"
                  onClick={() => { setShowImageInput(false); setImageUrl('') }}
                  className="p-1.5 text-sky-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <p className="text-pulse-500 text-sm mt-2">{error}</p>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-sky-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="p-2 text-sky-muted hover:text-vibe-400 hover:bg-vibe-500/10 rounded-lg transition-colors"
                  title="Add image URL"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {charCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6">
                      <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                        <circle
                          cx="12" cy="12" r="9"
                          fill="none"
                          stroke="#2A2D5A"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="12" cy="12" r="9"
                          fill="none"
                          stroke={isOverLimit ? '#FF6B8A' : isNearLimit ? '#F59E0B' : '#6C55FF'}
                          strokeWidth="2.5"
                          strokeDasharray={`${Math.min((charCount / maxChars) * 56.5, 56.5)} 56.5`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    {isNearLimit && (
                      <span className={cn('text-xs font-mono', isOverLimit ? 'text-pulse-500' : 'text-amber-400')}>
                        {remaining}
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!content.trim() || isOverLimit || loading}
                  className="flex items-center gap-2 vibe-btn-primary text-sm px-4 py-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? 'Posting...' : replyToId ? 'Reply' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
