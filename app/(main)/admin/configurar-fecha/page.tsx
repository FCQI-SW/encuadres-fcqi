"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { es } from "date-fns/locale";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type ConfiguracionFecha = {
  id?: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
};

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, "h:mm a", { locale: es });
}

function formatDateLong(dateString: string): string {
  if (!dateString) return "No seleccionada";
  try {
    const date = parseISO(dateString);
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return "Fecha inválida";
  }
}

export default function ConfigurarFechaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [configId, setConfigId] = useState<string | null>(null);

  // Fechas como strings (YYYY-MM-DD)
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("23:59");

  // Cargar configuración existente
  useEffect(() => {
    fetchConfiguracion();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  async function fetchConfiguracion() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("configuracion_fechas")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setConfigId(data.id);
        setFechaInicio(data.fecha_inicio);
        setFechaFin(data.fecha_fin);
        setStartTime(data.hora_inicio || "08:00");
        setEndTime(data.hora_fin || "23:59");
      } else {
        // Establecer fecha actual por defecto
        const today = format(new Date(), "yyyy-MM-dd");
        setFechaInicio(today);
        setFechaFin(today);
      }
    } catch (err) {
      console.error("Error al cargar configuración:", err);
      const today = format(new Date(), "yyyy-MM-dd");
      setFechaInicio(today);
      setFechaFin(today);
    }
    setLoading(false);
  }

  // Validar fechas
  const validateDates = (): string[] => {
    const errors: string[] = [];

    if (!fechaInicio) {
      errors.push("La fecha de inicio es obligatoria.");
    }
    if (!fechaFin) {
      errors.push("La fecha de fin es obligatoria.");
    }
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      errors.push("La fecha de inicio no puede ser posterior a la fecha de fin.");
    }
    if (startTime && endTime && startTime >= endTime) {
      errors.push("La hora de inicio debe ser anterior a la hora de cierre.");
    }

    return errors;
  };

  async function handleSave() {
    const validationErrors = validateDates();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(" "));
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const configuracion: ConfiguracionFecha = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        hora_inicio: startTime,
        hora_fin: endTime,
        activo: true,
      };

      let error;

      if (configId) {
        const result = await supabase
          .from("configuracion_fechas")
          .update(configuracion)
          .eq("id", configId);
        error = result.error;
      } else {
        const result = await supabase
          .from("configuracion_fechas")
          .insert([configuracion]);
        error = result.error;
      }

      if (error) {
        console.error("Error al guardar:", error);
        setErrorMessage("Error al guardar la configuración. Intenta de nuevo.");
        setSaving(false);
        return;
      }

      setSuccessMessage("Fecha de operación establecida correctamente.");
      await fetchConfiguracion();
    } catch (err) {
      console.error("Error:", err);
      setErrorMessage("Ocurrió un error inesperado.");
    }

    setSaving(false);
  }

  // Calcular días seleccionados
  const calcularDias = (): number => {
    if (!fechaInicio || !fechaFin) return 0;
    try {
      const inicio = parseISO(fechaInicio);
      const fin = parseISO(fechaFin);
      return differenceInDays(fin, inicio) + 1;
    } catch {
      return 0;
    }
  };

  const diffDays = calcularDias();

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Fecha de Operación</h1>
          <p className="text-sm text-muted-foreground">
            Establece el periodo de operación del sistema
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/admin")}
          className="cursor-pointer"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
        </Button>
      </div>

      {/* Mensajes */}
      {successMessage && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selector de fechas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#00723F]" />
              Rango de Fechas
            </CardTitle>
            <CardDescription>
              Selecciona el periodo de operación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha-inicio">Fecha de inicio</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full"
                />
                {fechaInicio && (
                  <p className="text-xs text-muted-foreground">
                    {formatDateLong(fechaInicio)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha-fin">Fecha de fin</Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={fechaFin}
                  min={fechaInicio}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full"
                />
                {fechaFin && (
                  <p className="text-xs text-muted-foreground">
                    {formatDateLong(fechaFin)}
                  </p>
                )}
              </div>
            </div>

            {/* Indicador visual del rango */}
            {fechaInicio && fechaFin && (
              <div className="p-4 bg-[#00723F]/10 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-[#00723F]">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {diffDays} día{diffDays !== 1 ? "s" : ""} seleccionado
                    {diffDays !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">
                  Del {formatDateLong(fechaInicio)} al {formatDateLong(fechaFin)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Horarios y resumen */}
        <div className="space-y-6">
          {/* Horarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#00723F]" />
                Horarios
              </CardTitle>
              <CardDescription>
                Define el horario de operación diario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Hora de inicio</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  {startTime && (
                    <p className="text-xs text-muted-foreground">
                      {formatTime(startTime)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Hora de cierre</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                  {endTime && (
                    <p className="text-xs text-muted-foreground">
                      {formatTime(endTime)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desde:</span>
                <span className="font-medium text-right">
                  {formatDateLong(fechaInicio)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hasta:</span>
                <span className="font-medium text-right">
                  {formatDateLong(fechaFin)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horario:</span>
                <span className="font-medium">
                  {formatTime(startTime)} - {formatTime(endTime)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duración:</span>
                <span className="font-medium">{diffDays} día(s)</span>
              </div>
            </CardContent>
          </Card>

          {/* Botón guardar */}
          <Button
            onClick={handleSave}
            disabled={saving || !fechaInicio || !fechaFin}
            className="w-full bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Establecer fecha
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información importante</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>
                  El periodo de operación define cuándo los usuarios pueden
                  realizar acciones en el sistema.
                </li>
                <li>
                  Los profesores y alumnos solo podrán registrar avances durante
                  este periodo.
                </li>
                <li>
                  Los horarios aplican para todos los días dentro del rango
                  seleccionado.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}