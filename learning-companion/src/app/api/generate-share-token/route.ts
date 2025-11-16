// app/api/generate-share-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateShareToken } from '@/lib/share-token'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Generate share token request received')
    
    // Get the session from the request
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('access_token')
    
    if (!accessToken) {
      console.error('No access token provided')
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    console.log('Verifying user session...')

    // Verify the user using the access token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
    
    if (error) {
      console.error('Auth error:', error)
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    if (!user) {
      console.error('No user found')
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Generate share token
    const shareToken = await generateShareToken(user.id)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${appUrl}/share?token=${shareToken}`

    console.log('✅ Share token generated for user:', user.id)
    console.log('Share URL:', shareUrl)

    return NextResponse.json({ 
      shareUrl, 
      expiresIn: '30 days',
      message: 'Share link copied to clipboard! Expires in 30 days.'
    })

  } catch (error: any) {
    console.error('❌ Error generating share token:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}