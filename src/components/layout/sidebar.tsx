"use client";

import { useState, useEffect, useRef } from "react";
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
  const sidebarRef = useRef<HTMLElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open || !isDesktop) return;

    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, isDesktop, onClose]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_order");
      if (saved) {
        const order: string[] = JSON.parse(saved);
        const reordered = order
          .map((id) => defaultNavItems.find((item) => item.id === id))
          .filter(Boolean) as typeof defaultNavItems;
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

  return (
    <>
      {/* Overlay — frosted blur */}
      {!isDesktop && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300 ease-in-out",
            open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
        />
      )}

      {/* Sidebar — glass panel */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 glass-panel transition-transform duration-300 ease-out sm:w-56",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
            <Link href="/dashboard" className="flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]">
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
                <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:bg-white/[0.06] hover:text-foreground">
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                      "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium cursor-grab transition-all duration-200",
                      dragIdx === idx ? "bg-white/[0.08] opacity-50 scale-95" : "hover:bg-white/[0.04]",
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
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/[0.08] text-foreground shadow-sm shadow-white/[0.02]"
                      : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive && "text-primary"
                  )} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Reorder hint */}
          {reordering && (
            <div className="border-t border-white/[0.06] px-4 py-2">
              <p className="text-[10px] text-muted-foreground text-center">Drag items to reorder</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
