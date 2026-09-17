"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  Loader2,
  CalendarDays,
  Plus,
  Trash2,
  BookOpenCheck,
  PenLine,
  ClipboardList,
  FileSpreadsheet,
  CircleDot,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/global-confirm-modal";

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────

type Ventana = {
  id: string;
  nombre: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  habilita_pua: boolean;
  habilita_encuadre: boolean;
  habilita_firma: boolean;
  habilita_avances: boolean;
  activo: boolean;
  created_at: string;
};

type Plantilla = {
  id: string;
  titulo: string;
  descripcion: string;
  icono: React.ElementType;
  nombre: string;
  pua: boolean;
  encuadre: boolean;
  firma: boolean;
  avances: boolean;
};

// Las cuatro etapas reales del semestre, en orden cronológico
const PLANTILLAS: Plantilla[] = [
  {
    id: "pua",
    titulo: "Captura de PUA",
    descripcion:
      "Los capturistas llenan el programa: datos generales, unidades y prácticas.",
    icono: FileSpreadsheet,
    nombre: "Captura de PUA",
    pua: true,
    encuadre: false,
    firma: false,
    avances: false,
  },
  {
    id: "encuadre",
    titulo: "Captura de encuadres",
    descripcion:
      "Los profesores llenan y publican su encuadre; los alumnos firman de enterado.",
    icono: BookOpenCheck,
    nombre: "Captura de encuadres",
    pua: false,
    encuadre: true,
    firma: true,
    avances: false,
  },
  {
    id: "avances",
    titulo: "Corte de avances",
    descripcion:
      "Profesores y alumnos registran qué temas se cubrieron. No reabre el encuadre.",
    icono: ClipboardList,
    nombre: "Corte de avances",
    pua: false,
    encuadre: false,
    firma: false,
    avances: true,
  },
  {
    id: "firmas",
    titulo: "Solo firmas",
    descripcion:
      "Reabre únicamente la firma de enterado para alumnos que faltaron.",
    icono: PenLine,
    nombre: "Periodo de firmas",
    pua: false,
    encuadre: false,
    firma: true,
    avances: false,
  },
];

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatearRango(v: Ventana): string {
  const f = (fecha: string) =>
    new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  return `${f(v.fecha_inicio)} → ${f(v.fecha_fin)}`;
}

function recortarHora(hora: string): string {
  return hora?.slice(0, 5) || "";
}

function estadoVentana(v: Ventana): "abierta" | "programada" | "cerrada" {
  const hoy = hoyISO();
  const ahora = new Date().toTimeString().slice(0, 8);

  if (hoy < v.fecha_inicio) return "programada";
  if (hoy > v.fecha_fin) return "cerrada";

  return ahora >= v.hora_inicio && ahora <= v.hora_fin
    ? "abierta"
    : "programada";
}

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────

