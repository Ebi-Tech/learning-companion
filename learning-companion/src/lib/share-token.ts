// lib/share-token.ts
import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.SHARE_TOKEN_SECRET || 'fallback-secret-change-in-production'
)

export async function generateShareToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30 days')
    .setIssuedAt()
    .sign(JWT_SECRET)
  
  return token
}

export async function verifyShareToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as string }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}