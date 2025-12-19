"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

type Curso = {
  id: string;
  materia_clave: string;
  materia_nombre: string;
  profesor_nombre: string;
  grupo: string;
  periodo: string;
  total_alumnos: number;
  total_temas: number;
  temas_profesor: number;
  porcentaje: number;
  nivel: "alta" | "moderada" | "baja" | "sin_datos";
};

export default function CursosLectorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtroInicial = searchParams.get("filtro") || "todos";

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filteredCursos, setFilteredCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriodo, setSelectedPeriodo] = useState("todos");
  const [selectedNivel, setSelectedNivel] = useState(filtroInicial);
  const [periodos, setPeriodos] = useState<string[]>([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarCursos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [cursos, searchTerm, selectedPeriodo, selectedNivel]);

  async function cargarCursos() {
    setLoading(true);

    try {
      // Obtener encuadres
      const { data: encuadres } = await supabase
        .from("encuadres")
        .select("id, programa_id, usuario_id, grupo, periodo")
        .order("periodo", { ascending: false });

      if (!encuadres) {
        setLoading(false);
        return;
      }

      // Obtener programas y materias
      const programaIds = [...new Set(encuadres.map((e) => e.programa_id))];
      const { data: programas } = await supabase
        .from("programas")
        .select("id, materia_id")
        .in("id", programaIds);

      const materiaIds = [...new Set((programas || []).map((p) => p.materia_id))];
      const { data: materias } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia")
        .in("id", materiaIds);

      // Obtener profesores
      const profesorIds = [...new Set(encuadres.map((e) => e.usuario_id))];
      const { data: profesores } = await supabase
        .from("usuarios")
        .select("id, nombre")
        .in("id", profesorIds);

      // Obtener inscripciones
      const encuadreIds = encuadres.map((e) => e.id);
      const { data: inscripciones } = await supabase
        .from("encuadre_alumnos")
        .select("encuadre_id, alumno_id")
        .in("encuadre_id", encuadreIds)
        .neq("estado", "revocada");

      // Obtener unidades y temas
      const { data: unidades } = await supabase
        .from("unidades")
        .select("id, programa_id")
        .in("programa_id", programaIds);

      const unidadIds = (unidades || []).map((u) => u.id);
      const { data: temas } = await supabase
        .from("temas")
        .select("id, unidad_id")
        .in("unidad_id", unidadIds);

      const temaIds = (temas || []).map((t) => t.id);
      const { data: checkins } = await supabase
        .from("temas_checkin")
        .select("tema_id, usuario_id, grupo, tema_visto")
        .in("tema_id", temaIds);

      // Crear mapas
      const programaMap = new Map((programas || []).map((p) => [p.id, p]));
      const materiaMap = new Map((materias || []).map((m) => [m.id, m]));
      const profesorMap = new Map((profesores || []).map((p) => [p.id, p]));
      const unidadToProgramaMap = new Map((unidades || []).map((u) => [u.id, u.programa_id]));

      // Temas por programa
      const temasCountByPrograma = new Map<string, number>();
      const temaIdsByPrograma = new Map<string, number[]>();
      (temas || []).forEach((t) => {
        const programaId = unidadToProgramaMap.get(t.unidad_id);
        if (programaId) {
          temasCountByPrograma.set(programaId, (temasCountByPrograma.get(programaId) || 0) + 1);
          if (!temaIdsByPrograma.has(programaId)) {
            temaIdsByPrograma.set(programaId, []);
          }
          temaIdsByPrograma.get(programaId)!.push(t.id);
        }
      });

      // Check-ins map
      const checkinsMap = new Map<string, boolean>();
      (checkins || []).forEach((c) => {
        const key = `${c.usuario_id}_${c.grupo}_${c.tema_id}`;
        checkinsMap.set(key, c.tema_visto);
      });

      // Contar alumnos por encuadre
      const alumnosPorEncuadre = new Map<string, number>();
      (inscripciones || []).forEach((i) => {
        alumnosPorEncuadre.set(
          i.encuadre_id,
          (alumnosPorEncuadre.get(i.encuadre_id) || 0) + 1
        );
      });

      // Construir cursos
      const cursosData: Curso[] = [];
      const periodosSet = new Set<string>();

      for (const encuadre of encuadres) {
        const programa = programaMap.get(encuadre.programa_id);
        const materia = programa ? materiaMap.get(programa.materia_id) : null;
        const profesor = profesorMap.get(encuadre.usuario_id);
        const totalTemas = temasCountByPrograma.get(encuadre.programa_id) || 0;
        const temasDelPrograma = temaIdsByPrograma.get(encuadre.programa_id) || [];
        const totalAlumnos = alumnosPorEncuadre.get(encuadre.id) || 0;

        if (encuadre.periodo) periodosSet.add(encuadre.periodo);

        // Contar temas registrados por profesor
        let temasProfesor = 0;
        temasDelPrograma.forEach((temaId) => {
          const key = `${encuadre.usuario_id}_${encuadre.grupo}_${temaId}`;
          if (checkinsMap.has(key)) temasProfesor++;
        });

        // Calcular coincidencia promedio
        const alumnosDelEncuadre = (inscripciones || [])
          .filter((i) => i.encuadre_id === encuadre.id)
          .map((i) => i.alumno_id);

        let coincidencias = 0;
        let comparables = 0;

        for (const alumnoId of alumnosDelEncuadre) {
          for (const temaId of temasDelPrograma) {
            const keyProfesor = `${encuadre.usuario_id}_${encuadre.grupo}_${temaId}`;
            const keyAlumno = `${alumnoId}_${encuadre.grupo}_${temaId}`;

            if (checkinsMap.has(keyProfesor) && checkinsMap.has(keyAlumno)) {
              comparables++;
              if (checkinsMap.get(keyProfesor) === checkinsMap.get(keyAlumno)) {
                coincidencias++;
              }
            }
          }
        }

        const porcentaje = comparables > 0
          ? Math.round((coincidencias / comparables) * 100)
          : 0;

        let nivel: "alta" | "moderada" | "baja" | "sin_datos" = "sin_datos";
        if (comparables > 0) {
          if (porcentaje >= 80) nivel = "alta";
          else if (porcentaje >= 50) nivel = "moderada";
          else nivel = "baja";
        }

        cursosData.push({
          id: encuadre.id,
          materia_clave: materia?.clave || "N/A",
          materia_nombre: materia?.nombre_materia || "Sin materia",
          profesor_nombre: profesor?.nombre || "Sin profesor",
          grupo: encuadre.grupo,
          periodo: encuadre.periodo || "Sin periodo",
          total_alumnos: totalAlumnos,
          total_temas: totalTemas,
          temas_profesor: temasProfesor,
          porcentaje,
          nivel,
        });
      }

      setCursos(cursosData);
      setPeriodos(Array.from(periodosSet).sort().reverse());
    } catch (err) {
      console.error("Error cargando cursos:", err);
    }

    setLoading(false);
  }

  function aplicarFiltros() {
    let filtered = [...cursos];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.materia_nombre.toLowerCase().includes(term) ||
          c.materia_clave.toLowerCase().includes(term) ||
          c.profesor_nombre.toLowerCase().includes(term) ||
          c.grupo.toLowerCase().includes(term)
      );
    }

    if (selectedPeriodo !== "todos") {
      filtered = filtered.filter((c) => c.periodo === selectedPeriodo);
    }

    if (selectedNivel !== "todos") {
      filtered = filtered.filter((c) => c.nivel === selectedNivel);
    }

    setFilteredCursos(filtered);
    setCurrentPage(1);
  }

  const limpiarFiltros = () => {
    setSearchTerm("");
    setSelectedPeriodo("todos");
    setSelectedNivel("todos");
  };

  const hayFiltrosActivos =
    searchTerm || selectedPeriodo !== "todos" || selectedNivel !== "todos";

  // Paginación
  const totalPages = Math.ceil(filteredCursos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredCursos.slice(startIndex, startIndex + itemsPerPage);

  const getNivelBadge = (nivel: string, porcentaje: number) => {
    switch (nivel) {
      case "alta":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> {porcentaje}%
          </span>
        );
      case "moderada":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
            <BarChart3 className="w-3 h-3" /> {porcentaje}%
          </span>
        );
      case "baja":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" /> {porcentaje}%
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
            Sin datos
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Cursos</h1>
          <p className="text-sm text-muted-foreground">
            Visualiza el progreso de todos los encuadres
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/lector")}
          className="cursor-pointer"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por materia, profesor o grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los periodos</SelectItem>
                {periodos.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedNivel} onValueChange={setSelectedNivel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Nivel de coincidencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                <SelectItem value="alta">Alta (≥80%)</SelectItem>
                <SelectItem value="moderada">Moderada (50-79%)</SelectItem>
                <SelectItem value="baja">Baja (&lt;50%)</SelectItem>
                <SelectItem value="sin_datos">Sin datos</SelectItem>
              </SelectContent>
            </Select>

            {hayFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Mostrando {filteredCursos.length} de {cursos.length} cursos
          </p>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          {filteredCursos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron cursos</p>
              <p className="text-sm">Intenta con otros filtros de búsqueda</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Materia</TableHead>
                      <TableHead>Profesor</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead className="text-center">Alumnos</TableHead>
                      <TableHead className="text-center">Avance Prof.</TableHead>
                      <TableHead className="text-center">Coincidencia</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((curso) => (
                      <TableRow key={curso.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{curso.materia_clave}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {curso.materia_nombre}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{curso.profesor_nombre}</TableCell>
                        <TableCell>{curso.grupo}</TableCell>
                        <TableCell>{curso.periodo}</TableCell>
                        <TableCell className="text-center">
                          {curso.total_alumnos}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm">
                            {curso.temas_profesor}/{curso.total_temas}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getNivelBadge(curso.nivel, curso.porcentaje)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/lector/cursos/${curso.id}`)}
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-1" /> Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="cursor-pointer"
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