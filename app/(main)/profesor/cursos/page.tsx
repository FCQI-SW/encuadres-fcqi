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
  Loader2,
  GraduationCap,
  Search,
  Users,
  FileSignature,
  ClipboardCheck,
  X,
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

export default function CursosProfesorPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filteredCursos, setFilteredCursos] = useState<Curso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("Todos");
  const [selectedGrupo, setSelectedGrupo] = useState<string>("Todos");
  const [loading, setLoading] = useState(true);

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

  return (
    <TooltipProvider>
      <div className="px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Mis Cursos</h1>
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
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    curso.firmas_completadas,
                                    curso.total_alumnos
                                  )}`}
                                >
                                  <FileSignature className="h-3 w-3" />
                                  <span>
                                    {curso.firmas_completadas}/
                                    {curso.total_alumnos}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {curso.firmas_completadas} de{" "}
                                  {curso.total_alumnos} alumnos han firmado el
                                  encuadre
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    curso.avances_completados,
                                    curso.total_alumnos
                                  )}`}
                                >
                                  <ClipboardCheck className="h-3 w-3" />
                                  <span>
                                    {curso.avances_completados}/
                                    {curso.total_alumnos}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {curso.avances_completados} de{" "}
                                  {curso.total_alumnos} alumnos han registrado
                                  avances
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
    </TooltipProvider>
  );
}
