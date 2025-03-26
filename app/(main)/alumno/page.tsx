"use client";

import { useSession } from "next-auth/react";
import { LogoutButton } from "@/components/logout-button";

export default function AlumnoPage() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Panel de Alumno</h1>

        {session?.user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h2 className="text-xl font-semibold mb-2">
              Información del usuario
            </h2>
            <p>
              <strong>ID:</strong> {session.user.id}
            </p>
            <p>
              <strong>Nombre:</strong> {session.user.name}
            </p>
            <p>
              <strong>Email:</strong> {session.user.email}
            </p>
            <p>
              <strong>Rol:</strong> {session.user.role}
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <LogoutButton variant="default" />
        </div>
      </div>
    </div>
  );
}
