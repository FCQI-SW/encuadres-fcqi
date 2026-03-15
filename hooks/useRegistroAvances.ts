import { useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { resolverPermisoOperacion } from "@/lib/permisoOperacion";

export type Tema = {
  id: number;
  unidad_id: number;
  numero: string;
  nombre: string;
  unidad_numero: number;
  unidad_nombre: string;
};

export type TemaConCheckin = Tema & {
  tema_visto: boolean | null;
  justificacion: string;
  checkin_id: number | null;
};

export type HeaderCurso = {
  asignatura: string;
  clave: string;
  grupo: string;
  seccion: string;
  docente: string;
  competencia: string;
  periodo: string;
};

export function useRegistroAvances(encuadreId: string) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerDatosCompletos = async (): Promise<{
    header: HeaderCurso | null;
    temas: TemaConCheckin[];
  }> => {
    if (!encuadreId || !session?.user?.id) {
      return { header: null, temas: [] };
    }

    setLoading(true);
    setError(null);

    try {
      const { data: encuadre, error: errorEncuadre } = await supabase
        .from("encuadres")
        .select("id, programa_id, grupo, periodo, seccion, usuario_id")
        .eq("id", encuadreId)
        .single();

      if (errorEncuadre || !encuadre) {
        setError("No se pudo cargar el encuadre");
        setLoading(false);
        return { header: null, temas: [] };
      }

      const { data: programa } = await supabase
        .from("programas")
        .select("id, materia_id, competencia")
        .eq("id", encuadre.programa_id)
        .single();

      const { data: materia } = await supabase
        .from("materias")
        .select("clave, nombre_materia")
        .eq("id", programa?.materia_id)
        .single();

      const { data: docente } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("id", encuadre.usuario_id)
        .single();

      const { data: unidades, error: errorUnidades } = await supabase
        .from("unidades")
        .select("id, numero, nombre, competencia")
        .eq("programa_id", encuadre.programa_id)
        .order("numero", { ascending: true });

      if (errorUnidades || !unidades || unidades.length === 0) {
        setLoading(false);
        return {
          header: {
            asignatura: materia?.nombre_materia || "Sin información",
            clave: materia?.clave || "N/A",
            grupo: encuadre.grupo,
            seccion: encuadre.seccion || "",
            docente: docente?.nombre || "Sin asignar",
            competencia: programa?.competencia || "",
            periodo: encuadre.periodo,
          },
          temas: [],
        };
      }

      const unidadIds = unidades.map((u: any) => u.id);
      const { data: temas, error: errorTemas } = await supabase
        .from("temas")
        .select("id, unidad_id, numero, nombre")
        .in("unidad_id", unidadIds)
        .order("numero", { ascending: true });

      if (errorTemas || !temas || temas.length === 0) {
        setLoading(false);
        return {
          header: {
            asignatura: materia?.nombre_materia || "Sin información",
            clave: materia?.clave || "N/A",
            grupo: encuadre.grupo,
            seccion: encuadre.seccion || "",
            docente: docente?.nombre || "Sin asignar",
            competencia: programa?.competencia || "",
            periodo: encuadre.periodo,
          },
          temas: [],
        };
      }

      const temaIds = temas.map((t: any) => t.id);
      const { data: checkins } = await supabase
        .from("temas_checkin")
        .select("id, tema_id, tema_visto, justificacion")
        .eq("usuario_id", session.user.id)
        .eq("grupo", encuadre.grupo)
        .in("tema_id", temaIds);

      const checkinMap = new Map<
        number,
        { id: number; tema_visto: boolean; justificacion: string }
      >();

      (checkins || []).forEach((c: any) => {
        checkinMap.set(c.tema_id, {
          id: c.id,
          tema_visto: c.tema_visto,
          justificacion: c.justificacion || "",
        });
      });

      const unidadMap = new Map<number, { numero: number; nombre: string }>();
      unidades.forEach((u: any) => {
        unidadMap.set(u.id, { numero: u.numero, nombre: u.nombre });
      });

      const temasConCheckin: TemaConCheckin[] = temas.map((t: any) => {
        const checkin = checkinMap.get(t.id);
        const unidad = unidadMap.get(t.unidad_id);
        return {
          id: t.id,
          unidad_id: t.unidad_id,
          numero: t.numero,
          nombre: t.nombre,
          unidad_numero: unidad?.numero || 0,
          unidad_nombre: unidad?.nombre || "",
          tema_visto: checkin?.tema_visto ?? null,
          justificacion: checkin?.justificacion || "",
          checkin_id: checkin?.id || null,
        };
      });

      temasConCheckin.sort((a, b) => {
        if (a.unidad_numero !== b.unidad_numero) {
          return a.unidad_numero - b.unidad_numero;
        }
        return a.numero.localeCompare(b.numero, undefined, { numeric: true });
      });

      const header: HeaderCurso = {
        asignatura: materia?.nombre_materia || "Sin información",
        clave: materia?.clave || "N/A",
        grupo: encuadre.grupo,
        seccion: encuadre.seccion || "",
        docente: docente?.nombre || "Sin asignar",
        competencia: programa?.competencia || "",
        periodo: encuadre.periodo,
      };

      setLoading(false);
      return { header, temas: temasConCheckin };
    } catch (err) {
      console.error("Error en obtenerDatosCompletos:", err);
      setError("Error inesperado al cargar los datos");
      setLoading(false);
      return { header: null, temas: [] };
    }
  };

  const guardarCheckins = async (
    respuestas: Record<number, { vista: boolean | null; justificacion: string }>,
    grupo: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user?.id) {
      return {
        success: false,
        error: "No hay sesión activa. Por favor, inicia sesión nuevamente.",
      };
    }

    if (!grupo || grupo.trim() === "") {
      return { success: false, error: "El grupo no es válido." };
    }

    const permisoOperacion = await resolverPermisoOperacion({
      encuadreId,
      userId: session.user.id,
      rol: "profesor",
    });

    if (
      !permisoOperacion.puede_registrar_avances ||
      permisoOperacion.solo_lectura
    ) {
      return {
        success: false,
        error:
          permisoOperacion.motivo ||
          "No tienes permiso para registrar avances en este momento.",
      };
    }

    const respuestasValidas = Object.entries(respuestas).filter(
      ([_, data]) => data.vista !== null
    );

    if (respuestasValidas.length === 0) {
      return {
        success: false,
        error:
          "No hay cambios para guardar. Marca al menos un tema como visto o no visto.",
      };
    }

    setLoading(true);
    setError(null);

    try {
      const userId = session.user.id;
      let erroresEncontrados = 0;
      let temasGuardados = 0;

      for (const [temaIdStr, data] of Object.entries(respuestas)) {
        const temaId = parseInt(temaIdStr);

        if (data.vista === null) continue;

        if (data.justificacion && data.justificacion.length > 500) {
          return {
            success: false,
            error: `La justificación del tema ${temaId} excede el límite de 500 caracteres.`,
          };
        }

        try {
          const { data: existente, error: errorBuscar } = await supabase
            .from("temas_checkin")
            .select("id")
            .eq("tema_id", temaId)
            .eq("usuario_id", userId)
            .eq("grupo", grupo)
            .maybeSingle();

          if (errorBuscar) {
            console.error("Error al buscar checkin existente:", errorBuscar);
          }

          if (existente) {
            const { error: errorUpdate } = await supabase
              .from("temas_checkin")
              .update({
                tema_visto: data.vista,
                justificacion: data.justificacion || "",
                fecha_checkin: new Date().toISOString(),
              })
              .eq("id", existente.id);

            if (errorUpdate) {
              console.error("Error al actualizar checkin:", errorUpdate);
              erroresEncontrados++;
            } else {
              temasGuardados++;
            }
          } else {
            const { error: errorInsert } = await supabase
              .from("temas_checkin")
              .insert({
                tema_id: temaId,
                usuario_id: userId,
                grupo: grupo,
                encuadre_id: encuadreId,
                tema_visto: data.vista,
                justificacion: data.justificacion || "",
              });

            if (errorInsert) {
              console.error(
                "Error al insertar checkin:",
                JSON.stringify(errorInsert, null, 2)
              );
              erroresEncontrados++;
            } else {
              temasGuardados++;
            }
          }
        } catch (err) {
          console.error("Error procesando tema:", temaId, err);
          erroresEncontrados++;
        }
      }

      setLoading(false);

      if (erroresEncontrados > 0 && temasGuardados === 0) {
        return {
          success: false,
          error:
            "No se pudo guardar ningún registro. Verifica los permisos de acceso.",
        };
      }

      if (erroresEncontrados > 0) {
        return {
          success: true,
          error: `Se guardaron ${temasGuardados} registros, pero hubo ${erroresEncontrados} errores.`,
        };
      }

      return { success: true };
    } catch (err) {
      console.error("Error en guardarCheckins:", err);
      setLoading(false);
      return {
        success: false,
        error: "Error inesperado al guardar los avances. Intenta nuevamente.",
      };
    }
  };

  return {
    obtenerDatosCompletos,
    guardarCheckins,
    loading,
    error,
  };
}