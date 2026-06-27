'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Repeat2, UserPlus, MessageCircle, CornerDownRight, Trash2, CheckCircle2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils'
import type { Notification } from '@/types'

const notifConfig = {
  LIKE: { icon: Heart, color: 'text-pulse-500', bg: 'bg-pulse-500/10', label: 'liked your post' },
  REPOST: { icon: Repeat2, color: 'text-aurora-400', bg: 'bg-aurora-400/10', label: 'reposted your post' },
  FOLLOW: { icon: UserPlus, color: 'text-vibe-400', bg: 'bg-vibe-400/10', label: 'started following you' },
  COMMENT: { icon: MessageCircle, color: 'text-sky-300', bg: 'bg-sky-300/10', label: 'commented on your post' },
  REPLY: { icon: CornerDownRight, color: 'text-vibe-300', bg: 'bg-vibe-300/10', label: 'replied to your post' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || [])
        setLoading(false)
      })
  }, [])

  async function clearAll() {
    await fetch('/api/notifications', { method: 'DELETE' })
    setNotifications([])
  }

  return (
    <div>
      <div className="sticky top-0 z-20 bg-sky-void/90 backdrop-blur-md border-b border-sky-border px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Notifications</h1>
        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-sky-muted hover:text-pulse-500 text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:block">Clear all</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-vibe-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <h3 className="text-white font-semibold text-lg mb-2">All quiet here</h3>
          <p className="text-sky-muted text-sm">Notifications will appear when people interact with you</p>
        </div>
      ) : (
        <div>
          {notifications.map((notif) => {
            const config = notifConfig[notif.type]
            const Icon = config.icon

            return (
              <div
                key={notif.id}
                className={`px-4 py-4 border-b border-sky-border flex gap-3 transition-colors ${
                  !notif.read ? 'bg-vibe-500/5' : 'hover:bg-sky-elevated/50'
                }`}
              >
                <div className="flex-shrink-0 relative">
                  <Link href={`/${notif.actor.username}`}>
                    <Avatar src={notif.actor.avatarUrl} alt={notif.actor.displayName} size="md" />
                  </Link>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.bg} flex items-center justify-center border border-sky-void`}>
                    <Icon className={`w-2.5 h-2.5 ${config.color}`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link href={`/${notif.actor.username}`} className="font-semibold text-white text-sm hover:underline">
                          {notif.actor.displayName}
                        </Link>
                        {notif.actor.verified && <CheckCircle2 className="w-3 h-3 text-vibe-400" />}
                        <span className="text-sky-muted text-sm">{config.label}</span>
                      </div>
                      {notif.post && (
                        <Link href={`/post/${notif.post.id}`}>
                          <p className="text-sky-muted text-sm mt-1 line-clamp-2 hover:text-white transition-colors">
                            {notif.post.content}
                          </p>
                        </Link>
                      )}
                    </div>
                    <span className="text-sky-muted text-xs flex-shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </div>

                {!notif.read && (
                  <div className="w-2 h-2 bg-vibe-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
