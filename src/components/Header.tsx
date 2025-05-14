"use client";
import { Menu } from "@headlessui/react";
import { Cog6ToothIcon, ArrowRightOnRectangleIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function Header({ title, onOpenSidebar }: { title: string, onOpenSidebar?: () => void }) {
  const { user, logout, role } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };
  const cancelLogout = () => setShowLogoutModal(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-gray-800 border-b border-gray-700 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
      {/* Encabezado con hamburguesa, título y engrane (alineado horizontal en móvil) */}
      <div className="flex justify-between items-center w-full gap-2">
        <div className="flex items-center gap-2">
          {onOpenSidebar && (
            <button
              className="sm:hidden text-gray-200"
              onClick={onOpenSidebar}
              aria-label="Abrir menú"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
        </div>

        {/* Correo del usuario (visible solo en escritorio) */}
        <div className="hidden sm:block text-gray-200 text-sm">{user?.email} | {role}</div>

        <Menu as="div" className="relative inline-block text-left ml-auto sm:ml-4">
          <Menu.Button className="flex items-center gap-1 px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 focus:outline-none cursor-pointer transition-colors duration-150">
            <Cog6ToothIcon className="h-5 w-5" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`${
                      active ? 'bg-red-100 text-red-700' : 'text-gray-700'
                    } group flex w-full items-center px-4 py-2 text-sm cursor-pointer hover:bg-red-50 transition-colors`}
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-red-500" />
                    Cerrar sesión
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>

      {/* Modal de confirmación */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-40 px-2">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Cerrar sesión?</h2>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que deseas cerrar sesión?
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
  </header>

  );
} 