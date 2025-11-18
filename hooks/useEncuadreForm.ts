import { useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

type EncuadreData = {
  usuario_id: string;
  grupo: string;
  periodo: string;
  descripcion_evaluacion: string;
  derecho_ordinario: string;
  derecho_extraordinario: string;
  descripcion_producto: string;
  bibliografia_basica: string;
  normas_conducta: string;
  profesor_puede_modificar_criterios: boolean;
  criterios?: Array<{
    id?: string;
    criterio: string;
    valor: number;
    descripcion: string;
  }>;
};

type GuardarEncuadreParams = {
  programaId: string;
  usuarioId: string;
  periodo: string;
  grupo: string;
  descripcionEvaluacion: string;
  derechoOrdinario: string;
  derechoExtraordinario: string;
  descripcionProducto: string;
  bibliografiaBasica: string;
  normasConducta: string;
  profesorPuedeModificarCriterios: boolean;
  criterios: Array<{
    id?: string;
    criterio: string;
    valor: number;
    descripcion: string;
  }>;
};

export function useEncuadreForm(programaId: string) {
  const { data: session } = useSession(); // ← IGUAL QUE PUA
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardarEncuadre = async (params: GuardarEncuadreParams): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Obtener usuario de NextAuth (igual que PUA)
      if (!session?.user?.id) {
        setError("No hay usuario autenticado");
        setLoading(false);
        return false;
      }

      const userId = session.user.id;

      // Verificar si ya existe un encuadre para este programa
      const { data: encuadreExistente } = await supabase
        .from("encuadres")
        .select("id")
        .eq("programa_id", params.programaId)
        .single();

      let encuadreId: string;

      const encuadreData = {
        usuario_id: params.usuarioId, // Profesor seleccionado
        grupo: params.grupo,
        periodo: params.periodo,
        descripcion_evaluacion: params.descripcionEvaluacion,
        derecho_ordinario: params.derechoOrdinario,
        derecho_extraordinario: params.derechoExtraordinario,
        descripcion_producto: params.descripcionProducto,
        bibliografia_basica: params.bibliografiaBasica,
        normas_conducta: params.normasConducta,
        profesor_puede_modificar_criterios: params.profesorPuedeModificarCriterios,
        ultimo_editor_id: userId, // Capturista de NextAuth
        ultima_edicion: new Date().toISOString(),
      };

      if (encuadreExistente) {
        // Actualizar encuadre existente
        const { error: errorActualizar } = await supabase
          .from("encuadres")
          .update(encuadreData)
          .eq("id", encuadreExistente.id);

        if (errorActualizar) {
          console.error("Error al actualizar encuadre:", errorActualizar);
          setError("Error al actualizar el encuadre");
          setLoading(false);
          return false;
        }

        encuadreId = encuadreExistente.id;

        // Eliminar criterios antiguos
        await supabase
          .from("criterios_evaluacion")
          .delete()
          .eq("encuadre_id", encuadreId);
      } else {
        // Crear nuevo encuadre
        const { data: nuevoEncuadre, error: errorCrear } = await supabase
          .from("encuadres")
          .insert({
            ...encuadreData,
            programa_id: params.programaId,
          })
          .select("id")
          .single();

        if (errorCrear || !nuevoEncuadre) {
          console.error("Error al crear encuadre:", errorCrear);
          setError("Error al crear el encuadre");
          setLoading(false);
          return false;
        }

        encuadreId = nuevoEncuadre.id;
      }

      // Insertar criterios de evaluación
      if (params.criterios.length > 0) {
        const criteriosParaInsertar = params.criterios.map((c) => ({
          encuadre_id: encuadreId,
          criterio: c.criterio,
          valor: c.valor,
          descripcion: c.descripcion,
        }));

        const { error: errorCriterios } = await supabase
          .from("criterios_evaluacion")
          .insert(criteriosParaInsertar);

        if (errorCriterios) {
          console.error("Error al guardar criterios:", errorCriterios);
          setError("Error al guardar los criterios de evaluación");
          setLoading(false);
          return false;
        }
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error en guardarEncuadre:", err);
      setError("Error inesperado al guardar el encuadre");
      setLoading(false);
      return false;
    }
  };

  const cargarEncuadre = async (): Promise<EncuadreData | null> => {
    if (!programaId) return null;

    try {
      const { data: encuadre, error: errorEncuadre } = await supabase
        .from("encuadres")
        .select("*")
        .eq("programa_id", programaId)
        .single();

      if (errorEncuadre) {
        if (errorEncuadre.code === "PGRST116") {
          return null;
        }
        console.error("Error al cargar encuadre:", errorEncuadre);
        return null;
      }

      // Cargar criterios de evaluación
      const { data: criterios, error: errorCriterios } = await supabase
        .from("criterios_evaluacion")
        .select("id, criterio, valor, descripcion")
        .eq("encuadre_id", encuadre.id)
        .order("id", { ascending: true });

      if (errorCriterios) {
        console.error("Error al cargar criterios:", errorCriterios);
      }

      return {
        usuario_id: encuadre.usuario_id,
        grupo: encuadre.grupo,
        periodo: encuadre.periodo,
        descripcion_evaluacion: encuadre.descripcion_evaluacion || "",
        derecho_ordinario: encuadre.derecho_ordinario || "",
        derecho_extraordinario: encuadre.derecho_extraordinario || "",
        descripcion_producto: encuadre.descripcion_producto || "",
        bibliografia_basica: encuadre.bibliografia_basica || "",
        normas_conducta: encuadre.normas_conducta || "",
        profesor_puede_modificar_criterios: encuadre.profesor_puede_modificar_criterios ?? true,
        criterios: criterios || [],
      };
    } catch (err) {
      console.error("Error en cargarEncuadre:", err);
      return null;
    }
  };

  return {
    guardarEncuadre,
    cargarEncuadre,
    loading,
    error,
  };
}