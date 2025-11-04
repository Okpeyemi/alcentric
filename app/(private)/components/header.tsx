"use client"

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

// Icône Commit en SVG
const CommitIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="3" />
    <line x1="3" y1="12" x2="9" y2="12" />
    <line x1="15" y1="12" x2="21" y2="12" />
  </svg>
);

interface HeaderProps {
  title?: string;
  showCommitButton?: boolean;
  userName?: string;
  userAvatar?: string;
}

export function Header({ 
  title, 
  showCommitButton = true,
  userName = "User", 
  userAvatar 
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card p-4">
      {/* Left side: Logo + Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center">
            <Image
                src="/alcentric-icon-default.png"
                alt="alcentric"
                width={36}
                height={36}
                className="dark:invert"
            />
            <h1 className="text-3xl font-semibold text-foreground">alcentric</h1>
        </div>
        {title && (
          <>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-semibold text-foreground">
              {title}
            </h1>
          </>
        )}
      </div>

      {/* Right side: Theme Toggle + Commit Button (optional) + Avatar with Dropdown */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Commit Button */}
        {showCommitButton && (
          <Button
            variant="default"
            size="default"
            className="gap-2"
            onClick={() => {
              // TODO: Implémenter la logique de commit
              console.log("Commit clicked");
            }}
          >
            <CommitIcon className="h-4 w-4" />
            Commit
          </Button>
        )}

        {/* Avatar with Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
              <Avatar>
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 dark:text-red-400">
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
