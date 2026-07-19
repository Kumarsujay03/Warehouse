"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { ConfirmProvider } from "@/components/confirm-dialog";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();

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
      <div className="flex min-h-screen bg-background">
        {/* Ambient background glow */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-violet-500/[0.02] blur-[120px]" />
          <div className="absolute -bottom-[30%] -right-[20%] h-[70%] w-[50%] rounded-full bg-blue-500/[0.02] blur-[120px]" />
        </div>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isDesktop={isDesktop} />
        <div
          className="flex flex-1 flex-col transition-[padding] duration-300 ease-out"
          style={{ paddingLeft: isDesktop && sidebarOpen ? "224px" : "0px" }}
        >
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
          <main key={pathname} className="flex-1 p-5 md:p-6">
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </ConfirmProvider>
  );
}
