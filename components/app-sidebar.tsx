// components/app-sidebar.tsx

import { 
    Calendar, 
    BookOpen, 
    Search, 
    Settings, 
    LogOut, 
    Users, 
    FileText 
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

  
  /**
   * Aquí definimos los menús para cada rol.
   * Cada item incluye:
   * - title: el nombre que aparecerá en el menú
   * - url: la ruta a la que dirige el enlace
   * - icon: el ícono que se muestra a la izquierda
   */
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
        url: "/admin/subjects",
        icon: BookOpen,
      },
      {
        title: "Establecer fecha de operación",
        url: "/admin/set-date",
        icon: Calendar,
      },
      {
        title: "Configuración",
        url: "/admin/settings",
        icon: Settings,
      },
    ],
    capturista: [
      {
        title: "Encuadres",
        url: "/capturista/encuadres",
        icon: FileText,
      },
      {
        title: "PUA",
        url: "/capturista/pua",
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
        title: "Mis materias",
        url: "/alumno/subjects",
        icon: BookOpen,
      },
      {
        title: "Mis calificaciones",
        url: "/alumno/grades",
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
    // Recibe el rol a través de props (proveniente de tu Layout).
    role: "admin" | "capturista" | "profesor" | "alumno" | "lector";
  }
  
  export function AppSidebar({ role }: AppSidebarProps) {
    // Obtenemos el arreglo de items correspondiente al rol
    const items = menuItemsByRole[role] || [];
  
    return (
      <Sidebar className="h-screen flex flex-col">
        <SidebarContent className="bg-[#00723F] text-white h-full flex flex-col">
          {/* LOGO + Título */}
          <div className="flex flex-col items-center justify-center p-4 mb-4">
            <div className="w-20 h-20">
              <Image 
                src="/uabc_logo.png" 
                alt="UABC Logo" 
                width={64} 
                height={64}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-white font-medium mt-1">UABC</span>
          </div>
          
          {/* Menús dinámicos según el rol */}
          <SidebarGroup className="flex-grow">
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title} className="py-2">
                    <SidebarMenuButton asChild>
                      <a 
                        href={item.url} 
                        className="flex items-center gap-3 px-4 py-2 text-white hover:bg-[#00723F]/80 transition-colors"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Botón de "Cerrar sesión" */}
          <div className="mt-auto p-4 flex justify-center">
            <a 
              href="/"
              className="flex items-center justify-center gap-2 bg-[#DD971A] hover:bg-[#FEBE10] text-white py-2 px-6 rounded-md transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </a>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }
  