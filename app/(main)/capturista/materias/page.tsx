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
  TableCaption,
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
import { CheckCircle2, AlertCircle, Loader2, Search } from "lucide-react";
import { Label } from "@/components/ui/label";

type MateriaEstado = {
  id: string;
  clave: string;
  nombre: string;
  encuadreCompleto: boolean;
  puaCompleto: boolean;
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
  
  // Estados de filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroProgreso, setFiltroProgreso] = useState<FiltroProgreso>("todas");
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterias = async () => {
      setLoading(true);

      // 1. Obtener solo materias activas
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

      // 2. Para cada materia, verificar estado de encuadre y PUA
      const materiasConEstado = await Promise.all(
        (materiasData || []).map(async (materia: any) => {
          // Verificar si existe un programa
          const { data: programa } = await supabase
            .from("programas")
            .select("id, proposito, competencia, evidencias, unidades")
            .eq("materia_id", materia.id)
            .single();

          let encuadreCompleto = false;
          let puaCompleto = false;

          if (programa) {
            // Verificar encuadre
            const { data: encuadre } = await supabase
              .from("encuadres")
              .select("usuario_id, grupo, periodo, seccion")
              .eq("programa_id", programa.id)
              .single();

            encuadreCompleto = !!(
              encuadre?.usuario_id &&
              encuadre?.grupo &&
              encuadre?.periodo &&
              encuadre?.seccion
            );

            // Verificar PUA (campos básicos)
            puaCompleto = !!(
              programa.proposito &&
              programa.competencia &&
              programa.evidencias &&
              programa.unidades > 0
            );
          }

          return {
            id: materia.id,
            clave: materia.clave,
            nombre: materia.nombre_materia,
            encuadreCompleto,
            puaCompleto,
          };
        })
      );

      setMaterias(materiasConEstado);
      setMateriasFiltradas(materiasConEstado);
      setLoading(false);
    };

    fetchMaterias();
  }, []);

  // Aplicar todos los filtros
  useEffect(() => {
    let filtradas = [...materias];

    // Filtro por búsqueda (nombre o clave)
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtradas = filtradas.filter(
        (m) =>
          m.nombre.toLowerCase().includes(busquedaLower) ||
          m.clave.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por progreso
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

      {/* Panel de Filtros */}
      <div className="mx-auto max-w-6xl mb-6 p-4 border rounded-lg bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda por texto */}
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

          {/* Filtro por progreso */}
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

        {/* Contador y botón limpiar */}
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
              <TableHead className="w-[35%]">Nombre del curso</TableHead>
              <TableHead className="w-[20%] text-center">Clave</TableHead>
              <TableHead className="w-[45%] text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {materiasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-6 text-center text-muted-foreground"
                >
                  No hay materias que coincidan con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              materiasFiltradas.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <span className="block truncate">
                      {m.nombre}
                    </span>
                  </TableCell>

                  <TableCell className="tabular-nums text-center">
                    {m.clave}
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Botón Encuadre */}
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

                      {/* Botón PUA */}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}