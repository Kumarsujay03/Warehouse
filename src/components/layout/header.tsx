"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Menu, Settings, LogOut, User, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/settings/avatar")
      .then((r) => r.json())
      .then((d) => { if (d.avatar_url) setAvatarUrl(d.avatar_url); })
      .catch(() => {})
      .finally(() => setLoadingAvatar(false));

    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((d) => { if (d.display_name) setDisplayName(d.display_name); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const today = formatDate(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      {/* Hamburger - always visible */}
      <button
        onClick={onToggleSidebar}
        className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        title={sidebarCollapsed ? "Open menu" : "Close menu"}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search bar */}
      <button
        className="flex flex-1 items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:max-w-md"
        onClick={() => {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        }}
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Search anything...</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          Ctrl+K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-xs text-muted-foreground lg:block">{today}</span>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted transition-colors hover:ring-2 hover:ring-primary/50">
              {loadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {displayName && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
