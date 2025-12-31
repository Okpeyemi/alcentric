import { NextResponse, type NextRequest } from 'next/server'

// AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
// Pour réactiver l'auth Supabase, décommenter le code ci-dessous

export async function updateSession(request: NextRequest) {
  // Simplement laisser passer toutes les requêtes sans vérification d'auth
  return NextResponse.next({ request })
  
  /* 
  // === CODE D'AUTHENTIFICATION SUPABASE (DÉSACTIVÉ) ===
  
  import { createServerClient } from '@supabase/ssr'
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api/voice-chat') &&
    !request.nextUrl.pathname.startsWith('/api/voice-chat-simple')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
  */
}
