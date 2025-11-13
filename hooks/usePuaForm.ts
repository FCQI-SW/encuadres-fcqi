"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

type PuaFormData = {
  materiaId: string;
  programaEducativo: string;
  planEstudios: string;
  competenciaGeneral: string;
  propositoUA: string;
  competenciaUA: string;
  evidencias: string;
  numUnidades: number;
};

export function usePuaForm(materiaId: string) {
  const { data: session } = useSession();
  const [programaId, setProgramaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guardar o actualizar el programa (PUA)
  const guardarPua = useCallback(async (data: PuaFormData) => {
    if (!session?.user?.id) {
      setError("No hay sesión activa");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar si ya existe un programa para esta materia
      const { data: existingPrograma } = await supabase
        .from("programas")
        .select("id")
        .eq("materia_id", data.materiaId)
        .single();

      if (existingPrograma) {
        // Actualizar programa existente
        const { error: updateError } = await supabase
          .from("programas")
          .update({
            programa_educativo: data.programaEducativo,
            plan_estudios: data.planEstudios,
            competencia_general: data.competenciaGeneral,
            proposito: data.propositoUA,
            competencia: data.competenciaUA,
            evidencias: data.evidencias,
            unidades: data.numUnidades,
          })
          .eq("id", existingPrograma.id);

        if (updateError) throw updateError;
        
        setProgramaId(existingPrograma.id);
        return existingPrograma.id;
      }

      // Crear nuevo programa
      const { data: newPrograma, error: insertError } = await supabase
        .from("programas")
        .insert({
          materia_id: data.materiaId,
          programa_educativo: data.programaEducativo,
          plan_estudios: data.planEstudios,
          competencia_general: data.competenciaGeneral,
          proposito: data.propositoUA,
          competencia: data.competenciaUA,
          evidencias: data.evidencias,
          unidades: data.numUnidades,
          estado_programa: "borrador",
          creado_por: session.user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setProgramaId(newPrograma.id);
      return newPrograma.id;
    } catch (err: any) {
      console.error("Error al guardar PUA:", err);
      setError(err.message || "Error al guardar");
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Cargar programa existente (si existe)
  const cargarPua = useCallback(async () => {
    if (!materiaId) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("programas")
        .select("*")
        .eq("materia_id", materiaId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // No existe todavía
        throw error;
      }

      setProgramaId(data.id);
      return data;
    } catch (err: any) {
      console.error("Error al cargar PUA:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [materiaId]);

  return {
    programaId,
    loading,
    error,
    guardarPua,
    cargarPua,
  };
}