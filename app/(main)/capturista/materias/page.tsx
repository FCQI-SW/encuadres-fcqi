"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  FileText,
  ClipboardList,
  X,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import PrintEncuadreButton from "@/components/Printencuadrebutton";
import PrintPuaButton from "@/components/Printpuabutton";

type MateriaEstado = {
  id: string;
  clave: string;
  nombre: string;
  programaId: string;
  encuadreId?: string;
  periodo: string;
  archivado: boolean;
  activo: boolean;
  encuadreCompleto: boolean;
  puaCompleto: boolean;
  editorPua?: string;
  edicionPua?: Date;
  editorEncuadre?: string;
  edicionEncuadre?: Date;
};

type FiltroProgreso =
  | "todas"
  | "ambos-completos"
  | "ambos-pendientes"
  | "encuadre-pendiente"
  | "pua-pendiente";

type CriterioDB = {
  encuadre_id: string;
  criterio: string | null;
  valor: number | null;
};

type EncuadreDB = {
  id: string;
  usuario_id: string | null;
  grupo: string | null;
  periodo: string | null;
  ultimo_editor_id: string | null;
  ultima_edicion: string | null;
};

type ProgramaDB = {
  id: string;
  periodo: string | null;
  activo: boolean | null;
  archivado: boolean | null;
  proposito: string | null;
  competencia: string | null;
  evidencias: string | null;
  unidades: number | null;
  ultimo_editor_id: string | null;
  ultima_edicion: string | null;
};

