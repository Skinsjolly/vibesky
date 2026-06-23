import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const type = searchParams.get('type') || 'all'

  if (!q) return NextResponse.json({ users: [], posts: [] })

  const [users, posts] = await Promise.all([
    type !== 'posts'
      ? prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 10,
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            verified: true,
            _count: { select: { followers: true } },
            followers: { where: { followerId: session.id }, select: { id: true } },
          },
        })
      : Promise.resolve([]),

    type !== 'users'
      ? prisma.post.findMany({
          where: { content: { contains: q, mode: 'insensitive' }, replyToId: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            content: true,
            imageUrl: true,
            createdAt: true,
            replyToId: true,
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true, verified: true } },
            _count: { select: { likes: true, comments: true, reposts: true, replies: true } },
            likes: { where: { userId: session.id }, select: { id: true } },
            reposts: { where: { userId: session.id }, select: { id: true } },
          },
        })
      : Promise.resolve([]),
  ])

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      isFollowing: u.followers?.length > 0,
      followers: undefined,
    })),
    posts: posts.map((p) => ({
      ...p,
      liked: p.likes?.length > 0,
      reposted: p.reposts?.length > 0,
      likes: undefined,
      reposts: undefined,
    })),
  })
}
