"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On desktop, default to expanded
      if (!mobile) setSidebarCollapsed(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function handleToggle() {
    setSidebarCollapsed(!sidebarCollapsed);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggle} />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-200",
          !isMobile && !sidebarCollapsed ? "lg:pl-56" : "",
          !isMobile && sidebarCollapsed ? "lg:pl-[52px]" : ""
        )}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggle}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
