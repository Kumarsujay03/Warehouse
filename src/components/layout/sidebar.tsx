"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Rss,
  Library,
  Cloud,
  Upload,
  Calendar,
  Search,
  Tags,
  BarChart3,
  Settings,
  PanelLeftClose,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/library", label: "Library", icon: Library },
  { href: "/cloud", label: "Cloud", icon: Cloud },
  { href: "/import", label: "Import / Export", icon: Upload },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/search", label: "Search", icon: Search },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  if (collapsed) return null;

  return (
    <>
      {/* Overlay backdrop on mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        onClick={onToggle}
      />

      {/* Sidebar panel */}
      <aside className="fixed left-0 top-0 z-50 h-screen w-56 border-r bg-card lg:z-40">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Link href="/dashboard" onClick={onToggle}>
              <Logo size="sm" />
            </Link>
            <button
              onClick={onToggle}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:block"
            >
              <PanelLeftClose className="hidden h-4 w-4 lg:block" />
              <X className="h-4 w-4 lg:hidden" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && item.href !== "/feed" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
