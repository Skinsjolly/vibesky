import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createSession(user.id)
    const cookieOptions = setSessionCookie(token)

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    })

    response.cookies.set(cookieOptions)
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
