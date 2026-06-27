'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Search, Bell, User, LogOut, Feather, Zap
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { User as UserType } from '@/types'

interface SidebarProps {
  user: UserType
}

const navItems = [
  { href: '/feed', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/notifications', icon: Bell, label: 'Notifications', hasCount: true },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [notifCount, setNotifCount] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/notifications/count')
      .then((r) => r.json())
      .then((d) => setNotifCount(d.count || 0))

    const interval = setInterval(() => {
      fetch('/api/notifications/count')
        .then((r) => r.json())
        .then((d) => setNotifCount(d.count || 0))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2.5 px-3 py-4 mb-4 w-fit group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-vibe-500 to-aurora-500 flex items-center justify-center shadow-lg group-hover:shadow-vibe-500/30 transition-shadow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white text-xl tracking-tight hidden lg:block">VibeSky</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, icon: Icon, label, hasCount }) => {
          const isActive = pathname === href
          const count = hasCount ? notifCount : 0

          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (href === '/notifications') setNotifCount(0)
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 group',
                isActive
                  ? 'bg-vibe-500/15 text-vibe-400'
                  : 'text-sky-muted hover:text-white hover:bg-sky-elevated'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', isActive && 'text-vibe-400')} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-vibe-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              <span className={cn('font-medium text-sm hidden lg:block', isActive && 'text-vibe-400 font-semibold')}>
                {label}
              </span>
            </Link>
          )
        })}

        <Link
          href={`/${user.username}`}
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150',
            pathname === `/${user.username}`
              ? 'bg-vibe-500/15 text-vibe-400'
              : 'text-sky-muted hover:text-white hover:bg-sky-elevated'
          )}
        >
          <User className={cn('w-5 h-5', pathname === `/${user.username}` && 'text-vibe-400')} />
          <span className={cn('font-medium text-sm hidden lg:block', pathname === `/${user.username}` && 'text-vibe-400 font-semibold')}>
            Profile
          </span>
        </Link>
      </nav>

      {/* User account */}
      <div className="mt-4 pt-4 border-t border-sky-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sky-elevated transition-colors group">
          <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
          <div className="flex-1 min-w-0 hidden lg:block">
            <p className="text-white text-sm font-medium truncate">{user.displayName}</p>
            <p className="text-sky-muted text-xs truncate">@{user.username}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 text-sky-muted hover:text-white rounded-lg hover:bg-sky-elevated transition-colors opacity-0 group-hover:opacity-100"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
