import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
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

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    post: {
      ...post,
      liked: post.likes.length > 0,
      reposted: post.reposts.length > 0,
      likes: undefined,
      reposts: undefined,
    },
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
