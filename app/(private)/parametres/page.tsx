"use client"

import { useState } from "react";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ParametresPage() {
  const [userName, setUserName] = useState("John Doe");
  const [userEmail, setUserEmail] = useState("john.doe@example.com");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-20b:free");

  const handleSave = () => {
    // TODO: Implémenter la sauvegarde des paramètres
    console.log("Saving settings:", { userName, userEmail, selectedModel });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header 
        title="Paramètres"
        showCommitButton={false}
        userName={userName}
        userAvatar="https://github.com/shadcn.png"
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeMenu="settings" />
        
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-8 dark:bg-background">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Informations utilisateur */}
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Gérez vos informations de profil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="votre.email@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuration du modèle */}
            <Card>
              <CardHeader>
                <CardTitle>Modèle de chat</CardTitle>
                <CardDescription>
                  Choisissez le modèle d'IA pour vos conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Modèle</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Sélectionner un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai/gpt-oss-20b:free">
                        GPT OSS 20B (Gratuit)
                      </SelectItem>
                      <SelectItem value="meta-llama/llama-3.2-3b-instruct:free">
                        Llama 3.2 3B (Gratuit)
                      </SelectItem>
                      <SelectItem value="meta-llama/llama-3.2-1b-instruct:free">
                        Llama 3.2 1B (Gratuit)
                      </SelectItem>
                      <SelectItem value="google/gemma-2-9b-it:free">
                        Gemma 2 9B (Gratuit)
                      </SelectItem>
                      <SelectItem value="mistralai/mistral-7b-instruct:free">
                        Mistral 7B (Gratuit)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Le modèle sélectionné sera utilisé pour toutes vos conversations
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bouton de sauvegarde */}
            <div className="flex justify-end">
              <Button onClick={handleSave} size="lg">
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
