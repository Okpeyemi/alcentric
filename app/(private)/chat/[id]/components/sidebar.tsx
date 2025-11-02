"use client"

import { Button } from "@/components/ui/button";

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
  activeMenu?: "chat" | "settings";
}

export function Sidebar({ activeMenu = "chat" }: SidebarProps) {
  const menuItems = [
    {
      id: "chat",
      label: "Chat",
      icon: ChatIcon,
      onClick: () => {
        // TODO: Navigation vers Chat
        console.log("Navigate to Chat");
      },
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: SettingsIcon,
      onClick: () => {
        // TODO: Navigation vers Paramètres
        console.log("Navigate to Settings");
      },
    },
  ];

  return (
    <aside className="flex w-fit flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <nav className="flex flex-col space-y-4 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;

          return (
            <div key={item.id} className="flex flex-col items-center gap-2 text-[10px]">
                <Button
                    variant={isActive ? "default" : "ghost"}
                    className="text-base font-medium"
                    onClick={item.onClick}
                >
                <Icon className="h-5 w-5" />
                </Button>
              {item.label}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
