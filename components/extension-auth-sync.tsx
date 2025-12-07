'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notifyExtension } from '@/lib/extension-notify'

export function ExtensionAuthSync() {
  useEffect(() => {
    const supabase = createClient()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        notifyExtension(true)
      } else if (event === 'SIGNED_OUT') {
        notifyExtension(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return null
}
