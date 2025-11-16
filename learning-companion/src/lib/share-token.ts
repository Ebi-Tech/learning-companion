// lib/share-token.ts
import { jwtVerify, SignJWT } from 'jose'

// Use a HARDCODED secret - no environment variables needed for now
const JWT_SECRET_STRING = 'learning_companion_share_secret_2024_secure_key_123'
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING)

export async function generateShareToken(userId: string): Promise<string> {
  try {
    const token = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30 days')
      .setIssuedAt()
      .sign(JWT_SECRET)
    
    return token
  } catch (error) {
    console.error('Error generating share token:', error)
    throw error
  }
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