import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Feed } from '@/components/feed/Feed'
import { ComposePost } from '@/components/feed/ComposePost'
import { FeedClient } from './FeedClient'

export default async function FeedPage() {
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

  return <FeedClient user={user} />
}
