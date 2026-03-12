import { useState } from "react";
import { supabase } from "@/lib/supabase";

type CriterioCalificacion = {
  criterio: string;
  valor: number;
  descripcion: string;
};

export type AsignacionProfesorGrupo = {
  profesorId: string;
  grupo: string;
  encuadreId?: string;
};

type GuardarEncuadreParams = {
  programaId: string;
  editorId: string;
  asignaciones: AsignacionProfesorGrupo[];
  periodo: string;
  descripcionEvaluacion: string;
  derechoOrdinario: string;
  derechoExtraordinario: string;
  descripcionProducto: string;
  bibliografiaBasica: string;
  normasConducta: string;
  profesorPuedeModificarCriterios: boolean;
  criterios: CriterioCalificacion[];
};

type EncuadreData = {
  asignaciones: AsignacionProfesorGrupo[];
  descripcion_evaluacion: string;
  derecho_ordinario: string;
  derecho_extraordinario: string;
  descripcion_producto: string;
  bibliografia_basica: string;
  normas_conducta: string;
  profesor_puede_modificar_criterios: boolean;
  criterios: Array<{
    id: string;
    criterio: string;
    valor: number;
    descripcion: string;
  }>;
};

export function useEncuadreForm(programaId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keyAsignacion = (profesorId: string, grupo: string) =>
    `${profesorId}::${grupo.trim().toUpperCase()}`;

  const cargarEncuadre = async (): Promise<EncuadreData | null> => {
    if (!programaId) return null;

    setLoading(true);
    setError(null);

    try {
      const { data: encuadres, error: encuadresError } = await supabase
        .from("encuadres")
        .select(`
          id,
          usuario_id,
          grupo,
          descripcion_evaluacion,
          derecho_ordinario,
          derecho_extraordinario,
          descripcion_producto,
          bibliografia_basica,
          normas_conducta,
          profesor_puede_modificar_criterios
        `)
        .eq("programa_id", programaId)
        .order("id", { ascending: true });

      if (encuadresError) {
        console.error(encuadresError);
        setError("Error al cargar el encuadre.");
        setLoading(false);
        return null;
      }

      if (!encuadres || encuadres.length === 0) {
        setLoading(false);
        return null;
      }

      const base = encuadres[0] as any;

      const { data: criterios, error: criteriosError } = await supabase
        .from("criterios_evaluacion")
        .select("id, criterio, valor, descripcion")
        .eq("encuadre_id", base.id)
        .order("id", { ascending: true });

      if (criteriosError) {
        console.error(criteriosError);
        setError("Error al cargar los criterios de evaluación.");
        setLoading(false);
        return null;
      }

      const response: EncuadreData = {
        asignaciones: encuadres.map((e: any) => ({
          encuadreId: e.id,
          profesorId: e.usuario_id,
          grupo: e.grupo,
        })),
        descripcion_evaluacion: base.descripcion_evaluacion || "",
        derecho_ordinario: base.derecho_ordinario || "",
        derecho_extraordinario: base.derecho_extraordinario || "",
        descripcion_producto: base.descripcion_producto || "",
        bibliografia_basica: base.bibliografia_basica || "",
        normas_conducta: base.normas_conducta || "",
        profesor_puede_modificar_criterios:
          base.profesor_puede_modificar_criterios ?? true,
        criterios: criterios || [],
      };

      setLoading(false);
      return response;
    } catch (err) {
      console.error(err);
      setError("Error inesperado al cargar el encuadre.");
      setLoading(false);
      return null;
    }
  };

  const guardarEncuadre = async (
    params: GuardarEncuadreParams
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const asignacionesLimpias = params.asignaciones.map((a) => ({
        profesorId: a.profesorId.trim(),
        grupo: a.grupo.trim(),
      }));

      const { data: existentes, error: existentesError } = await supabase
        .from("encuadres")
        .select("id, usuario_id, grupo")
        .eq("programa_id", params.programaId);

      if (existentesError) {
        console.error(existentesError);
        setError("Error al verificar encuadres existentes.");
        setLoading(false);
        return false;
      }

      const existentesMap = new Map<string, any>();
      (existentes || []).forEach((e: any) => {
        existentesMap.set(keyAsignacion(e.usuario_id, e.grupo), e);
      });

      const deseadasKeys = new Set(
        asignacionesLimpias.map((a) => keyAsignacion(a.profesorId, a.grupo))
      );

      const sobrantes = (existentes || []).filter(
        (e: any) => !deseadasKeys.has(keyAsignacion(e.usuario_id, e.grupo))
      );

      for (const encuadre of sobrantes) {
        const [{ data: alumnos }, { data: firmas }, { data: checkins }] =
          await Promise.all([
            supabase
              .from("encuadre_alumnos")
              .select("id")
              .eq("encuadre_id", encuadre.id)
              .limit(1),
            supabase
              .from("encuadre_firmas")
              .select("id")
              .eq("encuadre_id", encuadre.id)
              .limit(1),
            supabase
              .from("temas_checkin")
              .select("id")
              .eq("encuadre_id", encuadre.id)
              .limit(1),
          ]);

        const tieneMovimientos =
          (alumnos && alumnos.length > 0) ||
          (firmas && firmas.length > 0) ||
          (checkins && checkins.length > 0);

        if (tieneMovimientos) {
          setError(
            `No se puede eliminar la asignación del grupo "${encuadre.grupo}" porque ya tiene movimientos o alumnos relacionados.`
          );
          setLoading(false);
          return false;
        }
      }

      const encuadreIdsFinales: string[] = [];

      for (const asignacion of asignacionesLimpias) {
        const key = keyAsignacion(asignacion.profesorId, asignacion.grupo);
        const existente = existentesMap.get(key);

        const payloadComun = {
          programa_id: params.programaId,
          usuario_id: asignacion.profesorId,
          periodo: params.periodo,
          grupo: asignacion.grupo,
          descripcion_evaluacion: params.descripcionEvaluacion,
          derecho_ordinario: params.derechoOrdinario,
          derecho_extraordinario: params.derechoExtraordinario,
          descripcion_producto: params.descripcionProducto,
          bibliografia_basica: params.bibliografiaBasica,
          normas_conducta: params.normasConducta,
          profesor_puede_modificar_criterios:
            params.profesorPuedeModificarCriterios,
          ultimo_editor_id: params.editorId,
          ultima_edicion: new Date().toISOString(),
        };

        if (existente) {
          const { error: updateError } = await supabase
            .from("encuadres")
            .update(payloadComun)
            .eq("id", existente.id);

          if (updateError) {
            console.error(updateError);
            setError(
              `Error al actualizar la asignación del grupo "${asignacion.grupo}".`
            );
            setLoading(false);
            return false;
          }

          encuadreIdsFinales.push(existente.id);
        } else {
          const { data: nuevo, error: insertError } = await supabase
            .from("encuadres")
            .insert(payloadComun)
            .select("id")
            .single();

          if (insertError || !nuevo) {
            console.error(insertError);
            setError(
              `Error al crear la asignación del grupo "${asignacion.grupo}".`
            );
            setLoading(false);
            return false;
          }

          encuadreIdsFinales.push(nuevo.id);
        }
      }

      for (const encuadreId of encuadreIdsFinales) {
        const { error: deleteCriteriosError } = await supabase
          .from("criterios_evaluacion")
          .delete()
          .eq("encuadre_id", encuadreId);

        if (deleteCriteriosError) {
          console.error(deleteCriteriosError);
          setError("Error al reemplazar los criterios de evaluación.");
          setLoading(false);
          return false;
        }

        if (params.criterios.length > 0) {
          const criteriosPayload = params.criterios.map((c) => ({
            encuadre_id: encuadreId,
            criterio: c.criterio,
            valor: c.valor,
            descripcion: c.descripcion,
          }));

          const { error: insertCriteriosError } = await supabase
            .from("criterios_evaluacion")
            .insert(criteriosPayload);

          if (insertCriteriosError) {
            console.error(insertCriteriosError);
            setError("Error al guardar los criterios de evaluación.");
            setLoading(false);
            return false;
          }
        }
      }

      for (const encuadre of sobrantes) {
        await supabase
          .from("criterios_evaluacion")
          .delete()
          .eq("encuadre_id", encuadre.id);

        const { error: deleteEncuadreError } = await supabase
          .from("encuadres")
          .delete()
          .eq("id", encuadre.id);

        if (deleteEncuadreError) {
          console.error(deleteEncuadreError);
          setError(
            `Error al eliminar la asignación antigua del grupo "${encuadre.grupo}".`
          );
          setLoading(false);
          return false;
        }
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error(err);
      setError("Error inesperado al guardar el encuadre.");
      setLoading(false);
      return false;
    }
  };

  return {
    guardarEncuadre,
    cargarEncuadre,
    loading,
    error,
  };
}