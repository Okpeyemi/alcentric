import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github, Chrome, Terminal } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tighter">Alcentric</div>
          <nav className="flex gap-4 items-center">
            <Link href="https://github.com/Okpeyemi/alcentric" target="_blank" className="text-sm font-medium hover:underline flex items-center gap-2">
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 px-4 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-7xl font-bold tracking-tighter">
              Create faster with <span className="underline decoration-4 decoration-primary">Alcentric</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The ultimate tool to boost your productivity. Install it now and take control of your workflow.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="#installation">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Terminal className="w-4 h-4" />
                Install Project
              </Button>
            </Link>
            <Link href="#extension">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <Chrome className="w-4 h-4" />
                Chrome Extension
              </Button>
            </Link>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="py-24 px-4 bg-muted/30 border-y">
          <div className="container mx-auto max-w-3xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Installation</h2>
              <p className="text-muted-foreground text-lg">Start by cloning the repository from GitHub</p>
            </div>

            <div className="bg-zinc-950 text-zinc-50 p-6 rounded-xl font-mono text-sm shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 text-zinc-400 border-b border-zinc-800 pb-4 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="ml-2 text-xs">bash</div>
              </div>
              <div className="space-y-4 overflow-x-auto">
                <div className="group flex">
                  <span className="text-zinc-500 select-none mr-4">$</span>
                  <span className="text-green-400">git</span> clone https://github.com/Okpeyemi/alcentric.git
                </div>
                <div className="group flex">
                  <span className="text-zinc-500 select-none mr-4">$</span>
                  <span className="text-yellow-400">cd</span> alcentric
                </div>
                <div className="group flex">
                  <span className="text-zinc-500 select-none mr-4">$</span>
                  <span className="text-blue-400">npm</span> install
                </div>
                <div className="group flex">
                  <span className="text-zinc-500 select-none mr-4">$</span>
                  <span className="text-blue-400">npm</span> run dev
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Extension */}
        <section id="extension" className="py-24 px-4">
          <div className="container mx-auto max-w-5xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Chrome Extension</h2>
              <p className="text-muted-foreground text-lg">Load the extension locally for development</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="group relative bg-card p-6 border rounded-xl hover:shadow-lg transition-all">
                <div className="absolute -top-4 left-6 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-bold text-xl mt-2 mb-2">Access</h3>
                <p className="text-muted-foreground text-sm">
                  Open Chrome and go to <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">chrome://extensions</code>
                </p>
              </div>

              <div className="group relative bg-card p-6 border rounded-xl hover:shadow-lg transition-all">
                <div className="absolute -top-4 left-6 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-xl mt-2 mb-2">Enable</h3>
                <p className="text-muted-foreground text-sm">
                  Toggle <strong>&quot;Developer mode&quot;</strong> in the top right corner.
                </p>
              </div>

              <div className="group relative bg-card p-6 border rounded-xl hover:shadow-lg transition-all">
                <div className="absolute -top-4 left-6 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="font-bold text-xl mt-2 mb-2">Load</h3>
                <p className="text-muted-foreground text-sm">
                  Click on the <strong>&quot;Load unpacked&quot;</strong> button.
                </p>
              </div>

              <div className="group relative bg-card p-6 border rounded-xl hover:shadow-lg transition-all">
                <div className="absolute -top-4 left-6 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h3 className="font-bold text-xl mt-2 mb-2">Select</h3>
                <p className="text-muted-foreground text-sm">
                  Select the <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">extension</code> folder at the root of the project.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            Alcentric
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Alcentric. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
