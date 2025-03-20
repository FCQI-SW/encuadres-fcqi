"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar"; 
import { Bell } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<"admin" | "capturista" | "profesor" | "alumno" | "lector" | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    if (storedRole) {
      setRole(storedRole as any);
    } else {
      router.push("/auth"); // Redirige a login si no hay rol
    }
  }, [router]);

  if (!role) {
    return <div>Cargando...</div>; 
  }

  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
            >
              <Bell className="h-5 w-5" />
            </button>
            <span className="font-medium text-gray-800">Usuario</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-white font-semibold">
              {role[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
