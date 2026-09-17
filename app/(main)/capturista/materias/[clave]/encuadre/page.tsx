"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useEncuadreForm } from "@/hooks/useEncuadreForm";
import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";

type Materia = {
  id: string;
  clave: string;
  nombre: string;
};

type Profesor = {
  id: string;
  nombre: string;
};

type CriterioCalificacion = {
  criterio: string;
  valor: number;
  descripcion: string;
};

type AsignacionProfesorGrupo = {
  profesorId: string;
  grupo: string;
  encuadreId?: string;
};

export default function EncuadreMateria() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const searchParams = useSearchParams();
  const clave = params?.clave as string;
  const programaIdFromQuery = searchParams.get("programaId") || "";

  const confirm = useConfirm();
  const toast = useToast();
  const { data: session, status } = useSession();

  const [loadingData, setLoadingData] = useState(true);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [programaId, setProgramaId] = useState<string>(programaIdFromQuery);
  const [profesores, setProfesores] = useState<Profesor[]>([]);

  const [asignaciones, setAsignaciones] = useState<AsignacionProfesorGrupo[]>([
    { profesorId: "", grupo: "" },
  ]);
  const [periodo, setPeriodo] = useState("");
  const [descripcionEvaluacion, setDescripcionEvaluacion] = useState("");
  const [derechoOrdinario, setDerechoOrdinario] = useState("");
  const [derechoExtraordinario, setDerechoExtraordinario] = useState("");
  const [descripcionProducto, setDescripcionProducto] = useState("");
  const [bibliografiaBasica, setBibliografiaBasica] = useState("");
  const [normasConducta, setNormasConducta] = useState("");
  const [profesorPuedeModificar, setProfesorPuedeModificar] = useState(true);

  const [criteriosCalificacion, setCriteriosCalificacion] = useState<CriterioCalificacion[]>([
    { criterio: "", valor: 0, descripcion: "" },
    { criterio: "", valor: 0, descripcion: "" },
    { criterio: "", valor: 0, descripcion: "" },
  ]);

  const { guardarEncuadre, cargarEncuadre, loading, error } = useEncuadreForm(programaId);
  const [prevError, setPrevError] = useState<string | null>(null);

  useEffect(() => {
    if (error && error !== prevError) {
      toast.error(error);
      setPrevError(error);
    }
  }, [error, prevError, toast]);

  // ── 1. Cargar materia y validar programa ─────────────────────
  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoadingData(true);

      const [{ data: matData, error: matError }, { data: profData, error: profError }] =
        await Promise.all([
          supabase
            .from("materias")
            .select("id, clave, nombre_materia")
            .eq("clave", clave)
            .maybeSingle(),
          supabase
            .from("usuarios")
            .select("id, nombre, rol_id")
            .eq("rol_id", "bc3ab654-5fc8-401a-a6e2-97903b45cc93"),
        ]);

      if (!isMounted) return;

      if (matError) console.error("Error al obtener materia:", matError);

      if (matData) {
        setMateria({ id: matData.id, clave: matData.clave, nombre: matData.nombre_materia });

        if (programaIdFromQuery) {
          const { data: programaData, error: programaError } = await supabase
            .from("programas")
            .select("id, periodo, materia_id")
            .eq("id", programaIdFromQuery)
            .maybeSingle();

          if (programaError) console.error("Error al obtener programa:", programaError);

          if (programaData && programaData.materia_id === matData.id) {
            setProgramaId(programaData.id);
            setPeriodo(programaData.periodo || "");
          } else {
            setProgramaId("");
            setPeriodo("");
            toast.error("El programa solicitado no corresponde a esta materia o no existe.");
          }
        } else {
          setProgramaId("");
          setPeriodo("");
        }
      } else {
        setMateria(null);
        setProgramaId("");
        setPeriodo("");
      }

      if (profError) console.error("Error al obtener profesores:", profError);
      setProfesores((profData || []).map((p: any) => ({ id: p.id, nombre: p.nombre })));

      setLoadingData(false);
    })();

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, programaIdFromQuery]);

  // ── 2. Cargar encuadre — solo depende de programaId ──────────
  // FIX: no incluir cargarEncuadre en las dependencias porque es una
  // referencia nueva en cada render y causaría un loop infinito que
  // resetea los campos mientras el usuario escribe.
  useEffect(() => {
    if (!programaId) return;

    (async () => {
      const encuadre = await cargarEncuadre();

      if (encuadre) {
        setAsignaciones(
          encuadre.asignaciones && encuadre.asignaciones.length > 0
            ? encuadre.asignaciones
            : [{ profesorId: "", grupo: "" }]
        );
        setDescripcionEvaluacion(encuadre.descripcion_evaluacion || "");
        setDerechoOrdinario(encuadre.derecho_ordinario || "");
        setDerechoExtraordinario(encuadre.derecho_extraordinario || "");
        setDescripcionProducto(encuadre.descripcion_producto || "");
        setBibliografiaBasica(encuadre.bibliografia_basica || "");
        setNormasConducta(encuadre.normas_conducta || "");
        setProfesorPuedeModificar(encuadre.profesor_puede_modificar_criterios ?? true);

        if (encuadre.criterios && encuadre.criterios.length > 0) {
          setCriteriosCalificacion(
            encuadre.criterios.map((c: any) => ({
              criterio: c.criterio,
              valor: c.valor,
              descripcion: c.descripcion || "",
            }))
          );
        }
      } else {
        setAsignaciones([{ profesorId: "", grupo: "" }]);
        setDescripcionEvaluacion("");
        setDerechoOrdinario("");
        setDerechoExtraordinario("");
        setDescripcionProducto("");
        setBibliografiaBasica("");
        setNormasConducta("");
        setProfesorPuedeModificar(true);
        setCriteriosCalificacion([
          { criterio: "", valor: 0, descripcion: "" },
          { criterio: "", valor: 0, descripcion: "" },
          { criterio: "", valor: 0, descripcion: "" },
        ]);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programaId]); // ← SOLO programaId, no cargarEncuadre

  const handleBack = () => router.push("/capturista/materias");

  const agregarAsignacion = () => {
    setAsignaciones((prev) => [...prev, { profesorId: "", grupo: "" }]);
  };

  const eliminarAsignacion = (index: number) => {
    setAsignaciones((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarAsignacion = (
    index: number,
    field: keyof AsignacionProfesorGrupo,
    value: string
  ) => {
    setAsignaciones((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const agregarCriterioCalificacion = () => {
    setCriteriosCalificacion([...criteriosCalificacion, { criterio: "", valor: 0, descripcion: "" }]);
  };

  const eliminarCriterioCalificacion = (index: number) => {
    setCriteriosCalificacion(criteriosCalificacion.filter((_, i) => i !== index));
  };

  const actualizarCriterioCalificacion = (
    index: number,
    field: keyof CriterioCalificacion,
    value: string | number
  ) => {
    const next = [...criteriosCalificacion];
    next[index] = { ...next[index], [field]: value };
    setCriteriosCalificacion(next);
  };

  const handleGuardar = async () => {
    if (!materia) { toast.error("No se encontró la materia. Recarga la página."); return; }
    if (!programaId) { toast.error("Esta materia no tiene un programa válido para el periodo seleccionado."); return; }
    if (status === "loading") { toast.error("Espera un momento mientras se carga tu sesión."); return; }
    if (status === "unauthenticated" || !session?.user?.id) { toast.error("No se pudo verificar tu sesión."); return; }
    if (!periodo.trim()) { toast.error("El programa actual no tiene periodo configurado."); return; }

    const asignacionesLimpias = asignaciones.map((a) => ({
      ...a,
      profesorId: a.profesorId.trim(),
      grupo: a.grupo.trim(),
    }));

    if (asignacionesLimpias.length === 0) { toast.error("Debes agregar al menos un profesor con su grupo."); return; }

    const filaIncompleta = asignacionesLimpias.find((a) => !a.profesorId || !a.grupo);
    if (filaIncompleta) { toast.error("Todas las asignaciones deben tener profesor y grupo."); return; }

    const keys = asignacionesLimpias.map((a) => `${a.profesorId}::${a.grupo.toUpperCase()}`);
    if (keys.length !== new Set(keys).size) {
      toast.error("No puedes repetir la misma combinación de profesor y grupo."); return;
    }

    const criteriosAGuardar = criteriosCalificacion.filter((c) => c.criterio.trim() !== "");
    if (criteriosAGuardar.length === 0) { toast.error("Debes agregar al menos un criterio de evaluación."); return; }

    const criterioSinValor = criteriosAGuardar.find((c) => c.valor <= 0);
    if (criterioSinValor) { toast.error(`El criterio "${criterioSinValor.criterio}" debe tener un porcentaje mayor a 0.`); return; }

    const criterioExcesivo = criteriosAGuardar.find((c) => c.valor > 100);
    if (criterioExcesivo) { toast.error(`El criterio "${criterioExcesivo.criterio}" tiene un porcentaje mayor a 100%.`); return; }

    const totalPorcentaje = criteriosAGuardar.reduce((sum, c) => sum + c.valor, 0);
    if (totalPorcentaje !== 100) {
      toast.error(`Los porcentajes deben sumar exactamente 100%. Actualmente suman ${totalPorcentaje}%.`); return;
    }

    const shouldSave = await confirm({
      title: "Guardar encuadre",
      message: "¿Estás seguro de que deseas guardar la configuración del encuadre?",
      confirmText: "Guardar",
      cancelText: "Cancelar",
    });
    if (!shouldSave) return;

    const success = await guardarEncuadre({
      programaId,
      editorId: session.user.id,
      asignaciones: asignacionesLimpias,
      periodo,
      descripcionEvaluacion,
      derechoOrdinario,
      derechoExtraordinario,
      descripcionProducto,
      bibliografiaBasica,
      normasConducta,
      profesorPuedeModificarCriterios: profesorPuedeModificar,
      criterios: criteriosAGuardar,
    });

    if (success) {
      toast.success("El encuadre se ha guardado correctamente.");
      router.push("/capturista/materias");
    } else {
      toast.error("Error al guardar el encuadre. Intenta de nuevo.");
    }
  };

  const criteriosConValor = criteriosCalificacion.filter((c) => c.criterio.trim() !== "");
  const totalPorcentaje = criteriosConValor.reduce((sum, c) => sum + c.valor, 0);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!materia) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>No se encontró la materia</CardTitle>
              <CardDescription>Verifica la clave en la URL o regresa al listado.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button variant="outline" onClick={handleBack} className="cursor-pointer">Regresar</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ta =
    "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Button variant="outline" onClick={handleBack} className="cursor-pointer">
            <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Encuadre de la Unidad de Aprendizaje</h1>
          <p className="text-lg font-semibold text-[#00723F] mt-2">
            {materia.clave} - {materia.nombre}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Completa la información del encuadre del curso.
          </p>
          {!programaId && !loadingData && (
            <p className="mt-2 text-sm font-medium text-red-600">
              ⚠️ No se encontró un programa válido para este periodo.
            </p>
          )}
        </div>

        {/* Datos del curso */}
        <Card>
          <CardHeader><CardTitle>Datos del curso</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-3">
                <Label className="mb-2 block">Clave</Label>
                <Input value={materia.clave} disabled />
              </div>
              <div className="sm:col-span-6">
                <Label className="mb-2 block">Nombre del Curso</Label>
                <Input value={materia.nombre} disabled />
              </div>
              <div className="sm:col-span-3">
                <Label className="mb-2 block">Periodo <span className="text-red-500">*</span></Label>
                <Input value={periodo} disabled />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Label className="text-xl font-semibold">Profesores y grupos</Label>
              <Button type="button" variant="outline" onClick={agregarAsignacion}
                disabled={!programaId} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" /> Agregar profesor y grupo
              </Button>
            </div>

            <div className="space-y-4">
              {asignaciones.map((asignacion, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-12">
                  <div className="md:col-span-7">
                    <Label className="mb-2 block">Profesor <span className="text-red-500">*</span></Label>
                    <Select
                      value={asignacion.profesorId}
                      onValueChange={(value) => actualizarAsignacion(index, "profesorId", value)}
                      disabled={!programaId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un profesor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {profesores.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="mb-2 block">Grupo <span className="text-red-500">*</span></Label>
                    <Input value={asignacion.grupo}
                      onChange={(e) => actualizarAsignacion(index, "grupo", e.target.value)}
                      placeholder="301" disabled={!programaId} />
                  </div>
                  <div className="md:col-span-2 flex items-end justify-end">
                    <Button type="button" variant="ghost"
                      onClick={() => eliminarAsignacion(index)}
                      disabled={asignaciones.length === 1 || !programaId}
                      className="text-red-500 hover:text-red-600 cursor-pointer">
                      <Trash2 className="mr-2 h-4 w-4" /> Quitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evaluación */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluación de Curso</CardTitle>
            <CardDescription>Descripción detallada de cómo se evaluará el curso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 pb-4 border-b">
              <input
                type="checkbox"
                id="profesorModifica"
                checked={profesorPuedeModificar}
                onChange={(e) => setProfesorPuedeModificar(e.target.checked)}
                disabled={!programaId}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
              <Label htmlFor="profesorModifica" className="cursor-pointer">
                Permitir al profesor modificar estos criterios
              </Label>
            </div>

            <div>
              <Label className="mb-2 block">Descripción general</Label>
              <textarea className={ta} value={descripcionEvaluacion}
                onChange={(e) => setDescripcionEvaluacion(e.target.value)}
                disabled={!programaId}
                placeholder="Descripción detallada de cómo se evaluará el curso..." />
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Criterio</TableHead>
                    <TableHead className="w-[15%] text-center">Valor %</TableHead>
                    <TableHead className="w-[40%]">Descripción</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteriosCalificacion.map((crit, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input value={crit.criterio}
                          onChange={(e) => actualizarCriterioCalificacion(index, "criterio", e.target.value)}
                          placeholder="Nombre del criterio" disabled={!programaId} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min={0} max={100} value={crit.valor}
                          onChange={(e) => actualizarCriterioCalificacion(index, "valor", Number(e.target.value))}
                          className="text-center" placeholder="%" disabled={!programaId} />
                      </TableCell>
                      <TableCell>
                        <Input value={crit.descripcion}
                          onChange={(e) => actualizarCriterioCalificacion(index, "descripcion", e.target.value)}
                          placeholder="Descripción del criterio" disabled={!programaId} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm"
                          onClick={() => eliminarCriterioCalificacion(index)}
                          disabled={criteriosCalificacion.length === 1 || !programaId}
                          className="cursor-pointer">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${totalPorcentaje === 100 ? "text-green-600" : totalPorcentaje > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                        {totalPorcentaje}%
                      </span>
                    </TableCell>
                    <TableCell /><TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Button variant="outline" size="sm" onClick={agregarCriterioCalificacion}
              disabled={!programaId} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Agregar criterio
            </Button>
          </CardContent>
        </Card>

        {/* Derecho a examen */}
        <Card>
          <CardHeader>
            <CardTitle>Derecho Examen Ordinario y Extraordinario</CardTitle>
            <CardDescription>Criterios para exentar el examen ordinario</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <Label className="mb-2 block">Ordinario</Label>
              <textarea className={ta} value={derechoOrdinario}
                onChange={(e) => setDerechoOrdinario(e.target.value)}
                disabled={!programaId}
                placeholder="- Alumnos con 80% o más de asistencias..." />
            </div>
            <div>
              <Label className="mb-2 block">Extraordinario</Label>
              <textarea className={ta} value={derechoExtraordinario}
                onChange={(e) => setDerechoExtraordinario(e.target.value)}
                disabled={!programaId}
                placeholder="- Alumnos con 60% o más de asistencias..." />
            </div>
          </CardContent>
        </Card>

        {/* Descripción producto */}
        <Card>
          <CardHeader>
            <CardTitle>Descripción de Producto o Evidencia de Desempeño</CardTitle>
            <CardDescription>En caso de existir rúbrica del trabajo final, incluirla aquí</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea className={ta} value={descripcionProducto}
              onChange={(e) => setDescripcionProducto(e.target.value)}
              disabled={!programaId}
              placeholder="Describe el producto final o evidencias de desempeño..." />
          </CardContent>
        </Card>

        {/* Bibliografía */}
        <Card>
          <CardHeader><CardTitle>Bibliografía, Referencias y Recurso de la Red</CardTitle></CardHeader>
          <CardContent>
            <textarea className={ta} value={bibliografiaBasica}
              onChange={(e) => setBibliografiaBasica(e.target.value)}
              disabled={!programaId}
              placeholder="Lista las referencias bibliográficas, sitios web y recursos..." />
          </CardContent>
        </Card>

        {/* Normas de conducta */}
        <Card>
          <CardHeader>
            <CardTitle>Normas de Conducta dentro del Salón de Clases</CardTitle>
            <CardDescription>Reglas de conducta, retardos, uso de celular, alimentos, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea className={ta} value={normasConducta}
              onChange={(e) => setNormasConducta(e.target.value)}
              disabled={!programaId}
              placeholder="En caso de haber una sanción al no respetarlas, estas deberán mencionarse..." />
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleBack} disabled={loading} className="cursor-pointer">
            Cancelar
          </Button>
          <Button
            className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            onClick={handleGuardar}
            disabled={loading || !programaId}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}