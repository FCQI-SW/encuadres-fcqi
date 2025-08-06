"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

type Destinatario = "profesor" | "personal" | "alumno";

export default function CreateOrEditAdPage() {
  const router = useRouter();
  const params = useSearchParams();
  const adId = params.get("id"); // si viene, estamos editando

  // — Estado del formulario —
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [metodo, setMetodo] = useState<"correo"|"notificacion"|"ambos">("correo");
  const [programarFecha, setProgramarFecha] = useState<Date>();
  const [estadoOriginal, setEstadoOriginal] = useState<"borrador"|"programado">("borrador");
  const [errores, setErrores] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Precarga en caso de editar
  useEffect(() => {
    if (!adId) return;
    setLoading(true);
    supabase
      .from("anuncios")
      .select("titulo, mensaje, destinatarios, metodo, estado, enviado_at")
      .eq("id", adId)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          console.error("Error cargando anuncio:", error);
          return;
        }
        if (data) {
          setTitulo(data.titulo);
          setMensaje(data.mensaje);
          setDestinatarios(data.destinatarios as Destinatario[]);
          setMetodo(data.metodo as any);
          setEstadoOriginal(data.estado);
          if (data.enviado_at) {
            setProgramarFecha(new Date(data.enviado_at));
          }
        }
      });
  }, [adId]);

  function toggleDest(d: Destinatario, chk: boolean) {
    setDestinatarios(prev => (chk ? [...prev, d] : prev.filter(x => x !== d)));
  }

  function validar(): boolean {
    const errs: string[] = [];
    if (!titulo.trim()) errs.push("El título es obligatorio");
    if (!mensaje.trim()) errs.push("El mensaje es obligatorio");
    if (destinatarios.length === 0) errs.push("Selecciona al menos un destinatario");
    if (programarFecha && programarFecha < new Date())
      errs.push("La fecha tiene que ser futura");
    setErrores(errs);
    return errs.length === 0;
  }

  async function handleGuardar(targetEstado: "borrador"|"programado"|"enviado") {
    if (targetEstado !== "borrador" && !validar()) return;
    setIsSaving(true);

    const payload = {
      titulo,
      mensaje,
      destinatarios,
      metodo,
      estado: targetEstado,
      enviado_at:
        targetEstado === "borrador"
          ? null
          : programarFecha?.toISOString() || new Date().toISOString(),
    };

    let result;
    if (adId) {
      // actualizar
      result = await supabase.from("anuncios").update(payload).eq("id", adId);
    } else {
      // crear
      result = await supabase.from("anuncios").insert([payload]);
    }

    setIsSaving(false);

    if (result.error) {
      setErrores([result.error.message]);
    } else {
      router.push("/admin/ads");
    }
  }

  return (
    <div className="p-8 space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ChevronLeft className="mr-2 h-5 w-5" />
        {adId ? "Volver" : "Regresar"}
      </Button>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            {adId ? "Editar Anuncio" : "Crear Nuevo Anuncio"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p>Cargando datos…</p>
          ) : (
            <>
              {errores.length > 0 && (
                <div className="border border-red-300 bg-red-50 p-4 rounded">
                  <ul className="list-disc list-inside text-red-800">
                    {errores.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="mb-2">Título</Label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-800"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-2">Mensaje</Label>
                  <textarea
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-800 h-28"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Destinatarios</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={destinatarios.length === 3}
                        onChange={(e) =>
                          e.target.checked
                            ? setDestinatarios([
                                "profesor",
                                "personal",
                                "alumno",
                              ])
                            : setDestinatarios([])
                        }
                      />
                      <span>Seleccionar todos</span>
                    </label>
                    {(["profesor", "personal", "alumno"] as Destinatario[]).map(
                      (d) => (
                        <label
                          key={d}
                          className="inline-flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={destinatarios.includes(d)}
                            onChange={(e) =>
                              toggleDest(d, e.target.checked)
                            }
                          />
                          <span className="capitalize">{d}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="mb-2">Método de entrega</Label>
                    <select
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-800"
                      value={metodo}
                      onChange={(e) =>
                        setMetodo(e.target.value as any)
                      }
                    >
                      <option value="correo">Correo</option>
                      <option value="notificacion">Notificación</option>
                      <option value="ambos">Ambos</option>
                    </select>
                  </div>
                  <div>
                    <Label className="mb-2">Programar envío</Label>
                    <DatePicker
                      selected={programarFecha}
                      onSelect={(d) => setProgramarFecha(d)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    validar() &&
                    router.push(
                      `/admin/ads/preview?titulo=${encodeURIComponent(
                        titulo
                      )}&mensaje=${encodeURIComponent(mensaje)}`
                    )
                  }
                >
                  Vista previa
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleGuardar("borrador")}
                  disabled={isSaving}
                >
                  Guardar borrador
                </Button>
                <Button
                  variant="default"
                  className="flex-1 bg-green-800 hover:bg-green-600 text-white"
                  onClick={() =>
                    handleGuardar(
                      programarFecha ? "programado" : "enviado"
                    )
                  }
                  disabled={isSaving}
                >
                  {programarFecha ? "Programar envío" : "Enviar ahora"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
