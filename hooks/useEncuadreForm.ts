"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

type EncuadreFormData = {
  materiaId: string;
  profesorId: string;
  periodo: string;
  grupo: string;
  seccion: string;
  competenciaGeneral: string;
  descripcionEvaluacion: string;
  derechoOrdinario: string;
  derechoExtraordinario: string;
  descripcionProducto: string;
  bibliografiaBasica: string;
  normasConducta: string;
  profesorPuedeModificarCriterios: boolean;
  criteriosCalificacion: Array<{ criterio: string; valor: number; descripcion: string }>;
};

export function useEncuadreForm(materiaId: string) {
  const { data: session } = useSession();
  const [encuadreId, setEncuadreId] = useState<string | null>(null);
  const [programaId, setProgramaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guardar o actualizar el encuadre
  const guardarEncuadre = useCallback(async (data: EncuadreFormData) => {
    if (!session?.user?.id) {
      setError("No hay sesión activa");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Verificar si existe un programa para esta materia
      let currentProgramaId = programaId;
      
      if (!currentProgramaId) {
        const { data: existingPrograma } = await supabase
          .from("programas")
          .select("id")
          .eq("materia_id", data.materiaId)
          .single();

        if (existingPrograma) {
          currentProgramaId = existingPrograma.id;
          setProgramaId(existingPrograma.id);
        } else {
          // Crear programa mínimo si no existe
          const { data: newPrograma, error: programaError } = await supabase
            .from("programas")
            .insert({
              materia_id: data.materiaId,
              unidades: 1,
              proposito: "",
              competencia: "",
              evidencias: "",
              estado_programa: "borrador",
              creado_por: session.user.id,
            })
            .select()
            .single();

          if (programaError) throw programaError;
          
          currentProgramaId = newPrograma.id;
          setProgramaId(newPrograma.id);
        }
      }

      // 2. Verificar si ya existe un encuadre
      if (encuadreId) {
        // Actualizar encuadre existente
        const { error: updateError } = await supabase
          .from("encuadres")
          .update({
            usuario_id: data.profesorId,
            grupo: data.grupo,
            periodo: data.periodo,
            seccion: data.seccion,
            competencia_general: data.competenciaGeneral,
            descripcion_evaluacion: data.descripcionEvaluacion,
            derecho_ordinario: data.derechoOrdinario,
            derecho_extraordinario: data.derechoExtraordinario,
            descripcion_producto: data.descripcionProducto,
            bibliografia_basica: data.bibliografiaBasica,
            normas_conducta: data.normasConducta,
            profesor_puede_modificar_criterios: data.profesorPuedeModificarCriterios,
          })
          .eq("id", encuadreId);

        if (updateError) throw updateError;

        // Actualizar criterios de calificación
        await supabase.from("criterios_evaluacion").delete().eq("encuadre_id", encuadreId);

        if (data.criteriosCalificacion.length > 0) {
          const criteriosToInsert = data.criteriosCalificacion.map((c) => ({
            encuadre_id: encuadreId,
            criterio: c.criterio,
            valor: c.valor,
            descripcion: c.descripcion || null,
          }));

          const { error: criteriosError } = await supabase
            .from("criterios_evaluacion")
            .insert(criteriosToInsert);

          if (criteriosError) throw criteriosError;
        }
        
        return encuadreId;
      }

      // 3. Crear nuevo encuadre
      const { data: nuevoEncuadre, error: insertError } = await supabase
        .from("encuadres")
        .insert({
          programa_id: currentProgramaId,
          usuario_id: data.profesorId,
          grupo: data.grupo,
          periodo: data.periodo,
          seccion: data.seccion,
          competencia_general: data.competenciaGeneral,
          descripcion_evaluacion: data.descripcionEvaluacion,
          derecho_ordinario: data.derechoOrdinario,
          derecho_extraordinario: data.derechoExtraordinario,
          descripcion_producto: data.descripcionProducto,
          bibliografia_basica: data.bibliografiaBasica,
          normas_conducta: data.normasConducta,
          profesor_puede_modificar_criterios: data.profesorPuedeModificarCriterios,
          estado_encuadre: "borrador",
          creado_por: session.user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setEncuadreId(nuevoEncuadre.id);

      // Guardar criterios de calificación
      if (data.criteriosCalificacion.length > 0) {
        const criteriosToInsert = data.criteriosCalificacion.map((c) => ({
          encuadre_id: nuevoEncuadre.id,
          criterio: c.criterio,
          valor: c.valor,
          descripcion: c.descripcion || null,
        }));

        const { error: criteriosError } = await supabase
          .from("criterios_evaluacion")
          .insert(criteriosToInsert);

        if (criteriosError) throw criteriosError;
      }

      return nuevoEncuadre.id;
    } catch (err: any) {
      console.error("Error al guardar encuadre:", err);
      setError(err.message || "Error al guardar");
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, programaId, encuadreId]);

  // Cargar encuadre existente
  const cargarEncuadre = useCallback(async () => {
    if (!materiaId) return null;
    
    setLoading(true);
    try {
      const { data: programa } = await supabase
        .from("programas")
        .select("id")
        .eq("materia_id", materiaId)
        .single();

      if (!programa) return null;
      
      setProgramaId(programa.id);

      const { data: encuadre, error } = await supabase
        .from("encuadres")
        .select("*, criterios_evaluacion(*)")
        .eq("programa_id", programa.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      setEncuadreId(encuadre.id);
      return encuadre;
    } catch (err: any) {
      console.error("Error al cargar encuadre:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [materiaId]);

  return {
    encuadreId,
    loading,
    error,
    guardarEncuadre,
    cargarEncuadre,
  };
}