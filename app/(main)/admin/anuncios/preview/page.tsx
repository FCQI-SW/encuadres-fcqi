"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ChevronLeft, Mail, Bell, AlertCircle, CheckCircle } from "lucide-react";

// Constantes (deben coincidir con crear/page.tsx)
const VALIDACION = {
  TITULO_MIN: 5,
  TITULO_MAX: 200,
  MENSAJE_MIN: 10,
  MENSAJE_MAX: 5000,
};

export default function PreviewAnuncioPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const tituloParam = params.get("titulo") ?? "";
    const mensajeParam = params.get("mensaje") ?? "";

    // Decodificar y limpiar
    const tituloDecodificado = decodeURIComponent(tituloParam).trim();
    const mensajeDecodificado = decodeURIComponent(mensajeParam).trim();

    setTitulo(tituloDecodificado);
    setMensaje(mensajeDecodificado);

    // Validar
    const errs: string[] = [];

    if (!tituloDecodificado) {
      errs.push("No se proporcionó un título.");
    } else if (tituloDecodificado.length < VALIDACION.TITULO_MIN) {
      errs.push(
        `El título es muy corto (mínimo ${VALIDACION.TITULO_MIN} caracteres).`
      );
    } else if (tituloDecodificado.length > VALIDACION.TITULO_MAX) {
      errs.push(
        `El título excede el límite de ${VALIDACION.TITULO_MAX} caracteres.`
      );
    }

    if (!mensajeDecodificado) {
      errs.push("No se proporcionó un mensaje.");
    } else if (mensajeDecodificado.length < VALIDACION.MENSAJE_MIN) {
      errs.push(
        `El mensaje es muy corto (mínimo ${VALIDACION.MENSAJE_MIN} caracteres).`
      );
    } else if (mensajeDecodificado.length > VALIDACION.MENSAJE_MAX) {
      errs.push(
        `El mensaje excede el límite de ${VALIDACION.MENSAJE_MAX} caracteres.`
      );
    }

    setErrores(errs);
    setIsValid(errs.length === 0);
  }, [params]);

  // Función para escapar HTML (prevenir XSS en la vista previa)
  function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Si no hay contenido válido
  if (!titulo && !mensaje) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="cursor-pointer"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Volver
        </Button>

        <Card className="bg-yellow-50 border-yellow-200 max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-lg font-semibold text-yellow-700">
                Sin contenido para previsualizar
              </h2>
              <p className="text-yellow-600 mt-2">
                No se proporcionó título ni mensaje. Vuelve al editor y agrega el
                contenido.
              </p>
              <Button
                onClick={() => router.back()}
                className="mt-4 bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
              >
                Volver al editor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Vista Previa</h1>
          <p className="text-sm text-muted-foreground">
            Así se verá el mensaje para los destinatarios
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="cursor-pointer"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Volver
        </Button>
      </div>

      {/* Errores de validación */}
      {errores.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200 max-w-2xl mx-auto">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-700">
                  Advertencias de validación:
                </p>
                <ul className="text-sm text-yellow-600 list-disc list-inside mt-1">
                  {errores.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de validación */}
      {isValid && (
        <Card className="bg-green-50 border-green-200 max-w-2xl mx-auto">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                El contenido cumple con todos los requisitos
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Información del contenido */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Título:</span> {titulo.length}{" "}
                caracteres
              </div>
              <div>
                <span className="font-medium">Mensaje:</span> {mensaje.length}{" "}
                caracteres
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview como correo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#00723F]" />
              Vista de Correo Electrónico
            </CardTitle>
            <CardDescription>
              Así aparecerá en la bandeja de entrada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              {/* Header del correo */}
              <div className="bg-gray-50 p-4 border-b">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-16">De:</span>
                    <span className="font-medium">
                      FCQI - UABC &lt;noreply@uabc.edu.mx&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-16">Para:</span>
                    <span className="font-medium">[Destinatarios]</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-16">Asunto:</span>
                    <span className="font-medium">
                      {titulo || "Sin título"}
                    </span>
                  </div>
                </div>
              </div>
              {/* Cuerpo del correo */}
              <div className="p-6 bg-white">
                {/* Logo */}
                <div className="text-center mb-6">
                  <div className="inline-block px-6 py-3 bg-[#00723F] text-white rounded font-semibold">
                    FCQI - UABC
                  </div>
                </div>
                {/* Título */}
                <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
                  {titulo || "Sin título"}
                </h2>
                {/* Mensaje */}
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed border-l-4 border-[#00723F] pl-4 py-2 bg-gray-50 rounded-r">
                  {mensaje || "Sin contenido"}
                </div>
                {/* Footer */}
                <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
                  <p className="font-medium">Sistema ENCUADRES-FCQI</p>
                  <p className="mt-1">
                    Facultad de Ciencias Químicas e Ingeniería
                  </p>
                  <p>Universidad Autónoma de Baja California</p>
                  <p className="mt-2 text-xs">
                    Este es un correo automático, por favor no responder.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview como notificación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#00723F]" />
              Vista de Notificación
            </CardTitle>
            <CardDescription>
              Así aparecerá como notificación en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notificación estilo push */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Notificación push (móvil):
              </p>
              <div className="border rounded-lg p-4 bg-gray-50 max-w-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00723F] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">FC</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {titulo || "Sin título"}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {mensaje || "Sin contenido"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Ahora</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notificación en lista */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Notificación en el sistema:
              </p>
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border-l-4 border-blue-500">
                  <div className="w-8 h-8 rounded-full bg-[#00723F] flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {titulo || "Sin título"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {mensaje || "Sin contenido"}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">Hace un momento</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Volver al editor
          </Button>
          {isValid && (
            <Button
              onClick={() => router.back()}
              className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Contenido listo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}