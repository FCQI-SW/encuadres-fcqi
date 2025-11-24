import { useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

type EncuadreProfesor = {
  id: string;
  programa_id: string;
  materia_clave: string;
  materia_nombre: string;
  grupo: string;
  periodo: string;
  estado_encuadre: string;
  profesor_puede_modificar_criterios: boolean;
  descripcion_evaluacion: string;
  derecho_ordinario: string;
  derecho_extraordinario: string;
  descripcion_producto: string;
  bibliografia_basica: string;
  normas_conducta: string;
  criterios?: Array<{
    id: string;
    criterio: string;
    valor: number;
    descripcion: string;
  }>;
};

type ActualizarEncuadreParams = {
  encuadreId: string;
  descripcionEvaluacion?: string;
  derechoOrdinario?: string;
  derechoExtraordinario?: string;
  descripcionProducto?: string;
  bibliografiaBasica?: string;
  normasConducta?: string;
  criterios?: Array<{
    criterio: string;
    valor: number;
    descripcion: string;
  }>;
};

export function useEncuadreProfesor() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerMisEncuadres = async (): Promise<EncuadreProfesor[]> => {
    if (!session?.user?.id) {
      console.log("No hay sesión de usuario");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data: encuadres, error: errorEncuadres } = await supabase
        .from("encuadres")
        .select(`
          id,
          programa_id,
          grupo,
          periodo,
          estado_encuadre,
          profesor_puede_modificar_criterios,
          descripcion_evaluacion,
          derecho_ordinario,
          derecho_extraordinario,
          descripcion_producto,
          bibliografia_basica,
          normas_conducta
        `)
        .eq("usuario_id", session.user.id)
        .order("periodo", { ascending: false });

      if (errorEncuadres) {
        console.error("Error al obtener encuadres:", errorEncuadres);
        setError("Error al cargar los encuadres");
        setLoading(false);
        return [];
      }

      if (!encuadres || encuadres.length === 0) {
        setLoading(false);
        return [];
      }

      const programaIds = encuadres.map(e => e.programa_id);
      const { data: programas, error: errorProgramas } = await supabase
        .from("programas")
        .select("id, materia_id")
        .in("id", programaIds);

      if (errorProgramas) {
        console.error("Error al obtener programas:", errorProgramas);
        setError("Error al cargar información de materias");
        setLoading(false);
        return [];
      }

      const materiaIds = (programas || []).map((p: any) => p.materia_id);
      const { data: materias, error: errorMaterias } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia")
        .in("id", materiaIds);

      if (errorMaterias) {
        console.error("Error al obtener materias:", errorMaterias);
        setError("Error al cargar información de materias");
        setLoading(false);
        return [];
      }

      const programaMap = new Map();
      (programas || []).forEach((p: any) => {
        programaMap.set(p.id, p);
      });

      const materiaMap = new Map();
      (materias || []).forEach((m: any) => {
        materiaMap.set(m.id, m);
      });

      const encuadresFormateados: EncuadreProfesor[] = encuadres.map((e: any) => {
        const programa = programaMap.get(e.programa_id);
        const materia = programa ? materiaMap.get(programa.materia_id) : null;

        return {
          id: e.id,
          programa_id: e.programa_id,
          materia_clave: materia?.clave || "N/A",
          materia_nombre: materia?.nombre_materia || "Sin información",
          grupo: e.grupo,
          periodo: e.periodo,
          estado_encuadre: e.estado_encuadre,
          profesor_puede_modificar_criterios: e.profesor_puede_modificar_criterios,
          descripcion_evaluacion: e.descripcion_evaluacion || "",
          derecho_ordinario: e.derecho_ordinario || "",
          derecho_extraordinario: e.derecho_extraordinario || "",
          descripcion_producto: e.descripcion_producto || "",
          bibliografia_basica: e.bibliografia_basica || "",
          normas_conducta: e.normas_conducta || "",
        };
      });

      setLoading(false);
      return encuadresFormateados;
    } catch (err) {
      console.error("Error en obtenerMisEncuadres:", err);
      setError("Error inesperado al cargar encuadres");
      setLoading(false);
      return [];
    }
  };

  const obtenerEncuadre = async (encuadreId: string): Promise<EncuadreProfesor | null> => {
    if (!session?.user?.id) {
      console.error("No hay sesión de usuario");
      setError("No hay sesión activa");
      return null;
    }

    if (!encuadreId || encuadreId === "undefined") {
      console.error("Encuadre ID inválido:", encuadreId);
      setError("ID de encuadre inválido");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("=== INICIO obtenerEncuadre ===");
      console.log("Encuadre ID:", encuadreId);
      console.log("Usuario actual:", session.user.id);

      const { data: encuadreCheck, error: errorCheck } = await supabase
        .from("encuadres")
        .select("id, usuario_id")
        .eq("id", encuadreId);

      console.log("Resultado de verificación:", encuadreCheck);
      console.log("Error de verificación:", errorCheck);

      if (errorCheck) {
        console.error("Error al verificar encuadre:", errorCheck);
        setError("Error al verificar el encuadre: " + (errorCheck.message || "Error desconocido"));
        setLoading(false);
        return null;
      }

      if (!encuadreCheck || encuadreCheck.length === 0) {
        console.error("El encuadre no existe con ID:", encuadreId);
        setError("El encuadre no existe");
        setLoading(false);
        return null;
      }

      const encuadreBasico = encuadreCheck[0];
      if (encuadreBasico.usuario_id !== session.user.id) {
        console.error("Permiso denegado:");
        console.error("  - Usuario del encuadre:", encuadreBasico.usuario_id);
        console.error("  - Usuario de la sesión:", session.user.id);
        setError("No tienes permiso para ver este encuadre");
        setLoading(false);
        return null;
      }

      const { data: encuadre, error: errorEncuadre } = await supabase
        .from("encuadres")
        .select(`
          id,
          programa_id,
          grupo,
          periodo,
          estado_encuadre,
          profesor_puede_modificar_criterios,
          descripcion_evaluacion,
          derecho_ordinario,
          derecho_extraordinario,
          descripcion_producto,
          bibliografia_basica,
          normas_conducta,
          usuario_id
        `)
        .eq("id", encuadreId)
        .single();

      if (errorEncuadre) {
        console.error("Error al obtener datos completos del encuadre:", errorEncuadre);
        setError("Error al cargar datos del encuadre: " + (errorEncuadre.message || "Error desconocido"));
        setLoading(false);
        return null;
      }

      if (!encuadre) {
        console.error("No se obtuvieron datos del encuadre");
        setError("No se pudo cargar el encuadre");
        setLoading(false);
        return null;
      }

      console.log("Encuadre obtenido correctamente:", encuadre);

      console.log("Buscando programa con ID:", encuadre.programa_id);
      const { data: programa, error: errorPrograma } = await supabase
        .from("programas")
        .select("id, materia_id")
        .eq("id", encuadre.programa_id)
        .single();

      if (errorPrograma) {
        console.error("Error al obtener programa:", errorPrograma);
        setError("Error al cargar programa: " + (errorPrograma.message || "Error desconocido"));
        setLoading(false);
        return null;
      }

      if (!programa) {
        console.error("No se encontró el programa");
        setError("No se encontró el programa asociado");
        setLoading(false);
        return null;
      }

      console.log("Programa obtenido:", programa);

      console.log("Buscando materia con ID:", programa.materia_id);
      const { data: materia, error: errorMateria } = await supabase
        .from("materias")
        .select("clave, nombre_materia")
        .eq("id", programa.materia_id)
        .single();

      if (errorMateria) {
        console.error("Error al obtener materia:", errorMateria);
        setError("Error al cargar materia: " + (errorMateria.message || "Error desconocido"));
        setLoading(false);
        return null;
      }

      if (!materia) {
        console.error("No se encontró la materia");
        setError("No se encontró la materia asociada");
        setLoading(false);
        return null;
      }

      console.log("Materia obtenida:", materia);

      console.log("Cargando criterios de evaluación...");
      const { data: criterios, error: errorCriterios } = await supabase
        .from("criterios_evaluacion")
        .select("id, criterio, valor, descripcion")
        .eq("encuadre_id", encuadreId)
        .order("id", { ascending: true });

      if (errorCriterios) {
        console.error("Error al cargar criterios:", errorCriterios);
      } else {
        console.log("Criterios cargados:", criterios?.length || 0);
      }

      const encuadreFormateado: EncuadreProfesor = {
        id: encuadre.id,
        programa_id: encuadre.programa_id,
        materia_clave: materia.clave,
        materia_nombre: materia.nombre_materia,
        grupo: encuadre.grupo,
        periodo: encuadre.periodo,
        estado_encuadre: encuadre.estado_encuadre,
        profesor_puede_modificar_criterios: encuadre.profesor_puede_modificar_criterios,
        descripcion_evaluacion: encuadre.descripcion_evaluacion || "",
        derecho_ordinario: encuadre.derecho_ordinario || "",
        derecho_extraordinario: encuadre.derecho_extraordinario || "",
        descripcion_producto: encuadre.descripcion_producto || "",
        bibliografia_basica: encuadre.bibliografia_basica || "",
        normas_conducta: encuadre.normas_conducta || "",
        criterios: criterios || [],
      };

      console.log("=== Encuadre formateado exitosamente ===");
      setLoading(false);
      return encuadreFormateado;
    } catch (err: any) {
      console.error("=== ERROR CRÍTICO en obtenerEncuadre ===");
      console.error("Tipo de error:", typeof err);
      console.error("Error completo:", err);
      console.error("Error message:", err?.message);
      console.error("Error stack:", err?.stack);
      setError("Error inesperado: " + (err?.message || "Error desconocido"));
      setLoading(false);
      return null;
    }
  };

  const actualizarEncuadre = async (params: ActualizarEncuadreParams): Promise<boolean> => {
    if (!session?.user?.id) {
      setError("No hay usuario autenticado");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = session.user.id;

      const { data: encuadre, error: errorVerificar } = await supabase
        .from("encuadres")
        .select("usuario_id, profesor_puede_modificar_criterios")
        .eq("id", params.encuadreId)
        .single();

      if (errorVerificar || !encuadre) {
        setError("No tienes permiso para editar este encuadre");
        setLoading(false);
        return false;
      }

      if (encuadre.usuario_id !== userId) {
        setError("No tienes permiso para editar este encuadre");
        setLoading(false);
        return false;
      }

      const datosActualizar: any = {
        ultimo_editor_id: userId,
        ultima_edicion: new Date().toISOString(),
      };

      if (params.descripcionEvaluacion !== undefined) {
        datosActualizar.descripcion_evaluacion = params.descripcionEvaluacion;
      }
      if (params.derechoOrdinario !== undefined) {
        datosActualizar.derecho_ordinario = params.derechoOrdinario;
      }
      if (params.derechoExtraordinario !== undefined) {
        datosActualizar.derecho_extraordinario = params.derechoExtraordinario;
      }
      if (params.descripcionProducto !== undefined) {
        datosActualizar.descripcion_producto = params.descripcionProducto;
      }
      if (params.bibliografiaBasica !== undefined) {
        datosActualizar.bibliografia_basica = params.bibliografiaBasica;
      }
      if (params.normasConducta !== undefined) {
        datosActualizar.normas_conducta = params.normasConducta;
      }

      const { error: errorActualizar } = await supabase
        .from("encuadres")
        .update(datosActualizar)
        .eq("id", params.encuadreId);

      if (errorActualizar) {
        console.error("Error al actualizar encuadre:", errorActualizar);
        setError("Error al actualizar el encuadre");
        setLoading(false);
        return false;
      }

      if (encuadre.profesor_puede_modificar_criterios && params.criterios) {
        await supabase
          .from("criterios_evaluacion")
          .delete()
          .eq("encuadre_id", params.encuadreId);

        if (params.criterios.length > 0) {
          const criteriosParaInsertar = params.criterios.map((c) => ({
            encuadre_id: params.encuadreId,
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
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error en actualizarEncuadre:", err);
      setError("Error inesperado al actualizar el encuadre");
      setLoading(false);
      return false;
    }
  };

  return {
    obtenerMisEncuadres,
    obtenerEncuadre,
    actualizarEncuadre,
    loading,
    error,
  };
}