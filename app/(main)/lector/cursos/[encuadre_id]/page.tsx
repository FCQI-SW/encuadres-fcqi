"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  MinusCircle,
  AlertTriangle,
  User,
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
} from "lucide-react";

type InfoCurso = {
  materia_clave: string;
  materia_nombre: string;
  grupo: string;
  periodo: string;
  profesor_nombre: string;
};

type Alumno = {
  id: string;
  nombre: string;
  temas_registrados: number;
  coincidencias: number;
  porcentaje: number;
};

type TemaComparacion = {
  id: number;
  numero: string;
  nombre: string;
  unidad_numero: number;
  unidad_nombre: string;
  profesor_visto: boolean | null;
  registros_alumnos: {
    total: number;
    vistos: number;
    no_vistos: number;
    sin_registro: number;
  };
};

export default function DetalleCursoLectorPage() {
  const router = useRouter();
  const params = useParams<{ encuadre_id: string }>();
  const encuadreId = params?.encuadre_id;

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InfoCurso | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [temas, setTemas] = useState<TemaComparacion[]>([]);
  const [stats, setStats] = useState({
    totalTemas: 0,
    temasProfesor: 0,
    totalAlumnos: 0,
    promedioCoincidencia: 0,
  });

  useEffect(() => {
    if (encuadreId) {
      cargarDatos();
    }
  }, [encuadreId]);

  async function cargarDatos() {
    setLoading(true);

    try {
      // 1. Obtener info del encuadre
      const { data: encuadre } = await supabase
        .from("encuadres")
        .select("id, programa_id, usuario_id, grupo, periodo")
        .eq("id", encuadreId)
        .single();

      if (!encuadre) {
        setLoading(false);
        return;
      }

      // 2. Obtener programa y materia
      const { data: programa } = await supabase
        .from("programas")
        .select("id, materia_id")
        .eq("id", encuadre.programa_id)
        .single();

      const { data: materia } = await supabase
        .from("materias")
        .select("clave, nombre_materia")
        .eq("id", programa?.materia_id)
        .single();

      // 3. Obtener profesor
      const { data: profesor } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("id", encuadre.usuario_id)
        .single();

      setInfo({
        materia_clave: materia?.clave || "N/A",
        materia_nombre: materia?.nombre_materia || "Sin materia",
        grupo: encuadre.grupo,
        periodo: encuadre.periodo || "Sin periodo",
        profesor_nombre: profesor?.nombre || "Sin profesor",
      });

      // 4. Obtener alumnos inscritos
      const { data: inscripciones } = await supabase
        .from("encuadre_alumnos")
        .select("alumno_id")
        .eq("encuadre_id", encuadreId)
        .neq("estado", "revocada");

      const alumnoIds = (inscripciones || []).map((i) => i.alumno_id);

      const { data: alumnosData } = await supabase
        .from("usuarios")
        .select("id, nombre")
        .in("id", alumnoIds);

      // 5. Obtener unidades y temas
      const { data: unidades } = await supabase
        .from("unidades")
        .select("id, numero, nombre")
        .eq("programa_id", encuadre.programa_id)
        .order("numero", { ascending: true });

      const unidadIds = (unidades || []).map((u) => u.id);
      const { data: temasData } = await supabase
        .from("temas")
        .select("id, numero, nombre, unidad_id")
        .in("unidad_id", unidadIds)
        .order("numero", { ascending: true });

      // 6. Obtener todos los check-ins
      const temaIds = (temasData || []).map((t) => t.id);
      const { data: checkins } = await supabase
        .from("temas_checkin")
        .select("tema_id, usuario_id, tema_visto")
        .in("tema_id", temaIds)
        .eq("grupo", encuadre.grupo);

      // Crear mapas
      const unidadMap = new Map((unidades || []).map((u) => [u.id, u]));
      const checkinsMap = new Map<string, boolean>();
      (checkins || []).forEach((c) => {
        const key = `${c.usuario_id}_${c.tema_id}`;
        checkinsMap.set(key, c.tema_visto);
      });

      // Construir comparación de temas
      const temasComparacion: TemaComparacion[] = (temasData || []).map((tema) => {
        const unidad = unidadMap.get(tema.unidad_id);
        const keyProfesor = `${encuadre.usuario_id}_${tema.id}`;
        const profesorVisto = checkinsMap.has(keyProfesor)
          ? checkinsMap.get(keyProfesor)!
          : null;

        // Contar registros de alumnos
        let vistos = 0;
        let noVistos = 0;
        let sinRegistro = 0;

        alumnoIds.forEach((alumnoId) => {
          const keyAlumno = `${alumnoId}_${tema.id}`;
          if (checkinsMap.has(keyAlumno)) {
            if (checkinsMap.get(keyAlumno)) vistos++;
            else noVistos++;
          } else {
            sinRegistro++;
          }
        });

        return {
          id: tema.id,
          numero: tema.numero,
          nombre: tema.nombre,
          unidad_numero: unidad?.numero || 0,
          unidad_nombre: unidad?.nombre || "",
          profesor_visto: profesorVisto,
          registros_alumnos: {
            total: alumnoIds.length,
            vistos,
            no_vistos: noVistos,
            sin_registro: sinRegistro,
          },
        };
      });

      // Ordenar por unidad y número
      temasComparacion.sort((a, b) => {
        if (a.unidad_numero !== b.unidad_numero) {
          return a.unidad_numero - b.unidad_numero;
        }
        return a.numero.localeCompare(b.numero, undefined, { numeric: true });
      });

      setTemas(temasComparacion);

      // Calcular datos de alumnos
      const alumnosConDatos: Alumno[] = (alumnosData || []).map((alumno) => {
        let temasRegistrados = 0;
        let coincidencias = 0;
        let comparables = 0;

        temasComparacion.forEach((tema) => {
          const keyAlumno = `${alumno.id}_${tema.id}`;
          const keyProfesor = `${encuadre.usuario_id}_${tema.id}`;

          if (checkinsMap.has(keyAlumno)) {
            temasRegistrados++;

            if (checkinsMap.has(keyProfesor)) {
              comparables++;
              if (checkinsMap.get(keyAlumno) === checkinsMap.get(keyProfesor)) {
                coincidencias++;
              }
            }
          }
        });

        return {
          id: alumno.id,
          nombre: alumno.nombre,
          temas_registrados: temasRegistrados,
          coincidencias,
          porcentaje: comparables > 0 ? Math.round((coincidencias / comparables) * 100) : 0,
        };
      });

      alumnosConDatos.sort((a, b) => b.porcentaje - a.porcentaje);
      setAlumnos(alumnosConDatos);

      // Estadísticas
      const temasProfesor = temasComparacion.filter((t) => t.profesor_visto !== null).length;
      const promedioCoincidencia =
        alumnosConDatos.length > 0
          ? Math.round(
              alumnosConDatos.reduce((acc, a) => acc + a.porcentaje, 0) /
                alumnosConDatos.length
            )
          : 0;

      setStats({
        totalTemas: temasComparacion.length,
        temasProfesor,
        totalAlumnos: alumnosConDatos.length,
        promedioCoincidencia,
      });
    } catch (err) {
      console.error("Error cargando datos:", err);
    }

    setLoading(false);
  }

  const renderEstadoProfesor = (visto: boolean | null) => {
    if (visto === null) {
      return <MinusCircle className="w-5 h-5 text-gray-300" />;
    }
    if (visto) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  // Agrupar temas por unidad
  const temasAgrupados = temas.reduce((acc, tema) => {
    const key = `${tema.unidad_numero}-${tema.unidad_nombre}`;
    if (!acc[key]) {
      acc[key] = {
        unidad_numero: tema.unidad_numero,
        unidad_nombre: tema.unidad_nombre,
        temas: [],
      };
    }
    acc[key].temas.push(tema);
    return acc;
  }, {} as Record<string, { unidad_numero: number; unidad_nombre: string; temas: TemaComparacion[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="p-6">
        <Button
          variant="outline"
          onClick={() => router.push("/lector/cursos")}
          className="cursor-pointer"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No se encontró el curso solicitado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/lector/cursos")}
            className="cursor-pointer mb-4"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">
            {info.materia_clave} - {info.materia_nombre}
          </h1>
          <p className="text-muted-foreground">
            {info.profesor_nombre} • Grupo {info.grupo} • {info.periodo}
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-[#00723F]" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTemas}</p>
                <p className="text-xs text-muted-foreground">Total Temas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.temasProfesor}/{stats.totalTemas}
                </p>
                <p className="text-xs text-muted-foreground">Avance Profesor</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAlumnos}</p>
                <p className="text-xs text-muted-foreground">Alumnos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BarChart3
                className={`h-8 w-8 ${
                  stats.promedioCoincidencia >= 80
                    ? "text-green-600"
                    : stats.promedioCoincidencia >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              />
              <div>
                <p className="text-2xl font-bold">{stats.promedioCoincidencia}%</p>
                <p className="text-xs text-muted-foreground">Coincidencia Prom.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de alumnos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#00723F]" />
              Alumnos Inscritos
            </CardTitle>
            <CardDescription>
              Coincidencia individual con el profesor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alumnos.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No hay alumnos inscritos
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alumnos.map((alumno) => (
                  <div
                    key={alumno.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#00723F] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {alumno.nombre.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {alumno.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alumno.temas_registrados}/{stats.totalTemas} temas
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        alumno.porcentaje >= 80
                          ? "text-green-600"
                          : alumno.porcentaje >= 50
                          ? "text-yellow-600"
                          : alumno.porcentaje > 0
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {alumno.porcentaje > 0 ? `${alumno.porcentaje}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de temas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#00723F]" />
              Avance por Tema
            </CardTitle>
            <CardDescription>
              Estado de cada tema según profesor y alumnos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {temas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay temas registrados
              </p>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-[60px]">Tema</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-center w-[80px]">Prof.</TableHead>
                      <TableHead className="text-center w-[100px]">Alumnos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(temasAgrupados).map((grupo) => (
                      <Fragment key={`unidad-${grupo.unidad_numero}`}>
                        <TableRow className="bg-[#00723F]/10">
                          <TableCell colSpan={4} className="font-semibold py-2">
                            Unidad {grupo.unidad_numero}: {grupo.unidad_nombre}
                          </TableCell>
                        </TableRow>
                        {grupo.temas.map((tema) => (
                          <TableRow key={tema.id}>
                            <TableCell className="text-center font-medium">
                              {tema.numero}
                            </TableCell>
                            <TableCell className="text-sm">{tema.nombre}</TableCell>
                            <TableCell className="text-center">
                              {renderEstadoProfesor(tema.profesor_visto)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-xs text-green-600">
                                  {tema.registros_alumnos.vistos}✓
                                </span>
                                <span className="text-xs text-red-600">
                                  {tema.registros_alumnos.no_vistos}✗
                                </span>
                                <span className="text-xs text-gray-400">
                                  {tema.registros_alumnos.sin_registro}—
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leyenda */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="font-medium">Leyenda:</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Visto</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>No visto</span>
            </div>
            <div className="flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-gray-300" />
              <span>Sin registrar</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground">
              Alumnos: ✓ Vistos • ✗ No vistos • — Sin registro
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}