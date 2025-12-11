"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

type TemaComparacion = {
  id: number;
  numero: string;
  nombre: string;
  unidad_numero: number;
  unidad_nombre: string;
  profesor_visto: boolean | null;
  profesor_justificacion: string;
  alumno_visto: boolean | null;
  alumno_justificacion: string;
  coincide: boolean | null;
};

type InfoEncuadre = {
  materia_clave: string;
  materia_nombre: string;
  grupo: string;
  periodo: string;
  profesor_nombre: string;
  profesor_id: string;
  alumno_nombre: string;
};

export default function DetalleComparacionPage() {
  const router = useRouter();
  const params = useParams<{ encuadre_id: string; alumno_id: string }>();
  const encuadreId = params?.encuadre_id;
  const alumnoId = params?.alumno_id;

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InfoEncuadre | null>(null);
  const [temas, setTemas] = useState<TemaComparacion[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    profesorRegistrados: 0,
    alumnoRegistrados: 0,
    coincidencias: 0,
    discrepancias: 0,
  });

  useEffect(() => {
    if (encuadreId && alumnoId) {
      cargarDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadreId, alumnoId]);

  const cargarDatos = async () => {
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

      // 4. Obtener alumno
      const { data: alumno } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("id", alumnoId)
        .single();

      setInfo({
        materia_clave: materia?.clave || "N/A",
        materia_nombre: materia?.nombre_materia || "Sin información",
        grupo: encuadre.grupo,
        periodo: encuadre.periodo,
        profesor_nombre: profesor?.nombre || "Sin asignar",
        profesor_id: encuadre.usuario_id,
        alumno_nombre: alumno?.nombre || "Sin información",
      });

      // 5. Obtener unidades del programa
      const { data: unidades } = await supabase
        .from("unidades")
        .select("id, numero, nombre")
        .eq("programa_id", encuadre.programa_id)
        .order("numero", { ascending: true });

      if (!unidades || unidades.length === 0) {
        setLoading(false);
        return;
      }

      // 6. Obtener temas de las unidades
      const unidadIds = unidades.map((u: any) => u.id);
      const { data: temasData } = await supabase
        .from("temas")
        .select("id, numero, nombre, unidad_id")
        .in("unidad_id", unidadIds)
        .order("numero", { ascending: true });

      if (!temasData || temasData.length === 0) {
        setLoading(false);
        return;
      }

      // 7. Obtener todos los check-ins para los temas de este encuadre y grupo
      const temaIds = temasData.map((t: any) => t.id);
      
      // Check-ins del profesor (por tema_id, usuario_id del profesor, y grupo)
      const { data: checkinsProfesor } = await supabase
        .from("temas_checkin")
        .select("tema_id, tema_visto, justificacion")
        .in("tema_id", temaIds)
        .eq("usuario_id", encuadre.usuario_id)
        .eq("grupo", encuadre.grupo);

      // Check-ins del alumno (por tema_id, usuario_id del alumno, y grupo)
      const { data: checkinsAlumno } = await supabase
        .from("temas_checkin")
        .select("tema_id, tema_visto, justificacion")
        .in("tema_id", temaIds)
        .eq("usuario_id", alumnoId)
        .eq("grupo", encuadre.grupo);

      // Crear mapas
      const unidadMap = new Map((unidades || []).map((u: any) => [u.id, u]));
      const profesorMap = new Map((checkinsProfesor || []).map((c: any) => [c.tema_id, c]));
      const alumnoMap = new Map((checkinsAlumno || []).map((c: any) => [c.tema_id, c]));

      // Construir comparación
      const temasComparacion: TemaComparacion[] = temasData.map((tema: any) => {
        const unidad = unidadMap.get(tema.unidad_id);
        const profesorCheckin = profesorMap.get(tema.id);
        const alumnoCheckin = alumnoMap.get(tema.id);

        const profesorVisto = profesorCheckin?.tema_visto ?? null;
        const alumnoVisto = alumnoCheckin?.tema_visto ?? null;

        let coincide: boolean | null = null;
        if (profesorVisto !== null && alumnoVisto !== null) {
          coincide = profesorVisto === alumnoVisto;
        }

        return {
          id: tema.id,
          numero: tema.numero,
          nombre: tema.nombre,
          unidad_numero: unidad?.numero || 0,
          unidad_nombre: unidad?.nombre || "",
          profesor_visto: profesorVisto,
          profesor_justificacion: profesorCheckin?.justificacion || "",
          alumno_visto: alumnoVisto,
          alumno_justificacion: alumnoCheckin?.justificacion || "",
          coincide,
        };
      });

      // Ordenar por unidad y número de tema
      temasComparacion.sort((a, b) => {
        if (a.unidad_numero !== b.unidad_numero) {
          return a.unidad_numero - b.unidad_numero;
        }
        return a.numero.localeCompare(b.numero, undefined, { numeric: true });
      });

      setTemas(temasComparacion);

      // Calcular estadísticas
      const profesorRegistrados = temasComparacion.filter((t) => t.profesor_visto !== null).length;
      const alumnoRegistrados = temasComparacion.filter((t) => t.alumno_visto !== null).length;
      const coincidencias = temasComparacion.filter((t) => t.coincide === true).length;
      const discrepancias = temasComparacion.filter((t) => t.coincide === false).length;

      setStats({
        total: temasComparacion.length,
        profesorRegistrados,
        alumnoRegistrados,
        coincidencias,
        discrepancias,
      });
    } catch (err) {
      console.error("Error:", err);
    }

    setLoading(false);
  };

  const renderEstado = (visto: boolean | null) => {
    if (visto === null) {
      return (
        <span className="flex items-center text-gray-400">
          <MinusCircle className="w-4 h-4 mr-1" /> Sin registrar
        </span>
      );
    }
    if (visto) {
      return (
        <span className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" /> Sí
        </span>
      );
    }
    return (
      <span className="flex items-center text-red-600">
        <XCircle className="w-4 h-4 mr-1" /> No
      </span>
    );
  };

  const renderCoincidencia = (coincide: boolean | null) => {
    if (coincide === null) {
      return <span className="text-gray-400">—</span>;
    }
    if (coincide) {
      return (
        <span className="flex items-center justify-center text-green-600">
          <CheckCircle className="w-5 h-5" />
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center text-red-600">
        <AlertTriangle className="w-5 h-5" />
      </span>
    );
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
        <Button variant="outline" onClick={() => router.push("/admin/resultados")} className="cursor-pointer">
          <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          <p>No se encontró la información solicitada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="outline" onClick={() => router.push("/admin/resultados")} className="cursor-pointer mb-4">
            <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
          </Button>
          <h1 className="text-2xl font-bold">Comparación de Avances</h1>
          <p className="text-muted-foreground">
            {info.materia_clave} - {info.materia_nombre}
          </p>
        </div>
      </div>

      {/* Info del curso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-[#00723F]" />
              Profesor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{info.profesor_nombre}</p>
            <p className="text-sm text-muted-foreground">
              Grupo {info.grupo} • {info.periodo}
            </p>
            <Separator className="my-3" />
            <div className="flex justify-between text-sm">
              <span>Temas registrados:</span>
              <span className="font-semibold">
                {stats.profesorRegistrados}/{stats.total}
              </span>
            </div>
            {stats.profesorRegistrados === 0 && (
              <p className="text-sm text-amber-600 mt-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                El profesor aún no ha registrado avances
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-600" />
              Alumno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{info.alumno_nombre}</p>
            <p className="text-sm text-muted-foreground">
              Grupo {info.grupo} • {info.periodo}
            </p>
            <Separator className="my-3" />
            <div className="flex justify-between text-sm">
              <span>Temas registrados:</span>
              <span className="font-semibold">
                {stats.alumnoRegistrados}/{stats.total}
              </span>
            </div>
            {stats.alumnoRegistrados === 0 && (
              <p className="text-sm text-amber-600 mt-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                El alumno aún no ha registrado avances
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen de coincidencias */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Coincidencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total temas</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.coincidencias}</p>
              <p className="text-sm text-muted-foreground">Coincidencias</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.discrepancias}</p>
              <p className="text-sm text-muted-foreground">Discrepancias</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {stats.coincidencias + stats.discrepancias > 0
                  ? Math.round((stats.coincidencias / (stats.coincidencias + stats.discrepancias)) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">% Coincidencia</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de comparación */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Tema</CardTitle>
          <CardDescription>
            Comparación tema por tema entre profesor y alumno
          </CardDescription>
        </CardHeader>
        <CardContent>
          {temas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Sin temas registrados</p>
              <p className="text-sm">Este curso no tiene temas asignados en el programa</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[80px]">Unidad</TableHead>
                    <TableHead className="w-[80px]">Tema</TableHead>
                    <TableHead>Nombre del Tema</TableHead>
                    <TableHead className="text-center w-[120px]">Profesor</TableHead>
                    <TableHead className="text-center w-[120px]">Alumno</TableHead>
                    <TableHead className="text-center w-[100px]">¿Coincide?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(temasAgrupados).map((grupo) => (
                    <Fragment key={`unidad-${grupo.unidad_numero}`}>
                      {/* Header de unidad */}
                      <TableRow className="bg-[#00723F]/10">
                        <TableCell colSpan={6} className="font-semibold">
                          Unidad {grupo.unidad_numero}: {grupo.unidad_nombre}
                        </TableCell>
                      </TableRow>
                      {/* Temas */}
                      {grupo.temas.map((tema) => (
                        <TableRow
                          key={tema.id}
                          className={
                            tema.coincide === false
                              ? "bg-red-50"
                              : tema.coincide === true
                              ? "bg-green-50/30"
                              : ""
                          }
                        >
                          <TableCell className="text-center text-muted-foreground">
                            {tema.unidad_numero}
                          </TableCell>
                          <TableCell className="text-center">{tema.numero}</TableCell>
                          <TableCell>
                            {tema.nombre}
                            {(tema.profesor_justificacion || tema.alumno_justificacion) && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {tema.profesor_justificacion && (
                                  <p><span className="font-medium">Prof:</span> {tema.profesor_justificacion}</p>
                                )}
                                {tema.alumno_justificacion && (
                                  <p><span className="font-medium">Alum:</span> {tema.alumno_justificacion}</p>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderEstado(tema.profesor_visto)}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderEstado(tema.alumno_visto)}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderCoincidencia(tema.coincide)}
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
  );
}
