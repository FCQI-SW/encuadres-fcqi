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
  ventanas_activas?: string[];
  permiso_heredado?: boolean;
};

/** Permiso del capturista sobre el PUA de un programa */
export type PermisoPua = {
  puede_ver: boolean;
  dentro_ventana: boolean;
  tiene_permiso_especial: boolean;
  solo_lectura: boolean;
  puede_editar_pua: boolean;
  motivo: string;
  ventanas_activas?: string[];
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
  ventanas_activas: [],
  permiso_heredado: false,
};

export const permisoPuaDefault: PermisoPua = {
  puede_ver: true,
  dentro_ventana: false,
  tiene_permiso_especial: false,
  solo_lectura: true,
  puede_editar_pua: false,
  motivo: "",
  ventanas_activas: [],
};

type VentanaConfig = {
  nombre: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  habilita_encuadre: boolean | null;
  habilita_firma: boolean | null;
  habilita_avances: boolean | null;
  habilita_pua: boolean | null;
};

type VentanasResueltas = {
  abreEncuadre: boolean;
  abreFirma: boolean;
  abreAvances: boolean;
  abrePua: boolean;
  nombres: string[];
};

// ─────────────────────────────────────────────────────────────
// Ventanas activas (compartido por ambos resolvedores)
// ─────────────────────────────────────────────────────────────

async function obtenerVentanasActivas(): Promise<VentanasResueltas> {
  const resultado: VentanasResueltas = {
    abreEncuadre: false,
    abreFirma: false,
    abreAvances: false,
    abrePua: false,
    nombres: [],
  };

  const { data: configs, error } = await supabase
    .from("configuracion_fechas")
    .select(
      "nombre, fecha_inicio, fecha_fin, hora_inicio, hora_fin, habilita_encuadre, habilita_firma, habilita_avances, habilita_pua"
    )
    .eq("activo", true);

  if (error) {
    console.error("Error obteniendo ventanas de operación:", error);
    return resultado;
  }

  const ahora = new Date();
  const fechaHoy = format(ahora, "yyyy-MM-dd");
  const horaActual = format(ahora, "HH:mm:ss");

  (configs || []).forEach((c: VentanaConfig) => {
    const dentroFechas = fechaHoy >= c.fecha_inicio && fechaHoy <= c.fecha_fin;
    const dentroHorario =
      horaActual >= c.hora_inicio && horaActual <= c.hora_fin;

    if (!dentroFechas || !dentroHorario) return;

    resultado.nombres.push(c.nombre || "Ventana de operación");
    if (c.habilita_encuadre) resultado.abreEncuadre = true;
    if (c.habilita_firma) resultado.abreFirma = true;
    if (c.habilita_avances) resultado.abreAvances = true;
    if (c.habilita_pua) resultado.abrePua = true;
  });

  return resultado;
}

// ─────────────────────────────────────────────────────────────
// CAPTURISTA — permiso sobre el PUA de un programa
// ─────────────────────────────────────────────────────────────

type ResolverPermisoPuaParams = {
  programaId: string;
  userId: string;
};

