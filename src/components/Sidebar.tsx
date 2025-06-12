"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ChartBarIcon, 
  HomeIcon, 
  Bars3Icon, 
  XMarkIcon, 
  DocumentTextIcon,
  CreditCardIcon, 
  ArchiveBoxIcon
} from "@heroicons/react/24/outline";

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean, onClose: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    onClose(); // Cierra el sidebar móvil al navegar
  }, [pathname]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
    },
    {
      name: "Operación Mensual",
      href: "/operacion-mensual",
      icon: Bars3Icon,
    },
    {
      name: "Deudas",
      href: "/deudas",
      icon: CreditCardIcon,
    },
    {
      name: "Inventariado",
      href: "/inventario",
      icon: ArchiveBoxIcon,
    },
    {
      name: "Reportes",
      href: "/reportes",
      icon: DocumentTextIcon,
    },
  ];

  return (
    <>
      {/* Sidebar para desktop y móvil */}
      <aside
        className={`bg-gray-800 border-r border-gray-700 min-h-screen flex flex-col transition-all duration-200
          sm:sticky sm:top-0 sm:z-30
          ${collapsed ? "w-16" : "w-56"}
          ${mobileOpen ? "fixed top-0 left-0 w-full h-full z-50 translate-x-0" : "fixed -left-full top-0 w-0 h-full z-50 sm:relative sm:w-auto sm:left-0"}
        `}
        style={{ maxWidth: collapsed ? '4rem' : undefined }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <span className={`text-lg font-bold text-white transition-all duration-200 ${collapsed ? "hidden" : "block"}`}>Tesorería</span>
          <button
            className="text-gray-400 hover:text-white focus:outline-none sm:hidden cursor-pointer"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <button
            className="text-gray-400 hover:text-white focus:outline-none hidden sm:block cursor-pointer"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Colapsar menú"
          >
            {collapsed ? <Bars3Icon className="h-7 w-7" /> : <XMarkIcon className="h-7 w-7" />}
          </button>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 my-1 rounded-md transition-colors text-gray-200 hover:bg-gray-700 hover:text-white ${
                pathname === item.href ? "bg-indigo-600 text-white" : ""
              } ${collapsed ? "justify-center px-0" : ""}`}
              onClick={onClose}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      {/* Fondo oscuro al abrir el menú en móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
} 