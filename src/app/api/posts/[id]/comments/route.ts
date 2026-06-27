import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, verified: true } },
    },
  })

  return NextResponse.json({ comments })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params
  const { content } = await req.json()

  if (!content?.trim() || content.length > 300) {
    return NextResponse.json({ error: 'Invalid comment' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: { content: content.trim(), userId: session.id, postId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, verified: true } },
    },
  })

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
  if (post && post.authorId !== session.id) {
    await prisma.notification.create({
      data: { recipientId: post.authorId, actorId: session.id, type: 'COMMENT', postId },
    }).catch(() => {})
  }

  return NextResponse.json({ comment }, { status: 201 })
}
