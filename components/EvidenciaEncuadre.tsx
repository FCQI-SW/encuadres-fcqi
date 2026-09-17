"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Upload,
  ImageIcon,
  CalendarDays,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Evidencia = {
  id: string;
  foto_url: string;
  fecha_subida: string;
  fecha_presentacion: string;
};

type Props = {
  encuadreId: string;
  puedeSubir: boolean;
};

export default function EvidenciaEncuadre({ encuadreId, puedeSubir }: Props) {
  const { data: session } = useSession();
  const toast = useToast();

  const [evidencia, setEvidencia] = useState<Evidencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [fechaPresentacion, setFechaPresentacion] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (encuadreId) cargarEvidencia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadreId]);

  const cargarEvidencia = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("encuadre_evidencias")
      .select("id, foto_url, fecha_subida, fecha_presentacion")
      .eq("encuadre_id", encuadreId)
      .order("fecha_subida", { ascending: false })
      .limit(1)
      .maybeSingle();

    setEvidencia(data || null);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede ser mayor a 5MB.");
      return;
    }

    setArchivoSeleccionado(file);

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubir = async () => {
    if (!archivoSeleccionado) {
      toast.error("Selecciona una imagen antes de guardar.");
      return;
    }
    if (!fechaPresentacion) {
      toast.error("Indica la fecha en que se presentó el encuadre a los alumnos.");
      return;
    }
    if (!session?.user?.id) {
      toast.error("No hay sesión activa. Intenta recargar la página.");
      return;
    }

    setSubiendo(true);

    try {
      const ext = archivoSeleccionado.name.split(".").pop();
      const path = `${encuadreId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("evidencias-encuadre")
        .upload(path, archivoSeleccionado, { upsert: true });

      if (uploadError) {
        toast.error(`Error al subir la imagen: ${uploadError.message}`);
        setSubiendo(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("evidencias-encuadre").getPublicUrl(path);

      const { error: dbError } = await supabase
        .from("encuadre_evidencias")
        .insert({
          encuadre_id: encuadreId,
          profesor_id: session.user.id,
          foto_url: publicUrl,
          fecha_presentacion: fechaPresentacion,
        });

      if (dbError) {
        toast.error(`Error al guardar la evidencia: ${dbError.message}`);
      } else {
        toast.success("Evidencia guardada correctamente.");
        setArchivoSeleccionado(null);
        setPreview(null);
        setFechaPresentacion("");
        if (inputRef.current) inputRef.current.value = "";
        await cargarEvidencia();
      }
    } catch (err: any) {
      console.error("Error al subir evidencia:", err);
      toast.error("Error inesperado. Intenta de nuevo.");
    }

    setSubiendo(false);
  };

  const formatearFecha = (fecha: string) =>
    new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatearFechaHora = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#00723F]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[#00723F]" />
          Evidencia del Encuadre Firmado
        </CardTitle>
        <CardDescription>
          {puedeSubir
            ? "Sube una foto del encuadre firmado físicamente e indica la fecha en que se presentó a los alumnos."
            : "Foto del encuadre firmado presentado por el docente."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* ── Evidencia existente ── */}
        {evidencia && (
          <div className="space-y-4 p-4 rounded-lg border border-green-200 bg-green-50">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Evidencia registrada
            </div>

            <div className="rounded-md border overflow-hidden bg-white">
              <img
                src={evidencia.foto_url}
                alt="Evidencia del encuadre firmado"
                className="w-full object-contain max-h-[480px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-md bg-white border border-green-100">
                <CalendarDays className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Fecha de presentación
                  </p>
                  <p className="text-sm text-gray-800 font-medium">
                    {formatearFecha(evidencia.fecha_presentacion)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Día en que el docente presentó el encuadre en clase
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md bg-white border border-gray-100">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Fecha de subida al sistema
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatearFechaHora(evidencia.fecha_subida)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cuando se registró la foto en el sistema
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Sin evidencia — vista alumno ── */}
        {!evidencia && !puedeSubir && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
            <ImageIcon className="h-14 w-14 opacity-20" />
            <p className="text-sm text-center">
              El docente aún no ha subido la evidencia del encuadre firmado.
            </p>
          </div>
        )}

        {/* ── Formulario de subida — solo profesor ── */}
        {puedeSubir && (
          <div className="space-y-4 pt-2 border-t">
            <p className="text-sm font-semibold text-gray-700">
              {evidencia ? "Reemplazar evidencia" : "Subir evidencia"}
            </p>

            <div>
              <Label className="mb-2 block">
                ¿Qué día presentaste el encuadre a los alumnos?
              </Label>
              <Input
                type="date"
                value={fechaPresentacion}
                onChange={(e) => setFechaPresentacion(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full sm:w-64"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Esta es la fecha real de presentación, no la de hoy.
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Foto del encuadre firmado</Label>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer w-full sm:w-auto border-dashed h-11"
              >
                <Upload className="mr-2 h-4 w-4" />
                {archivoSeleccionado
                  ? archivoSeleccionado.name
                  : "Seleccionar imagen"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos: JPG, PNG, WEBP. Máximo 5MB.
              </p>
            </div>

            {preview && (
              <div className="rounded-md border overflow-hidden bg-gray-50">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="w-full object-contain max-h-64"
                />
              </div>
            )}

            <Button
              onClick={handleSubir}
              disabled={subiendo || !archivoSeleccionado || !fechaPresentacion}
              className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            >
              {subiendo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {subiendo ? "Subiendo..." : "Guardar evidencia"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}