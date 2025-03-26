"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "sidebar";
}

export function LogoutButton({
  className,
  variant = "default",
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setIsLoading(false);
    }
  };

  // Para la variante sidebar
  if (variant === "sidebar") {
    return (
      <Button
        onClick={handleLogout}
        disabled={isLoading}
        className={cn(
          "w-full bg-[#DD971A] hover:bg-[#FEBE10] text-white",
          className
        )}
        size="lg"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {isLoading ? "Cerrando sesión..." : "Cerrar sesión"}
      </Button>
    );
  }

  // Para la variante default, usamos el estilo destructive de shadcn
  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="destructive"
      className={className}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
}
