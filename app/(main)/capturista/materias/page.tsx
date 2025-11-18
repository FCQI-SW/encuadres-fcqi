"use client";

import React, { useEffect, useState } from "react";
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
import { CheckCircle2, AlertCircle, Loader2, Search, FileText, ClipboardList } from "lucide-react";
import { Label } from "@/components/ui/label";

type MateriaEstado = {
  id: string;
  clave: string;
  nombre: string;
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

export default function Materias() {
  const [materias, setMaterias] = useState<MateriaEstado[]>([]);
  const [materiasFiltradas, setMateriasFiltradas] = useState<MateriaEstado[]>([]);
  
  const [busqueda, setBusqueda] = useState("");
  const [filtroProgreso, setFiltroProgreso] = useState<FiltroProgreso>("todas");
  
  const [loading, setLoading] = useState(true);

  const fetchMaterias = async () => {
    setLoading(true);

    const { data: materiasData, error: materiasError } = await supabase
      .from("materias")
      .select("id, clave, nombre_materia")
      .eq("estado", "Activa");

    if (materiasError) {
      console.error("Error al obtener materias:", materiasError);
      setMaterias([]);
      setLoading(false);
      return;
    }

    const materiasConEstado = await Promise.all(
      (materiasData || []).map(async (materia: any) => {
        const { data: programa } = await supabase
          .from("programas")
          .select(`
            id, 
            proposito, 
            competencia, 
            evidencias, 
            unidades,
            ultimo_editor_id,
            ultima_edicion
          `)
          .eq("materia_id", materia.id)
          .single();

        let encuadreCompleto = false;
        let puaCompleto = false;
        let editorPua: string | undefined;
        let edicionPua: Date | undefined;
        let editorEncuadre: string | undefined;
        let edicionEncuadre: Date | undefined;

        if (programa) {
          // Información del editor PUA
          if (programa.ultimo_editor_id) {
            const { data: editorData } = await supabase
              .from("usuarios")
              .select("nombre")
              .eq("id", programa.ultimo_editor_id)
              .single();
            
            editorPua = editorData?.nombre;
            edicionPua = programa.ultima_edicion ? new Date(programa.ultima_edicion) : undefined;
          }

          // Verificar encuadre
          const { data: encuadre } = await supabase
            .from("encuadres")
            .select(`
              id,
              usuario_id, 
              grupo, 
              periodo,
              ultimo_editor_id,
              ultima_edicion
            `)
            .eq("programa_id", programa.id)
            .single();

          // Verificar criterios de evaluación
          let criteriosCompletos = false;
          if (encuadre?.id) {
            const { data: criterios } = await supabase
              .from("criterios_evaluacion")
              .select("criterio, valor")
              .eq("encuadre_id", encuadre.id);

            if (criterios && criterios.length > 0) {
              const criteriosConNombre = criterios.filter((c) => c.criterio?.trim());
              const totalPorcentaje = criteriosConNombre.reduce((sum, c) => sum + (c.valor || 0), 0);
              criteriosCompletos = criteriosConNombre.length > 0 && totalPorcentaje === 100;
            }
          }

          encuadreCompleto = !!(
            encuadre?.usuario_id &&
            encuadre?.grupo &&
            encuadre?.periodo &&
            criteriosCompletos
          );

          // Información del editor Encuadre
          if (encuadre?.ultimo_editor_id) {
            const { data: editorData } = await supabase
              .from("usuarios")
              .select("nombre")
              .eq("id", encuadre.ultimo_editor_id)
              .single();
            
            editorEncuadre = editorData?.nombre;
            edicionEncuadre = encuadre.ultima_edicion ? new Date(encuadre.ultima_edicion) : undefined;
          }

          // Verificar PUA completo
          const numUnidades = programa.unidades || 0;
          const camposBasicosCompletos = !!(
            programa.proposito &&
            programa.competencia &&
            programa.evidencias &&
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
                u.duracion > 0
            );

            puaCompleto = unidadesCompletas.length === numUnidades;
          } else {
            puaCompleto = false;
          }
        }

        return {
          id: materia.id,
          clave: materia.clave,
          nombre: materia.nombre_materia,
          encuadreCompleto,
          puaCompleto,
          editorPua,
          edicionPua,
          editorEncuadre,
          edicionEncuadre,
        };
      })
    );

    setMaterias(materiasConEstado);
    setMateriasFiltradas(materiasConEstado);
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  useEffect(() => {
    let filtradas = [...materias];

    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtradas = filtradas.filter(
        (m) =>
          m.nombre.toLowerCase().includes(busquedaLower) ||
          m.clave.toLowerCase().includes(busquedaLower)
      );
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
  }, [busqueda, filtroProgreso, materias]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroProgreso("todas");
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: Date) => {
    const opciones: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return fecha.toLocaleDateString('es-MX', opciones);
  };

  // Función para determinar qué mostrar
  const obtenerInfoEdicion = (m: MateriaEstado) => {
    const editoPua = !!m.editorPua;
    const editoEncuadre = !!m.editorEncuadre;

    if (editoPua && editoEncuadre) {
      // Ambos editados - mostrar ambos
      return {
        tipo: "ambos",
        pua: {
          editor: m.editorPua!,
          fecha: m.edicionPua!,
        },
        encuadre: {
          editor: m.editorEncuadre!,
          fecha: m.edicionEncuadre!,
        }
      };
    } else if (editoPua) {
      return {
        tipo: "pua",
        pua: {
          editor: m.editorPua!,
          fecha: m.edicionPua!,
        }
      };
    } else if (editoEncuadre) {
      return {
        tipo: "encuadre",
        encuadre: {
          editor: m.editorEncuadre!,
          fecha: m.edicionEncuadre!,
        }
      };
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold">
        Materias - Capturista
      </h1>

      <div className="mx-auto max-w-6xl mb-6 p-4 border rounded-lg bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label className="mb-2 block text-sm font-medium">
              Buscar por nombre o clave
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ej: Cívica, MAT202s..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">
              Filtrar por progreso
            </Label>
            <Select value={filtroProgreso} onValueChange={(value) => setFiltroProgreso(value as FiltroProgreso)}>
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

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            Mostrando <span className="font-semibold">{materiasFiltradas.length}</span> de{" "}
            <span className="font-semibold">{materias.length}</span> materias
          </span>
          {(busqueda || filtroProgreso !== "todas") && (
            <Button
              variant="outline"
              size="sm"
              onClick={limpiarFiltros}
              className="cursor-pointer"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl overflow-x-auto rounded-md border">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Nombre del curso</TableHead>
              <TableHead className="w-[15%] text-center">Clave</TableHead>
              <TableHead className="w-[20%] text-center">Última edición</TableHead>
              <TableHead className="w-[35%] text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {materiasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-6 text-center text-muted-foreground"
                >
                  No hay materias que coincidan con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              materiasFiltradas.map((m) => {
                const infoEdicion = obtenerInfoEdicion(m);
                
                return (
                  <TableRow key={m.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <span className="block truncate">{m.nombre}</span>
                    </TableCell>

                    <TableCell className="tabular-nums text-center">
                      {m.clave}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        {infoEdicion ? (
                          <>
                            {infoEdicion.tipo === "ambos" && infoEdicion.pua && infoEdicion.encuadre ? (
                              <>
                                {/* PUA */}
                                <div className="flex items-center gap-2 text-xs">
                                  <FileText className="h-3 w-3 text-[#00723F]" />
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium text-[#00723F]">PUA: {infoEdicion.pua.editor}</span>
                                    <span className="text-muted-foreground">{formatearFecha(infoEdicion.pua.fecha)}</span>
                                  </div>
                                </div>
                                {/* Encuadre */}
                                <div className="flex items-center gap-2 text-xs">
                                  <ClipboardList className="h-3 w-3 text-blue-600" />
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium text-blue-600">Encuadre: {infoEdicion.encuadre.editor}</span>
                                    <span className="text-muted-foreground">{formatearFecha(infoEdicion.encuadre.fecha)}</span>
                                  </div>
                                </div>
                              </>
                            ) : infoEdicion.tipo === "pua" && infoEdicion.pua ? (
                              <div className="flex items-center gap-2 text-xs">
                                <FileText className="h-3 w-3 text-[#00723F]" />
                                <div className="flex flex-col items-start">
                                  <span className="font-medium text-[#00723F]">PUA: {infoEdicion.pua.editor}</span>
                                  <span className="text-muted-foreground">{formatearFecha(infoEdicion.pua.fecha)}</span>
                                </div>
                              </div>
                            ) : infoEdicion.tipo === "encuadre" && infoEdicion.encuadre ? (
                              <div className="flex items-center gap-2 text-xs">
                                <ClipboardList className="h-3 w-3 text-blue-600" />
                                <div className="flex flex-col items-start">
                                  <span className="font-medium text-blue-600">Encuadre: {infoEdicion.encuadre.editor}</span>
                                  <span className="text-muted-foreground">{formatearFecha(infoEdicion.encuadre.fecha)}</span>
                                </div>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin ediciones</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className={`cursor-pointer ${
                              m.encuadreCompleto
                                ? "border-green-600 text-green-700 hover:bg-green-50"
                                : "border-orange-600 text-orange-700 hover:bg-orange-50"
                            }`}
                          >
                            <Link href={`/capturista/materias/${m.clave}/encuadre`}>
                              {m.encuadreCompleto ? (
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                              ) : (
                                <AlertCircle className="mr-1 h-4 w-4" />
                              )}
                              Ver Encuadre
                            </Link>
                          </Button>
                          <Badge
                            variant={m.encuadreCompleto ? "default" : "secondary"}
                            className={`text-xs ${
                              m.encuadreCompleto
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-orange-500 hover:bg-orange-600"
                            }`}
                          >
                            {m.encuadreCompleto ? "Completo" : "Pendiente"}
                          </Badge>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <Button
                            asChild
                            size="sm"
                            className={`cursor-pointer ${
                              m.puaCompleto
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-orange-500 text-white hover:bg-orange-600"
                            }`}
                          >
                            <Link href={`/capturista/materias/${m.clave}/pua`}>
                              {m.puaCompleto ? (
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                              ) : (
                                <AlertCircle className="mr-1 h-4 w-4" />
                              )}
                              Ver PUA
                            </Link>
                          </Button>
                          <Badge
                            variant={m.puaCompleto ? "default" : "secondary"}
                            className={`text-xs ${
                              m.puaCompleto
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-orange-500 hover:bg-orange-600"
                            }`}
                          >
                            {m.puaCompleto ? "Completo" : "Pendiente"}
                          </Badge>
                        </div>
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