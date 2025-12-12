"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useConfirm } from "@/components/global-confirm-modal";

interface LogoutButtonProps {
  variant?: "sidebar" | "header" | "default";
}

export function LogoutButton({ variant = "default" }: LogoutButtonProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    const confirmed = await confirm({
      title: "Cerrar sesión",
      message: "¿Estás seguro de que deseas cerrar tu sesión?",
      confirmText: "Sí, cerrar sesión",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    setIsLoading(true);

    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#DD971A] hover:bg-[#FEBE10] text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cerrando...</span>
          </>
        ) : (
          <>
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </>
        )}
      </button>
    );
  }

  if (variant === "header") {
    return (
      <Button
        onClick={handleLogout}
        disabled={isLoading}
        variant="ghost"
        size="sm"
        className="text-gray-600 hover:text-gray-800 cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="outline"
      className="cursor-pointer"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Cerrando sesión...
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </>
      )}
    </Button>
  );
}