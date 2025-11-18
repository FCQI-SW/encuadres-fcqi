import { useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

type PuaData = {
  unidad_academica: string;
  programa_educativo: string;
  plan_estudios: string;
  hc: number;
  hl: number;
  ht: number;
  hpc: number;
  hcl: number;
  he: number;
  cr: number;
  etapa_formacion: string;
  caracter_ua: string;
  requisitos: string;
  proposito: string;
  competencia: string;
  evidencias: string;
  unidades: number;
};

type GuardarPuaParams = {
  materiaId: string;
  unidadAcademica: string;
  programaEducativo: string;
  planEstudios: string;
  hc: number;
  hl: number;
  ht: number;
  hpc: number;
  hcl: number;
  he: number;
  cr: number;
  etapaFormacion: string;
  caracterUA: string;
  requisitos: string;
  propositoUA: string;
  competenciaUA: string;
  evidencias: string;
  numUnidades: number;
};

export function usePuaForm(materiaId: string) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardarPua = async (params: GuardarPuaParams): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // Obtener usuario de NextAuth
      if (!session?.user?.id) {
        setError("No hay usuario autenticado");
        setLoading(false);
        return null;
      }

      const userId = session.user.id;

      // Verificar si ya existe un programa para esta materia
      const { data: programaExistente, error: errorBuscar } = await supabase
        .from("programas")
        .select("id")
        .eq("materia_id", params.materiaId)
        .single();

      let programaId: string;

      if (programaExistente) {
        // Actualizar programa existente
        const { error: errorActualizar } = await supabase
          .from("programas")
          .update({
            unidad_academica: params.unidadAcademica,
            programa_educativo: params.programaEducativo,
            plan_estudios: params.planEstudios,
            hc: params.hc,
            hl: params.hl,
            ht: params.ht,
            hpc: params.hpc,
            hcl: params.hcl,
            he: params.he,
            cr: params.cr,
            etapa_formacion: params.etapaFormacion,
            caracter_ua: params.caracterUA,
            requisitos: params.requisitos,
            proposito: params.propositoUA,
            competencia: params.competenciaUA,
            evidencias: params.evidencias,
            unidades: params.numUnidades,
            ultimo_editor_id: userId,
            ultima_edicion: new Date().toISOString(),
          })
          .eq("id", programaExistente.id);

        if (errorActualizar) {
          console.error("Error al actualizar programa:", errorActualizar);
          setError("Error al actualizar el PUA");
          setLoading(false);
          return null;
        }

        programaId = programaExistente.id;
      } else {
        // Crear nuevo programa
        const { data: nuevoPrograma, error: errorCrear } = await supabase
          .from("programas")
          .insert({
            materia_id: params.materiaId,
            unidad_academica: params.unidadAcademica,
            programa_educativo: params.programaEducativo,
            plan_estudios: params.planEstudios,
            hc: params.hc,
            hl: params.hl,
            ht: params.ht,
            hpc: params.hpc,
            hcl: params.hcl,
            he: params.he,
            cr: params.cr,
            etapa_formacion: params.etapaFormacion,
            caracter_ua: params.caracterUA,
            requisitos: params.requisitos,
            proposito: params.propositoUA,
            competencia: params.competenciaUA,
            evidencias: params.evidencias,
            unidades: params.numUnidades,
            ultimo_editor_id: userId,
            ultima_edicion: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (errorCrear || !nuevoPrograma) {
          console.error("Error al crear programa:", errorCrear);
          setError("Error al crear el PUA");
          setLoading(false);
          return null;
        }

        programaId = nuevoPrograma.id;
      }

      setLoading(false);
      return programaId;
    } catch (err) {
      console.error("Error en guardarPua:", err);
      setError("Error inesperado al guardar el PUA");
      setLoading(false);
      return null;
    }
  };

  const cargarPua = async (): Promise<PuaData | null> => {
    if (!materiaId) return null;

    try {
      const { data, error } = await supabase
        .from("programas")
        .select("*")
        .eq("materia_id", materiaId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        console.error("Error al cargar PUA:", error);
        return null;
      }

      return data as PuaData;
    } catch (err) {
      console.error("Error en cargarPua:", err);
      return null;
    }
  };

  return {
    guardarPua,
    cargarPua,
    loading,
    error,
  };
}