export default function Materias() {
  const [materias, setMaterias] = useState<MateriaEstado[]>([]);
  const [materiasFiltradas, setMateriasFiltradas] = useState<MateriaEstado[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroProgreso, setFiltroProgreso] = useState<FiltroProgreso>("todas");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todas");

  const [loading, setLoading] = useState(true);

  const fetchMaterias = async () => {
    setLoading(true);

    const { data: materiasData, error: materiasError } = await supabase
      .from("materias")
      .select("id, clave, nombre_materia");

    if (materiasError) {
      console.error("Error al obtener materias:", materiasError);
      setMaterias([]);
      setLoading(false);
      return;
    }

    const filas: MateriaEstado[] = [];

    for (const materia of materiasData || []) {
      const { data: programas, error: programasError } = await supabase
        .from("programas")
        .select(`
          id,
          periodo,
          activo,
          archivado,
          proposito,
          competencia,
          evidencias,
          unidades,
          ultimo_editor_id,
          ultima_edicion
        `)
        .eq("materia_id", materia.id)
        .eq("archivado", false)
        .eq("activo", true)
        .order("periodo", { ascending: false });

      if (programasError) {
        console.error(`Error al obtener programas de ${materia.clave}:`, programasError);
        continue;
      }

      for (const programa of (programas || []) as ProgramaDB[]) {
        let encuadreCompleto = false;
        let puaCompleto = false;
        let editorPua: string | undefined;
        let edicionPua: Date | undefined;
        let editorEncuadre: string | undefined;
        let edicionEncuadre: Date | undefined;
        let encuadreId: string | undefined;

        if (programa.ultimo_editor_id) {
          const { data: editorData } = await supabase
            .from("usuarios")
            .select("nombre")
            .eq("id", programa.ultimo_editor_id)
            .maybeSingle();

          editorPua = editorData?.nombre;
          edicionPua = programa.ultima_edicion
            ? new Date(programa.ultima_edicion)
            : undefined;
        }

        const { data: encuadres, error: encuadresError } = await supabase
          .from("encuadres")
          .select(`id, usuario_id, grupo, periodo, ultimo_editor_id, ultima_edicion`)
          .eq("programa_id", programa.id);

        if (encuadresError) {
          console.error(`Error al obtener encuadres de ${materia.clave} (${programa.periodo}):`, encuadresError);
        }

        const encuadresLista = (encuadres || []) as EncuadreDB[];

        if (encuadresLista.length > 0) {
          encuadreId = encuadresLista[0].id;
          const encuadreIds = encuadresLista.map((e) => e.id);

          const { data: criteriosData, error: criteriosError } = await supabase
            .from("criterios_evaluacion")
            .select("encuadre_id, criterio, valor")
            .in("encuadre_id", encuadreIds);

          if (criteriosError) {
            console.error(`Error al obtener criterios de ${materia.clave}:`, criteriosError);
          }

          const criterios = (criteriosData || []) as CriterioDB[];
          const criteriosPorEncuadre = new Map<string, CriterioDB[]>();

          for (const criterio of criterios) {
            if (!criteriosPorEncuadre.has(criterio.encuadre_id)) {
              criteriosPorEncuadre.set(criterio.encuadre_id, []);
            }
            criteriosPorEncuadre.get(criterio.encuadre_id)!.push(criterio);
          }

          encuadreCompleto = encuadresLista.every((encuadre) => {
            const criteriosDelEncuadre = criteriosPorEncuadre.get(encuadre.id) || [];
            const criteriosConNombre = criteriosDelEncuadre.filter((c) => c.criterio?.trim());
            const totalPorcentaje = criteriosConNombre.reduce((sum, c) => sum + (c.valor || 0), 0);
            const criteriosCompletos = criteriosConNombre.length > 0 && totalPorcentaje === 100;

            return !!(
              encuadre.usuario_id &&
              encuadre.grupo?.trim() &&
              encuadre.periodo?.trim() &&
              criteriosCompletos
            );
          });

          const encuadreMasReciente = [...encuadresLista]
            .filter((e) => e.ultima_edicion)
            .sort((a, b) => {
              const fechaA = a.ultima_edicion ? new Date(a.ultima_edicion).getTime() : 0;
              const fechaB = b.ultima_edicion ? new Date(b.ultima_edicion).getTime() : 0;
              return fechaB - fechaA;
            })[0];

          if (encuadreMasReciente?.ultimo_editor_id) {
            const { data: editorData } = await supabase
              .from("usuarios")
              .select("nombre")
              .eq("id", encuadreMasReciente.ultimo_editor_id)
              .maybeSingle();

            editorEncuadre = editorData?.nombre;
            edicionEncuadre = encuadreMasReciente.ultima_edicion
              ? new Date(encuadreMasReciente.ultima_edicion)
              : undefined;
          }
        }

        const numUnidades = programa.unidades || 0;
        const camposBasicosCompletos = !!(
          programa.proposito?.trim() &&
          programa.competencia?.trim() &&
          programa.evidencias?.trim() &&
          numUnidades > 0
        );

        if (camposBasicosCompletos) {
          const { data: unidades } = await supabase
            .from("unidades")
            .select("numero, nombre, competencia, contenido, duracion")
            .eq("programa_id", programa.id);

          const unidadesCompletas = (unidades || []).filter(
            (u) =>
              u.nombre?.trim() &&
              u.competencia?.trim() &&
              u.contenido?.trim() &&
              Number(u.duracion) > 0
          );

          const todasUnidadesCompletas = unidadesCompletas.length === numUnidades;

          let practicasTallerCompletas = false;
          const { data: practicasTaller } = await supabase
            .from("practicas_taller")
            .select("competencia, descripcion, duracion")
            .eq("programa_id", programa.id);

          if (practicasTaller && practicasTaller.length > 0) {
            const practicasValidas = practicasTaller.filter(
              (p) =>
                p.competencia?.trim() &&
                p.descripcion?.trim() &&
                Number(p.duracion) > 0
            );
            practicasTallerCompletas = practicasValidas.length === practicasTaller.length;
          } else {
            practicasTallerCompletas = false;
          }

          puaCompleto = todasUnidadesCompletas && practicasTallerCompletas;
        } else {
          puaCompleto = false;
        }

        filas.push({
          id: materia.id,
          clave: materia.clave,
          nombre: materia.nombre_materia,
          programaId: programa.id,
          encuadreId,
          periodo: programa.periodo || "",
          archivado: programa.archivado ?? false,
          activo: programa.activo ?? true,
          encuadreCompleto,
          puaCompleto,
          editorPua,
          edicionPua,
          editorEncuadre,
          edicionEncuadre,
        });
      }
    }

    filas.sort((a, b) => {
      const nombre = a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
      if (nombre !== 0) return nombre;
      return (b.periodo || "").localeCompare(a.periodo || "");
    });

    setMaterias(filas);
    setMateriasFiltradas(filas);
    setLoading(false);
  };

  useEffect(() => {
    void fetchMaterias();
  }, []);

  // ── Periodos únicos derivados de los datos cargados ──────────
  const periodosUnicos = useMemo(() => {
    const set = new Set(materias.map((m) => m.periodo).filter(Boolean));
    return [...set].sort((a, b) => b.localeCompare(a, "es", { numeric: true }));
  }, [materias]);

  // ── Filtrado reactivo ────────────────────────────────────────
  useEffect(() => {
    let filtradas = [...materias];

    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtradas = filtradas.filter(
        (m) =>
          m.nombre.toLowerCase().includes(busquedaLower) ||
          m.clave.toLowerCase().includes(busquedaLower) ||
          m.periodo.toLowerCase().includes(busquedaLower)
      );
    }

    if (filtroPeriodo !== "todas") {
      filtradas = filtradas.filter((m) => m.periodo === filtroPeriodo);
    }

    switch (filtroProgreso) {
      case "ambos-completos":
        filtradas = filtradas.filter((m) => m.encuadreCompleto && m.puaCompleto);
        break;
      case "ambos-pendientes":
        filtradas = filtradas.filter((m) => !m.encuadreCompleto && !m.puaCompleto);
        break;
      case "encuadre-pendiente":
        filtradas = filtradas.filter((m) => !m.encuadreCompleto);
        break;
      case "pua-pendiente":
        filtradas = filtradas.filter((m) => !m.puaCompleto);
        break;
    }

    setMateriasFiltradas(filtradas);
  }, [busqueda, filtroProgreso, filtroPeriodo, materias]);

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    filtroProgreso !== "todas" ||
    filtroPeriodo !== "todas";

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroProgreso("todas");
    setFiltroPeriodo("todas");
  };

  const formatearFecha = (fecha: Date) => {
    const opciones: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return fecha.toLocaleDateString("es-MX", opciones);
  };

  const obtenerInfoEdicion = (m: MateriaEstado) => {
    const editoPua = !!m.editorPua;
    const editoEncuadre = !!m.editorEncuadre;

    if (editoPua && editoEncuadre) {
      return {
        tipo: "ambos" as const,
        pua: { editor: m.editorPua!, fecha: m.edicionPua! },
        encuadre: { editor: m.editorEncuadre!, fecha: m.edicionEncuadre! },
      };
    } else if (editoPua) {
      return {
        tipo: "pua" as const,
        pua: { editor: m.editorPua!, fecha: m.edicionPua! },
      };
    } else if (editoEncuadre) {
      return {
        tipo: "encuadre" as const,
        encuadre: { editor: m.editorEncuadre!, fecha: m.edicionEncuadre! },
      };
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      {/* ── Barra de filtros ─────────────────────────────────── */}
      <div className="mx-auto mb-6 max-w-6xl rounded-lg border bg-muted/30 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Búsqueda */}
          <div className="md:col-span-1">
            <Label className="mb-2 block text-sm font-medium">
              Buscar por nombre, clave o periodo
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ej: Cívica, MAT202, 2026-2..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por periodo */}
          <div>
            <Label className="mb-2 block text-sm font-medium">
              Filtrar por periodo
            </Label>
            <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los periodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todas">Todos los periodos</SelectItem>
                  {periodosUnicos.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por progreso */}
          <div>
            <Label className="mb-2 block text-sm font-medium">
              Filtrar por progreso
            </Label>
            <Select
              value={filtroProgreso}
              onValueChange={(value) => setFiltroProgreso(value as FiltroProgreso)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todas">Todas las materias</SelectItem>
                  <SelectItem value="ambos-completos">✅ Ambos completos</SelectItem>
                  <SelectItem value="ambos-pendientes">⚠️ Ambos pendientes</SelectItem>
                  <SelectItem value="encuadre-pendiente">Encuadre pendiente</SelectItem>
                  <SelectItem value="pua-pendiente">PUA pendiente</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">
            Mostrando{" "}
            <span className="font-semibold">{materiasFiltradas.length}</span> de{" "}
            <span className="font-semibold">{materias.length}</span> periodos
          </span>

          {hayFiltrosActivos && (
            <Button
              variant="outline"
              size="sm"
              onClick={limpiarFiltros}
              className="cursor-pointer border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabla ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl overflow-x-auto rounded-md border">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[24%]">Nombre del curso</TableHead>
              <TableHead className="w-[10%] text-center">Clave</TableHead>
              <TableHead className="w-[10%] text-center">Periodo</TableHead>
              <TableHead className="w-[20%] text-center">Última edición</TableHead>
              <TableHead className="w-[36%] text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {materiasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-muted-foreground"
                >
                  No hay materias que coincidan con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              materiasFiltradas.map((m) => {
                const infoEdicion = obtenerInfoEdicion(m);

                return (
                  <TableRow
                    key={`${m.id}-${m.programaId}-${m.periodo}`}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="align-top font-medium">
                      <span className="block truncate">{m.nombre}</span>
                    </TableCell>

                    <TableCell className="tabular-nums text-center align-top">
                      {m.clave}
                    </TableCell>

                    <TableCell className="tabular-nums text-center align-top">
                      {m.periodo || "—"}
                    </TableCell>

                    <TableCell className="text-center align-top">
                      <div className="flex flex-col items-center gap-2">
                        {infoEdicion ? (
                          <>
                            {infoEdicion.tipo === "ambos" &&
                            infoEdicion.pua &&
                            infoEdicion.encuadre ? (
                              <>
                                <div className="flex items-center gap-2 text-xs">
                                  <FileText className="h-3 w-3 text-[#00723F]" />
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium text-[#00723F]">
                                      PUA: {infoEdicion.pua.editor}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {formatearFecha(infoEdicion.pua.fecha)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <ClipboardList className="h-3 w-3 text-blue-600" />
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium text-blue-600">
                                      Encuadre: {infoEdicion.encuadre.editor}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {formatearFecha(infoEdicion.encuadre.fecha)}
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : infoEdicion.tipo === "pua" && infoEdicion.pua ? (
                              <div className="flex items-center gap-2 text-xs">
                                <FileText className="h-3 w-3 text-[#00723F]" />
                                <div className="flex flex-col items-start">
                                  <span className="font-medium text-[#00723F]">
                                    PUA: {infoEdicion.pua.editor}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatearFecha(infoEdicion.pua.fecha)}
                                  </span>
                                </div>
                              </div>
                            ) : infoEdicion.tipo === "encuadre" &&
                              infoEdicion.encuadre ? (
                              <div className="flex items-center gap-2 text-xs">
                                <ClipboardList className="h-3 w-3 text-blue-600" />
                                <div className="flex flex-col items-start">
                                  <span className="font-medium text-blue-600">
                                    Encuadre: {infoEdicion.encuadre.editor}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatearFecha(infoEdicion.encuadre.fecha)}
                                  </span>
                                </div>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sin ediciones
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="flex flex-col items-center justify-start gap-3 py-1">
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                          {/* Encuadre */}
                          <div className="flex w-[170px] flex-col items-center gap-1">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className={`w-full justify-center whitespace-nowrap cursor-pointer ${
                                m.encuadreCompleto
                                  ? "border-green-600 text-green-700 hover:bg-green-50"
                                  : "border-orange-600 text-orange-700 hover:bg-orange-50"
                              }`}
                            >
                              <Link
                                href={`/capturista/materias/${m.clave}/encuadre?programaId=${m.programaId}`}
                              >
                                {m.encuadreCompleto ? (
                                  <CheckCircle2 className="mr-1 h-4 w-4 shrink-0" />
                                ) : (
                                  <AlertCircle className="mr-1 h-4 w-4 shrink-0" />
                                )}
                                Ver Encuadre
                              </Link>
                            </Button>

                            <Badge
                              variant={m.encuadreCompleto ? "default" : "secondary"}
                              className={`min-w-[95px] justify-center text-xs ${
                                m.encuadreCompleto
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-orange-500 hover:bg-orange-600"
                              }`}
                            >
                              {m.encuadreCompleto ? "Completo" : "Pendiente"}
                            </Badge>
                          </div>

                          {/* PUA */}
                          <div className="flex w-[170px] flex-col items-center gap-1">
                            <Button
                              asChild
                              size="sm"
                              className={`w-full justify-center whitespace-nowrap cursor-pointer ${
                                m.puaCompleto
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-orange-500 text-white hover:bg-orange-600"
                              }`}
                            >
                              <Link
                                href={`/capturista/materias/${m.clave}/pua?programaId=${m.programaId}`}
                              >
                                {m.puaCompleto ? (
                                  <CheckCircle2 className="mr-1 h-4 w-4 shrink-0" />
                                ) : (
                                  <AlertCircle className="mr-1 h-4 w-4 shrink-0" />
                                )}
                                Ver PUA
                              </Link>
                            </Button>

                            <Badge
                              variant={m.puaCompleto ? "default" : "secondary"}
                              className={`min-w-[95px] justify-center text-xs ${
                                m.puaCompleto
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-orange-500 hover:bg-orange-600"
                              }`}
                            >
                              {m.puaCompleto ? "Completo" : "Pendiente"}
                            </Badge>
                          </div>
                        </div>

                        {(m.encuadreId || m.programaId) && (
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {m.encuadreId && (
                              <div className="flex min-w-[170px] justify-center">
                                <PrintEncuadreButton encuadreId={m.encuadreId} />
                              </div>
                            )}
                            {m.programaId && (
                              <div className="flex min-w-[170px] justify-center">
                                <PrintPuaButton programaId={m.programaId} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}