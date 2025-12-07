import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null }, { headers: corsHeaders })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      }
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null }, { headers: corsHeaders })
  }
}
