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
  metodo_encuadre: string;
  metodo_estrategia_docente: string;
  metodo_estrategia_alumno: string;
  referencias_basicas: string;
  referencias_complementarias: string;
  perfil_docente: string;
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
  metodoEncuadre: string;
  metodoEstrategiaDocente: string;
  metodoEstrategiaAlumno: string;
  referenciaBasicas: string;
  referenciasComplementarias: string;
  perfilDocente: string;
};

// ── FIX: el hook ahora recibe programaId en lugar de materiaId ──
// Antes usaba materia_id para buscar y guardar, lo que causaba que
// con múltiples periodos se tomara el programa equivocado.
// Ahora trabaja directamente con el id del programa correcto.
export function usePuaForm(programaId: string) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardarPua = async (params: GuardarPuaParams): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      if (!session?.user?.id) {
        setError("No hay usuario autenticado");
        setLoading(false);
        return null;
      }

      const userId = session.user.id;

      const programaData = {
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
        metodo_encuadre: params.metodoEncuadre,
        metodo_estrategia_docente: params.metodoEstrategiaDocente,
        metodo_estrategia_alumno: params.metodoEstrategiaAlumno,
        referencias_basicas: params.referenciaBasicas,
        referencias_complementarias: params.referenciasComplementarias,
        perfil_docente: params.perfilDocente,
        ultimo_editor_id: userId,
        ultima_edicion: new Date().toISOString(),
      };

      if (programaId) {
        // ── FIX: actualizar por programaId directamente ──────────
        // Antes buscaba por materia_id y traía el programa equivocado
        // cuando había varios periodos para la misma materia.
        const { error: errorActualizar } = await supabase
          .from("programas")
          .update(programaData)
          .eq("id", programaId);

        if (errorActualizar) {
          console.error("Error al actualizar programa:", errorActualizar);
          setError("Error al actualizar el PUA");
          setLoading(false);
          return null;
        }

        setLoading(false);
        return programaId;
      } else {
        // Sin programaId no podemos crear — el programa debe existir
        // ya que se crea automáticamente al agregar la materia.
        setError("No se encontró el programa. Contacta al administrador.");
        setLoading(false);
        return null;
      }
    } catch (err) {
      console.error("Error en guardarPua:", err);
      setError("Error inesperado al guardar el PUA");
      setLoading(false);
      return null;
    }
  };

  const cargarPua = async (): Promise<PuaData | null> => {
    if (!programaId) return null;

    try {
      // ── FIX: cargar por id del programa, no por materia_id ──────
      // Antes: .eq("materia_id", materiaId) → traía el primer programa
      //        encontrado sin importar el periodo.
      // Ahora: .eq("id", programaId) → trae exactamente el programa
      //        del periodo que el usuario seleccionó.
      const { data, error } = await supabase
        .from("programas")
        .select("*")
        .eq("id", programaId)
        .maybeSingle();

      if (error) {
        console.error("Error al cargar PUA:", error);
        return null;
      }

      return data as PuaData | null;
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