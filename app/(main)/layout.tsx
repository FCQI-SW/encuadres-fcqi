// app/layout.tsx (o donde manejes tu layout)
"use client"

import { ReactNode } from "react"

// Importa desde tu biblioteca de componentes (shadcn, etc.)
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"

import { AppSidebar } from "@/components/app-sidebar"

// Si usas lucide-react para los íconos
import { Bell } from "lucide-react"

export default function Layout({ children }: { children: ReactNode }) {
  const role: "admin" | "capturista" | "profesor" | "alumno" | "lector" = "admin"

  return (
    <SidebarProvider>
      {/* Sidebar con tu lógica de rol */}
      <AppSidebar role={role} />

      {/* Contenedor principal: Header (arriba) + contenido */}
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-4">
          {/* Sección izquierda: Trigger + Título */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
           
          </div>

          {/* Sección derecha: notificaciones + nombre de usuario + avatar */}
          <div className="flex items-center gap-4">
            {/* Ícono de notificaciones */}
            <button
              type="button"
              className="relative p-2 text-gray-500 hover:text-gray-700
                         hover:bg-gray-100 focus:outline-none focus:ring-2
                         focus:ring-green-500 rounded-full"
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* Nombre de usuario (provisional) */}
            <span className="font-medium text-gray-800">Jose Gonzalez</span>

            {/* Avatar circular con iniciales */}
            <div className="flex h-9 w-9 items-center justify-center
                            rounded-full bg-gray-700 text-white font-semibold">
              JG
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
