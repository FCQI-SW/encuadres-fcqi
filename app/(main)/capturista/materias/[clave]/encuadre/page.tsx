"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EncuadreMateria() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave as string;
  const confirm = useConfirm();
  const toast = useToast();
  const { data: session, status } = useSession();

  const [loadingData, setLoadingData] = useState(true);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [programaId, setProgramaId] = useState<string>("");
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [profesorId, setProfesorId] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [grupo, setGrupo] = useState("");
  const [descripcionEvaluacion, setDescripcionEvaluacion] = useState("");
  const [derechoOrdinario, setDerechoOrdinario] = useState("");
  const [derechoExtraordinario, setDerechoExtraordinario] = useState("");
  const [descripcionProducto, setDescripcionProducto] = useState("");
  const [bibliografiaBasica, setBibliografiaBasica] = useState("");
  const [normasConducta, setNormasConducta] = useState("");
  const [profesorPuedeModificar, setProfesorPuedeModificar] = useState(true);
  
  // Criterios de calificación (tabla)
  const [criteriosCalificacion, setCriteriosCalificacion] = useState<CriterioCalificacion[]>([
    { criterio: "", valor: 0, descripcion: "" },
    { criterio: "", valor: 0, descripcion: "" },
    { criterio: "", valor: 0, descripcion: "" },
  ]);

  const { guardarEncuadre, cargarEncuadre, loading, error } = useEncuadreForm(programaId);
  const [prevError, setPrevError] = useState<string | null>(null);

  // Mostrar error en toast cuando cambie
  useEffect(() => {
    if (error && error !== prevError) {
      toast.error(error);
      setPrevError(error);
    }
  }, [error, prevError, toast]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingData(true);

      const [{ data: matData }, { data: profData }] = await Promise.all([
        supabase
          .from("materias")
          .select("id, clave, nombre_materia")
          .eq("clave", clave),
        supabase
          .from("usuarios")
          .select("id, nombre, rol_id")
          .eq("rol_id", "bc3ab654-5fc8-401a-a6e2-97903b45cc93"),
      ]);

      if (!isMounted) return;

      if (matData && matData.length > 0) {
        const m = matData[0] as any;
        setMateria({ id: m.id, clave: m.clave, nombre: m.nombre_materia });

        // Obtener el programa_id
        const { data: programaData } = await supabase
          .from("programas")
          .select("id")
          .eq("materia_id", m.id)
          .single();

        if (programaData) {
          setProgramaId(programaData.id);
        }
      } else {
        setMateria(null);
      }

      if (profData) {
        setProfesores(
          (profData as any[]).map((p) => ({ id: p.id, nombre: p.nombre }))
        );
      } else {
        setProfesores([]);
      }

      setLoadingData(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [clave]);

  // Cargar encuadre existente
  useEffect(() => {
    if (!programaId) return;

    (async () => {
      const encuadre = await cargarEncuadre();
      if (encuadre) {
        setProfesorId(encuadre.usuario_id || "");
        setGrupo(encuadre.grupo || "");
        setPeriodo(encuadre.periodo || "");
        setDescripcionEvaluacion(encuadre.descripcion_evaluacion || "");
        setDerechoOrdinario(encuadre.derecho_ordinario || "");
        setDerechoExtraordinario(encuadre.derecho_extraordinario || "");
        setDescripcionProducto(encuadre.descripcion_producto || "");
        setBibliografiaBasica(encuadre.bibliografia_basica || "");
        setNormasConducta(encuadre.normas_conducta || "");
        setProfesorPuedeModificar(encuadre.profesor_puede_modificar_criterios ?? true);
        
        // Cargar criterios
        if (encuadre.criterios && encuadre.criterios.length > 0) {
          setCriteriosCalificacion(
            encuadre.criterios.map((c: any) => ({
              criterio: c.criterio,
              valor: c.valor,
              descripcion: c.descripcion || "",
            }))
          );
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programaId]);

  const handleBack = async () => {
    if (profesorId || periodo || grupo) {
      const shouldLeave = await confirm({
        title: "¿Salir sin guardar?",
        message: "Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?",
        confirmText: "Sí, salir",
        cancelText: "Cancelar",
      });

      if (!shouldLeave) return;
    }

    router.push("/capturista/materias");
  };

  const handleGuardar = async () => {
    if (!materia || !programaId) return;

    // Esperar a que la sesión esté completamente cargada
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

    const userId = session.user.id;

    // ========================================
    // VALIDACIONES BÁSICAS (Campos requeridos)
    // ========================================

    if (!profesorId) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor selecciona un profesor.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!periodo.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa el periodo.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!grupo.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa el grupo.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    // ========================================
    // VALIDACIONES DE CRITERIOS DE CALIFICACIÓN
    // ========================================

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

    // ========================================
    // ADVERTENCIAS OPCIONALES
    // ========================================

    if (!descripcionEvaluacion.trim()) {
      const shouldContinue = await confirm({
        title: "Campo vacío",
        message: "No has ingresado una descripción general de la evaluación. ¿Deseas continuar de todas formas?",
        confirmText: "Sí, continuar",
        cancelText: "Cancelar",
      });

      if (!shouldContinue) return;
    }

    if (!derechoOrdinario.trim() || !derechoExtraordinario.trim()) {
      const shouldContinue = await confirm({
        title: "Información incompleta",
        message: "No has completado los criterios para el Derecho a Examen Ordinario y/o Extraordinario. ¿Deseas continuar de todas formas?",
        confirmText: "Sí, continuar",
        cancelText: "Cancelar",
      });

      if (!shouldContinue) return;
    }

    // ========================================
    // CONFIRMACIÓN FINAL
    // ========================================

    const shouldSave = await confirm({
      title: "Guardar encuadre",
      message: "¿Estás seguro de que deseas guardar la configuración del encuadre?",
      confirmText: "Guardar",
      cancelText: "Cancelar",
    });

    if (!shouldSave) return;

    // ========================================
    // PREPARAR Y GUARDAR DATOS
    // ========================================

    const criteriosAGuardar = criteriosCalificacion.filter((c) => c.criterio.trim() !== "");

    const success = await guardarEncuadre({
      programaId: programaId,
      usuarioId: profesorId,
      periodo,
      grupo,
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

  const agregarCriterioCalificacion = () => {
    setCriteriosCalificacion([...criteriosCalificacion, { criterio: "", valor: 0, descripcion: "" }]);
  };

  const eliminarCriterioCalificacion = (index: number) => {
    setCriteriosCalificacion(criteriosCalificacion.filter((_, i) => i !== index));
  };

  const actualizarCriterioCalificacion = (index: number, field: keyof CriterioCalificacion, value: string | number) => {
    const nuevosCriterios = [...criteriosCalificacion];
    nuevosCriterios[index] = { ...nuevosCriterios[index], [field]: value };
    setCriteriosCalificacion(nuevosCriterios);
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
              <CardDescription>
                Verifica la clave en la URL o regresa al listado.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleBack}
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
          <Button
            variant="outline"
            onClick={handleBack}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar
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
</div>


        {/* Datos básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del curso</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <Label className="mb-2 block">Clave</Label>
              <Input value={materia.clave} disabled />
            </div>
            <div className="sm:col-span-9">
              <Label className="mb-2 block">Nombre del Curso</Label>
              <Input value={materia.nombre} disabled />
            </div>

            <div className="sm:col-span-6">
              <Label className="mb-2 block">
                Profesor <span className="text-red-500">*</span>
              </Label>
              <Select
                value={profesorId}
                onValueChange={setProfesorId}
                disabled={loadingData || profesores.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingData ? "Cargando..." : "Seleccione un profesor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {profesores.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3">
              <Label className="mb-2 block">
                Periodo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="2025-1"
              />
            </div>

            <div className="sm:col-span-3">
              <Label className="mb-2 block">
                Grupo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                placeholder="301"
              />
            </div>
          </CardContent>
        </Card>

        {/* Evaluación de Curso */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluación de Curso</CardTitle>
            <CardDescription>
              Descripción detallada de cómo se evaluará el curso. Asignar valor a cada actividad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Checkbox permitir modificar */}
            <div className="flex items-center space-x-2 pb-4 border-b">
              <input
                type="checkbox"
                id="profesorModifica"
                checked={profesorPuedeModificar}
                onChange={(e) => setProfesorPuedeModificar(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
              <Label htmlFor="profesorModifica" className="cursor-pointer">
                Permitir al profesor modificar estos criterios
              </Label>
            </div>

            {/* Descripción general de evaluación */}
            <div>
              <Label className="mb-2 block">Descripción general</Label>
              <textarea
                className={ta}
                value={descripcionEvaluacion}
                onChange={(e) => setDescripcionEvaluacion(e.target.value)}
                placeholder="Descripción detallada de cómo se evaluará el curso..."
              />
            </div>

            {/* Tabla de criterios */}
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
                        <Input
                          value={crit.criterio}
                          onChange={(e) =>
                            actualizarCriterioCalificacion(index, "criterio", e.target.value)
                          }
                          placeholder="Nombre del criterio"
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
                          className="text-center"
                          placeholder="%"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={crit.descripcion}
                          onChange={(e) =>
                            actualizarCriterioCalificacion(index, "descripcion", e.target.value)
                          }
                          placeholder="Descripción del criterio"
                        />
                      </TableCell>
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
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={agregarCriterioCalificacion}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar criterio
            </Button>
          </CardContent>
        </Card>

        {/* Derecho Examen Ordinario y Extraordinario */}
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

        {/* Descripción de Producto */}
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

        {/* Bibliografía */}
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

        {/* Normas de Conducta */}
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
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}