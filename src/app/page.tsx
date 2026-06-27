import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getSession()
  if (session) redirect('/feed')

  return (
    <div className="min-h-screen bg-sky-void flex flex-col">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-vibe-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-aurora-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vibe-500 to-aurora-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">VibeSky</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="vibe-btn-ghost text-sm">Sign in</Link>
          <Link href="/register" className="vibe-btn-primary text-sm">Join now</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-vibe-500/10 border border-vibe-500/20 rounded-full px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 bg-aurora-400 rounded-full animate-pulse" />
          <span className="text-aurora-400 text-sm font-medium">Now in open beta</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 leading-none">
          <span className="text-white">Where ideas</span>
          <br />
          <span className="text-gradient-vibe">take flight</span>
        </h1>

        <p className="text-sky-muted text-xl max-w-xl mb-12 leading-relaxed">
          VibeSky is a space for curious minds to share, connect, and discover what matters. No noise, just signal.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/register" className="vibe-btn-primary text-base px-8 py-3 glow-vibe">
            Start vibing →
          </Link>
          <Link href="/login" className="vibe-btn-secondary text-base px-8 py-3">
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-16">
          {['Posts & Replies', 'Follow Feeds', 'Reposts', 'Notifications', 'Search'].map((f) => (
            <span
              key={f}
              className="bg-sky-surface border border-sky-border text-sky-muted text-sm px-4 py-2 rounded-full"
            >
              {f}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sky-muted text-sm">
        © 2025 VibeSky. Built with intention.
      </footer>
    </div>
  )
}
