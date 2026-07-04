"use client";

import { useState, useEffect } from "react";
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
  GripVertical,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const defaultNavItems = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "feed", href: "/feed", label: "Feed", icon: Rss },
  { id: "posts", href: "/posts", label: "Posts", icon: FileText },
  { id: "library", href: "/library", label: "Library", icon: Library },
  { id: "cloud", href: "/cloud", label: "Cloud", icon: Cloud },
  { id: "import", href: "/import", label: "Import / Export", icon: Upload },
  { id: "calendar", href: "/calendar", label: "Calendar", icon: Calendar },
  { id: "search", href: "/search", label: "Search", icon: Search },
  { id: "tags", href: "/tags", label: "Tags", icon: Tags },
  { id: "analytics", href: "/analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

export function Sidebar({ open, onClose, isDesktop }: SidebarProps) {
  const pathname = usePathname();
  const [navItems, setNavItems] = useState(defaultNavItems);
  const [reordering, setReordering] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Load saved order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_order");
      if (saved) {
        const order: string[] = JSON.parse(saved);
        const reordered = order
          .map((id) => defaultNavItems.find((item) => item.id === id))
          .filter(Boolean) as typeof defaultNavItems;
        // Add any new items that weren't in saved order
        const remaining = defaultNavItems.filter((item) => !order.includes(item.id));
        setNavItems([...reordered, ...remaining]);
      }
    } catch {}
  }, []);

  function saveOrder(items: typeof defaultNavItems) {
    setNavItems(items);
    localStorage.setItem("sidebar_order", JSON.stringify(items.map((i) => i.id)));
  }

  function moveItem(from: number, to: number) {
    if (from === to) return;
    const items = [...navItems];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    saveOrder(items);
  }

  if (!open) return null;

  return (
    <>
      {!isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-black/60 animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r bg-card shadow-2xl animate-in slide-in-from-left duration-200 sm:w-56">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
            <div className="flex items-center gap-1">
              {reordering ? (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setReordering(false)} title="Done reordering">
                  <Check className="h-4 w-4 text-green-400" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-8 w-8 hidden sm:flex" onClick={() => setReordering(true)} title="Reorder menu">
                  <GripVertical className="h-4 w-4" />
                </Button>
              )}
              {!isDesktop && (
                <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && item.href !== "/feed" && pathname.startsWith(item.href + "/"));

              if (reordering) {
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={() => { if (dragIdx !== null) moveItem(dragIdx, idx); setDragIdx(null); }}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium cursor-grab transition-colors",
                      dragIdx === idx ? "bg-accent/60 opacity-50" : "hover:bg-accent/30",
                      "text-muted-foreground"
                    )}
                  >
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={true}
                  onClick={() => { if (!isDesktop) onClose(); }}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
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

          {/* Reorder hint */}
          {reordering && (
            <div className="border-t px-4 py-2">
              <p className="text-[10px] text-muted-foreground text-center">Drag items to reorder</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
