// hooks/useUnidadesForm.ts
"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

type UnidadData = {
  numero: number;
  nombre: string;
  competencia: string;
  contenido: string;
  duracion: number;
};

// Función para extraer temas del contenido
function extraerTemasDeContenido(contenido: string, numeroUnidad: number): { numero: string; nombre: string }[] {
  if (!contenido || !contenido.trim()) return [];

  const lineas = contenido.split("\n").filter((l) => l.trim());
  const temas: { numero: string; nombre: string }[] = [];

  lineas.forEach((linea) => {
    const match = linea.trim().match(/^(\d+(?:\.\d+)+)\s+(.+)$/);
    if (!match) return;

    const numeracion = match[1];
    const texto = match[2];
    const niveles = numeracion.split(".").filter((n) => n).length;

    // Solo guardamos temas de primer nivel (1.1, 1.2, etc.) y subtemas (1.1.1, 1.1.2)
    // Los incisos (1.1.1.1) no los guardamos como temas separados
    if (niveles === 2 || niveles === 3) {
      temas.push({
        numero: numeracion,
        nombre: texto,
      });
    }
  });

  return temas;
}

export function useUnidadesForm(programaId: string) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardarUnidades = useCallback(async (unidades: UnidadData[]) => {
    if (!programaId) {
      setError("No hay programa ID");
      return false;
    }

    if (!session?.user?.id) {
      setError("No hay usuario autenticado");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = session.user.id;

      // 1. Obtener IDs de unidades existentes para eliminar sus temas
      const { data: unidadesExistentes } = await supabase
        .from("unidades")
        .select("id")
        .eq("programa_id", programaId);

      // 2. Eliminar temas de las unidades existentes
      if (unidadesExistentes && unidadesExistentes.length > 0) {
        const unidadIds = unidadesExistentes.map((u) => u.id);
        await supabase
          .from("temas")
          .delete()
          .in("unidad_id", unidadIds);
      }

      // 3. Eliminar unidades existentes
      await supabase
        .from("unidades")
        .delete()
        .eq("programa_id", programaId);

      // 4. Insertar nuevas unidades
      const unidadesParaGuardar = unidades.map((u) => ({
        programa_id: programaId,
        numero: u.numero,
        nombre: u.nombre,
        competencia: u.competencia,
        contenido: u.contenido,
        duracion: u.duracion,
      }));

      const { data: unidadesInsertadas, error: insertError } = await supabase
        .from("unidades")
        .insert(unidadesParaGuardar)
        .select("id, numero");

      if (insertError) throw insertError;

      // 5. Extraer y guardar temas de cada unidad
      if (unidadesInsertadas) {
        const temasParaGuardar: { unidad_id: number; numero: string; nombre: string }[] = [];

        unidadesInsertadas.forEach((unidadInsertada) => {
          const unidadOriginal = unidades.find((u) => u.numero === unidadInsertada.numero);
          if (unidadOriginal?.contenido) {
            // Extraer temas del contenido
            const temasExtraidos = extraerTemasDeContenido(
              unidadOriginal.contenido,
              unidadOriginal.numero
            );

            temasExtraidos.forEach((tema) => {
              temasParaGuardar.push({
                unidad_id: unidadInsertada.id,
                numero: tema.numero,
                nombre: tema.nombre,
              });
            });
          }
        });

        if (temasParaGuardar.length > 0) {
          const { error: temasError } = await supabase
            .from("temas")
            .insert(temasParaGuardar);

          if (temasError) {
            console.error("Error al guardar temas:", temasError);
          }
        }
      }

      // 6. Actualizar auditoría en el PUA
      await supabase
        .from("programas")
        .update({
          ultimo_editor_id: userId,
          ultima_edicion: new Date().toISOString(),
        })
        .eq("id", programaId);

      return true;
    } catch (err: any) {
      console.error("Error al guardar unidades:", err);
      setError(err.message || "Error al guardar");
      return false;
    } finally {
      setLoading(false);
    }
  }, [programaId, session?.user?.id]);

  const cargarUnidades = useCallback(async () => {
    if (!programaId) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("unidades")
        .select("*")
        .eq("programa_id", programaId)
        .order("numero", { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (err: any) {
      console.error("Error al cargar unidades:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [programaId]);

  return {
    loading,
    error,
    guardarUnidades,
    cargarUnidades,
  };
}