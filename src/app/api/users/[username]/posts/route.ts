import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await params
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const posts = await prisma.post.findMany({
    where: {
      authorId: user.id,
      replyToId: null,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 21,
    select: {
      id: true,
      content: true,
      imageUrl: true,
      createdAt: true,
      replyToId: true,
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, verified: true },
      },
      _count: { select: { likes: true, comments: true, reposts: true, replies: true } },
      likes: { where: { userId: session.id }, select: { id: true } },
      reposts: { where: { userId: session.id }, select: { id: true } },
    },
  })

  const hasMore = posts.length > 20
  const items = hasMore ? posts.slice(0, 20) : posts
  const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null

  return NextResponse.json({
    posts: items.map((p) => ({
      ...p,
      liked: p.likes.length > 0,
      reposted: p.reposts.length > 0,
      likes: undefined,
      reposts: undefined,
    })),
    nextCursor,
  })
}
