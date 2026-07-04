"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Rss,
  FileText,
  Library,
  Cloud,
  Upload,
  Calendar,
  Search,
  Tags,
  BarChart3,
  Settings,
} from "lucide-react";

const commands = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "Posts", href: "/posts", icon: FileText },
  { label: "Library", href: "/library", icon: Library },
  { label: "Cloud", href: "/cloud", icon: Cloud },
  { label: "Import / Export", href: "/import", icon: Upload },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Search", href: "/search", icon: Search },
  { label: "Tags", href: "/tags", icon: Tags },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 px-4">
        <Command className="rounded-lg border bg-popover shadow-2xl">
          <Command.Input
            placeholder="Type a command or search..."
            autoFocus
            className="h-12 w-full border-b bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            <Command.Group heading="Navigation">
              {commands.map((cmd) => (
                <Command.Item
                  key={cmd.href}
                  value={cmd.label}
                  onSelect={() => runCommand(cmd.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <cmd.icon className="h-4 w-4 text-muted-foreground" />
                  {cmd.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
