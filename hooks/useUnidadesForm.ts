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
  semana_inicio?: number | null;
  semana_fin?: number | null;
};

type TemaExtraido = {
  numero: string;
  nombre: string;
};

type UnidadInsertada = {
  id: string | number;
  numero: number;
};

function extraerTemasDeContenido(contenido: string): TemaExtraido[] {
  if (!contenido || !contenido.trim()) return [];

  const lineas = contenido.split("\n").filter((l) => l.trim());
  const temas: TemaExtraido[] = [];

  lineas.forEach((linea) => {
    const match = linea.trim().match(/^(\d+(?:\.\d+)+)\s+(.+)$/);
    if (!match) return;

    const numeracion = match[1];
    const texto = match[2];
    const niveles = numeracion.split(".").filter((n) => n).length;

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

  const guardarUnidades = useCallback(
    async (unidades: UnidadData[]) => {
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

        const { data: unidadesExistentes, error: unidadesExistentesError } =
          await supabase
            .from("unidades")
            .select("id")
            .eq("programa_id", programaId);

        if (unidadesExistentesError) throw unidadesExistentesError;

        if (unidadesExistentes && unidadesExistentes.length > 0) {
          const unidadIds = unidadesExistentes.map((u: any) => u.id);

          const { error: deleteTemasError } = await supabase
            .from("temas")
            .delete()
            .in("unidad_id", unidadIds);

          if (deleteTemasError) throw deleteTemasError;
        }

        const { error: deleteUnidadesError } = await supabase
          .from("unidades")
          .delete()
          .eq("programa_id", programaId);

        if (deleteUnidadesError) throw deleteUnidadesError;

        const unidadesParaGuardar = unidades.map((u) => ({
          programa_id: programaId,
          numero: u.numero,
          nombre: u.nombre,
          competencia: u.competencia,
          contenido: u.contenido,
          duracion: u.duracion,
          semana_inicio: u.semana_inicio ?? null,
          semana_fin: u.semana_fin ?? null,
        }));

        const { data: unidadesInsertadas, error: insertError } = await supabase
          .from("unidades")
          .insert(unidadesParaGuardar)
          .select("id, numero");

        if (insertError) throw insertError;

        if (unidadesInsertadas) {
          const temasParaGuardar: {
            unidad_id: string | number;
            numero: string;
            nombre: string;
          }[] = [];

          (unidadesInsertadas as UnidadInsertada[]).forEach(
            (unidadInsertada) => {
              const unidadOriginal = unidades.find(
                (u) => u.numero === unidadInsertada.numero
              );

              if (unidadOriginal?.contenido) {
                const temasExtraidos = extraerTemasDeContenido(
                  unidadOriginal.contenido
                );

                temasExtraidos.forEach((tema) => {
                  temasParaGuardar.push({
                    unidad_id: unidadInsertada.id,
                    numero: tema.numero,
                    nombre: tema.nombre,
                  });
                });
              }
            }
          );

          if (temasParaGuardar.length > 0) {
            const { error: temasError } = await supabase
              .from("temas")
              .insert(temasParaGuardar);

            if (temasError) {
              console.error("Error al guardar temas:", temasError);
            }
          }
        }

        const { error: auditoriaError } = await supabase
          .from("programas")
          .update({
            ultimo_editor_id: userId,
            ultima_edicion: new Date().toISOString(),
          })
          .eq("id", programaId);

        if (auditoriaError) throw auditoriaError;

        return true;
      } catch (err: any) {
        console.error("Error al guardar unidades:", err);
        setError(err.message || "Error al guardar");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [programaId, session?.user?.id]
  );

  const cargarUnidades = useCallback(async () => {
    if (!programaId) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("unidades")
        .select(
          "numero, nombre, competencia, contenido, duracion, semana_inicio, semana_fin"
        )
        .eq("programa_id", programaId)
        .order("numero", { ascending: true });

      if (error) throw error;

      return (data || []) as UnidadData[];
    } catch (err: any) {
      console.error("Error al cargar unidades:", err);
      setError(err.message || "Error al cargar unidades");
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