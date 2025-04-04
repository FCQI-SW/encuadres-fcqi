"use client";
import { ReactNode, useEffect } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Layout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 1. Redirecciona si no hay sesión
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
    }
  }, [status, session, router]);

  // 2. Mientras carga
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Cargando...
      </div>
    );
  }

  // 3. Si no hay sesión, no mostramos nada (o redirigimos)
  if (!session) {
    return null;
  }

  // 4. Extraer rol y nombre de la sesión
  //    Asegúrate de que tu callback de NextAuth devuelva user.role y user.name
  const role = session.user.role as
    | "admin"
    | "capturista"
    | "profesor"
    | "alumno"
    | "lector";

  const userName = session.user.name || "Invitado";

  // 5. Generar iniciales a partir del nombre
  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <SidebarProvider>
      {/* Sidebar (rol dinámico) */}
      <AppSidebar role={role} />

      <SidebarInset>
        {/* HEADER */}
        <header className="flex h-16 items-center justify-between border-b px-4">
          {/* Sección izquierda: sidebar trigger */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>

          {/* Sección derecha: notificaciones + nombre + avatar */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 text-gray-500 hover:text-gray-700
                         hover:bg-gray-100 focus:outline-none focus:ring-2
                         focus:ring-green-500 rounded-full"
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* Mostrar nombre real del usuario */}
            <span className="font-medium text-gray-800">{userName}</span>

            {/* Avatar con iniciales */}
            <div
              className="flex h-9 w-9 items-center justify-center
                         rounded-full bg-gray-700 text-white font-semibold"
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
