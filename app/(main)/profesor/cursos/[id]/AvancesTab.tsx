"use client";

import * as React from "react";
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ClipboardList, Save, AlertCircle } from "lucide-react";
import {
  useRegistroAvances,
  TemaConCheckin,
  HeaderCurso,
} from "@/hooks/useRegistroAvances";
import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";

type AvancesTabProps = {
  encuadreId: string;
  materiaNombre: string;
  grupo: string;
  periodo: string;
  puedeEditar: boolean;
  motivoPermiso?: string;
};

type RespuestaLocal = {
  vista: boolean | null;
  justificacion: string;
};

export default function AvancesTab({
  encuadreId,
  grupo,
  puedeEditar,
  motivoPermiso,
}: AvancesTabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const { obtenerDatosCompletos, guardarCheckins, loading } =
    useRegistroAvances(encuadreId);

  const [loadingData, setLoadingData] = React.useState(true);
  const [header, setHeader] = React.useState<HeaderCurso | null>(null);
  const [temas, setTemas] = React.useState<TemaConCheckin[]>([]);
  const [respuestas, setRespuestas] = React.useState<
    Record<number, RespuestaLocal>
  >({});

  React.useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadreId]);

  const cargarDatos = async () => {
    setLoadingData(true);
    const { header: h, temas: t } = await obtenerDatosCompletos();
    setHeader(h);
    setTemas(t);

    const respuestasIniciales: Record<number, RespuestaLocal> = {};
    t.forEach((tema) => {
      respuestasIniciales[tema.id] = {
        vista: tema.tema_visto,
        justificacion: tema.justificacion || "",
      };
    });
    setRespuestas(respuestasIniciales);

    setLoadingData(false);
  };

  const setVista = (temaId: number, valor: boolean) => {
    if (!puedeEditar) return;

    setRespuestas((prev) => {
      const actual: RespuestaLocal = prev[temaId] || {
        vista: null,
        justificacion: "",
      };

      if (valor === true) {
        return {
          ...prev,
          [temaId]: {
            vista: true,
            justificacion: "",
          },
        };
      }

      return {
        ...prev,
        [temaId]: {
          ...actual,
          vista: false,
        },
      };
    });
  };

  const setJustificacion = (temaId: number, value: string) => {
    if (!puedeEditar) return;

    setRespuestas((prev) => ({
      ...prev,
      [temaId]: { ...prev[temaId], justificacion: value },
    }));
  };

  // ── Temas marcados como "No" que aún no tienen justificación ──
  // Se calcula aquí para usarlo tanto en la validación de guardado
  // como para resaltar en rojo los campos que faltan.
  const temasSinJustificar = React.useMemo(
    () =>
      temas.filter((tema) => {
        const r = respuestas[tema.id];
        return r?.vista === false && !r.justificacion?.trim();
      }),
    [temas, respuestas]
  );

  const handleGuardar = async () => {
    if (!puedeEditar) {
      toast.error(
        motivoPermiso ||
          "No tienes permiso de operación para registrar avances en este momento."
      );
      return;
    }

    const tieneRespuestas = Object.values(respuestas).some(
      (r) => r.vista !== null
    );

    if (!tieneRespuestas) {
      toast.warning(
        "No hay cambios para guardar. Marca al menos un tema como visto o no visto."
      );
      return;
    }

    // ── VALIDACIÓN: todo tema marcado como "No" requiere justificación ──
    if (temasSinJustificar.length > 0) {
      const lista = temasSinJustificar.map((t) => t.numero).join(", ");
      toast.error(
        `Debes escribir una justificación para los temas marcados como "No": ${lista}`
      );
      return;
    }

    const shouldSave = await confirm({
      title: "Guardar avances",
      message:
        "¿Deseas guardar el registro de avances? Esta acción actualizará el estado de los temas.",
      confirmText: "Guardar",
      cancelText: "Cancelar",
    });

    if (!shouldSave) return;

    const result = await guardarCheckins(respuestas, grupo);

    if (result.success) {
      toast.success(
        result.error || "El registro de avances se ha guardado correctamente."
      );
      await cargarDatos();
    } else {
      toast.error(result.error || "No se pudo guardar el registro de avances.");
    }
  };

  const temasPorUnidad = React.useMemo(() => {
    const grupos: Record<number, { nombre: string; temas: TemaConCheckin[] }> =
      {};
    temas.forEach((tema) => {
      if (!grupos[tema.unidad_numero]) {
        grupos[tema.unidad_numero] = {
          nombre: tema.unidad_nombre,
          temas: [],
        };
      }
      grupos[tema.unidad_numero].temas.push(tema);
    });
    return grupos;
  }, [temas]);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  if (!header || temas.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Sin temas registrados</p>
            <p className="text-sm">
              No se encontraron temas para este curso. Verifique que el programa
              tenga unidades y temas asignados.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!puedeEditar && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Registro en modo consulta
                </h3>
                <p className="text-sm text-blue-800">
                  Puedes revisar el plan de clases, pero no registrar avances.
                  {motivoPermiso ? ` ${motivoPermiso}` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso de justificaciones pendientes */}
      {puedeEditar && temasSinJustificar.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  {temasSinJustificar.length} tema
                  {temasSinJustificar.length > 1 ? "s" : ""} sin justificar
                </h3>
                <p className="text-sm text-red-800">
                  Los temas marcados como &quot;No&quot; requieren una
                  justificación: {temasSinJustificar.map((t) => t.numero).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg">
            UNIVERSIDAD AUTÓNOMA DE BAJA CALIFORNIA
          </CardTitle>
          <CardDescription className="text-center text-xs">
            COORDINACIÓN GENERAL DE FORMACIÓN PROFESIONAL
            <br />
            PROGRAMA DE UNIDAD DE APRENDIZAJE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-bold">
                    UNIDAD DE APRENDIZAJE
                  </TableHead>
                  <TableHead className="font-bold">CLAVE</TableHead>
                  <TableHead className="font-bold">GRUPO</TableHead>
                  <TableHead className="font-bold">PERIODO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    {header.asignatura}
                  </TableCell>
                  <TableCell>{header.clave}</TableCell>
                  <TableCell>{header.grupo}</TableCell>
                  <TableCell>{header.periodo}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center font-semibold bg-muted/40"
                  >
                    NOMBRE DEL DOCENTE
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4}>{header.docente}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {header.competencia && (
            <div className="mt-4 p-3 bg-muted/30 rounded-md">
              <p className="text-sm">
                <span className="font-semibold">Competencia del curso:</span>{" "}
                {header.competencia}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Plan de Clases
          </CardTitle>
          <CardDescription>
            Marque los temas que se han cubierto. Los temas marcados como
            &quot;No&quot; requieren justificación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-bold w-[100px]">UNIDAD</TableHead>
                  <TableHead className="font-bold w-[80px]">TEMA</TableHead>
                  <TableHead className="font-bold min-w-[200px]">
                    NOMBRE DEL TEMA
                  </TableHead>
                  <TableHead className="font-bold w-[140px]">
                    TEMA VISTO
                  </TableHead>
                  <TableHead className="font-bold min-w-[200px]">
                    JUSTIFICACIÓN
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(temasPorUnidad).map(
                  ([unidadNum, unidadData]) => (
                    <React.Fragment key={unidadNum}>
                      <TableRow className="bg-[#00723F]/10">
                        <TableCell colSpan={5} className="font-semibold">
                          Unidad {unidadNum}: {unidadData.nombre}
                        </TableCell>
                      </TableRow>

                      {unidadData.temas.map((tema) => {
                        const state = respuestas[tema.id];
                        // Falta justificación en un tema marcado como "No"
                        const faltaJustificacion =
                          puedeEditar &&
                          state?.vista === false &&
                          !state.justificacion?.trim();

                        return (
                          <TableRow key={tema.id}>
                            <TableCell className="text-center text-muted-foreground">
                              {tema.unidad_numero}
                            </TableCell>
                            <TableCell className="text-center">
                              {tema.numero}
                            </TableCell>
                            <TableCell>{tema.nombre}</TableCell>

                            <TableCell>
                              <div className="flex items-center gap-4">
                                <label
                                  className={`flex items-center gap-2 ${
                                    puedeEditar ? "cursor-pointer" : "opacity-60"
                                  }`}
                                >
                                  <Checkbox
                                    checked={state?.vista === true}
                                    disabled={!puedeEditar}
                                    onCheckedChange={(checked) => {
                                      if (checked) setVista(tema.id, true);
                                    }}
                                  />
                                  <span className="text-sm">Sí</span>
                                </label>
                                <label
                                  className={`flex items-center gap-2 ${
                                    puedeEditar ? "cursor-pointer" : "opacity-60"
                                  }`}
                                >
                                  <Checkbox
                                    checked={state?.vista === false}
                                    disabled={!puedeEditar}
                                    onCheckedChange={(checked) => {
                                      if (checked) setVista(tema.id, false);
                                    }}
                                  />
                                  <span className="text-sm">No</span>
                                </label>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Input
                                placeholder={
                                  state?.vista === false
                                    ? "Justificación obligatoria..."
                                    : "Escriba una justificación..."
                                }
                                value={state?.justificacion ?? ""}
                                onChange={(e) =>
                                  setJustificacion(tema.id, e.target.value)
                                }
                                className={`text-sm ${
                                  faltaJustificacion
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : ""
                                }`}
                                disabled={!puedeEditar || state?.vista !== false}
                                maxLength={500}
                              />
                              {faltaJustificacion && (
                                <p className="text-xs text-red-600 mt-1">
                                  Este campo es obligatorio
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
          onClick={handleGuardar}
          disabled={loading || !puedeEditar}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {loading ? "Guardando..." : "Guardar avances"}
        </Button>
      </div>
    </div>
  );
}