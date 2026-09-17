"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Loader2,
  ShieldCheck,
  Plus,
  Trash2,
  Search,
  CalendarClock,
  UserPlus,
  PenLine,
  Eye,
  BookOpenCheck,
  SlidersHorizontal,
  AlertTriangle,
  Clock,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/global-confirm-modal";

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────

type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol_id: string;
  rol_nombre: string;
};

type EncuadreOption = {
  id: string;
  label: string;
  materia: string;
  grupo: string;
  periodo: string;
  profesor: string;
};

type Permiso = {
  id: string;
  encuadre_id: string;
  usuario_id: string;
  rol_objetivo: "profesor" | "alumno";
  acceso_desde: string;
  acceso_hasta: string;
  solo_lectura: boolean;
  puede_editar_encuadre: boolean;
  puede_gestionar_alumnos: boolean;
  puede_firmar: boolean;
  puede_registrar_avances: boolean;
  incluye_alumnos: boolean;
  activo: boolean;
  motivo: string | null;
};

type RolObjetivo = "profesor" | "alumno";

// ─────────────────────────────────────────────────────────────
// Escenarios
//
// El admin piensa en situaciones, no en banderas booleanas.
// Cada escenario traduce una situación real a la combinación de
// permisos y duración que le corresponde.
// ─────────────────────────────────────────────────────────────

type Escenario = {
  id: string;
  titulo: string;
  descripcion: string;
  icono: React.ElementType;
  rol: RolObjetivo;
  dias: number;
  permisos: {
    solo_lectura: boolean;
    editar_encuadre: boolean;
    gestionar_alumnos: boolean;
    firmar: boolean;
    registrar_avances: boolean;
  };
  incluye_alumnos: boolean;
};

const ESCENARIOS: Escenario[] = [
  {
    id: "materia-tardia",
    titulo: "Materia asignada tarde",
    descripcion:
      "El profesor recibió el curso después del cierre. Podrá llenar el encuadre, invitar alumnos y registrar avances.",
    icono: BookOpenCheck,
    rol: "profesor",
    dias: 15,
    permisos: {
      solo_lectura: false,
      editar_encuadre: true,
      gestionar_alumnos: true,
      registrar_avances: true,
      firmar: false,
    },
    incluye_alumnos: true,
  },
  {
    id: "alumno-tardio",
    titulo: "Alumno se integró tarde",
    descripcion:
      "Un alumno concreto entró al curso fuera de fecha. Podrá firmar de enterado y registrar sus avances.",
    icono: UserPlus,
    rol: "alumno",
    dias: 15,
    permisos: {
      solo_lectura: false,
      editar_encuadre: false,
      gestionar_alumnos: false,
      registrar_avances: true,
      firmar: true,
    },
    incluye_alumnos: false,
  },
  {
    id: "correccion",
    titulo: "Corregir el encuadre",
    descripcion:
      "Reabre solo la edición del encuadre. Si incluyes a los alumnos, podrán firmar de nuevo el encuadre corregido.",
    icono: PenLine,
    rol: "profesor",
    dias: 7,
    permisos: {
      solo_lectura: false,
      editar_encuadre: true,
      gestionar_alumnos: false,
      registrar_avances: false,
      firmar: false,
    },
    incluye_alumnos: false,
  },
  {
    id: "consulta",
    titulo: "Solo consulta",
    descripcion:
      "Da acceso para revisar el curso sin permitir ningún cambio.",
    icono: Eye,
    rol: "profesor",
    dias: 30,
    permisos: {
      solo_lectura: true,
      editar_encuadre: false,
      gestionar_alumnos: false,
      registrar_avances: false,
      firmar: false,
    },
    incluye_alumnos: false,
  },
];

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────

