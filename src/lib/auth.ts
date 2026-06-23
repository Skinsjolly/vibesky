// src/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vibesky-secret-key-change-in-production'
)

export interface SessionUser {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
  verified: boolean
}

export async function createSession(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: { userId, token, expiresAt },
  })

  return token
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('vibesky_session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.userId as string

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    const { user } = session
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      verified: user.verified,
    }
  } catch {
    return null
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get('vibesky_session')?.value
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {})
  }
}

export function setSessionCookie(token: string) {
  // Called from API routes
  return {
    name: 'vibesky_session',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  }
}
