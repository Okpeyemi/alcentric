"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [repoUrl, setRepoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setStep(1);
    setRepoUrl("");
    setMessage("");
  };

  const handleNextStep = () => {
    if (step === 1 && repoUrl.trim()) {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleStartChat = async () => {
    if (!repoUrl.trim() || !message.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Créer un nouveau chat avec le repo et le message
      // Pour l'instant, on génère un ID simple
      const chatId = Date.now().toString();
      
      // TODO: Sauvegarder le repo URL et le message initial dans la base de données
      console.log("Repo URL:", repoUrl);
      console.log("Initial message:", message);
      
      // Rediriger vers la page de chat
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header 
        title="Dashboard"
        showCommitButton={false}
        userName="John Doe"
        userAvatar="https://github.com/shadcn.png"
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeMenu="dashboard" />
        
        <main className="flex flex-1 items-center justify-center bg-background p-8">
          <div className="w-full max-w-2xl space-y-8 text-center">
            {/* Titre principal */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Que souhaitez-vous tester aujourd'hui ?
              </h1>
            </div>

            {/* Bouton Démarrer */}
            <Button
              size="lg"
              onClick={handleOpenDialog}
            >
              Démarrer
            </Button>
          </div>
        </main>
      </div>

      {/* Modal avec étapes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Étape 1 : Repository GitHub" : "Étape 2 : Message de démarrage"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 
                ? "Collez le lien de votre repository GitHub" 
                : "Décrivez ce que vous souhaitez faire avec ce repository"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {step === 1 ? (
              // Étape 1 : URL du repo
              <div className="space-y-2">
                <Label htmlFor="repo-url">Lien du repository</Label>
                <Input
                  id="repo-url"
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="h-11"
                  autoFocus
                />
              </div>
            ) : (
              // Étape 2 : Message initial
              <div className="space-y-2">
                <Label htmlFor="message">Message initial</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: Analyse ce code et suggère des améliorations..."
                  className="h-11"
                  autoFocus
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {step === 2 && (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={isLoading}
              >
                Retour
              </Button>
            )}
            
            {step === 1 ? (
              <Button
                onClick={handleNextStep}
                disabled={!repoUrl.trim()}
                className="ml-auto"
              >
                Suivant
              </Button>
            ) : (
              <Button
                onClick={handleStartChat}
                disabled={!message.trim() || isLoading}
                className="ml-auto"
              >
                {isLoading ? "Démarrage..." : "Commencer"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
