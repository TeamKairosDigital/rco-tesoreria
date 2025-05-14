"use client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import "../globals.css";
import { useState } from "react";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/operacion-mensual": "Operación Mensual",
  "/reportes": "Reportes",
};

export default function PrivadoLayout({ children }: { children: React.ReactNode }) {
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const pathname = usePathname();
  const title = TITLES[pathname] || "Tesorería";

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={sidebarMobileOpen} onClose={() => setSidebarMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen bg-gray-900 min-w-0">
        <Header title={title} onOpenSidebar={() => setSidebarMobileOpen(true)} />
        {children}
      </div>
    </div>
  );
} 