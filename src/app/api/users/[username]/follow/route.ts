import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await params
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (target.id === session.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.id, followingId: target.id } },
  })

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })
    return NextResponse.json({ following: false })
  }

  await prisma.follow.create({ data: { followerId: session.id, followingId: target.id } })

  await prisma.notification.create({
    data: { recipientId: target.id, actorId: session.id, type: 'FOLLOW' },
  }).catch(() => {})

  return NextResponse.json({ following: true })
}
