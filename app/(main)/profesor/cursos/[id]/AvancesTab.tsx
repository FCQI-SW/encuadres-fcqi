// app/(main)/profesor/cursos/[id]/AvancesTab.tsx

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
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
import { Loader2, ClipboardList, Save, MessageSquare, X } from "lucide-react";
import { useRegistroAvances, TemaConCheckin, HeaderCurso } from "@/hooks/useRegistroAvances";
import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";

type AvancesTabProps = {
  encuadreId: string;
  materiaNombre: string;
  grupo: string;
  periodo: string;
};

type RespuestaLocal = {
  vista: boolean | null;
  justificacion: string;
  showComment: boolean;
};

export default function AvancesTab({ encuadreId, grupo }: AvancesTabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const { obtenerDatosCompletos, guardarCheckins, loading } = useRegistroAvances(encuadreId);

  const [loadingData, setLoadingData] = React.useState(true);
  const [header, setHeader] = React.useState<HeaderCurso | null>(null);
  const [temas, setTemas] = React.useState<TemaConCheckin[]>([]);
  const [respuestas, setRespuestas] = React.useState<Record<number, RespuestaLocal>>({});

  React.useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadreId]);

  const cargarDatos = async () => {
    setLoadingData(true);
    const { header: h, temas: t } = await obtenerDatosCompletos();
    setHeader(h);
    setTemas(t);

    // Inicializar respuestas con los datos existentes
    const respuestasIniciales: Record<number, RespuestaLocal> = {};
    t.forEach((tema) => {
      respuestasIniciales[tema.id] = {
        vista: tema.tema_visto,
        justificacion: tema.justificacion,
        showComment: tema.justificacion ? true : false,
      };
    });
    setRespuestas(respuestasIniciales);

    setLoadingData(false);
  };

  const setVista = (temaId: number, valor: boolean) => {
    setRespuestas((prev) => ({
      ...prev,
      [temaId]: { ...prev[temaId], vista: valor },
    }));
  };

  const toggleComment = (temaId: number) => {
    setRespuestas((prev) => ({
      ...prev,
      [temaId]: { ...prev[temaId], showComment: !prev[temaId]?.showComment },
    }));
  };

  const setJustificacion = (temaId: number, value: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [temaId]: { ...prev[temaId], justificacion: value },
    }));
  };
const handleGuardar = async () => {
  // Validación: verificar que hay al menos un cambio
  const tieneRespuestas = Object.values(respuestas).some(r => r.vista !== null);
  
  if (!tieneRespuestas) {
    toast.warning("No hay cambios para guardar. Marca al menos un tema como visto o no visto.");
    return;
  }

  const shouldSave = await confirm({
    title: "Guardar avances",
    message: "¿Deseas guardar el registro de avances? Esta acción actualizará el estado de los temas.",
    confirmText: "Guardar",
    cancelText: "Cancelar",
  });

  if (!shouldSave) return;

  const result = await guardarCheckins(respuestas, grupo);

  if (result.success) {
    toast.success(result.error || "El registro de avances se ha guardado correctamente.");
    await cargarDatos();
  } else {
    toast.error(result.error || "No se pudo guardar el registro de avances.");
  }
};
  // Agrupar temas por unidad
  const temasPorUnidad = React.useMemo(() => {
    const grupos: Record<number, { nombre: string; temas: TemaConCheckin[] }> = {};
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
      {/* Header del curso */}
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
                  <TableHead className="font-bold">UNIDAD DE APRENDIZAJE</TableHead>
                  <TableHead className="font-bold">CLAVE</TableHead>
                  <TableHead className="font-bold">GRUPO</TableHead>
                  <TableHead className="font-bold">PERIODO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{header.asignatura}</TableCell>
                  <TableCell>{header.clave}</TableCell>
                  <TableCell>{header.grupo}</TableCell>
                  <TableCell>{header.periodo}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-center font-semibold bg-muted/40">
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

      {/* Tabla de temas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Plan de Clases
          </CardTitle>
          <CardDescription>
            Marque los temas que se han cubierto y agregue comentarios si es necesario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-bold w-[100px]">UNIDAD</TableHead>
                  <TableHead className="font-bold w-[80px]">TEMA</TableHead>
                  <TableHead className="font-bold min-w-[200px]">NOMBRE DEL TEMA</TableHead>
                  <TableHead className="font-bold w-[140px]">TEMA VISTO</TableHead>
                  <TableHead className="font-bold min-w-[200px]">JUSTIFICACIÓN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(temasPorUnidad).map(([unidadNum, unidadData]) => (
                  <React.Fragment key={unidadNum}>
                    {/* Fila de encabezado de unidad */}
                    <TableRow className="bg-[#00723F]/10">
                      <TableCell colSpan={5} className="font-semibold">
                        Unidad {unidadNum}: {unidadData.nombre}
                      </TableCell>
                    </TableRow>

                    {/* Filas de temas */}
                    {unidadData.temas.map((tema) => {
                      const state = respuestas[tema.id];
                      return (
                        <TableRow key={tema.id}>
                          <TableCell className="text-center text-muted-foreground">
                            {tema.unidad_numero}
                          </TableCell>
                          <TableCell className="text-center">{tema.numero}</TableCell>
                          <TableCell>{tema.nombre}</TableCell>

                          {/* Sí / No */}
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={state?.vista === true}
                                  onCheckedChange={(checked) => {
                                    if (checked) setVista(tema.id, true);
                                  }}
                                />
                                <span className="text-sm">Sí</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={state?.vista === false}
                                  onCheckedChange={(checked) => {
                                    if (checked) setVista(tema.id, false);
                                  }}
                                />
                                <span className="text-sm">No</span>
                              </label>
                            </div>
                          </TableCell>

                          {/* Justificación */}
                          <TableCell>
                            {!state?.showComment ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => toggleComment(tema.id)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {state?.justificacion ? "Ver comentario" : "Agregar"}
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Escriba una justificación..."
                                  value={state?.justificacion ?? ""}
                                  onChange={(e) => setJustificacion(tema.id, e.target.value)}
                                  className="text-sm"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-pointer p-1"
                                  onClick={() => toggleComment(tema.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-center">
        <Button
          className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
          onClick={handleGuardar}
          disabled={loading}
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