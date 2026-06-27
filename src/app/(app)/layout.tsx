import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

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
      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-vibe-500/4 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-aurora-500/4 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 flex">
        {/* Sidebar */}
        <div className="hidden md:flex w-16 lg:w-56 xl:w-64 flex-shrink-0 sticky top-0 h-screen py-4 pr-4">
          <Sidebar user={user} />
        </div>

        {/* Main content */}
        <main className="flex-1 min-h-screen border-x border-sky-border max-w-[600px] pb-20 md:pb-0">
          {children}
        </main>

        {/* Right sidebar — hidden on small screens */}
        <div className="hidden xl:block w-72 flex-shrink-0 py-4 pl-4 space-y-4">
          {/* Search box */}
          <div className="relative">
            <input
              type="search"
              placeholder="Search VibeSky..."
              className="vibe-input w-full pl-10 text-sm"
              onFocus={(e) => { e.target.blur(); window.location.href = '/search' }}
              readOnly
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <MobileNav user={user} />
    </div>
  )
}
