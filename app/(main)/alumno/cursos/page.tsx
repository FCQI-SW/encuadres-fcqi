"use client";

import { useEffect, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, GraduationCap, Search, BookOpen } from "lucide-react";

type Curso = {
  id: string;
  encuadre_id: string;
  materia_clave: string;
  materia_nombre: string;
  grupo: string;
  periodo: string;
  docente: string;
  firmado: boolean;
};

export default function CursosAlumnoPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filteredCursos, setFilteredCursos] = useState<Curso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      // Obtener los encuadres donde el alumno está inscrito
      const { data: inscripciones, error: errorInscripciones } = await supabase
        .from("encuadre_alumnos")
        .select("encuadre_id")
        .eq("alumno_id", session.user.id)
        .neq("estado", "revocada");

      if (errorInscripciones || !inscripciones || inscripciones.length === 0) {
        setCursos([]);
        setFilteredCursos([]);
        setLoading(false);
        return;
      }

      const encuadreIds = inscripciones.map((i) => i.encuadre_id);

      // Obtener los encuadres
      const { data: encuadres, error: errorEncuadres } = await supabase
        .from("encuadres")
        .select("id, programa_id, grupo, periodo, usuario_id")
        .in("id", encuadreIds)
        .order("periodo", { ascending: false });

      if (errorEncuadres || !encuadres) {
        console.error("Error al obtener encuadres:", errorEncuadres);
        setLoading(false);
        return;
      }

      // Obtener programas
      const programaIds = encuadres.map((e) => e.programa_id);
      const { data: programas } = await supabase
        .from("programas")
        .select("id, materia_id")
        .in("id", programaIds);

      // Obtener materias
      const materiaIds = (programas || []).map((p: any) => p.materia_id);
      const { data: materias } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia")
        .in("id", materiaIds);

      // Obtener docentes
      const docenteIds = encuadres.map((e) => e.usuario_id);
      const { data: docentes } = await supabase
        .from("usuarios")
        .select("id, nombre")
        .in("id", docenteIds);

      // Obtener firmas del alumno
      const { data: firmas } = await supabase
        .from("encuadre_firmas")
        .select("encuadre_id")
        .eq("alumno_id", session.user.id)
        .in("encuadre_id", encuadreIds);

      const firmasSet = new Set((firmas || []).map((f: any) => f.encuadre_id));

      // Crear mapas
      const programaMap = new Map((programas || []).map((p: any) => [p.id, p]));
      const materiaMap = new Map((materias || []).map((m: any) => [m.id, m]));
      const docenteMap = new Map((docentes || []).map((d: any) => [d.id, d]));

      const cursosFormateados: Curso[] = encuadres.map((e: any) => {
        const programa = programaMap.get(e.programa_id);
        const materia = programa ? materiaMap.get(programa.materia_id) : null;
        const docente = docenteMap.get(e.usuario_id);

        return {
          id: e.programa_id,
          encuadre_id: e.id,
          materia_clave: materia?.clave || "N/A",
          materia_nombre: materia?.nombre_materia || "Sin información",
          grupo: e.grupo,
          periodo: e.periodo,
          docente: docente?.nombre || "Sin asignar",
          firmado: firmasSet.has(e.id),
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
    if (searchTerm.trim() === "") {
      setFilteredCursos(cursos);
    } else {
      const filtered = cursos.filter(
        (c) =>
          c.materia_clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.materia_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.periodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.docente.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCursos(filtered);
    }
  }, [searchTerm, cursos]);

  const handleVerCurso = (encuadreId: string) => {
    router.push(`/alumno/cursos/${encuadreId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mis Cursos</h1>
            <p className="text-gray-600 mt-1">
              Consulta tus encuadres y registra tus avances
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold">{cursos.length}</span>
            <span>cursos inscritos</span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por clave, materia, grupo, periodo o docente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {filteredCursos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm ? "No se encontraron cursos" : "Sin cursos inscritos"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Intenta con otros términos de búsqueda"
                    : "Aún no estás inscrito en ningún curso"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Cursos</CardTitle>
              <CardDescription>
                Haz clic en un curso para ver el encuadre y registrar tus avances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clave</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Docente</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Enterado</TableHead>
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
                        <TableCell>{curso.docente}</TableCell>
                        <TableCell>{curso.periodo}</TableCell>
                        <TableCell>{curso.grupo}</TableCell>
                        <TableCell>
                          {curso.firmado ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Firmado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pendiente
                            </span>
                          )}
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
                            Ver curso
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
  );
}