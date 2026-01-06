"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  BarChart3,
  X,
} from "lucide-react";

type MatchData = {
  id: string;
  encuadre_id: string;
  alumno_id: string;
  materia_clave: string;
  materia_nombre: string;
  profesor_nombre: string;
  alumno_nombre: string;
  grupo: string;
  periodo: string;
  porcentaje: number;
  temas_profesor: number;
  temas_alumno: number;
  total_temas: number;
  nivelDiscrepancia: "Coincidencia" | "Moderada" | "Alta" | "Sin datos";
};

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<MatchData[]>([]);
  const [filteredData, setFilteredData] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscrepancia, setSelectedDiscrepancia] =
    useState<string>("Todos");
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("Todos");
  const [periodos, setPeriodos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      // 1. Obtener todos los encuadres
      const { data: encuadres, error: errorEncuadres } = await supabase
        .from("encuadres")
        .select("id, programa_id, usuario_id, grupo, periodo")
        .order("periodo", { ascending: false });

      if (errorEncuadres || !encuadres) {
        console.error("Error al cargar encuadres:", errorEncuadres);
        setLoading(false);
        return;
      }

      // 2. Obtener programas y materias
      const programaIds = [...new Set(encuadres.map((e) => e.programa_id))];
      const { data: programas } = await supabase
        .from("programas")
        .select("id, materia_id")
        .in("id", programaIds);

      const materiaIds = [
        ...new Set((programas || []).map((p: any) => p.materia_id)),
      ];
      const { data: materias } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia")
        .in("id", materiaIds);

      // 3. Obtener profesores
      const profesorIds = [...new Set(encuadres.map((e) => e.usuario_id))];
      const { data: profesores } = await supabase
        .from("usuarios")
        .select("id, nombre")
        .in("id", profesorIds);

      // 4. Obtener alumnos inscritos
      const encuadreIds = encuadres.map((e) => e.id);
      const { data: inscripciones } = await supabase
        .from("encuadre_alumnos")
        .select("encuadre_id, alumno_id")
        .in("encuadre_id", encuadreIds)
        .neq("estado", "revocada");

      // 5. Obtener datos de alumnos
      const alumnoIds = [
        ...new Set((inscripciones || []).map((i: any) => i.alumno_id)),
      ];
      const { data: alumnos } = await supabase
        .from("usuarios")
        .select("id, nombre")
        .in("id", alumnoIds);

      // 6. Obtener unidades por programa
      const { data: unidades } = await supabase
        .from("unidades")
        .select("id, programa_id")
        .in("programa_id", programaIds);

      // 7. Obtener temas por unidad
      const unidadIds = (unidades || []).map((u: any) => u.id);
      const { data: temas } = await supabase
        .from("temas")
        .select("id, unidad_id")
        .in("unidad_id", unidadIds);

      // 8. Obtener todos los check-ins
      const temaIds = (temas || []).map((t: any) => t.id);
      const { data: checkins } = await supabase
        .from("temas_checkin")
        .select("tema_id, usuario_id, grupo, tema_visto")
        .in("tema_id", temaIds);

      // Crear mapas para búsqueda rápida
      const programaMap = new Map((programas || []).map((p: any) => [p.id, p]));
      const materiaMap = new Map((materias || []).map((m: any) => [m.id, m]));
      const profesorMap = new Map(
        (profesores || []).map((p: any) => [p.id, p])
      );
      const alumnoMap = new Map((alumnos || []).map((a: any) => [a.id, a]));

      // Crear mapa de unidad -> programa
      const unidadToProgramaMap = new Map(
        (unidades || []).map((u: any) => [u.id, u.programa_id])
      );

      // Contar temas por programa
      const temasCountByPrograma = new Map<string, number>();
      (temas || []).forEach((t: any) => {
        const programaId = unidadToProgramaMap.get(t.unidad_id);
        if (programaId) {
          temasCountByPrograma.set(
            programaId,
            (temasCountByPrograma.get(programaId) || 0) + 1
          );
        }
      });

      // Obtener temas IDs por programa
      const temaIdsByPrograma = new Map<string, number[]>();
      (temas || []).forEach((t: any) => {
        const programaId = unidadToProgramaMap.get(t.unidad_id);
        if (programaId) {
          if (!temaIdsByPrograma.has(programaId)) {
            temaIdsByPrograma.set(programaId, []);
          }
          temaIdsByPrograma.get(programaId)!.push(t.id);
        }
      });

      // Agrupar check-ins - guardar el valor real (true/false)
      const checkinsMap = new Map<string, boolean>();
      (checkins || []).forEach((c: any) => {
        const key = `${c.usuario_id}_${c.grupo}_${c.tema_id}`;
        checkinsMap.set(key, c.tema_visto);
      });

      // Construir datos de comparación
      const resultados: MatchData[] = [];

      for (const inscripcion of inscripciones || []) {
        const encuadre = encuadres.find(
          (e) => e.id === inscripcion.encuadre_id
        );
        if (!encuadre) continue;

        const programa = programaMap.get(encuadre.programa_id);
        const materia = programa ? materiaMap.get(programa.materia_id) : null;
        const profesor = profesorMap.get(encuadre.usuario_id);
        const alumno = alumnoMap.get(inscripcion.alumno_id);

        const totalTemas = temasCountByPrograma.get(encuadre.programa_id) || 0;
        const temasDelPrograma =
          temaIdsByPrograma.get(encuadre.programa_id) || [];

        // Contar check-ins del profesor (cualquier registro, sea true o false)
        let temasProfesorRegistrados = 0;
        const checkinsProfesor = new Map<number, boolean>();
        temasDelPrograma.forEach((temaId) => {
          const key = `${encuadre.usuario_id}_${encuadre.grupo}_${temaId}`;
          if (checkinsMap.has(key)) {
            temasProfesorRegistrados++;
            checkinsProfesor.set(temaId, checkinsMap.get(key)!);
          }
        });

        // Contar check-ins del alumno (cualquier registro, sea true o false)
        let temasAlumnoRegistrados = 0;
        const checkinsAlumno = new Map<number, boolean>();
        temasDelPrograma.forEach((temaId) => {
          const key = `${inscripcion.alumno_id}_${encuadre.grupo}_${temaId}`;
          if (checkinsMap.has(key)) {
            temasAlumnoRegistrados++;
            checkinsAlumno.set(temaId, checkinsMap.get(key)!);
          }
        });

        // Calcular porcentaje de coincidencia
        let porcentaje = 0;
        let nivelDiscrepancia:
          | "Coincidencia"
          | "Moderada"
          | "Alta"
          | "Sin datos" = "Sin datos";

        if (
          totalTemas > 0 &&
          (temasProfesorRegistrados > 0 || temasAlumnoRegistrados > 0)
        ) {
          // Calcular coincidencias: temas donde AMBOS tienen registro Y el valor es igual
          let coincidencias = 0;
          let comparables = 0;

          temasDelPrograma.forEach((temaId) => {
            const profesorTieneRegistro = checkinsProfesor.has(temaId);
            const alumnoTieneRegistro = checkinsAlumno.has(temaId);

            if (profesorTieneRegistro && alumnoTieneRegistro) {
              comparables++;
              const valorProfesor = checkinsProfesor.get(temaId);
              const valorAlumno = checkinsAlumno.get(temaId);
              if (valorProfesor === valorAlumno) {
                coincidencias++;
              }
            }
          });

          // El porcentaje se basa en los temas donde ambos tienen registro
          if (comparables > 0) {
            porcentaje = Math.round((coincidencias / comparables) * 100);
          }

          if (porcentaje >= 80) {
            nivelDiscrepancia = "Coincidencia";
          } else if (porcentaje >= 50) {
            nivelDiscrepancia = "Moderada";
          } else {
            nivelDiscrepancia = "Alta";
          }
        }

        resultados.push({
          id: `${encuadre.id}_${inscripcion.alumno_id}`,
          encuadre_id: encuadre.id,
          alumno_id: inscripcion.alumno_id,
          materia_clave: materia?.clave || "N/A",
          materia_nombre: materia?.nombre_materia || "Sin información",
          profesor_nombre: profesor?.nombre || "Sin asignar",
          alumno_nombre: alumno?.nombre || "Sin información",
          grupo: encuadre.grupo,
          periodo: encuadre.periodo,
          porcentaje,
          temas_profesor: temasProfesorRegistrados,
          temas_alumno: temasAlumnoRegistrados,
          total_temas: totalTemas,
          nivelDiscrepancia,
        });
      }

      // Obtener periodos únicos
      const periodosUnicos = [...new Set(resultados.map((r) => r.periodo))];
      setPeriodos(periodosUnicos);

      setData(resultados);
      setFilteredData(resultados);
    } catch (err) {
      console.error("Error:", err);
    }

    setLoading(false);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedDiscrepancia("Todos");
    setSelectedPeriodo("Todos");
  };

  // Verificar si hay filtros activos
  const hasActiveFilters =
    searchTerm ||
    selectedDiscrepancia !== "Todos" ||
    selectedPeriodo !== "Todos";

  // Filtrado
  useEffect(() => {
    let filtered = data;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.materia_nombre.toLowerCase().includes(term) ||
          item.materia_clave.toLowerCase().includes(term) ||
          item.profesor_nombre.toLowerCase().includes(term) ||
          item.alumno_nombre.toLowerCase().includes(term)
      );
    }

    if (selectedDiscrepancia !== "Todos") {
      filtered = filtered.filter(
        (item) => item.nivelDiscrepancia === selectedDiscrepancia
      );
    }

    if (selectedPeriodo !== "Todos") {
      filtered = filtered.filter((item) => item.periodo === selectedPeriodo);
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedDiscrepancia, selectedPeriodo, data]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleVerDetalles = (item: MatchData) => {
    router.push(`/admin/resultados/${item.encuadre_id}/${item.alumno_id}`);
  };

  // Estadísticas
  const stats = {
    total: filteredData.length,
    coincidencia: filteredData.filter(
      (d) => d.nivelDiscrepancia === "Coincidencia"
    ).length,
    moderada: filteredData.filter((d) => d.nivelDiscrepancia === "Moderada")
      .length,
    alta: filteredData.filter((d) => d.nivelDiscrepancia === "Alta").length,
    sinDatos: filteredData.filter((d) => d.nivelDiscrepancia === "Sin datos")
      .length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Revisión de Resultados</h1>
          <p className="text-muted-foreground">
            Comparación de avances entre profesores y alumnos
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin")}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coincidencia</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.coincidencia}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moderada</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.moderada}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alta</p>
                <p className="text-2xl font-bold text-red-600">{stats.alta}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin datos</p>
                <p className="text-2xl font-bold text-gray-500">
                  {stats.sinDatos}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Búsqueda y filtros en la misma fila */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Búsqueda */}
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por materia, profesor o alumno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80"
                />
              </div>

              {/* Filtros por categorías */}
              <Select
                value={selectedPeriodo}
                onValueChange={setSelectedPeriodo}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo} value={periodo}>
                      {periodo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedDiscrepancia}
                onValueChange={setSelectedDiscrepancia}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Nivel de discrepancia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Coincidencia">Coincidencia</SelectItem>
                  <SelectItem value="Moderada">Moderada</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Sin datos">Sin datos</SelectItem>
                </SelectContent>
              </Select>

              {/* Botón limpiar filtros */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleClearFilters}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 cursor-pointer font-medium"
                >
                  <X className="h-5 w-5 mr-2" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            {/* Contador de resultados */}
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredData.length} de {data.length} resultados
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                No se encontraron resultados
              </p>
              <p className="text-sm">Intenta con otros filtros de búsqueda</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materia</TableHead>
                    <TableHead>Profesor</TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-center">Avances</TableHead>
                    <TableHead className="text-center">
                      % Coincidencia
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.materia_clave}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.materia_nombre}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.profesor_nombre}</TableCell>
                      <TableCell>{item.alumno_nombre}</TableCell>
                      <TableCell>{item.grupo}</TableCell>
                      <TableCell>{item.periodo}</TableCell>
                      <TableCell className="text-center">
                        <div className="text-xs">
                          <p>
                            Prof: {item.temas_profesor}/{item.total_temas}
                          </p>
                          <p>
                            Alum: {item.temas_alumno}/{item.total_temas}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold ${
                            item.porcentaje >= 80
                              ? "text-green-600"
                              : item.porcentaje >= 50
                              ? "text-yellow-600"
                              : item.porcentaje > 0
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {item.nivelDiscrepancia === "Sin datos"
                            ? "—"
                            : `${item.porcentaje}%`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.nivelDiscrepancia === "Coincidencia" && (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />{" "}
                            Coincidencia
                          </span>
                        )}
                        {item.nivelDiscrepancia === "Moderada" && (
                          <span className="flex items-center text-yellow-600">
                            <AlertTriangle className="w-4 h-4 mr-1" /> Moderada
                          </span>
                        )}
                        {item.nivelDiscrepancia === "Alta" && (
                          <span className="flex items-center text-red-600">
                            <XCircle className="w-4 h-4 mr-1" /> Alta
                          </span>
                        )}
                        {item.nivelDiscrepancia === "Sin datos" && (
                          <span className="flex items-center text-gray-500">
                            <BarChart3 className="w-4 h-4 mr-1" /> Sin datos
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => handleVerDetalles(item)}
                        >
                          <Search className="w-4 h-4 mr-1" /> Ver detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    className="cursor-pointer"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        className={
                          currentPage === pageNum
                            ? "bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
                            : "cursor-pointer"
                        }
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-2 py-2">...</span>}
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    className="cursor-pointer"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
