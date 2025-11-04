"use client"

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icône Chat en SVG
const ChatIcon = ({ className }: { className?: string }) => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Icône Dashboard en SVG
const DashboardIcon = ({ className }: { className?: string }) => (
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
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

// Icône History en SVG
const HistoryIcon = ({ className }: { className?: string }) => (
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
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

// Icône Paramètres en SVG
const SettingsIcon = ({ className }: { className?: string }) => (
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
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

interface SidebarProps {
  activeMenu?: "dashboard" | "chat" | "settings";
}

export function Sidebar({ activeMenu = "dashboard" }: SidebarProps) {
  // TODO: Récupérer l'historique depuis l'API/base de données
  const chatHistory = [
    { id: "1", title: "Projet React", date: "Aujourd'hui" },
    { id: "2", title: "Debug API", date: "Hier" },
    { id: "3", title: "Design System", date: "Il y a 2 jours" },
    { id: "4", title: "Optimisation", date: "Il y a 3 jours" },
  ];

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: DashboardIcon,
      href: "/dashboard",
    },
    {
      id: "chat",
      label: "Chat",
      icon: ChatIcon,
      href: "/chat/new",
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: SettingsIcon,
      href: "/parametres",
    },
  ];

  return (
    <aside className="flex w-fit flex-col border-r border-border bg-card">
      <nav className="flex flex-col space-y-4 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;

          return (
            <Link key={item.id} href={item.href}>
              <div className="flex flex-col items-center gap-2 text-[10px]">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="text-base font-medium"
                >
                  <Icon className="h-5 w-5" />
                </Button>
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* History Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex flex-col items-center gap-2 text-[10px] cursor-pointer">
              <Button
                variant="ghost"
                className="text-base font-medium"
              >
                <HistoryIcon className="h-5 w-5" />
              </Button>
              History
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-64">
            <DropdownMenuLabel>Historique des chats</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {chatHistory.length > 0 ? (
              chatHistory.map((chat) => (
                <DropdownMenuItem key={chat.id} asChild>
                  <Link href={`/chat/${chat.id}`} className="flex flex-col items-start">
                    <span className="font-medium">{chat.title}</span>
                    <span className="text-xs text-muted-foreground">{chat.date}</span>
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                Aucun historique
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </aside>
  );
}
