"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Loader2,
  Save,
  Send,
  Clock,
  Eye,
  AlertCircle,
  Mail,
  Bell,
  Users,
  Info,
  X,
} from "lucide-react";
import { format, parseISO, addYears, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/toast";

type Destinatario = "profesor" | "personal" | "alumno";
type Metodo = "correo" | "notificacion" | "ambos";
type Estado = "borrador" | "programado" | "enviado";

const VALIDACION = {
  TITULO_MIN: 5,
  TITULO_MAX: 200,
  MENSAJE_MIN: 10,
  MENSAJE_MAX: 5000,
  MAX_DIAS_FUTURO: 365,
};

const CARACTERES_PELIGROSOS = /[<>{}]/g;

interface ModalCrearAnuncioProps {
  isOpen: boolean;
  onClose: () => void;
  anuncioId?: string | null;
  onSuccess?: () => void;
}

export function ModalCrearAnuncio({
  isOpen,
  onClose,
  anuncioId,
  onSuccess,
}: ModalCrearAnuncioProps) {
  const toast = useToast();

  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [metodo, setMetodo] = useState<Metodo>("correo");
  const [programarFecha, setProgramarFecha] = useState("");
  const [programarHora, setProgramarHora] = useState("");
  const [estadoOriginal, setEstadoOriginal] = useState<Estado | null>(null);

  const [errores, setErrores] = useState<string[]>([]);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar anuncio si estamos editando
  useEffect(() => {
    if (!isOpen) {
      // Resetear formulario al cerrar
      setTitulo("");
      setMensaje("");
      setDestinatarios([]);
      setMetodo("correo");
      setProgramarFecha("");
      setProgramarHora("");
      setEstadoOriginal(null);
      setErrores([]);
      setAdvertencias([]);
      return;
    }

    if (!anuncioId) return;

    setLoading(true);
    supabase
      .from("anuncios")
      .select("titulo, mensaje, destinatarios, metodo, estado, enviado_at")
      .eq("id", anuncioId)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) {
          console.error("Error cargando anuncio:", error);
          toast.error("Error al cargar el anuncio.");
          onClose();
          return;
        }

        if (data.estado === "enviado") {
          toast.error("No se puede editar un anuncio que ya fue enviado.");
          onClose();
          return;
        }

        setTitulo(data.titulo || "");
        setMensaje(data.mensaje || "");
        setDestinatarios((data.destinatarios as Destinatario[]) || []);
        setMetodo((data.metodo as Metodo) || "correo");
        setEstadoOriginal(data.estado);

        if (data.enviado_at) {
          try {
            const fecha = parseISO(data.enviado_at);
            setProgramarFecha(format(fecha, "yyyy-MM-dd"));
            setProgramarHora(format(fecha, "HH:mm"));
          } catch (err) {
            console.error("Error parseando fecha:", err);
          }
        }
      });
  }, [isOpen, anuncioId, onClose, toast]);

  function sanitizarTexto(texto: string): string {
    return texto.replace(CARACTERES_PELIGROSOS, "");
  }

  function handleTituloChange(value: string) {
    const sanitizado = sanitizarTexto(value);
    if (sanitizado.length <= VALIDACION.TITULO_MAX) {
      setTitulo(sanitizado);
    }
  }

  function handleMensajeChange(value: string) {
    const sanitizado = sanitizarTexto(value);
    if (sanitizado.length <= VALIDACION.MENSAJE_MAX) {
      setMensaje(sanitizado);
    }
  }

  function toggleDestinatario(d: Destinatario, checked: boolean) {
    setDestinatarios((prev) =>
      checked ? [...prev, d] : prev.filter((x) => x !== d)
    );
  }

  function toggleTodos(checked: boolean) {
    if (checked) {
      setDestinatarios(["profesor", "personal", "alumno"]);
    } else {
      setDestinatarios([]);
    }
  }

  function validar(esBorrador: boolean = false): {
    valido: boolean;
    errores: string[];
    advertencias: string[];
  } {
    const errs: string[] = [];
    const warns: string[] = [];

    const tituloLimpio = titulo.trim();
    if (!tituloLimpio) {
      errs.push("El título es obligatorio.");
    } else {
      if (tituloLimpio.length < VALIDACION.TITULO_MIN) {
        errs.push(
          `El título debe tener al menos ${VALIDACION.TITULO_MIN} caracteres.`
        );
      }
      if (tituloLimpio.length > VALIDACION.TITULO_MAX) {
        errs.push(
          `El título no puede exceder ${VALIDACION.TITULO_MAX} caracteres.`
        );
      }
      if (/^(.)\1+$/.test(tituloLimpio)) {
        errs.push("El título no puede consistir solo en caracteres repetidos.");
      }
    }

    if (esBorrador) {
      return { valido: errs.length === 0, errores: errs, advertencias: warns };
    }

    const mensajeLimpio = mensaje.trim();
    if (!mensajeLimpio) {
      errs.push("El mensaje es obligatorio.");
    } else {
      if (mensajeLimpio.length < VALIDACION.MENSAJE_MIN) {
        errs.push(
          `El mensaje debe tener al menos ${VALIDACION.MENSAJE_MIN} caracteres.`
        );
      }
      if (mensajeLimpio.length > VALIDACION.MENSAJE_MAX) {
        errs.push(
          `El mensaje no puede exceder ${VALIDACION.MENSAJE_MAX} caracteres.`
        );
      }
      if (/^(.)\1+$/.test(mensajeLimpio)) {
        errs.push(
          "El mensaje no puede consistir solo en caracteres repetidos."
        );
      }
    }

    if (destinatarios.length === 0) {
      errs.push("Selecciona al menos un destinatario.");
    }

    const metodosValidos: Metodo[] = ["correo", "notificacion", "ambos"];
    if (!metodosValidos.includes(metodo)) {
      errs.push("Selecciona un método de envío válido.");
    }

    if (programarFecha) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(programarFecha)) {
        errs.push("El formato de fecha no es válido.");
      } else {
        const fechaHora = programarHora
          ? new Date(`${programarFecha}T${programarHora}`)
          : new Date(`${programarFecha}T00:00`);

        const ahora = new Date();
        const maxFecha = addYears(ahora, 1);

        if (isNaN(fechaHora.getTime())) {
          errs.push("La fecha u hora ingresada no es válida.");
        } else {
          if (isBefore(fechaHora, ahora)) {
            errs.push("La fecha programada debe ser futura.");
          }

          if (isAfter(fechaHora, maxFecha)) {
            errs.push(
              `La fecha no puede ser mayor a ${VALIDACION.MAX_DIAS_FUTURO} días en el futuro.`
            );
          }

          const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);
          if (isBefore(fechaHora, unaHoraDespues)) {
            warns.push(
              "La fecha programada es en menos de 1 hora. Asegúrate de que es correcta."
            );
          }
        }
      }

      if (programarHora) {
        const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!horaRegex.test(programarHora)) {
          errs.push("El formato de hora no es válido.");
        }
      }
    }

    if (destinatarios.length === 3) {
      warns.push("Este anuncio se enviará a todos los usuarios del sistema.");
    }

    if (metodo === "ambos") {
      warns.push("Se enviará tanto por correo como por notificación.");
    }

    return { valido: errs.length === 0, errores: errs, advertencias: warns };
  }

  async function handleGuardar(targetEstado: Estado) {
    setErrores([]);
    setAdvertencias([]);

    const esBorrador = targetEstado === "borrador";
    const resultado = validar(esBorrador);

    setAdvertencias(resultado.advertencias);

    if (!resultado.valido) {
      setErrores(resultado.errores);
      return;
    }

    setIsSaving(true);

    try {
      let enviadoAt: string | null = null;

      if (targetEstado === "programado" && programarFecha) {
        const fechaHora = programarHora
          ? new Date(`${programarFecha}T${programarHora}`)
          : new Date(`${programarFecha}T00:00`);
        enviadoAt = fechaHora.toISOString();
      } else if (targetEstado === "enviado") {
        enviadoAt = new Date().toISOString();
      }

      const payload = {
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        destinatarios,
        metodo,
        estado: targetEstado,
        enviado_at: enviadoAt,
      };

      let result;
      if (anuncioId) {
        const { data: anuncioActual, error: errorCheck } = await supabase
          .from("anuncios")
          .select("estado")
          .eq("id", anuncioId)
          .single();

        if (errorCheck || !anuncioActual) {
          setErrores(["El anuncio ya no existe o no se puede acceder."]);
          setIsSaving(false);
          return;
        }

        if (anuncioActual.estado === "enviado") {
          setErrores(["Este anuncio ya fue enviado y no se puede modificar."]);
          setIsSaving(false);
          return;
        }

        result = await supabase
          .from("anuncios")
          .update(payload)
          .eq("id", anuncioId);
      } else {
        result = await supabase.from("anuncios").insert([payload]);
      }

      if (result.error) {
        console.error("Error al guardar:", result.error);
        setErrores([`Error al guardar: ${result.error.message}`]);
        setIsSaving(false);
        return;
      }

      const mensajeExito =
        targetEstado === "borrador"
          ? "Borrador guardado correctamente."
          : targetEstado === "programado"
          ? "Anuncio programado correctamente."
          : "Anuncio enviado correctamente.";

      toast.success(mensajeExito);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error:", err);
      setErrores(["Ocurrió un error inesperado. Intenta de nuevo."]);
    }

    setIsSaving(false);
  }

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-4xl mx-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tituloLength = titulo.length;
  const mensajeLength = mensaje.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 cursor-pointer"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle>
            {anuncioId ? "Editar Anuncio" : "Crear Anuncio"}
          </CardTitle>
          <CardDescription>
            {anuncioId
              ? "Modifica los datos del anuncio"
              : "Crea un nuevo mensaje o notificación"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Errores */}
          {errores.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <ul className="text-sm text-red-700 space-y-1">
                    {errores.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advertencias */}
          {advertencias.length > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {advertencias.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contenido principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Título y mensaje */}
              <Card>
                <CardHeader>
                  <CardTitle>Contenido del Anuncio</CardTitle>
                  <CardDescription>
                    Define el título y el mensaje que se enviará
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">
                      Título *{" "}
                      <span className="text-xs text-muted-foreground">
                        (mín. {VALIDACION.TITULO_MIN} caracteres)
                      </span>
                    </Label>
                    <Input
                      id="titulo"
                      placeholder="Ej: Aviso importante sobre el periodo de evaluación"
                      value={titulo}
                      onChange={(e) => handleTituloChange(e.target.value)}
                      disabled={isSaving}
                      className={
                        tituloLength > 0 && tituloLength < VALIDACION.TITULO_MIN
                          ? "border-yellow-500"
                          : ""
                      }
                    />
                    <div className="flex justify-between text-xs">
                      <span
                        className={
                          tituloLength > 0 &&
                          tituloLength < VALIDACION.TITULO_MIN
                            ? "text-yellow-600"
                            : "text-muted-foreground"
                        }
                      >
                        {tituloLength < VALIDACION.TITULO_MIN &&
                          tituloLength > 0 &&
                          `Faltan ${
                            VALIDACION.TITULO_MIN - tituloLength
                          } caracteres`}
                      </span>
                      <span
                        className={
                          tituloLength > VALIDACION.TITULO_MAX * 0.9
                            ? "text-yellow-600"
                            : "text-muted-foreground"
                        }
                      >
                        {tituloLength}/{VALIDACION.TITULO_MAX}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensaje">
                      Mensaje *{" "}
                      <span className="text-xs text-muted-foreground">
                        (mín. {VALIDACION.MENSAJE_MIN} caracteres)
                      </span>
                    </Label>
                    <Textarea
                      id="mensaje"
                      placeholder="Escribe el contenido del mensaje..."
                      value={mensaje}
                      onChange={(e) => handleMensajeChange(e.target.value)}
                      rows={8}
                      disabled={isSaving}
                      className={`resize-none ${
                        mensajeLength > 0 &&
                        mensajeLength < VALIDACION.MENSAJE_MIN
                          ? "border-yellow-500"
                          : ""
                      }`}
                    />
                    <div className="flex justify-between text-xs">
                      <span
                        className={
                          mensajeLength > 0 &&
                          mensajeLength < VALIDACION.MENSAJE_MIN
                            ? "text-yellow-600"
                            : "text-muted-foreground"
                        }
                      >
                        {mensajeLength < VALIDACION.MENSAJE_MIN &&
                          mensajeLength > 0 &&
                          `Faltan ${
                            VALIDACION.MENSAJE_MIN - mensajeLength
                          } caracteres`}
                      </span>
                      <span
                        className={
                          mensajeLength > VALIDACION.MENSAJE_MAX * 0.9
                            ? "text-yellow-600"
                            : "text-muted-foreground"
                        }
                      >
                        {mensajeLength}/{VALIDACION.MENSAJE_MAX}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destinatarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#00723F]" />
                    Destinatarios *
                  </CardTitle>
                  <CardDescription>
                    Selecciona quiénes recibirán este mensaje
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="todos"
                        checked={destinatarios.length === 3}
                        onCheckedChange={(checked) =>
                          toggleTodos(checked as boolean)
                        }
                        disabled={isSaving}
                      />
                      <Label
                        htmlFor="todos"
                        className="font-medium cursor-pointer"
                      >
                        Seleccionar todos
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-6">
                      {(
                        ["profesor", "personal", "alumno"] as Destinatario[]
                      ).map((d) => (
                        <div key={d} className="flex items-center space-x-2">
                          <Checkbox
                            id={d}
                            checked={destinatarios.includes(d)}
                            onCheckedChange={(checked) =>
                              toggleDestinatario(d, checked as boolean)
                            }
                            disabled={isSaving}
                          />
                          <Label
                            htmlFor={d}
                            className="capitalize cursor-pointer"
                          >
                            {d === "profesor"
                              ? "Profesores"
                              : d === "personal"
                              ? "Personal"
                              : "Alumnos"}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {destinatarios.length === 0 && (
                      <p className="text-xs text-muted-foreground pl-6">
                        Debes seleccionar al menos un destinatario
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel lateral */}
            <div className="space-y-6">
              {/* Método de envío */}
              <Card>
                <CardHeader>
                  <CardTitle>Método de Envío</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={metodo}
                    onValueChange={(v: Metodo) => setMetodo(v)}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="correo">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Correo electrónico
                        </div>
                      </SelectItem>
                      <SelectItem value="notificacion">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" /> Notificación
                        </div>
                      </SelectItem>
                      <SelectItem value="ambos">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <Bell className="h-4 w-4" /> Ambos
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {metodo === "correo" &&
                      "Se enviará un correo electrónico a los destinatarios."}
                    {metodo === "notificacion" &&
                      "Aparecerá como notificación en el sistema."}
                    {metodo === "ambos" &&
                      "Se enviará por correo y aparecerá como notificación."}
                  </p>
                </CardContent>
              </Card>

              {/* Programar envío */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#00723F]" />
                    Programar Envío
                  </CardTitle>
                  <CardDescription>
                    Opcional: programa una fecha y hora
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={programarFecha}
                      min={format(new Date(), "yyyy-MM-dd")}
                      max={format(addYears(new Date(), 1), "yyyy-MM-dd")}
                      onChange={(e) => setProgramarFecha(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora">Hora</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={programarHora}
                      onChange={(e) => setProgramarHora(e.target.value)}
                      disabled={!programarFecha || isSaving}
                    />
                    {!programarFecha && (
                      <p className="text-xs text-muted-foreground">
                        Selecciona una fecha primero
                      </p>
                    )}
                  </div>
                  {programarFecha && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <Clock className="inline h-3 w-3 mr-1" />
                        Se enviará el{" "}
                        {format(
                          parseISO(programarFecha),
                          "EEEE d 'de' MMMM 'de' yyyy",
                          {
                            locale: es,
                          }
                        )}{" "}
                        a las {programarHora || "00:00"}
                      </p>
                    </div>
                  )}
                  {programarFecha && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => {
                        setProgramarFecha("");
                        setProgramarHora("");
                      }}
                      disabled={isSaving}
                    >
                      Limpiar fecha programada
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Acciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="secondary"
                    className="w-full cursor-pointer"
                    onClick={() => handleGuardar("borrador")}
                    disabled={isSaving || !titulo.trim()}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar borrador
                  </Button>
                  <Button
                    className="w-full bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
                    onClick={() =>
                      handleGuardar(programarFecha ? "programado" : "enviado")
                    }
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : programarFecha ? (
                      <Clock className="mr-2 h-4 w-4" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {programarFecha ? "Programar envío" : "Enviar ahora"}
                  </Button>
                </CardContent>
              </Card>

              {/* Información */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p>
                      <strong>Borrador:</strong> Se guarda sin enviar, puedes
                      editarlo después.
                    </p>
                    <p>
                      <strong>Programar:</strong> Se enviará automáticamente en
                      la fecha indicada.
                    </p>
                    <p>
                      <strong>Enviar ahora:</strong> Se envía inmediatamente a
                      los destinatarios.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
