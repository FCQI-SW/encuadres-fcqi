import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

export type RolOperacion = "profesor" | "alumno";

export type PermisoOperacion = {
  puede_ver: boolean;
  dentro_ventana_global: boolean;
  tiene_permiso_especial: boolean;
  solo_lectura: boolean;
  puede_editar_encuadre: boolean;
  puede_gestionar_alumnos: boolean;
  puede_firmar: boolean;
  puede_registrar_avances: boolean;
  motivo: string;
};

export const permisoDefault: PermisoOperacion = {
  puede_ver: true,
  dentro_ventana_global: false,
  tiene_permiso_especial: false,
  solo_lectura: false,
  puede_editar_encuadre: false,
  puede_gestionar_alumnos: false,
  puede_firmar: false,
  puede_registrar_avances: false,
  motivo: "",
};

type ResolverPermisoParams = {
  encuadreId: string;
  userId: string;
  rol: RolOperacion;
};

export async function resolverPermisoOperacion({
  encuadreId,
  userId,
  rol,
}: ResolverPermisoParams): Promise<PermisoOperacion> {
  if (!userId || !encuadreId) {
    return {
      ...permisoDefault,
      puede_ver: false,
      solo_lectura: true,
      motivo: "Sesión o encuadre inválido.",
    };
  }

  try {
    // 1. Obtener encuadre base
    const { data: encuadre, error: errorEncuadre } = await supabase
      .from("encuadres")
      .select("id, usuario_id")
      .eq("id", encuadreId)
      .single();

    if (errorEncuadre || !encuadre) {
      return {
        ...permisoDefault,
        puede_ver: false,
        solo_lectura: true,
        motivo: "No se encontró el encuadre.",
      };
    }

    // 2. Validación por rol
    if (rol === "profesor") {
      if (encuadre.usuario_id !== userId) {
        return {
          ...permisoDefault,
          puede_ver: false,
          solo_lectura: true,
          motivo: "No tienes permiso para ver este encuadre.",
        };
      }
    }

    if (rol === "alumno") {
      const { data: relacionAlumno, error: errorRelacionAlumno } =
        await supabase
          .from("encuadre_alumnos")
          .select("id, estado")
          .eq("encuadre_id", encuadreId)
          .eq("alumno_id", userId)
          .neq("estado", "revocada")
          .limit(1);

      if (errorRelacionAlumno) {
        console.error("Error validando relación alumno-encuadre:", errorRelacionAlumno);
      }

      if ((relacionAlumno?.length ?? 0) === 0) {
        return {
          ...permisoDefault,
          puede_ver: false,
          solo_lectura: true,
          motivo: "No tienes acceso a este encuadre.",
        };
      }
    }

    // 3. Validar ventana global
    // ── FIX: el default es FALSE (ventana cerrada) ───────────────
    // Antes era `true`, lo que hacía que si no había config activa
    // (o fallaba la consulta), el sistema asumía ventana abierta y
    // daba permisos completos ignorando los permisos especiales.
    // Ahora, sin config = ventana cerrada = evaluar permisos especiales.
    let dentroVentanaGlobal = false;

    const { data: config, error: errorConfig } = await supabase
      .from("configuracion_fechas")
      .select("fecha_inicio, fecha_fin, hora_inicio, hora_fin")
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (errorConfig && errorConfig.code !== "PGRST116") {
      console.error("Error obteniendo configuración de fechas:", errorConfig);
    }

    if (config) {
      const ahora = new Date();
      const fechaHoy = format(ahora, "yyyy-MM-dd");
      const horaActual = format(ahora, "HH:mm:ss");

      const dentroFechas =
        fechaHoy >= config.fecha_inicio && fechaHoy <= config.fecha_fin;
      const dentroHorario =
        horaActual >= config.hora_inicio && horaActual <= config.hora_fin;

      dentroVentanaGlobal = dentroFechas && dentroHorario;
    }

    // 4. Si está dentro de la ventana global → permisos completos según rol
    if (dentroVentanaGlobal) {
      return {
        puede_ver: true,
        dentro_ventana_global: true,
        tiene_permiso_especial: false,
        solo_lectura: false,
        puede_editar_encuadre: rol === "profesor",
        puede_gestionar_alumnos: rol === "profesor",
        puede_firmar: rol === "alumno",
        puede_registrar_avances: true,
        motivo: "",
      };
    }

    // 5. Fuera de ventana global → buscar permiso especial con sus flags específicos
    const ahoraIso = new Date().toISOString();

    const { data: permisosEspeciales, error: errorPermisoEspecial } =
      await supabase
        .from("permisos_operacion_encuadre")
        .select(
          "id, motivo, solo_lectura, puede_editar_encuadre, puede_gestionar_alumnos, puede_firmar, puede_registrar_avances"
        )
        .eq("usuario_id", userId)
        .eq("encuadre_id", encuadreId)
        .eq("rol_objetivo", rol)
        .eq("activo", true)
        .lte("acceso_desde", ahoraIso)
        .gte("acceso_hasta", ahoraIso)
        .limit(1);

    if (errorPermisoEspecial && Object.keys(errorPermisoEspecial).length > 0) {
      console.error("Error validando permiso especial:", errorPermisoEspecial);
    }

    const tienePermisoEspecial = (permisosEspeciales?.length ?? 0) > 0;
    const permisoEspecial = permisosEspeciales?.[0];

    // 6. Si hay permiso especial → respetar exactamente sus flags
    if (tienePermisoEspecial && permisoEspecial) {
      const esSoloLectura = permisoEspecial.solo_lectura ?? false;

      return {
        puede_ver: true,
        dentro_ventana_global: false,
        tiene_permiso_especial: true,
        solo_lectura: esSoloLectura,
        puede_editar_encuadre: !esSoloLectura && (permisoEspecial.puede_editar_encuadre ?? false),
        puede_gestionar_alumnos: !esSoloLectura && (permisoEspecial.puede_gestionar_alumnos ?? false),
        puede_firmar: !esSoloLectura && (permisoEspecial.puede_firmar ?? false),
        puede_registrar_avances: !esSoloLectura && (permisoEspecial.puede_registrar_avances ?? false),
        motivo: permisoEspecial.motivo?.trim() || "Permiso especial activo fuera del periodo general.",
      };
    }

    // 7. Sin ventana global ni permiso especial → solo lectura
    const motivoBloqueo =
      rol === "profesor"
        ? "No tienes permiso de operación para editar este encuadre en este momento."
        : "No tienes permiso de operación para realizar acciones en este encuadre en este momento.";

    return {
      puede_ver: true,
      dentro_ventana_global: false,
      tiene_permiso_especial: false,
      solo_lectura: true,
      puede_editar_encuadre: false,
      puede_gestionar_alumnos: false,
      puede_firmar: false,
      puede_registrar_avances: false,
      motivo: motivoBloqueo,
    };

  } catch (err) {
    console.error("Error inesperado resolviendo permiso de operación:", err);

    return {
      ...permisoDefault,
      puede_ver: true,
      solo_lectura: true,
      motivo:
        rol === "profesor"
          ? "No se pudo validar el permiso de operación para editar este encuadre."
          : "No se pudo validar el permiso de operación.",
    };
  }
}