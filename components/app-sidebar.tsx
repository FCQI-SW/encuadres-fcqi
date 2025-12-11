import Link from "next/link";
import {
  Calendar,
  BookOpen,
  Search,
  Settings,
  Users,
  FileText,
  GraduationCap,
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

const menuItemsByRole = {
  admin: [
    {
      title: "Manejo de usuarios",
      url: "/admin/usuarios",
      icon: Users,
    },
    {
      title: "Revisión de resultados",
      url: "/admin/resultados",
      icon: Search,
    },
    {
      title: "Manejo de materias",
      url: "/admin/materias",
      icon: BookOpen,
    },
    {
      title: "Establecer fecha de operación",
      url: "/admin/configurar-fecha",
      icon: Calendar,
    },
    {
      title: "Anuncios",
      url: "/admin/anuncios",
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
      title: "Mis Cursos",
      url: "/profesor/cursos",
      icon: GraduationCap,
    },
  ],
  alumno: [
    {
      title: "Mis Cursos",
      url: "/alumno/cursos",
      icon: GraduationCap,
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
  const items = menuItemsByRole[role] || [];

  return (
    <Sidebar className="h-screen flex flex-col">
      <SidebarContent className="bg-[#00723F] text-white h-full flex flex-col">
        {/* Logo UABC */}
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
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 px-4 py-4 text-white hover:bg-[#00723F]/80 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="sidebar-title">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cerrar sesión */}
        <div className="mt-auto p-4">
          <LogoutButton variant="sidebar" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}