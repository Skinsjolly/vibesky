import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  const user = {
    id: session.id,
    username: session.username,
    displayName: session.displayName,
    email: session.email,
    avatarUrl: session.avatarUrl,
    verified: session.verified,
  }

  return (
    <div className="min-h-screen bg-sky-void">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-vibe-500/4 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-aurora-500/4 rounded-full blur-[140px]" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 flex">
        <div className="hidden md:flex w-16 lg:w-56 xl:w-64 flex-shrink-0 sticky top-0 h-screen py-4 pr-4">
          <Sidebar user={user} />
        </div>
        <main className="flex-1 min-h-screen border-x border-sky-border max-w-[600px] pb-20 md:pb-0">
          {children}
        </main>
        <div className="hidden xl:block w-72 flex-shrink-0 py-4 pl-4">
          <a href="/search" className="flex items-center gap-2 vibe-input w-full text-sky-muted text-sm">
            Search VibeSky...
          </a>
        </div>
      </div>
      <MobileNav user={user} />
    </div>
  )
}
