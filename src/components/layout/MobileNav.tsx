'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User as UserType } from '@/types'

export function MobileNav({ user }: { user: UserType }) {
  const pathname = usePathname()

  const items = [
    { href: '/feed', icon: Home },
    { href: '/search', icon: Search },
    { href: '/notifications', icon: Bell },
    { href: `/${user.username}`, icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-sky-deep/95 backdrop-blur-md border-t border-sky-border flex md:hidden">
      {items.map(({ href, icon: Icon }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex items-center justify-center py-3.5 transition-colors',
              isActive ? 'text-vibe-400' : 'text-sky-muted hover:text-white'
            )}
          >
            <Icon className="w-5 h-5" />
          </Link>
        )
      })}
    </nav>
  )
}
