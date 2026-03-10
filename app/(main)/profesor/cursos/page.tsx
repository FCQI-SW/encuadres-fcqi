"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  GraduationCap,
  Search,
  Users,
  FileSignature,
  ClipboardCheck,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";

type Curso = {
  id: string;
  encuadre_id: string;
  materia_clave: string;
  materia_nombre: string;
  grupo: string;
  periodo: string;
  total_alumnos: number;
  firmas_completadas: number;
  avances_completados: number;
};

type AlumnoDetalle = {
  id: string;
  correo: string;
  nombre: string | null;
  completado: boolean;
  fecha: string | null;
};

export default function CursosProfesorPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filteredCursos, setFilteredCursos] = useState<Curso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("Todos");
  const [selectedGrupo, setSelectedGrupo] = useState<string>("Todos");
  const [loading, setLoading] = useState(true);

  // Estados para el modal de detalles
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<"firmas" | "avances">("firmas");
  const [modalCurso, setModalCurso] = useState<Curso | null>(null);
  const [alumnosDetalle, setAlumnosDetalle] = useState<AlumnoDetalle[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      cargarCursos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const cargarCursos = async () => {
    if (!session?.user?.id) return;

    setLoading(true);

    try {
      const { data: encuadres, error: errorEncuadres } = await supabase
        .from("encuadres")
        .select("id, programa_id, grupo, periodo")
        .eq("usuario_id", session.user.id)
        .order("periodo", { ascending: false });

      if (errorEncuadres || !encuadres) {
        console.error("Error al obtener encuadres:", errorEncuadres);
        setLoading(false);
        return;
      }

      if (encuadres.length === 0) {
        setCursos([]);
        setFilteredCursos([]);
        setLoading(false);
        return;
      }

      const programaIds = encuadres.map((e) => e.programa_id);
      const { data: programas } = await supabase
        .from("programas")
        .select("id, materia_id")
        .in("id", programaIds);

      const materiaIds = (programas || []).map((p: any) => p.materia_id);
      const { data: materias } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia")
        .in("id", materiaIds);

      const encuadreIds = encuadres.map((e) => e.id);

      // Obtener alumnos inscritos
      const { data: alumnosData } = await supabase
        .from("encuadre_alumnos")
        .select("encuadre_id, alumno_id")
        .in("encuadre_id", encuadreIds)
        .neq("estado", "revocada");

      // Obtener firmas
      const { data: firmasData } = await supabase
        .from("encuadre_firmas")
        .select("encuadre_id, alumno_id")
        .in("encuadre_id", encuadreIds);

      // Obtener avances (alumnos que han registrado al menos un check-in)
      const { data: avancesData } = await supabase
        .from("temas_checkin")
        .select("encuadre_id, usuario_id")
        .in("encuadre_id", encuadreIds);

      const programaMap = new Map((programas || []).map((p: any) => [p.id, p]));
      const materiaMap = new Map((materias || []).map((m: any) => [m.id, m]));

      // Contar alumnos por encuadre
      const alumnosCountMap = new Map<string, number>();
      (alumnosData || []).forEach((a: any) => {
        const count = alumnosCountMap.get(a.encuadre_id) || 0;
        alumnosCountMap.set(a.encuadre_id, count + 1);
      });

      // Contar firmas por encuadre
      const firmasCountMap = new Map<string, number>();
      (firmasData || []).forEach((f: any) => {
        const count = firmasCountMap.get(f.encuadre_id) || 0;
        firmasCountMap.set(f.encuadre_id, count + 1);
      });

      // Contar alumnos únicos que han registrado avances por encuadre
      const avancesMap = new Map<string, Set<string>>();
      (avancesData || []).forEach((a: any) => {
        if (!avancesMap.has(a.encuadre_id)) {
          avancesMap.set(a.encuadre_id, new Set());
        }
        avancesMap.get(a.encuadre_id)?.add(a.usuario_id);
      });

      const cursosFormateados: Curso[] = encuadres.map((e: any) => {
        const programa = programaMap.get(e.programa_id);
        const materia = programa ? materiaMap.get(programa.materia_id) : null;

        return {
          id: e.programa_id,
          encuadre_id: e.id,
          materia_clave: materia?.clave || "N/A",
          materia_nombre: materia?.nombre_materia || "Sin información",
          grupo: e.grupo,
          periodo: e.periodo,
          total_alumnos: alumnosCountMap.get(e.id) || 0,
          firmas_completadas: firmasCountMap.get(e.id) || 0,
          avances_completados: avancesMap.get(e.id)?.size || 0,
        };
      });

      setCursos(cursosFormateados);
      setFilteredCursos(cursosFormateados);
    } catch (err) {
      console.error("Error:", err);
    }

    setLoading(false);
  };

  // Cargar detalles de firmas o avances
  const cargarDetalle = async (curso: Curso, tipo: "firmas" | "avances") => {
    setLoadingDetalle(true);
    setAlumnosDetalle([]);

    try {
      // Obtener todos los alumnos del encuadre
      const { data: alumnosEncuadre } = await supabase
        .from("encuadre_alumnos")
        .select(
          `
          alumno_id,
          usuarios!encuadre_alumnos_alumno_id_fkey (
            id,
            correo,
            nombre
          )
        `
        )
        .eq("encuadre_id", curso.encuadre_id)
        .neq("estado", "revocada");

      if (!alumnosEncuadre || alumnosEncuadre.length === 0) {
        setAlumnosDetalle([]);
        setLoadingDetalle(false);
        return;
      }

      if (tipo === "firmas") {
        // Obtener firmas de este encuadre
        const { data: firmas } = await supabase
          .from("encuadre_firmas")
          .select("alumno_id, firmado_at")
          .eq("encuadre_id", curso.encuadre_id);

        const firmasMap = new Map(
          (firmas || []).map((f: any) => [f.alumno_id, f.firmado_at])
        );

        const detalle: AlumnoDetalle[] = alumnosEncuadre.map((ae: any) => ({
          id: ae.alumno_id,
          correo: ae.usuarios?.correo || "Sin correo",
          nombre: ae.usuarios?.nombre || null,
          completado: firmasMap.has(ae.alumno_id),
          fecha: firmasMap.get(ae.alumno_id) || null,
        }));

        // Ordenar: primero los que NO han firmado
        detalle.sort((a, b) => {
          if (a.completado === b.completado) return 0;
          return a.completado ? 1 : -1;
        });

        setAlumnosDetalle(detalle);
      } else {
        // Obtener avances de este encuadre
        const { data: avances } = await supabase
          .from("temas_checkin")
          .select("usuario_id, created_at")
          .eq("encuadre_id", curso.encuadre_id);

        // Agrupar por usuario y obtener la fecha más reciente
        const avancesMap = new Map<string, string>();
        (avances || []).forEach((a: any) => {
          const existente = avancesMap.get(a.usuario_id);
          if (!existente || new Date(a.created_at) > new Date(existente)) {
            avancesMap.set(a.usuario_id, a.created_at);
          }
        });

        const detalle: AlumnoDetalle[] = alumnosEncuadre.map((ae: any) => ({
          id: ae.alumno_id,
          correo: ae.usuarios?.correo || "Sin correo",
          nombre: ae.usuarios?.nombre || null,
          completado: avancesMap.has(ae.alumno_id),
          fecha: avancesMap.get(ae.alumno_id) || null,
        }));

        // Ordenar: primero los que NO han registrado avances
        detalle.sort((a, b) => {
          if (a.completado === b.completado) return 0;
          return a.completado ? 1 : -1;
        });

        setAlumnosDetalle(detalle);
      }
    } catch (err) {
      console.error("Error al cargar detalle:", err);
    }

    setLoadingDetalle(false);
  };

  const handleOpenModal = (
    curso: Curso,
    tipo: "firmas" | "avances",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setModalCurso(curso);
    setModalTipo(tipo);
    setModalOpen(true);
    cargarDetalle(curso, tipo);
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    let filtered = [...cursos];

    // Filtro por periodo
    if (selectedPeriodo !== "Todos") {
      filtered = filtered.filter((c) => c.periodo === selectedPeriodo);
    }

    // Filtro por grupo
    if (selectedGrupo !== "Todos") {
      filtered = filtered.filter((c) => c.grupo === selectedGrupo);
    }

    // Búsqueda por texto
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.materia_clave.toLowerCase().includes(term) ||
          c.materia_nombre.toLowerCase().includes(term) ||
          c.grupo.toLowerCase().includes(term) ||
          c.periodo.toLowerCase().includes(term)
      );
    }

    setFilteredCursos(filtered);
  }, [searchTerm, selectedPeriodo, selectedGrupo, cursos]);

  const periodos = Array.from(new Set(cursos.map((c) => c.periodo)));
  const grupos = Array.from(new Set(cursos.map((c) => c.grupo)));

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedPeriodo("Todos");
    setSelectedGrupo("Todos");
  };

  const hasActiveFilters =
    searchTerm || selectedPeriodo !== "Todos" || selectedGrupo !== "Todos";

  const handleVerCurso = (encuadreId: string) => {
    router.push(`/profesor/cursos/${encuadreId}`);
  };

  // Función para obtener el color del badge según el porcentaje
  const getStatusColor = (completados: number, total: number) => {
    if (total === 0) return "bg-gray-100 text-gray-500";
    const porcentaje = (completados / total) * 100;
    if (porcentaje === 100) return "bg-green-100 text-green-700";
    if (porcentaje >= 50) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  const completados = alumnosDetalle.filter((a) => a.completado).length;
  const pendientes = alumnosDetalle.length - completados;

  return (
    <TooltipProvider>
      <div className="px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mt-1">
                Administra tus cursos, alumnos y avances
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GraduationCap className="h-5 w-5" />
              <span className="font-semibold">{cursos.length}</span>
              <span>cursos asignados</span>
            </div>
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
                      type="text"
                      placeholder="Buscar por clave, materia, grupo o periodo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-80"
                    />
                  </div>

                  {/* Filtro por periodo */}
                  <Select
                    value={selectedPeriodo}
                    onValueChange={setSelectedPeriodo}
                  >
                    <SelectTrigger className="min-w-[180px]">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos los periodos</SelectItem>
                      {periodos.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro por grupo */}
                  <Select
                    value={selectedGrupo}
                    onValueChange={setSelectedGrupo}
                  >
                    <SelectTrigger className="min-w-[140px]">
                      <SelectValue placeholder="Grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos los grupos</SelectItem>
                      {grupos.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
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
                  Mostrando {filteredCursos.length} de {cursos.length} cursos
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredCursos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchTerm
                      ? "No se encontraron cursos"
                      : "Sin cursos asignados"}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm
                      ? "Intenta con otros términos de búsqueda"
                      : "Aún no tienes cursos asignados"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Cursos</CardTitle>
                <CardDescription>
                  Haz clic en un curso para gestionar encuadre, alumnos y
                  avances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clave</TableHead>
                        <TableHead>Materia</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead className="text-center">Alumnos</TableHead>
                        <TableHead className="text-center">Firmas</TableHead>
                        <TableHead className="text-center">Avances</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCursos.map((curso) => (
                        <TableRow
                          key={curso.encuadre_id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleVerCurso(curso.encuadre_id)}
                        >
                          <TableCell className="font-medium">
                            {curso.materia_clave}
                          </TableCell>
                          <TableCell>{curso.materia_nombre}</TableCell>
                          <TableCell>{curso.periodo}</TableCell>
                          <TableCell>{curso.grupo}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>{curso.total_alumnos}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) =>
                                    handleOpenModal(curso, "firmas", e)
                                  }
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors hover:opacity-80 ${getStatusColor(
                                    curso.firmas_completadas,
                                    curso.total_alumnos
                                  )}`}
                                >
                                  <FileSignature className="h-3 w-3" />
                                  <span>
                                    {curso.firmas_completadas}/
                                    {curso.total_alumnos}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {curso.firmas_completadas} de{" "}
                                  {curso.total_alumnos} alumnos han firmado el
                                  encuadre. Clic para ver detalles.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) =>
                                    handleOpenModal(curso, "avances", e)
                                  }
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors hover:opacity-80 ${getStatusColor(
                                    curso.avances_completados,
                                    curso.total_alumnos
                                  )}`}
                                >
                                  <ClipboardCheck className="h-3 w-3" />
                                  <span>
                                    {curso.avances_completados}/
                                    {curso.total_alumnos}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {curso.avances_completados} de{" "}
                                  {curso.total_alumnos} alumnos han registrado
                                  avances. Clic para ver detalles.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerCurso(curso.encuadre_id);
                              }}
                              className="cursor-pointer"
                            >
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Gestionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de detalles de firmas/avances */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalTipo === "firmas" ? (
                <FileSignature className="h-5 w-5 text-[#00723F]" />
              ) : (
                <ClipboardCheck className="h-5 w-5 text-[#00723F]" />
              )}
              {modalTipo === "firmas"
                ? "Firmas del Encuadre"
                : "Registro de Avances"}
            </DialogTitle>
            <DialogDescription>
              {modalCurso?.materia_nombre} - Grupo {modalCurso?.grupo}
            </DialogDescription>
          </DialogHeader>

          {/* Resumen */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  <strong>{completados}</strong>{" "}
                  {modalTipo === "firmas" ? "firmaron" : "registraron"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">
                  <strong>{pendientes}</strong> pendientes
                </span>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                completados === alumnosDetalle.length &&
                alumnosDetalle.length > 0
                  ? "bg-green-100 text-green-800"
                  : alumnosDetalle.length === 0
                  ? "bg-gray-100 text-gray-600"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {completados}/{alumnosDetalle.length}
            </div>
          </div>

          {/* Tabla de alumnos */}
          {loadingDetalle ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#00723F]" />
            </div>
          ) : alumnosDetalle.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay alumnos registrados en este curso</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Estado</TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>
                      {modalTipo === "firmas"
                        ? "Fecha de firma"
                        : "Último registro"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alumnosDetalle.map((alumno) => (
                    <TableRow key={alumno.id}>
                      <TableCell>
                        {alumno.completado ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {alumno.nombre || alumno.correo}
                          </p>
                          {alumno.nombre && (
                            <p className="text-sm text-muted-foreground">
                              {alumno.correo}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {alumno.completado ? (
                          formatearFecha(alumno.fecha)
                        ) : (
                          <span className="text-red-500 font-medium">
                            Pendiente
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}