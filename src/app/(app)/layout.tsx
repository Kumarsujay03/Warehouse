"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { ConfirmProvider } from "@/components/confirm-dialog";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isDesktop={isDesktop} />
        <div
          className="flex flex-1 flex-col transition-[padding] duration-300 ease-in-out"
          style={{ paddingLeft: isDesktop && sidebarOpen ? "224px" : "0px" }}
        >
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
          <main className="flex-1 p-5 md:p-6">{children}</main>
        </div>
        <CommandPalette />
      </div>
    </ConfirmProvider>
  );
}
