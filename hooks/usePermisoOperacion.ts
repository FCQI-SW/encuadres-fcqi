import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  resolverPermisoOperacion,
  permisoDefault,
  type PermisoOperacion,
  type RolOperacion,
} from "@/lib/permisoOperacion";

export type { PermisoOperacion };

export function usePermisoOperacion() {
  const { data: session } = useSession();
  const [loadingPermiso, setLoadingPermiso] = useState(false);

  const validarPermiso = async (
    encuadreId: string,
    rol: RolOperacion
  ): Promise<PermisoOperacion> => {
    if (!session?.user?.id || !encuadreId) {
      return permisoDefault;
    }

    setLoadingPermiso(true);

    try {
      const permiso = await resolverPermisoOperacion({
        encuadreId,
        userId: session.user.id,
        rol,
      });

      return permiso;
    } catch (err) {
      console.error("Error inesperado al validar permiso:", err);
      return permisoDefault;
    } finally {
      setLoadingPermiso(false);
    }
  };

  return {
    validarPermiso,
    loadingPermiso,
  };
}