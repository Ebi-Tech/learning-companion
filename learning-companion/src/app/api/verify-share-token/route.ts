// app/api/verify-share-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyShareToken } from '@/lib/share-token'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 })
    }

    const verified = await verifyShareToken(token)
    
    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return NextResponse.json(verified)
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}