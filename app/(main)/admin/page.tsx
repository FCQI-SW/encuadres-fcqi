"use client";

import { useSession } from "next-auth/react";
import { LogoutButton } from "@/components/logout-button";

export default function AdminPage() {
  const { data: session } = useSession();

  return (
    <div>
      <h1>Seleccione una opción de la barra de navegación.</h1>
    </div>
  );
}
