import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: { select: { id: true, username: true, displayName: true, avatarUrl: true, verified: true } },
      post: { select: { id: true, content: true } },
    },
  })

  // Mark all as read
  await prisma.notification.updateMany({
    where: { recipientId: session.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ notifications })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.deleteMany({ where: { recipientId: session.id } })
  return NextResponse.json({ success: true })
}
