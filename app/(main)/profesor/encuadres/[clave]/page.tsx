"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ChevronLeft, Loader2, Plus, Trash2, Lock } from "lucide-react";
import { useEncuadreProfesor } from "@/hooks/useEncuadreProfesor";
import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";
import AlumnosEncuadreCard from "@/components/alumnosEncuadreCard";

type CriterioCalificacion = {
  criterio: string;
  valor: number;
  descripcion: string;
};

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const encuadreId = params.clave as string;

  const confirm = useConfirm();
  const toast = useToast();
  const { data: session, status } = useSession();

  console.log("=== CLIENT COMPONENT ===");
  console.log("Encuadre ID recibido:", encuadreId);

  const [loadingData, setLoadingData] = useState(true);
  const [materiaClave, setMateriaClave] = useState("");
  const [materiaNombre, setMateriaNombre] = useState("");
  const [profesorPuedeModificar, setProfesorPuedeModificar] = useState(false);
  const [periodo, setPeriodo] = useState("");
  const [grupo, setGrupo] = useState("");
  const [descripcionEvaluacion, setDescripcionEvaluacion] = useState("");
  const [derechoOrdinario, setDerechoOrdinario] = useState("");
  const [derechoExtraordinario, setDerechoExtraordinario] = useState("");
  const [descripcionProducto, setDescripcionProducto] = useState("");
  const [bibliografiaBasica, setBibliografiaBasica] = useState("");
  const [normasConducta, setNormasConducta] = useState("");

  const [criteriosCalificacion, setCriteriosCalificacion] = useState<CriterioCalificacion[]>([
    { criterio: "", valor: 0, descripcion: "" },
  ]);

  const [valoresOriginales, setValoresOriginales] = useState<any>(null);

  const { obtenerEncuadre, actualizarEncuadre, loading, error } = useEncuadreProfesor();
  const [prevError, setPrevError] = useState<string | null>(null);

  useEffect(() => {
    if (encuadreId && encuadreId !== "undefined") {
      console.log("Llamando a cargarDatos con ID:", encuadreId);
      cargarDatos();
    } else {
      console.error("ID de encuadre inválido en useEffect:", encuadreId);
      setLoadingData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadreId]);

  // Mostrar error en toast cuando cambie
  useEffect(() => {
    if (error && error !== prevError) {
      toast.error(error);
      setPrevError(error);
    }
  }, [error, prevError, toast]);

  const cargarDatos = async () => {
    console.log("=== INICIO cargarDatos ===");
    console.log("ID a cargar:", encuadreId);

    setLoadingData(true);
    const encuadre = await obtenerEncuadre(encuadreId);

    if (encuadre) {
      console.log("Encuadre cargado exitosamente");
      setMateriaClave(encuadre.materia_clave);
      setMateriaNombre(encuadre.materia_nombre);
      setProfesorPuedeModificar(encuadre.profesor_puede_modificar_criterios);
      setPeriodo(encuadre.periodo);
      setGrupo(encuadre.grupo);
      setDescripcionEvaluacion(encuadre.descripcion_evaluacion);
      setDerechoOrdinario(encuadre.derecho_ordinario);
      setDerechoExtraordinario(encuadre.derecho_extraordinario);
      setDescripcionProducto(encuadre.descripcion_producto);
      setBibliografiaBasica(encuadre.bibliografia_basica);
      setNormasConducta(encuadre.normas_conducta);

      if (encuadre.criterios && encuadre.criterios.length > 0) {
        setCriteriosCalificacion(
          encuadre.criterios.map((c: any) => ({
            criterio: c.criterio,
            valor: c.valor,
            descripcion: c.descripcion || "",
          }))
        );
      }

      setValoresOriginales({
        descripcionEvaluacion: encuadre.descripcion_evaluacion,
        derechoOrdinario: encuadre.derecho_ordinario,
        derechoExtraordinario: encuadre.derecho_extraordinario,
        descripcionProducto: encuadre.descripcion_producto,
        bibliografiaBasica: encuadre.bibliografia_basica,
        normasConducta: encuadre.normas_conducta,
        criterios: encuadre.criterios || [],
      });
    } else {
      console.error("No se pudo cargar el encuadre");
    }

    setLoadingData(false);
  };

  const handleBack = async () => {
    const hayCambios =
      descripcionEvaluacion !== valoresOriginales?.descripcionEvaluacion ||
      derechoOrdinario !== valoresOriginales?.derechoOrdinario ||
      derechoExtraordinario !== valoresOriginales?.derechoExtraordinario ||
      descripcionProducto !== valoresOriginales?.descripcionProducto ||
      bibliografiaBasica !== valoresOriginales?.bibliografiaBasica ||
      normasConducta !== valoresOriginales?.normasConducta ||
      JSON.stringify(criteriosCalificacion) !== JSON.stringify(valoresOriginales?.criterios || []);

    if (hayCambios) {
      const shouldLeave = await confirm({
        title: "¿Salir sin guardar?",
        message: "Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?",
        confirmText: "Sí, salir",
        cancelText: "Cancelar",
      });

      if (!shouldLeave) return;
    }

    router.push("/profesor/encuadres");
  };

  const handleGuardar = async () => {
    if (status === "loading") {
      await confirm({
        title: "Cargando sesión",
        message: "Por favor espera un momento mientras se carga tu sesión.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (status === "unauthenticated" || !session?.user?.id) {
      await confirm({
        title: "Sesión no válida",
        message: "No se pudo verificar tu sesión. Por favor, cierra sesión y vuelve a iniciar.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (profesorPuedeModificar) {
      const criteriosConValor = criteriosCalificacion.filter((c) => c.criterio.trim() !== "");

      if (criteriosConValor.length > 0) {
        const criterioSinValor = criteriosConValor.find((c) => c.valor <= 0);
        if (criterioSinValor) {
          await confirm({
            title: "Porcentaje inválido",
            message: `El criterio "${criterioSinValor.criterio}" debe tener un porcentaje mayor a 0.`,
            confirmText: "Entendido",
            cancelText: "",
          });
          return;
        }

        const totalPorcentaje = criteriosConValor.reduce((sum, c) => sum + c.valor, 0);
        if (totalPorcentaje !== 100) {
          await confirm({
            title: "Porcentajes incorrectos",
            message: `Los porcentajes deben sumar exactamente 100%. Actualmente suman ${totalPorcentaje}%.`,
            confirmText: "Entendido",
            cancelText: "",
          });
          return;
        }

        const criterioExcesivo = criteriosConValor.find((c) => c.valor > 100);
        if (criterioExcesivo) {
          await confirm({
            title: "Porcentaje inválido",
            message: `El criterio "${criterioExcesivo.criterio}" tiene un porcentaje mayor a 100%.`,
            confirmText: "Entendido",
            cancelText: "",
          });
          return;
        }
      }

      if (criteriosConValor.length === 0) {
        await confirm({
          title: "Sin criterios de calificación",
          message: "Debes agregar al menos un criterio de evaluación con su porcentaje.",
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }
    }

    const shouldSave = await confirm({
      title: "Guardar cambios",
      message: "¿Estás seguro de que deseas guardar los cambios realizados al encuadre?",
      confirmText: "Guardar",
      cancelText: "Cancelar",
    });

    if (!shouldSave) return;

    const criteriosAGuardar = profesorPuedeModificar
      ? criteriosCalificacion.filter((c) => c.criterio.trim() !== "")
      : undefined;

    const success = await actualizarEncuadre({
      encuadreId: encuadreId,
      descripcionEvaluacion,
      derechoOrdinario,
      derechoExtraordinario,
      descripcionProducto,
      bibliografiaBasica,
      normasConducta,
      criterios: criteriosAGuardar,
    });

    if (success) {
      toast.success("Los cambios se han guardado correctamente.");
      await cargarDatos();
    } else {
      toast.error("Error al guardar los cambios. Intenta de nuevo.");
    }
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
    const nuevosCriterios = [...criteriosCalificacion];
    nuevosCriterios[index] = { ...nuevosCriterios[index], [field]: value };
    setCriteriosCalificacion(nuevosCriterios);
  };

  const criteriosConValor = criteriosCalificacion.filter((c) => c.criterio.trim() !== "");
  const totalPorcentaje = criteriosConValor.reduce((sum, c) => sum + c.valor, 0);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  if (!materiaClave || !encuadreId || encuadreId === "undefined") {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>No se encontró el encuadre</CardTitle>
              <CardDescription>
                El encuadre no existe o no tienes permiso para verlo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => router.push("/profesor/encuadres")}
                className="cursor-pointer"
              >
                Regresar
              </Button>
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
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Encuadre de la Unidad de Aprendizaje</h1>
          <p className="text-lg font-semibold text-[#00723F] mt-2">
            {materiaClave} - {materiaNombre}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa y edita el encuadre de tu curso.
          </p>
        </div>

        {!profesorPuedeModificar && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Permisos de edición limitados
                  </h3>
                  <p className="text-sm text-yellow-800">
                    El capturista ha restringido la edición de los criterios de evaluación.
                    Solo podrás editar las descripciones y contenidos generales del encuadre.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Datos del curso</CardTitle>
            <CardDescription>
              Esta información no puede ser modificada por el profesor
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <Label className="mb-2 block">Clave</Label>
              <Input value={materiaClave} disabled className="bg-gray-50" />
            </div>
            <div className="sm:col-span-9">
              <Label className="mb-2 block">Nombre del Curso</Label>
              <Input value={materiaNombre} disabled className="bg-gray-50" />
            </div>

            <div className="sm:col-span-3">
              <Label className="mb-2 block">Periodo</Label>
              <Input value={periodo} disabled className="bg-gray-50" />
            </div>

            <div className="sm:col-span-3">
              <Label className="mb-2 block">Grupo</Label>
              <Input value={grupo} disabled className="bg-gray-50" />
            </div>

            <div className="sm:col-span-6">
              <Label className="mb-2 block">Permisos de Edición</Label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                {profesorPuedeModificar ? (
                  <span className="text-sm text-green-700 font-medium">
                    ✓ Edición completa habilitada
                  </span>
                ) : (
                  <span className="text-sm text-yellow-700 font-medium">
                    <Lock className="inline h-4 w-4 mr-1" />
                    Solo lectura en criterios
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluación de Curso</CardTitle>
            <CardDescription>
              {profesorPuedeModificar
                ? "Puedes modificar los criterios de evaluación y sus porcentajes"
                : "Los criterios de evaluación no pueden ser modificados"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Descripción general</Label>
              <textarea
                className={ta}
                value={descripcionEvaluacion}
                onChange={(e) => setDescripcionEvaluacion(e.target.value)}
                placeholder="Descripción detallada de cómo se evaluará el curso..."
              />
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Criterio</TableHead>
                    <TableHead className="w-[15%] text-center">Valor %</TableHead>
                    <TableHead className="w-[40%]">Descripción</TableHead>
                    {profesorPuedeModificar && <TableHead className="w-[10%]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteriosCalificacion.map((crit, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={crit.criterio}
                          onChange={(e) =>
                            actualizarCriterioCalificacion(index, "criterio", e.target.value)
                          }
                          placeholder="Nombre del criterio"
                          disabled={!profesorPuedeModificar}
                          className={!profesorPuedeModificar ? "bg-gray-50" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={crit.valor}
                          onChange={(e) =>
                            actualizarCriterioCalificacion(index, "valor", Number(e.target.value))
                          }
                          className={`text-center ${!profesorPuedeModificar ? "bg-gray-50" : ""}`}
                          placeholder="%"
                          disabled={!profesorPuedeModificar}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={crit.descripcion}
                          onChange={(e) =>
                            actualizarCriterioCalificacion(index, "descripcion", e.target.value)
                          }
                          placeholder="Descripción del criterio"
                          disabled={!profesorPuedeModificar}
                          className={!profesorPuedeModificar ? "bg-gray-50" : ""}
                        />
                      </TableCell>
                      {profesorPuedeModificar && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarCriterioCalificacion(index)}
                            disabled={criteriosCalificacion.length === 1}
                            className="cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-semibold ${
                          totalPorcentaje === 100
                            ? "text-green-600"
                            : totalPorcentaje > 0
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {totalPorcentaje}%
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                    {profesorPuedeModificar && <TableCell></TableCell>}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {profesorPuedeModificar && (
              <Button
                variant="outline"
                size="sm"
                onClick={agregarCriterioCalificacion}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar criterio
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derecho Examen Ordinario y Extraordinario</CardTitle>
            <CardDescription>
              Detallar claramente los criterios para exentar el examen ordinario
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <Label className="mb-2 block">Ordinario</Label>
              <textarea
                className={ta}
                value={derechoOrdinario}
                onChange={(e) => setDerechoOrdinario(e.target.value)}
                placeholder="- Alumnos con 80% o más de asistencias en clases impartidas&#10;- Para exentar examen ordinario el estudiante deberá tener..."
              />
            </div>
            <div>
              <Label className="mb-2 block">Extraordinario</Label>
              <textarea
                className={ta}
                value={derechoExtraordinario}
                onChange={(e) => setDerechoExtraordinario(e.target.value)}
                placeholder="- Alumnos con 60% o más de asistencias en clases impartidas&#10;- La calificación final obtenida equivale al 100%"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descripción de Producto o Evidencia de Desempeño</CardTitle>
            <CardDescription>
              En caso de existir rúbrica del trabajo final, incluirla en este apartado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className={ta}
              value={descripcionProducto}
              onChange={(e) => setDescripcionProducto(e.target.value)}
              placeholder="Describe el producto final o evidencias de desempeño..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bibliografía, Referencias y Recurso de la Red</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className={ta}
              value={bibliografiaBasica}
              onChange={(e) => setBibliografiaBasica(e.target.value)}
              placeholder="Lista las referencias bibliográficas, sitios web y recursos..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Normas de Conducta dentro del Salón de Clases</CardTitle>
            <CardDescription>
              Describir las reglas de conducta, retardos, uso de celular, alimentos, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className={ta}
              value={normasConducta}
              onChange={(e) => setNormasConducta(e.target.value)}
              placeholder="En caso de haber una sanción al no respetarlas, estas deberán mencionarse en este apartado y apegarse al estatuto general de la UABC (art. 202)"
            />
          </CardContent>
        </Card>

        {/* Card de Gestión de Alumnos */}
        <AlumnosEncuadreCard
          encuadreId={encuadreId}
          materiaNombre={materiaNombre}
          grupo={grupo}
          periodo={periodo}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            onClick={handleGuardar}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}