"use client"

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Icône GitHub en SVG
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    
    // Simuler une connexion (remplacer par votre logique réelle)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // TODO: Implémenter la logique de connexion GitHub
    console.log("Connexion GitHub");
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <div className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-10 dark:bg-zinc-900">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/alcentric-black.png"
            alt="Alcentric Logo"
            width={200}
            height={60}
            priority
            className="dark:invert"
          />
        </div>

        {/* Texte de bienvenue */}
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bienvenue
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            Connectez-vous avec votre compte GitHub pour continuer
          </p>
        </div>

        {/* Bouton de connexion GitHub */}
        <div className="pt-4">
          <Button
            className="w-full gap-3 text-base font-medium"
            size="lg"
            onClick={handleGitHubLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="h-5 w-5" />
                Connexion en cours...
              </>
            ) : (
              <>
                <GitHubIcon className="h-5 w-5" />
                Se connecter avec GitHub
              </>
            )}
          </Button>
        </div>

        {/* Texte légal optionnel */}
        <p className="pt-4 text-center text-sm text-zinc-500 dark:text-zinc-500">
          En vous connectant, vous acceptez nos conditions d&apos;utilisation
          et notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}
