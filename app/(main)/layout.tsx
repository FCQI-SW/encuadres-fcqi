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
import DynamicHeader from "@/components/dynamic-header";

export default function Layout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
    }
  }, [status, session, router]);

  if (!session) {
    return null;
  }

  const role = session.user.role as
    | "admin"
    | "capturista"
    | "profesor"
    | "alumno"
    | "lector";

  const userName = session.user.name || "Invitado";

  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <SidebarProvider>
      <AppSidebar role={role} />

      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <DynamicHeader />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
            >
              <Bell className="h-5 w-5" />
            </button>
            <span className="font-medium text-gray-800">{userName}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-white font-semibold">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}