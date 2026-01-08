"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Calendar,
  BookOpen,
  Search,
  Users,
  GraduationCap,
  Megaphone,
  BarChart3,
  Eye,
  Home,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

import Brand from "../public/uabc_logo.png";
import { LogoutButton } from "./logout-button";

const menuItemsByRole = {
  admin: [
    { title: "Inicio", url: "/admin", icon: Home },
    { title: "Manejo de usuarios", url: "/admin/usuarios", icon: Users },
    { title: "Revisión de resultados", url: "/admin/resultados", icon: Search },
    { title: "Manejo de materias", url: "/admin/materias", icon: BookOpen },
    {
      title: "Fecha de operación",
      url: "/admin/configurar-fecha",
      icon: Calendar,
    },
    { title: "Anuncios", url: "/admin/anuncios", icon: Megaphone },
  ],
  capturista: [
    { title: "Inicio", url: "/capturista", icon: Home },
    { title: "Materias", url: "/capturista/materias", icon: BookOpen },
  ],
  profesor: [
    { title: "Inicio", url: "/profesor", icon: Home },
    { title: "Mis Cursos", url: "/profesor/cursos", icon: GraduationCap },
  ],
  alumno: [
    { title: "Inicio", url: "/alumno", icon: Home },
    { title: "Mis Cursos", url: "/alumno/cursos", icon: GraduationCap },
  ],
  lector: [
    { title: "Dashboard", url: "/lector", icon: BarChart3 },
    { title: "Cursos", url: "/lector/cursos", icon: Eye },
  ],
};

interface AppSidebarProps {
  role: "admin" | "capturista" | "profesor" | "alumno" | "lector";
}

export function AppSidebar({ role }: AppSidebarProps) {
  const items = menuItemsByRole[role] || [];
  const pathname = usePathname();

  const isActive = (url: string) => {
    // Caso exacto
    if (pathname === url) return true;
    
    // Si la URL es una subruta (contiene /), verificar que comience exactamente con url + /
    if (pathname.startsWith(url + "/")) {
      return true;
    }
    
    return false;
  };

  // Obtener la ruta más específica activa para comparar
  const getMostSpecificActiveRoute = () => {
    const activeRoutes = items.filter(item => 
      pathname === item.url || pathname.startsWith(item.url + "/")
    );
    
    if (activeRoutes.length === 0) return null;
    
    // Retornar la ruta más larga (más específica)
    return activeRoutes.reduce((prev, current) => 
      current.url.length > prev.url.length ? current : prev
    );
  };

  const mostSpecificRoute = getMostSpecificActiveRoute();

  return (
    <Sidebar className="h-dvh border-r-0">
      {/* HEADER */}
      <SidebarHeader className="bg-[#00723F] text-white border-b border-white/10">
        <div className="px-4 pt-4 pb-4">
          {/* Logo sin fondo */}
          <div className="flex justify-center">
            <Image
              src={Brand}
              alt="UABC"
              priority
              width={90}
              height={90}
              className="h-auto w-[90px] max-w-[90px] object-contain"
            />
          </div>

          {/* Texto Universidad */}
          <div className="mt-3 text-center">
            <div className="text-sm font-semibold leading-tight">
              Universidad Autónoma
            </div>
            <div className="text-sm font-semibold leading-tight">
              de Baja California
            </div>
            <div className="mt-1 text-xs text-white/75">Sistema de Gestión</div>
          </div>
        </div>
      </SidebarHeader>

      {/* MENU */}
      <SidebarContent className="bg-[#00723F] text-white px-3 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const active = mostSpecificRoute?.url === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        aria-current={active ? "page" : undefined}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl
                          transition-all duration-200 ease-out
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                          ${
                            active
                              ? "bg-white text-[#00723F] shadow-md"
                              : "text-white hover:bg-white/15"
                          }
                        `}
                      >
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            active ? "text-[#00723F]" : "text-white"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            active ? "text-[#00723F]" : "text-white"
                          }`}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="bg-[#00723F] text-white border-t border-white/10 p-4">
        <LogoutButton variant="sidebar" />
      </SidebarFooter>
    </Sidebar>
  );
}