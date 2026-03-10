"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  BookOpen,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  BarChart3,
} from "lucide-react";

type Estadisticas = {
  totalCursos: number;
  totalProfesores: number;
  totalAlumnos: number;
  promedioCoincidencia: number;
  cursosAltaCoincidencia: number;
  cursosBajaCoincidencia: number;
};

type CursoReciente = {
  id: string;
  materia_nombre: string;
  materia_clave: string;
  profesor_nombre: string;
  grupo: string;
  periodo: string;
  porcentaje: number;
};

export default function LectorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Estadisticas>({
    totalCursos: 0,
    totalProfesores: 0,
    totalAlumnos: 0,
    promedioCoincidencia: 0,
    cursosAltaCoincidencia: 0,
    cursosBajaCoincidencia: 0,
  });
  const [cursosRecientes, setCursosRecientes] = useState<CursoReciente[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);

    try {
      // Obtener encuadres
      const { data: encuadres } = await supabase
        .from("encuadres")
        .select("id, programa_id, usuario_id, grupo, periodo");

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

      // Obtener alumnos inscritos
      const encuadreIds = encuadres.map((e) => e.id);
      const { data: inscripciones } = await supabase
        .from("encuadre_alumnos")
        .select("encuadre_id, alumno_id")
        .in("encuadre_id", encuadreIds)
        .neq("estado", "revocada");

      const alumnosUnicos = new Set((inscripciones || []).map((i) => i.alumno_id));

      // Obtener unidades y temas para calcular avances
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
      const temaIdsByPrograma = new Map<string, number[]>();
      (temas || []).forEach((t) => {
        const programaId = unidadToProgramaMap.get(t.unidad_id);
        if (programaId) {
          if (!temaIdsByPrograma.has(programaId)) {
            temaIdsByPrograma.set(programaId, []);
          }
          temaIdsByPrograma.get(programaId)!.push(t.id);
        }
      });

      // Check-ins por usuario y grupo
      const checkinsMap = new Map<string, boolean>();
      (checkins || []).forEach((c) => {
        const key = `${c.usuario_id}_${c.grupo}_${c.tema_id}`;
        checkinsMap.set(key, c.tema_visto);
      });

      // Calcular coincidencias por encuadre
      let totalCoincidencia = 0;
      let cursosConDatos = 0;
      let altaCoincidencia = 0;
      let bajaCoincidencia = 0;

      const cursosConPorcentaje: CursoReciente[] = [];

      for (const encuadre of encuadres) {
        const programa = programaMap.get(encuadre.programa_id);
        const materia = programa ? materiaMap.get(programa.materia_id) : null;
        const profesor = profesorMap.get(encuadre.usuario_id);
        const temasDelPrograma = temaIdsByPrograma.get(encuadre.programa_id) || [];

        const alumnosDelEncuadre = (inscripciones || [])
          .filter((i) => i.encuadre_id === encuadre.id)
          .map((i) => i.alumno_id);

        if (temasDelPrograma.length === 0 || alumnosDelEncuadre.length === 0) continue;

        // Calcular coincidencia promedio para este encuadre
        let coincidenciasTotal = 0;
        let comparablesTotal = 0;

        for (const alumnoId of alumnosDelEncuadre) {
          for (const temaId of temasDelPrograma) {
            const keyProfesor = `${encuadre.usuario_id}_${encuadre.grupo}_${temaId}`;
            const keyAlumno = `${alumnoId}_${encuadre.grupo}_${temaId}`;

            if (checkinsMap.has(keyProfesor) && checkinsMap.has(keyAlumno)) {
              comparablesTotal++;
              if (checkinsMap.get(keyProfesor) === checkinsMap.get(keyAlumno)) {
                coincidenciasTotal++;
              }
            }
          }
        }

        const porcentaje = comparablesTotal > 0
          ? Math.round((coincidenciasTotal / comparablesTotal) * 100)
          : 0;

        if (comparablesTotal > 0) {
          totalCoincidencia += porcentaje;
          cursosConDatos++;

          if (porcentaje >= 80) altaCoincidencia++;
          if (porcentaje < 50) bajaCoincidencia++;
        }

        cursosConPorcentaje.push({
          id: encuadre.id,
          materia_nombre: materia?.nombre_materia || "Sin materia",
          materia_clave: materia?.clave || "N/A",
          profesor_nombre: profesor?.nombre || "Sin profesor",
          grupo: encuadre.grupo,
          periodo: encuadre.periodo || "Sin periodo",
          porcentaje,
        });
      }

      // Ordenar por porcentaje y tomar los 5 más recientes
      cursosConPorcentaje.sort((a, b) => b.porcentaje - a.porcentaje);

      setStats({
        totalCursos: encuadres.length,
        totalProfesores: profesorIds.length,
        totalAlumnos: alumnosUnicos.size,
        promedioCoincidencia: cursosConDatos > 0
          ? Math.round(totalCoincidencia / cursosConDatos)
          : 0,
        cursosAltaCoincidencia: altaCoincidencia,
        cursosBajaCoincidencia: bajaCoincidencia,
      });

      setCursosRecientes(cursosConPorcentaje.slice(0, 5));
    } catch (err) {
      console.error("Error cargando datos:", err);
    }

    setLoading(false);
  }

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
      <div>
        <p className="text-muted-foreground">
          Vista general del progreso académico
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center text-center">
              <BookOpen className="h-8 w-8 text-[#00723F] mb-2" />
              <p className="text-2xl font-bold">{stats.totalCursos}</p>
              <p className="text-xs text-muted-foreground">Cursos Activos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center text-center">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{stats.totalProfesores}</p>
              <p className="text-xs text-muted-foreground">Profesores</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center text-center">
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{stats.totalAlumnos}</p>
              <p className="text-xs text-muted-foreground">Alumnos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="h-8 w-8 text-yellow-600 mb-2" />
              <p className="text-2xl font-bold">{stats.promedioCoincidencia}%</p>
              <p className="text-xs text-muted-foreground">Coincidencia Prom.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-2xl font-bold">{stats.cursosAltaCoincidencia}</p>
              <p className="text-xs text-muted-foreground">Alta Coincidencia</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-2xl font-bold">{stats.cursosBajaCoincidencia}</p>
              <p className="text-xs text-muted-foreground">Baja Coincidencia</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cursos destacados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mejores coincidencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#00723F]" />
              Cursos con Mejor Coincidencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cursosRecientes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay datos disponibles
              </p>
            ) : (
              <div className="space-y-4">
                {cursosRecientes.map((curso) => (
                  <div
                    key={curso.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {curso.materia_clave} - {curso.materia_nombre}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {curso.profesor_nombre} • Grupo {curso.grupo}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-lg font-bold ${
                          curso.porcentaje >= 80
                            ? "text-green-600"
                            : curso.porcentaje >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {curso.porcentaje}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/lector/cursos/${curso.id}`)}
                        className="cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 cursor-pointer"
              onClick={() => router.push("/lector/cursos")}
            >
              <BookOpen className="h-5 w-5 mr-3 text-[#00723F]" />
              <div className="text-left">
                <p className="font-medium">Ver todos los cursos</p>
                <p className="text-xs text-muted-foreground">
                  Explora la lista completa de encuadres
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 cursor-pointer"
              onClick={() => router.push("/lector/cursos?filtro=baja")}
            >
              <AlertTriangle className="h-5 w-5 mr-3 text-red-600" />
              <div className="text-left">
                <p className="font-medium">Cursos con baja coincidencia</p>
                <p className="text-xs text-muted-foreground">
                  Revisa los cursos que necesitan atención
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 cursor-pointer"
              onClick={() => router.push("/lector/cursos?filtro=alta")}
            >
              <CheckCircle className="h-5 w-5 mr-3 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Cursos con alta coincidencia</p>
                <p className="text-xs text-muted-foreground">
                  Revisa los cursos con mejor desempeño
                </p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Nota informativa */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Modo de observación</p>
              <p className="text-blue-700">
                Estás en modo de solo lectura. Puedes visualizar el progreso de
                todos los cursos, pero no puedes realizar modificaciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}