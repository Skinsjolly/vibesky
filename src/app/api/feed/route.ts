import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'following'
  const cursor = searchParams.get('cursor')
  const limit = 20

  try {
    let authorFilter: { in?: string[] } | undefined = undefined

    if (type === 'following') {
      const following = await prisma.follow.findMany({
        where: { followerId: session.id },
        select: { followingId: true },
      })
      const followingIds = [session.id, ...following.map((f) => f.followingId)]
      authorFilter = { in: followingIds }
    }

    const posts = await prisma.post.findMany({
      where: {
        replyToId: null,
        ...(authorFilter ? { authorId: authorFilter } : {}),
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
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

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null

    const formatted = items.map((post) => ({
      ...post,
      liked: post.likes.length > 0,
      reposted: post.reposts.length > 0,
      likes: undefined,
      reposts: undefined,
    }))

    return NextResponse.json({ posts: formatted, nextCursor })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
