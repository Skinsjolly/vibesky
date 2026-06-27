import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, username, displayName, password } = await req.json()

    if (!email || !username || !displayName || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters: lowercase letters, numbers, underscores' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username'
      return NextResponse.json({ error: `${field} is already taken` }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`

    const user = await prisma.user.create({
      data: { email, username, displayName, passwordHash, avatarUrl },
    })

    const token = await createSession(user.id)
    const cookieOptions = setSessionCookie(token)

    const response = NextResponse.json({
      user: { id: user.id, username: user.username, displayName: user.displayName },
    })

    response.cookies.set(cookieOptions)
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
