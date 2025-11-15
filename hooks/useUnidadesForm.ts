"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type UnidadData = {
  numero: number;
  nombre: string;
  competencia: string;
  contenido: string;
  duracion: number;
};

export function useUnidadesForm(programaId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardarUnidades = useCallback(async (unidades: UnidadData[]) => {
    if (!programaId) {
      setError("No hay programa ID");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Eliminar unidades existentes
      await supabase
        .from("unidades")
        .delete()
        .eq("programa_id", programaId);

      // Insertar nuevas unidades
      const unidadesParaGuardar = unidades.map((u) => ({
        programa_id: programaId,
        numero: u.numero,
        nombre: u.nombre,
        competencia: u.competencia,
        contenido: u.contenido,
        duracion: u.duracion,
      }));

      const { error: insertError } = await supabase
        .from("unidades")
        .insert(unidadesParaGuardar);

      if (insertError) throw insertError;

      return true;
    } catch (err: any) {
      console.error("Error al guardar unidades:", err);
      setError(err.message || "Error al guardar");
      return false;
    } finally {
      setLoading(false);
    }
  }, [programaId]);

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