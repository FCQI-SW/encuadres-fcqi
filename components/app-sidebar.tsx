// app-sidebar.tsx

import {
  Calendar,
  BookOpen,
  Search,
  Settings,
  Users,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Logo from "../public/uabc_logo.png";
import { LogoutButton } from "./logout-button";

// Menús por rol
const menuItemsByRole = {
  admin: [
    {
      title: "Manejo de usuarios",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Revisión de resultados",
      url: "/admin/results",
      icon: Search,
    },
    {
      title: "Manejo de materias",
      url: "/admin/materias",
      icon: BookOpen,
    },
    {
      title: "Establecer fecha de operación",
      url: "/admin/set-date",
      icon: Calendar,
    },
    {
      title: "Anuncios",
      url: "/admin/ads",
      icon: Settings,
    },
  ],
capturista: [
  {
    title: "Materias",
    url: "/capturista/materias",
    icon: BookOpen,
  },
],
  profesor: [
    {
      title: "Sistema de revisión de encuadres",
      url: "/profesor/encuadres",
      icon: BookOpen,
    },
    {
      title: "Registro de avances",
      url: "/profesor/avances",
      icon: Calendar,
    },
  ],
  alumno: [
    {
      title: "Sistema de revisión de encuadres",
      url: "/alumno/encuadres",
      icon: BookOpen,
    },
    {
      title: "Sistema de unidad de aprendizaje",
      url: "/alumno/aprendizaje",
      icon: Search,
    },
  ],
  lector: [
    {
      title: "Ver documentos",
      url: "/lector/docs",
      icon: FileText,
    },
  ],
};

interface AppSidebarProps {
  role: "admin" | "capturista" | "profesor" | "alumno" | "lector";
}

export function AppSidebar({ role }: AppSidebarProps) {
  // Obtenemos el arreglo de items según el rol
  const items = menuItemsByRole[role] || [];

  return (
    <Sidebar className="h-screen flex flex-col">
      {/* Pantone 356 - #00723F para background */}
      <SidebarContent className="bg-[#00723F] text-white h-full flex flex-col">
        {/* Logo UABC - centrado */}
        <div className="flex flex-col items-center justify-center p-4 mb-4">
          <div className="w-20 h-20">
            <Image
              src={Logo || "/placeholder.svg"}
              alt="UABC Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-white font-medium mt-1">UABC</span>
        </div>

        <SidebarGroup className="flex-grow">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="py-2">
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className="flex items-center gap-3 px-4 py-4 text-white hover:bg-[#00723F]/80 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="sidebar-title">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cerrar sesión button - Pantone 131 - #DD971A */}
        <div className="mt-auto p-4">
          {/* Usamos el componente LogoutButton con shadcn/ui */}
          <LogoutButton variant="sidebar" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
