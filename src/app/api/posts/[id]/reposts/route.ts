import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params

  try {
    const existing = await prisma.repost.findUnique({
      where: { userId_postId: { userId: session.id, postId } },
    })

    if (existing) {
      await prisma.repost.delete({ where: { id: existing.id } })
      return NextResponse.json({ reposted: false })
    }

    await prisma.repost.create({ data: { userId: session.id, postId } })

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })
    if (post && post.authorId !== session.id) {
      await prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: session.id,
          type: 'REPOST',
          postId,
        },
      }).catch(() => {})
    }

    return NextResponse.json({ reposted: true })
  } catch (error) {
    console.error('Repost error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
