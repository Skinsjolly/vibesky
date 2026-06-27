import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getSession()
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      verified: true,
      createdAt: true,
      _count: {
        select: { posts: true, followers: true, following: true },
      },
      ...(session
        ? {
            followers: {
              where: { followerId: session.id },
              select: { id: true },
            },
          }
        : {}),
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const isFollowing = session
    ? (user as { followers?: { id: string }[] }).followers?.length > 0
    : false

  return NextResponse.json({
    user: {
      ...user,
      followers: undefined,
      isFollowing,
      isOwn: session?.id === user.id,
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await params
  if (session.username !== username)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { displayName, bio, avatarUrl } = await req.json()

  const user = await prisma.user.update({
    where: { username },
    data: {
      ...(displayName && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    select: {
      id: true, username: true, displayName: true, bio: true, avatarUrl: true, verified: true,
    },
  })

  return NextResponse.json({ user })
}
