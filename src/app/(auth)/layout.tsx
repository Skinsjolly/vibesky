import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session) redirect('/feed')

  return (
    <div className="min-h-screen bg-sky-void flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vibe-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-aurora-500/8 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
