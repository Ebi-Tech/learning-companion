// app/api/generate-share-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateShareToken } from '@/lib/share-token'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get the access token from query parameters
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('access_token')
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    // Verify the user using the access token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    // Generate share token
    const shareToken = await generateShareToken(user.id)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://learning-companion-opal.vercel.app/'
    const shareUrl = `${appUrl}/share?token=${shareToken}`

    return NextResponse.json({ 
      shareUrl, 
      expiresIn: '30 days',
      message: 'Share link copied to clipboard! Expires in 30 days.'
    })

  } catch (error: any) {
    console.error('Error generating share token:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}