export async function resolverPermisoPua({
  programaId,
  userId,
}: ResolverPermisoPuaParams): Promise<PermisoPua> {
  if (!userId || !programaId) {
    return {
      ...permisoPuaDefault,
      puede_ver: false,
      motivo: "Sesión o programa inválido.",
    };
  }

  try {
    // El programa debe existir
    const { data: programa, error: errorPrograma } = await supabase
      .from("programas")
      .select("id, estado_programa, archivado")
      .eq("id", programaId)
      .single();

    if (errorPrograma || !programa) {
      return {
        ...permisoPuaDefault,
        puede_ver: false,
        motivo: "No se encontró el programa.",
      };
    }

    // Un periodo archivado no se toca, pase lo que pase
    if (programa.archivado) {
      return {
        ...permisoPuaDefault,
        motivo:
          "Este periodo está archivado. Desarchívalo desde Manejo de materias para poder editarlo.",
      };
    }

    const ventanas = await obtenerVentanasActivas();
    const ahoraIso = new Date().toISOString();

    // Permiso especial a nombre de este capturista sobre este programa
    const { data: permisos, error: errorPermiso } = await supabase
      .from("permisos_operacion_encuadre")
      .select("id, motivo, solo_lectura, puede_editar_pua")
      .eq("usuario_id", userId)
      .eq("programa_id", programaId)
      .eq("rol_objetivo", "capturista")
      .eq("activo", true)
      .lte("acceso_desde", ahoraIso)
      .gte("acceso_hasta", ahoraIso)
      .limit(1);

    if (errorPermiso && Object.keys(errorPermiso).length > 0) {
      console.error("Error validando permiso de PUA:", errorPermiso);
    }

    const permiso = permisos?.[0];
    const especialSoloLectura = permiso?.solo_lectura ?? false;

    const porEspecial =
      !!permiso && !especialSoloLectura && (permiso.puede_editar_pua ?? false);

    const puedeEditarPua = ventanas.abrePua || porEspecial;

    let motivo = "";
    if (permiso) {
      motivo =
        permiso.motivo?.trim() || "Permiso especial activo para este PUA.";
    } else if (!puedeEditarPua) {
      motivo =
        ventanas.nombres.length > 0
          ? "La ventana abierta no habilita la captura del PUA."
          : "El periodo de captura del PUA está cerrado. Solicita un permiso especial al administrador.";
    }

    return {
      puede_ver: true,
      dentro_ventana: ventanas.abrePua,
      tiene_permiso_especial: !!permiso,
      solo_lectura: !puedeEditarPua,
      puede_editar_pua: puedeEditarPua,
      motivo,
      ventanas_activas: ventanas.nombres,
    };
  } catch (err) {
    console.error("Error inesperado resolviendo permiso de PUA:", err);
    return {
      ...permisoPuaDefault,
      motivo: "No se pudo validar el permiso de captura.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// PROFESOR / ALUMNO — permiso sobre un encuadre
// ─────────────────────────────────────────────────────────────

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
    // ── 1. Encuadre base ────────────────────────────────────────
    const { data: encuadre, error: errorEncuadre } = await supabase
      .from("encuadres")
      .select("id, usuario_id, estado_encuadre")
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

    const encuadrePublicado = encuadre.estado_encuadre === "publicado";

    // ── 2. Pertenencia por rol ──────────────────────────────────
    if (rol === "profesor" && encuadre.usuario_id !== userId) {
      return {
        ...permisoDefault,
        puede_ver: false,
        solo_lectura: true,
        motivo: "No tienes permiso para ver este encuadre.",
      };
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
        console.error(
          "Error validando relación alumno-encuadre:",
          errorRelacionAlumno
        );
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

    // ── 3. Ventanas activas ────────────────────────────────────
    const ventanas = await obtenerVentanasActivas();
    const hayVentanaAbierta = ventanas.nombres.length > 0;
    const ahoraIso = new Date().toISOString();

    // ── 4. Permiso especial propio ─────────────────────────────
    const { data: permisosPropios, error: errorPermisoPropio } = await supabase
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

    if (errorPermisoPropio && Object.keys(errorPermisoPropio).length > 0) {
      console.error("Error validando permiso especial:", errorPermisoPropio);
    }

    const permisoPropio = permisosPropios?.[0];
    const propioSoloLectura = permisoPropio?.solo_lectura ?? false;

    // ── 5. Herencia desde el permiso del profesor ──────────────
    // Espeja lo que el permiso del profesor abre:
    //   editar encuadre   → el alumno puede firmar
    //   registrar avances → el alumno puede registrar avances
    let heredaFirma = false;
    let heredaAvances = false;
    let motivoHeredado = "";

    if (rol === "alumno" && !permisoPropio) {
      const { data: permisosProfesor, error: errorHeredado } = await supabase
        .from("permisos_operacion_encuadre")
        .select(
          "id, motivo, solo_lectura, puede_editar_encuadre, puede_registrar_avances"
        )
        .eq("encuadre_id", encuadreId)
        .eq("rol_objetivo", "profesor")
        .eq("incluye_alumnos", true)
        .eq("activo", true)
        .lte("acceso_desde", ahoraIso)
        .gte("acceso_hasta", ahoraIso)
        .limit(1);

      if (errorHeredado && Object.keys(errorHeredado).length > 0) {
        console.error("Error validando permiso heredado:", errorHeredado);
      }

      const permisoProfesor = permisosProfesor?.[0];

      if (permisoProfesor && !permisoProfesor.solo_lectura) {
        heredaFirma = permisoProfesor.puede_editar_encuadre ?? false;
        heredaAvances = permisoProfesor.puede_registrar_avances ?? false;

        if (heredaFirma || heredaAvances) {
          motivoHeredado =
            permisoProfesor.motivo?.trim() ||
            "Tu profesor tiene un permiso especial activo para este curso.";
        }
      }
    }

    const heredado = heredaFirma || heredaAvances;

    // ── 6. Combinar ────────────────────────────────────────────
    const esProfesor = rol === "profesor";
    const esAlumno = rol === "alumno";

    const porPropio = (flag?: boolean | null) =>
      !!permisoPropio && !propioSoloLectura && (flag ?? false);

    let puedeEditarEncuadre =
      (ventanas.abreEncuadre && esProfesor) ||
      porPropio(permisoPropio?.puede_editar_encuadre);

    const puedeGestionarAlumnos =
      (ventanas.abreEncuadre && esProfesor) ||
      porPropio(permisoPropio?.puede_gestionar_alumnos);

    const puedeFirmar =
      (ventanas.abreFirma && esAlumno) ||
      porPropio(permisoPropio?.puede_firmar) ||
      (esAlumno && heredaFirma);

    const puedeRegistrarAvances =
      ventanas.abreAvances ||
      porPropio(permisoPropio?.puede_registrar_avances) ||
      (esAlumno && heredaAvances);

    // ── 7. Candado: encuadre publicado no se edita ─────────────
    const desbloqueoExplicito = porPropio(permisoPropio?.puede_editar_encuadre);
    if (encuadrePublicado && !desbloqueoExplicito) {
      puedeEditarEncuadre = false;
    }

    // ── 8. Motivo ──────────────────────────────────────────────
    let motivo = "";

    if (permisoPropio) {
      motivo =
        permisoPropio.motivo?.trim() ||
        "Permiso especial activo para este encuadre.";
    } else if (heredado) {
      motivo = motivoHeredado;
    } else if (encuadrePublicado && ventanas.abreEncuadre && esProfesor) {
      motivo =
        "El encuadre ya fue publicado y no puede modificarse. Solicita un permiso especial al administrador si necesitas corregirlo.";
    } else if (!hayVentanaAbierta) {
      motivo = "No hay ninguna ventana de operación abierta en este momento.";
    } else if (!puedeEditarEncuadre && !puedeFirmar && !puedeRegistrarAvances) {
      motivo =
        "La ventana abierta no habilita acciones para tu rol en este encuadre.";
    }

    const sinNingunPermiso =
      !puedeEditarEncuadre &&
      !puedeGestionarAlumnos &&
      !puedeFirmar &&
      !puedeRegistrarAvances;

    return {
      puede_ver: true,
      dentro_ventana_global: hayVentanaAbierta,
      tiene_permiso_especial: !!permisoPropio || heredado,
      solo_lectura: sinNingunPermiso,
      puede_editar_encuadre: puedeEditarEncuadre,
      puede_gestionar_alumnos: puedeGestionarAlumnos,
      puede_firmar: puedeFirmar,
      puede_registrar_avances: puedeRegistrarAvances,
      motivo,
      ventanas_activas: ventanas.nombres,
      permiso_heredado: heredado,
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