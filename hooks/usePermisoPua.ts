"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  resolverPermisoPua,
  permisoPuaDefault,
  type PermisoPua,
} from "@/lib/permisoOperacion";

export type { PermisoPua };

/**
 * Resuelve si el capturista puede editar el PUA de un programa.
 *
 * Equivalente a usePermisoOperacion, pero para el capturista: ahí
 * la unidad de trabajo es el encuadre, aquí es el programa.
 *
 * Uso:
 *   const { puedeEditar, permiso, loadingPermiso } =
 *     usePermisoPua(programa?.id || "");
 */
export function usePermisoPua(programaId: string) {
  const { data: session, status } = useSession();
  const [permiso, setPermiso] = useState<PermisoPua>(permisoPuaDefault);
  const [loadingPermiso, setLoadingPermiso] = useState(true);

  useEffect(() => {
    // Aún no sabemos quién es: mantener cargando, no asumir nada
    if (status === "loading") return;

    if (!programaId || !session?.user?.id) {
      setPermiso(permisoPuaDefault);
      setLoadingPermiso(false);
      return;
    }

    let cancelado = false;
    setLoadingPermiso(true);

    resolverPermisoPua({ programaId, userId: session.user.id })
      .then((resultado) => {
        if (cancelado) return;
        setPermiso(resultado);
      })
      .catch((err) => {
        console.error("Error resolviendo permiso de PUA:", err);
        if (cancelado) return;
        // Ante la duda, solo lectura
        setPermiso({
          ...permisoPuaDefault,
          motivo: "No se pudo validar el permiso de captura.",
        });
      })
      .finally(() => {
        if (!cancelado) setLoadingPermiso(false);
      });

    return () => {
      cancelado = true;
    };
  }, [programaId, session?.user?.id, status]);

  return {
    permiso,
    puedeEditar: permiso.puede_editar_pua,
    soloLectura: permiso.solo_lectura,
    motivoPermiso: permiso.motivo,
    loadingPermiso,
  };
}