export default function FechasOperacionPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ventanas, setVentanas] = useState<Ventana[]>([]);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [plantillaId, setPlantillaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaInicio, setHoraInicio] = useState("07:00");
  const [horaFin, setHoraFin] = useState("22:00");

  const [habPua, setHabPua] = useState(false);
  const [habEncuadre, setHabEncuadre] = useState(false);
  const [habFirma, setHabFirma] = useState(false);
  const [habAvances, setHabAvances] = useState(false);

  // ── Carga ──────────────────────────────────────────────────
  const cargar = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("configuracion_fechas")
      .select("*")
      .order("fecha_inicio", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("No se pudieron cargar las ventanas. Recarga la página.");
      setLoading(false);
      return;
    }

    setVentanas((data || []) as Ventana[]);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Formulario ─────────────────────────────────────────────
  const aplicarPlantilla = (p: Plantilla) => {
    setPlantillaId(p.id);
    setNombre(p.nombre);
    setHabPua(p.pua);
    setHabEncuadre(p.encuadre);
    setHabFirma(p.firma);
    setHabAvances(p.avances);
  };

  const limpiar = () => {
    setPlantillaId("");
    setNombre("");
    setFechaInicio("");
    setFechaFin("");
    setHoraInicio("07:00");
    setHoraFin("22:00");
    setHabPua(false);
    setHabEncuadre(false);
    setHabFirma(false);
    setHabAvances(false);
    setMostrarForm(false);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      toast.error("Ponle un nombre a la ventana para identificarla después.");
      return;
    }
    if (!fechaInicio || !fechaFin) {
      toast.error("Indica la fecha de inicio y de fin.");
      return;
    }
    if (fechaFin < fechaInicio) {
      toast.error("La fecha final debe ser posterior a la inicial.");
      return;
    }
    if (horaFin <= horaInicio) {
      toast.error("La hora final debe ser posterior a la inicial.");
      return;
    }
    if (!habPua && !habEncuadre && !habFirma && !habAvances) {
      toast.error("Elige al menos una sección que esta ventana habilite.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("configuracion_fechas").insert([
      {
        nombre: nombre.trim(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        hora_inicio: `${horaInicio}:00`,
        hora_fin: `${horaFin}:00`,
        habilita_pua: habPua,
        habilita_encuadre: habEncuadre,
        habilita_firma: habFirma,
        habilita_avances: habAvances,
        activo: true,
      },
    ]);

    if (error) {
      console.error(error);
      toast.error("No se pudo crear la ventana. Revisa los datos.");
      setSaving(false);
      return;
    }

    toast.success("Ventana creada.");
    limpiar();
    await cargar();
    setSaving(false);
  };

  const alternarActivo = async (v: Ventana) => {
    const activar = !v.activo;

    if (!activar) {
      const ok = await confirm({
        title: "Cerrar ventana",
        message: `"${
          v.nombre || "Esta ventana"
        }" dejará de aplicar de inmediato, aunque sus fechas sigan vigentes. ¿Continuar?`,
        confirmText: "Sí, cerrar",
        cancelText: "Cancelar",
      });
      if (!ok) return;
    }

    const { error } = await supabase
      .from("configuracion_fechas")
      .update({ activo: activar })
      .eq("id", v.id);

    if (error) {
      console.error(error);
      toast.error("No se pudo cambiar el estado de la ventana.");
      return;
    }

    toast.success(activar ? "Ventana reactivada." : "Ventana cerrada.");
    await cargar();
  };

  const eliminar = async (v: Ventana) => {
    const ok = await confirm({
      title: "Eliminar ventana",
      message: `Se borrará "${
        v.nombre || "esta ventana"
      }" del historial. Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    const { error } = await supabase
      .from("configuracion_fechas")
      .delete()
      .eq("id", v.id);

    if (error) {
      console.error(error);
      toast.error("No se pudo eliminar la ventana.");
      return;
    }

    toast.success("Ventana eliminada.");
    await cargar();
  };

  // ── Derivados ──────────────────────────────────────────────
  const abiertasAhora = useMemo(
    () => ventanas.filter((v) => v.activo && estadoVentana(v) === "abierta"),
    [ventanas]
  );

  const resumenAbierto = useMemo(() => {
    const secciones: string[] = [];
    if (abiertasAhora.some((v) => v.habilita_pua))
      secciones.push("captura del PUA");
    if (abiertasAhora.some((v) => v.habilita_encuadre))
      secciones.push("edición del encuadre");
    if (abiertasAhora.some((v) => v.habilita_firma))
      secciones.push("firma de enterado");
    if (abiertasAhora.some((v) => v.habilita_avances))
      secciones.push("registro de avances");
    return secciones;
  }, [abiertasAhora]);

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

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
            <CalendarDays className="h-5 w-5 text-[#00723F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Fechas de operación</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Define cuándo se puede capturar el PUA, llenar el encuadre, firmar
              y registrar avances.
            </p>
          </div>
        </div>
      </div>

      {/* Estado actual */}
      <Card
        className={
          resumenAbierto.length > 0
            ? "border-green-300 bg-green-50"
            : "border-amber-300 bg-amber-50"
        }
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CircleDot
              className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                resumenAbierto.length > 0 ? "text-green-700" : "text-amber-700"
              }`}
            />
            <div>
              {resumenAbierto.length > 0 ? (
                <>
                  <p className="font-medium text-green-900">
                    Ahora mismo está abierto: {resumenAbierto.join(", ")}
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    Por{" "}
                    {abiertasAhora
                      .map((v) => v.nombre || "ventana sin nombre")
                      .join(", ")}
                    .
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-amber-900">
                    Todo está cerrado en este momento
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Capturistas, profesores y alumnos solo pueden consultar.
                    Crea una ventana para habilitar la captura.
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crear ventana */}
      {!mostrarForm ? (
        <div className="flex justify-end">
          <Button
            onClick={() => setMostrarForm(true)}
            className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva ventana
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva ventana</CardTitle>
            <CardDescription>
              Elige qué habilita y en qué fechas. Pueden coexistir varias.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Plantillas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PLANTILLAS.map((p) => {
                const Icono = p.icono;
                const activo = plantillaId === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => aplicarPlantilla(p)}
                    className={`text-left rounded-lg border-2 p-4 transition-colors cursor-pointer ${
                      activo
                        ? "border-[#00723F] bg-[#00723F]/5"
                        : "border-border hover:border-[#00723F]/40 hover:bg-muted/40"
                    }`}
                  >
                    <Icono
                      className={`h-5 w-5 mb-2 ${
                        activo ? "text-[#00723F]" : "text-muted-foreground"
                      }`}
                    />
                    <p className="font-medium text-sm">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {p.descripcion}
                    </p>
                  </button>
                );
              })}
            </div>

            <div>
              <Label className="mb-2 block">Nombre</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Captura de PUA 2026-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Del día</Label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Al día</Label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Desde las</Label>
                <Input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Hasta las</Label>
                <Input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground -mt-2">
              El horario aplica todos los días del rango. Déjalo amplio si no
              necesitas restringir por hora.
            </p>

            <div className="rounded-lg border p-4 space-y-3">
              <Label className="block">Esta ventana habilita</Label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={habPua}
                  onCheckedChange={(v) => setHabPua(!!v)}
                />
                <span className="text-sm">
                  Captura del PUA{" "}
                  <span className="text-muted-foreground">
                    — capturistas llenan el programa
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={habEncuadre}
                  onCheckedChange={(v) => setHabEncuadre(!!v)}
                />
                <span className="text-sm">
                  Edición del encuadre{" "}
                  <span className="text-muted-foreground">
                    — profesores capturan y publican
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={habFirma}
                  onCheckedChange={(v) => setHabFirma(!!v)}
                />
                <span className="text-sm">
                  Firma de enterado{" "}
                  <span className="text-muted-foreground">
                    — alumnos firman el encuadre
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={habAvances}
                  onCheckedChange={(v) => setHabAvances(!!v)}
                />
                <span className="text-sm">
                  Registro de avances{" "}
                  <span className="text-muted-foreground">
                    — profesores y alumnos marcan temas vistos
                  </span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={limpiar}
                disabled={saving}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={guardar}
                disabled={saving}
                className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {saving ? "Creando..." : "Crear ventana"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Ventanas configuradas</CardTitle>
          <CardDescription>De la más reciente a la más antigua.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {ventanas.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                Aún no hay ventanas. Crea la primera para que capturistas,
                profesores y alumnos puedan trabajar.
              </p>
            </div>
          ) : (
            ventanas.map((v) => {
              const estado = estadoVentana(v);
              const abierta = v.activo && estado === "abierta";

              return (
                <div
                  key={v.id}
                  className={`rounded-lg border p-4 flex items-start justify-between gap-4 ${
                    !v.activo || estado === "cerrada"
                      ? "opacity-60 bg-muted/30"
                      : ""
                  }`}
                >
                  <div className="space-y-2 text-sm min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {v.nombre || "Ventana sin nombre"}
                      </span>

                      {!v.activo ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                          Cerrada manualmente
                        </span>
                      ) : abierta ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          Abierta ahora
                        </span>
                      ) : estado === "programada" ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Programada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                          Terminada
                        </span>
                      )}
                    </div>

                    <p className="text-muted-foreground">
                      {formatearRango(v)} · {recortarHora(v.hora_inicio)} a{" "}
                      {recortarHora(v.hora_fin)}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {v.habilita_pua && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-700">
                          PUA
                        </span>
                      )}
                      {v.habilita_encuadre && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          Encuadre
                        </span>
                      )}
                      {v.habilita_firma && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                          Firmas
                        </span>
                      )}
                      {v.habilita_avances && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                          Avances
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alternarActivo(v)}
                      className="cursor-pointer"
                    >
                      {v.activo ? "Cerrar" : "Reactivar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => eliminar(v)}
                      className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}