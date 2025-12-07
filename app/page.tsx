import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Chrome } from 'lucide-react'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Bienvenue sur Alcentric
          </CardTitle>
          <CardDescription className="text-center">
            Vous êtes connecté en tant que <strong>{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Chrome className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Extension Chrome</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Installez l&apos;extension Chrome pour utiliser Alcentric sur n&apos;importe quelle page web.
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Ouvrez <code className="bg-background px-1 rounded">chrome://extensions</code></li>
              <li>Activez le &quot;Mode développeur&quot;</li>
              <li>Cliquez sur &quot;Charger l&apos;extension non empaquetée&quot;</li>
              <li>Sélectionnez le dossier <code className="bg-background px-1 rounded">extension</code></li>
            </ol>
          </div>
          
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
