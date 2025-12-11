"use client";

import { Fragment, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ClipboardList, Save, MessageSquare, X } from "lucide-react";
import { useRegistroAvances, TemaConCheckin } from "@/hooks/useRegistroAvances";
import { useConfirm } from "@/components/global-confirm-modal";

type AvancesTabProps = {
  encuadreId: string;
  grupo: string;
};

type RespuestaTema = {
  vista: boolean | null;
  justificacion: string;
  showComment: boolean;
};

export default function AvancesTab({ encuadreId, grupo }: AvancesTabProps) {
  const { data: session } = useSession();
  const confirm = useConfirm();
  const { obtenerDatosCompletos, guardarCheckins, loading } = useRegistroAvances(encuadreId);

  const [temas, setTemas] = useState<TemaConCheckin[]>([]);
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaTema>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [headerInfo, setHeaderInfo] = useState<{
    asignatura: string;
    clave: string;
    grupo: string;
    periodo: string;
    docente: string;
  } | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      cargarDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, encuadreId]);

  const cargarDatos = async () => {
    setLoadingData(true);
    const { header, temas: temasData } = await obtenerDatosCompletos();
    setHeaderInfo(header);
    setTemas(temasData);

    const respuestasIniciales: Record<number, RespuestaTema> = {};
    temasData.forEach((tema) => {
      respuestasIniciales[tema.id] = {
        vista: tema.tema_visto,
        justificacion: tema.justificacion || "",
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
    const tieneRespuestas = Object.values(respuestas).some((r) => r.vista !== null);

    if (!tieneRespuestas) {
      await confirm({
        title: "Sin cambios",
        message: "No hay cambios para guardar. Marca al menos un tema como estudiado o no estudiado.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    const shouldSave = await confirm({
      title: "Guardar avances",
      message: "¿Deseas guardar tu registro de avances?",
      confirmText: "Guardar",
      cancelText: "Cancelar",
    });

    if (!shouldSave) return;

    const result = await guardarCheckins(respuestas, grupo);

    if (result.success) {
      await confirm({
        title: "¡Guardado exitoso!",
        message: result.error || "Tu registro de avances se ha guardado correctamente.",
        confirmText: "Aceptar",
        cancelText: "",
      });
      await cargarDatos();
    } else {
      await confirm({
        title: "Error al guardar",
        message: result.error || "No se pudo guardar el registro de avances.",
        confirmText: "Entendido",
        cancelText: "",
      });
    }
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
  }, {} as Record<string, { unidad_numero: number; unidad_nombre: string; temas: TemaConCheckin[] }>);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-t-4 border-t-[#00723F]">
        <CardHeader className="bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>UNIVERSIDAD AUTÓNOMA DE BAJA CALIFORNIA</span>
              </div>
              <CardTitle className="text-xl">
                {headerInfo?.asignatura || "Cargando..."}
              </CardTitle>
              <CardDescription className="mt-1">
                Clave: {headerInfo?.clave} • Grupo: {headerInfo?.grupo} • Periodo: {headerInfo?.periodo}
              </CardDescription>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-500">Docente</p>
              <p className="font-medium">{headerInfo?.docente}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Información para el alumno */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800">
            <strong>Instrucciones:</strong> Marca los temas que ya has estudiado. 
            Si hay algún tema que aún no has podido revisar, puedes agregar una nota en la columna de observaciones.
          </p>
        </CardContent>
      </Card>

      {/* Tabla de temas */}
      {temas.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Sin temas registrados</p>
              <p className="text-sm">El encuadre aún no tiene temas para registrar avances</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Registro de Avances
              </CardTitle>
              <CardDescription>
                Marca los temas que has estudiado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-bold w-[80px]">UNIDAD</TableHead>
                      <TableHead className="font-bold w-[80px]">TEMA</TableHead>
                      <TableHead className="font-bold min-w-[200px]">NOMBRE DEL TEMA</TableHead>
                      <TableHead className="font-bold w-[140px]">¿ESTUDIADO?</TableHead>
                      <TableHead className="font-bold min-w-[200px]">OBSERVACIONES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(temasAgrupados).map((grupoUnidad) => (
                      <Fragment key={`unidad-${grupoUnidad.unidad_numero}`}>
                        {/* Encabezado de unidad */}
                        <TableRow className="bg-[#00723F]/10">
                          <TableCell colSpan={5} className="font-semibold">
                            Unidad {grupoUnidad.unidad_numero}: {grupoUnidad.unidad_nombre}
                          </TableCell>
                        </TableRow>
                        {/* Temas de la unidad */}
                        {grupoUnidad.temas.map((tema) => {
                          const state = respuestas[tema.id];
                          return (
                            <TableRow key={tema.id}>
                              <TableCell className="text-center text-muted-foreground">
                                {tema.unidad_numero}
                              </TableCell>
                              <TableCell className="text-center">{tema.numero}</TableCell>
                              <TableCell>{tema.nombre}</TableCell>
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
                              <TableCell>
                                {!state?.showComment ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => toggleComment(tema.id)}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    {state?.justificacion ? "Ver nota" : "Agregar"}
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      placeholder="Escribe una observación..."
                                      value={state?.justificacion ?? ""}
                                      onChange={(e) => setJustificacion(tema.id, e.target.value)}
                                      className="text-sm"
                                      maxLength={500}
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
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Botón guardar */}
          <div className="flex justify-center">
            <Button
              onClick={handleGuardar}
              disabled={loading}
              className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {loading ? "Guardando..." : "Guardar mis avances"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}