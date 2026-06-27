import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { content, imageUrl, replyToId } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Post exceeds 500 characters' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl || null,
        authorId: session.id,
        replyToId: replyToId || null,
      },
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
      },
    })

    // If it's a reply, notify the original post author
    if (replyToId) {
      const originalPost = await prisma.post.findUnique({
        where: { id: replyToId },
        select: { authorId: true },
      })
      if (originalPost && originalPost.authorId !== session.id) {
        await prisma.notification.create({
          data: {
            recipientId: originalPost.authorId,
            actorId: session.id,
            type: 'REPLY',
            postId: replyToId,
          },
        })
      }
    }

    return NextResponse.json({ post: { ...post, liked: false, reposted: false } }, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