function aInputLocal(fecha: Date): string {
  const offset = fecha.getTimezoneOffset();
  return new Date(fecha.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function diasRestantes(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────

export default function PermisosEspecialesPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [encuadres, setEncuadres] = useState<EncuadreOption[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);

  const [escenarioId, setEscenarioId] = useState("");
  const [rolObjetivo, setRolObjetivo] = useState<RolObjetivo>("profesor");
  const [encuadreId, setEncuadreId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [accesoDesde, setAccesoDesde] = useState("");
  const [accesoHasta, setAccesoHasta] = useState("");
  const [motivo, setMotivo] = useState("");

  const [soloLectura, setSoloLectura] = useState(false);
  const [puedeEditarEncuadre, setPuedeEditarEncuadre] = useState(false);
  const [puedeGestionarAlumnos, setPuedeGestionarAlumnos] = useState(false);
  const [puedeFirmar, setPuedeFirmar] = useState(false);
  const [puedeRegistrarAvances, setPuedeRegistrarAvances] = useState(false);
  const [incluyeAlumnos, setIncluyeAlumnos] = useState(false);

  const [busquedaEncuadre, setBusquedaEncuadre] = useState("");
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);
  const [mostrarVencidos, setMostrarVencidos] = useState(false);

  const normalizarRol = (nombre: string) => nombre.trim().toLowerCase();

  // ── Carga ──────────────────────────────────────────────────
  const cargarTodo = async () => {
    setLoading(true);

    try {
      const [
        { data: rolesData },
        { data: usuariosData },
        { data: encuadresData },
        { data: programasData },
        { data: materiasData },
        { data: permisosData },
      ] = await Promise.all([
        supabase.from("roles").select("id, nombre"),
        supabase.from("usuarios").select("id, nombre, correo, rol_id"),
        supabase
          .from("encuadres")
          .select("id, programa_id, grupo, periodo, usuario_id"),
        supabase.from("programas").select("id, materia_id"),
        supabase.from("materias").select("id, clave, nombre_materia"),
        supabase
          .from("permisos_operacion_encuadre")
          .select("*")
          .eq("activo", true)
          .order("created_at", { ascending: false }),
      ]);

      const rolesMap = new Map<string, string>();
      (rolesData || []).forEach((r: any) => rolesMap.set(r.id, r.nombre));

      const usuariosFormateados: Usuario[] = (usuariosData || []).map(
        (u: any) => ({
          id: u.id,
          nombre: u.nombre,
          correo: u.correo,
          rol_id: u.rol_id,
          rol_nombre: rolesMap.get(u.rol_id) || "",
        })
      );

      const programaMap = new Map<string, any>();
      (programasData || []).forEach((p: any) => programaMap.set(p.id, p));

      const materiaMap = new Map<string, any>();
      (materiasData || []).forEach((m: any) => materiaMap.set(m.id, m));

      const nombrePorId = new Map<string, string>();
      usuariosFormateados.forEach((u) => nombrePorId.set(u.id, u.nombre));

      const encuadresFormateados: EncuadreOption[] = (encuadresData || []).map(
        (e: any) => {
          const programa = programaMap.get(e.programa_id);
          const materia = programa ? materiaMap.get(programa.materia_id) : null;
          const profesor = nombrePorId.get(e.usuario_id) || "Sin profesor";
          const materiaTexto = `${materia?.clave || "N/A"} · ${
            materia?.nombre_materia || "Sin materia"
          }`;

          return {
            id: e.id,
            materia: materiaTexto,
            grupo: e.grupo,
            periodo: e.periodo,
            profesor,
            label: `${materiaTexto} — Grupo ${e.grupo} — ${e.periodo} — ${profesor}`,
          };
        }
      );

      setUsuarios(usuariosFormateados);
      setEncuadres(encuadresFormateados);
      setPermisos((permisosData || []) as Permiso[]);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la información. Recarga la página.");
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Escenarios y duración ──────────────────────────────────
  const aplicarDuracion = (dias: number) => {
    const ahora = new Date();
    setAccesoDesde(aInputLocal(ahora));
    setAccesoHasta(aInputLocal(new Date(ahora.getTime() + dias * 86400000)));
  };

  const aplicarEscenario = (esc: Escenario) => {
    setEscenarioId(esc.id);
    setRolObjetivo(esc.rol);
    setUsuarioId("");

    setSoloLectura(esc.permisos.solo_lectura);
    setPuedeEditarEncuadre(esc.permisos.editar_encuadre);
    setPuedeGestionarAlumnos(esc.permisos.gestionar_alumnos);
    setPuedeFirmar(esc.permisos.firmar);
    setPuedeRegistrarAvances(esc.permisos.registrar_avances);
    setIncluyeAlumnos(esc.incluye_alumnos);

    aplicarDuracion(esc.dias);
  };

  const cambiarRol = (nuevoRol: RolObjetivo) => {
    setRolObjetivo(nuevoRol);
    setUsuarioId("");
    if (nuevoRol === "alumno") setIncluyeAlumnos(false);
  };

  // ── Derivados ──────────────────────────────────────────────
  const escenarioActivo = ESCENARIOS.find((e) => e.id === escenarioId);

  const usuariosFiltrados = useMemo(
    () =>
      usuarios.filter((u) => {
        const rol = normalizarRol(u.rol_nombre);
        return rolObjetivo === "profesor"
          ? rol.includes("profesor")
          : rol.includes("alumno");
      }),
    [usuarios, rolObjetivo]
  );

  const encuadresFiltrados = useMemo(() => {
    const q = busquedaEncuadre.trim().toLowerCase();
    if (!q) return encuadres;
    return encuadres.filter((e) => e.label.toLowerCase().includes(q));
  }, [encuadres, busquedaEncuadre]);

  const encuadreLabelMap = useMemo(
    () => new Map(encuadres.map((e) => [e.id, e.label])),
    [encuadres]
  );

  const usuarioLabelMap = useMemo(
    () => new Map(usuarios.map((u) => [u.id, `${u.nombre} (${u.correo})`])),
    [usuarios]
  );

  const permisosVisibles = useMemo(() => {
    const lista = [...permisos].sort(
      (a, b) =>
        new Date(a.acceso_hasta).getTime() - new Date(b.acceso_hasta).getTime()
    );
    return mostrarVencidos
      ? lista
      : lista.filter((p) => diasRestantes(p.acceso_hasta) >= 0);
  }, [permisos, mostrarVencidos]);

  const totalVencidos = useMemo(
    () => permisos.filter((p) => diasRestantes(p.acceso_hasta) < 0).length,
    [permisos]
  );

  // Qué heredarán los alumnos, según lo que abra el permiso
  const herenciaAlumnos = useMemo(() => {
    if (!incluyeAlumnos || rolObjetivo !== "profesor" || soloLectura) return [];
    const acciones: string[] = [];
    if (puedeEditarEncuadre) acciones.push("firmar de enterado");
    if (puedeRegistrarAvances) acciones.push("registrar avances");
    return acciones;
  }, [
    incluyeAlumnos,
    rolObjetivo,
    soloLectura,
    puedeEditarEncuadre,
    puedeRegistrarAvances,
  ]);

  const resumen = useMemo(() => {
    if (!encuadreId || !usuarioId || !accesoHasta) return null;

    const usuario = usuarios.find((u) => u.id === usuarioId);
    const encuadre = encuadres.find((e) => e.id === encuadreId);
    if (!usuario || !encuadre) return null;

    const acciones: string[] = [];
    if (soloLectura) {
      acciones.push("consultar el curso sin hacer cambios");
    } else {
      if (puedeEditarEncuadre) acciones.push("editar el encuadre");
      if (puedeGestionarAlumnos) acciones.push("invitar y administrar alumnos");
      if (puedeFirmar) acciones.push("firmar de enterado");
      if (puedeRegistrarAvances) acciones.push("registrar avances");
    }

    if (acciones.length === 0) return null;

    return {
      usuario: usuario.nombre,
      curso: `${encuadre.materia} · Grupo ${encuadre.grupo}`,
      acciones,
      hasta: formatearFecha(new Date(accesoHasta).toISOString()),
    };
  }, [
    encuadreId,
    usuarioId,
    accesoHasta,
    usuarios,
    encuadres,
    soloLectura,
    puedeEditarEncuadre,
    puedeGestionarAlumnos,
    puedeFirmar,
    puedeRegistrarAvances,
  ]);

  const limpiarFormulario = () => {
    setEscenarioId("");
    setEncuadreId("");
    setUsuarioId("");
    setMotivo("");
    setAccesoDesde("");
    setAccesoHasta("");
    setBusquedaEncuadre("");
    setSoloLectura(false);
    setPuedeEditarEncuadre(false);
    setPuedeGestionarAlumnos(false);
    setPuedeFirmar(false);
    setPuedeRegistrarAvances(false);
    setIncluyeAlumnos(false);
    setMostrarAvanzado(false);
  };

  // ── Guardar ────────────────────────────────────────────────
  const guardarPermiso = async () => {
    if (!session?.user?.id) {
      toast.error("Tu sesión expiró. Inicia sesión de nuevo.");
      return;
    }
    if (!encuadreId) {
      toast.error("Elige el curso al que aplica el permiso.");
      return;
    }
    if (!usuarioId) {
      toast.error("Elige a la persona que recibirá el permiso.");
      return;
    }
    if (!accesoDesde || !accesoHasta) {
      toast.error("Indica desde y hasta cuándo estará vigente.");
      return;
    }
    if (new Date(accesoDesde) >= new Date(accesoHasta)) {
      toast.error("La fecha final debe ser posterior a la inicial.");
      return;
    }

    const sinPermisos =
      !soloLectura &&
      !puedeEditarEncuadre &&
      !puedeGestionarAlumnos &&
      !puedeFirmar &&
      !puedeRegistrarAvances;

    if (sinPermisos) {
      toast.error("Elige un escenario o marca al menos un permiso.");
      return;
    }

    setSaving(true);

    const payload = {
      encuadre_id: encuadreId,
      usuario_id: usuarioId,
      rol_objetivo: rolObjetivo,
      acceso_desde: new Date(accesoDesde).toISOString(),
      acceso_hasta: new Date(accesoHasta).toISOString(),
      solo_lectura: soloLectura,
      puede_editar_encuadre: soloLectura ? false : puedeEditarEncuadre,
      puede_gestionar_alumnos: soloLectura ? false : puedeGestionarAlumnos,
      puede_firmar: soloLectura ? false : puedeFirmar,
      puede_registrar_avances: soloLectura ? false : puedeRegistrarAvances,
      // Solo tiene efecto en permisos de profesor
      incluye_alumnos:
        rolObjetivo === "profesor" && !soloLectura ? incluyeAlumnos : false,
      activo: true,
      motivo: motivo.trim() || null,
      creado_por: session.user.id,
    };

    const { error } = await supabase
      .from("permisos_operacion_encuadre")
      .insert([payload]);

    if (error) {
      console.error(error);
      toast.error(
        "No se pudo crear el permiso. Revisa los datos e intenta de nuevo."
      );
      setSaving(false);
      return;
    }

    toast.success("Permiso creado. Ya puede operar el curso.");
    limpiarFormulario();
    await cargarTodo();
    setSaving(false);
  };

  const desactivarPermiso = async (permiso: Permiso) => {
    const nombre = usuarioLabelMap.get(permiso.usuario_id) || "esta persona";

    const ok = await confirm({
      title: "Retirar permiso",
      message: `${nombre} dejará de poder operar este curso de inmediato. ¿Continuar?`,
      confirmText: "Sí, retirar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    const { error } = await supabase
      .from("permisos_operacion_encuadre")
      .update({ activo: false })
      .eq("id", permiso.id);

    if (error) {
      console.error(error);
      toast.error("No se pudo retirar el permiso. Intenta de nuevo.");
      return;
    }

    toast.success("Permiso retirado.");
    await cargarTodo();
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  const listo = !!(encuadreId && usuarioId && accesoDesde && accesoHasta);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => router.push("/admin")}
          className="cursor-pointer"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Regresar
        </Button>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00723F]/10 flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-[#00723F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Permisos especiales</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Abre un curso a una persona concreta cuando el periodo general ya
              cerró.
            </p>
          </div>
        </div>
      </div>

      {/* Paso 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00723F] text-white text-xs font-bold">
              1
            </span>
            ¿Qué necesitas resolver?
          </CardTitle>
          <CardDescription>
            Elige la situación y se configuran los permisos que le corresponden.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ESCENARIOS.map((esc) => {
              const Icono = esc.icono;
              const activo = escenarioId === esc.id;

              return (
                <button
                  key={esc.id}
                  type="button"
                  onClick={() => aplicarEscenario(esc)}
                  className={`text-left rounded-lg border-2 p-4 transition-colors cursor-pointer ${
                    activo
                      ? "border-[#00723F] bg-[#00723F]/5"
                      : "border-border hover:border-[#00723F]/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icono
                      className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        activo ? "text-[#00723F]" : "text-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{esc.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {esc.descripcion}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Para {esc.rol} · {esc.dias} días
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Paso 2 */}
      <Card className={escenarioId ? "" : "opacity-60 pointer-events-none"}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00723F] text-white text-xs font-bold">
              2
            </span>
            ¿En qué curso y para quién?
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Curso</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={busquedaEncuadre}
                onChange={(e) => setBusquedaEncuadre(e.target.value)}
                placeholder="Filtra por clave, materia, grupo o profesor"
                className="pl-9"
              />
            </div>

            <Select value={encuadreId} onValueChange={setEncuadreId}>
              <SelectTrigger>
                <SelectValue placeholder="Elige un curso" />
              </SelectTrigger>
              <SelectContent>
                {encuadresFiltrados.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                    Ningún curso coincide con esa búsqueda.
                  </div>
                ) : (
                  encuadresFiltrados.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">Rol</Label>
              <Select
                value={rolObjetivo}
                onValueChange={(v) => cambiarRol(v as RolObjetivo)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profesor">Profesor</SelectItem>
                  <SelectItem value="alumno">Alumno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="mb-2 block">Persona</Label>
              <Select value={usuarioId} onValueChange={setUsuarioId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Elige un ${rolObjetivo}`} />
                </SelectTrigger>
                <SelectContent>
                  {usuariosFiltrados.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                      No hay usuarios con rol de {rolObjetivo}.
                    </div>
                  ) : (
                    usuariosFiltrados.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre} ({u.correo})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alcance a los alumnos — solo para permisos de profesor */}
          {rolObjetivo === "profesor" && !soloLectura && (
            <div className="rounded-lg border p-4 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={incluyeAlumnos}
                  onCheckedChange={(v) => setIncluyeAlumnos(!!v)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Incluir a los alumnos de este curso
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Los alumnos que el profesor invite quedarán habilitados
                    automáticamente durante la misma vigencia. No necesitas
                    saber sus nombres de antemano.
                  </p>
                </div>
              </label>

              {incluyeAlumnos && (
                <p className="text-xs text-[#00723F] pl-7">
                  {herenciaAlumnos.length > 0
                    ? `Los alumnos podrán: ${herenciaAlumnos.join(" y ")}.`
                    : "Este permiso no abre nada que los alumnos puedan heredar. Marca “editar el encuadre” o “registrar avances”."}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paso 3 */}
      <Card className={escenarioId ? "" : "opacity-60 pointer-events-none"}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00723F] text-white text-xs font-bold">
              3
            </span>
            ¿Hasta cuándo?
          </CardTitle>
          <CardDescription>
            El permiso se retira solo al llegar la fecha final.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[7, 15, 30].map((dias) => (
              <Button
                key={dias}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => aplicarDuracion(dias)}
                className="cursor-pointer"
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                {dias} días
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Desde</Label>
              <Input
                type="datetime-local"
                value={accesoDesde}
                onChange={(e) => setAccesoDesde(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Hasta</Label>
              <Input
                type="datetime-local"
                value={accesoHasta}
                onChange={(e) => setAccesoHasta(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">
              Motivo{" "}
              <span className="text-muted-foreground font-normal">
                (lo verá la persona en su curso)
              </span>
            </Label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ej. Materia asignada después del cierre de encuadres"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ajuste manual */}
      {escenarioId && (
        <Card>
          <CardHeader className="pb-3">
            <button
              type="button"
              onClick={() => setMostrarAvanzado((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-[#00723F] transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {mostrarAvanzado
                ? "Ocultar permisos individuales"
                : "Ajustar permisos individuales"}
            </button>
            {!mostrarAvanzado && escenarioActivo && (
              <p className="text-xs text-muted-foreground pt-1">
                Usando la configuración de &quot;{escenarioActivo.titulo}&quot;.
              </p>
            )}
          </CardHeader>

          {mostrarAvanzado && (
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={soloLectura}
                  onCheckedChange={(v) => setSoloLectura(!!v)}
                />
                <span className="text-sm">
                  Solo lectura — bloquea todos los cambios
                </span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  {
                    label: "Editar el encuadre",
                    checked: puedeEditarEncuadre,
                    set: setPuedeEditarEncuadre,
                  },
                  {
                    label: "Invitar y administrar alumnos",
                    checked: puedeGestionarAlumnos,
                    set: setPuedeGestionarAlumnos,
                  },
                  {
                    label: "Firmar de enterado",
                    checked: puedeFirmar,
                    set: setPuedeFirmar,
                  },
                  {
                    label: "Registrar avances",
                    checked: puedeRegistrarAvances,
                    set: setPuedeRegistrarAvances,
                  },
                ].map((p) => (
                  <label
                    key={p.label}
                    className={`flex items-center gap-2 ${
                      soloLectura
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <Checkbox
                      checked={p.checked}
                      disabled={soloLectura}
                      onCheckedChange={(v) => p.set(!!v)}
                    />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Resumen */}
      {resumen && (
        <Card className="border-[#00723F]/30 bg-[#00723F]/5">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm leading-relaxed">
              <strong>{resumen.usuario}</strong> podrá{" "}
              {resumen.acciones.join(", ")} en <strong>{resumen.curso}</strong>{" "}
              hasta el <strong>{resumen.hasta}</strong>.
            </p>

            {herenciaAlumnos.length > 0 && (
              <p className="text-sm leading-relaxed">
                Los alumnos de ese curso podrán{" "}
                {herenciaAlumnos.join(" y ")} durante el mismo periodo.
              </p>
            )}

            <div className="flex justify-end">
              <Button
                onClick={guardarPermiso}
                disabled={saving || !listo}
                className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {saving ? "Creando..." : "Crear permiso"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permisos vigentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Permisos vigentes</CardTitle>
              <CardDescription>
                Ordenados por el que vence primero.
              </CardDescription>
            </div>
            {totalVencidos > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarVencidos((v) => !v)}
                className="cursor-pointer"
              >
                {mostrarVencidos
                  ? "Ocultar vencidos"
                  : `Ver ${totalVencidos} vencido${
                      totalVencidos > 1 ? "s" : ""
                    }`}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {permisosVisibles.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No hay permisos especiales vigentes. Crea uno arriba cuando
                alguien necesite operar un curso fuera de fecha.
              </p>
            </div>
          ) : (
            permisosVisibles.map((permiso) => {
              const dias = diasRestantes(permiso.acceso_hasta);
              const vencido = dias < 0;
              const porVencer = !vencido && dias <= 3;

              return (
                <div
                  key={permiso.id}
                  className={`rounded-lg border p-4 flex items-start justify-between gap-4 ${
                    vencido ? "opacity-60 bg-muted/30" : ""
                  }`}
                >
                  <div className="space-y-2 text-sm min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {usuarioLabelMap.get(permiso.usuario_id) ||
                          permiso.usuario_id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                        {permiso.rol_objetivo}
                      </span>

                      {vencido ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                          Vencido
                        </span>
                      ) : porVencer ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {dias === 0 ? "Vence hoy" : `Vence en ${dias} d`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {dias} días restantes
                        </span>
                      )}
                    </div>

                    <p className="text-muted-foreground">
                      {encuadreLabelMap.get(permiso.encuadre_id) ||
                        permiso.encuadre_id}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {permiso.solo_lectura && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                          Solo lectura
                        </span>
                      )}
                      {permiso.puede_editar_encuadre && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          Editar encuadre
                        </span>
                      )}
                      {permiso.puede_gestionar_alumnos && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          Gestionar alumnos
                        </span>
                      )}
                      {permiso.puede_firmar && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                          Firmar
                        </span>
                      )}
                      {permiso.puede_registrar_avances && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                          Registrar avances
                        </span>
                      )}
                      {permiso.incluye_alumnos && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[#00723F]/10 text-[#00723F] flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Alcanza a sus alumnos
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {formatearFecha(permiso.acceso_desde)} →{" "}
                      {formatearFecha(permiso.acceso_hasta)}
                    </p>

                    {permiso.motivo && (
                      <p className="text-xs text-muted-foreground italic">
                        “{permiso.motivo}”
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => desactivarPermiso(permiso)}
                    className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Retirar
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}