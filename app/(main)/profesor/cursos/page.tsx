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
import { Loader2, GraduationCap, Search, Users } from "lucide-react";

type Curso = {
  id: string;
  encuadre_id: string;
  materia_clave: string;
  materia_nombre: string;
  grupo: string;
  periodo: string;
  estado_encuadre: string;
  total_alumnos: number;
};

export default function CursosProfesorPage() {
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
      // Obtener encuadres del profesor
      const { data: encuadres, error: errorEncuadres } = await supabase
        .from("encuadres")
        .select("id, programa_id, grupo, periodo, estado_encuadre")
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

      // Obtener conteo de alumnos por encuadre
      const encuadreIds = encuadres.map((e) => e.id);
      const { data: alumnosCounts } = await supabase
        .from("encuadre_alumnos")
        .select("encuadre_id")
        .in("encuadre_id", encuadreIds)
        .neq("estado", "revocada");

      // Crear mapas
      const programaMap = new Map((programas || []).map((p: any) => [p.id, p]));
      const materiaMap = new Map((materias || []).map((m: any) => [m.id, m]));
      
      // Contar alumnos por encuadre
      const alumnosCountMap = new Map<string, number>();
      (alumnosCounts || []).forEach((a: any) => {
        const count = alumnosCountMap.get(a.encuadre_id) || 0;
        alumnosCountMap.set(a.encuadre_id, count + 1);
      });

      // Formatear cursos
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
          estado_encuadre: e.estado_encuadre,
          total_alumnos: alumnosCountMap.get(e.id) || 0,
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
          c.periodo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCursos(filtered);
    }
  }, [searchTerm, cursos]);

  const handleVerCurso = (encuadreId: string) => {
    router.push(`/profesor/cursos/${encuadreId}`);
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
              Administra tus cursos, alumnos y avances
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">{cursos.length}</span>
            <span>cursos asignados</span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por clave, nombre de materia, grupo o periodo..."
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
                <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm ? "No se encontraron cursos" : "Sin cursos asignados"}
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
                Haz clic en un curso para gestionar encuadre, alumnos y avances
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
                      <TableHead>Alumnos</TableHead>
                      <TableHead>Estado</TableHead>
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
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{curso.total_alumnos}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              curso.estado_encuadre === "publicado"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {curso.estado_encuadre === "publicado"
                              ? "Publicado"
                              : "Borrador"}
                          </span>
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
  );
}