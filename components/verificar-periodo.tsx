"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VerificarPeriodoProps {
  children: React.ReactNode;
  rolesExentos?: string[];
  rolActual: string;
}

export function VerificarPeriodo({
  children,
  rolesExentos = ["admin"],
  rolActual,
}: VerificarPeriodoProps) {
  const [verificando, setVerificando] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [periodo, setPeriodo] = useState<{
    inicio: string;
    fin: string;
    horaInicio: string;
    horaFin: string;
  } | null>(null);

  useEffect(() => {
    verificarPeriodo();
  }, [rolActual]);

  async function verificarPeriodo() {
    // Si el rol está exento, permitir siempre
    if (rolesExentos.includes(rolActual)) {
      setPermitido(true);
      setVerificando(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("configuracion_fechas")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // Si no hay configuración, permitir acceso
        setPermitido(true);
        setVerificando(false);
        return;
      }

      const ahora = new Date();
      const fechaHoy = format(ahora, "yyyy-MM-dd");
      const horaActual = format(ahora, "HH:mm");

      const dentroFechas =
        fechaHoy >= data.fecha_inicio && fechaHoy <= data.fecha_fin;
      const dentroHorario =
        horaActual >= data.hora_inicio && horaActual <= data.hora_fin;

      setPeriodo({
        inicio: data.fecha_inicio,
        fin: data.fecha_fin,
        horaInicio: data.hora_inicio,
        horaFin: data.hora_fin,
      });

      if (!dentroFechas) {
        setPermitido(false);
        if (fechaHoy < data.fecha_inicio) {
          setMensaje("El periodo de operación aún no ha comenzado.");
        } else {
          setMensaje("El periodo de operación ha finalizado.");
        }
      } else if (!dentroHorario) {
        setPermitido(false);
        setMensaje("El sistema no está disponible en este horario.");
      } else {
        setPermitido(true);
      }
    } catch (err) {
      console.error("Error verificando periodo:", err);
      setPermitido(true);
    }

    setVerificando(false);
  }

  if (verificando) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-b-2 border-[#00723F] rounded-full" />
      </div>
    );
  }

  if (!permitido) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-800">
                Sistema no disponible
              </h2>

              <p className="text-muted-foreground">{mensaje}</p>

              {periodo && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-medium text-gray-700">
                    Periodo de operación:
                  </p>
                  <p className="text-gray-600">
                    {format(new Date(periodo.inicio + "T00:00:00"), "d 'de' MMMM", {
                      locale: es,
                    })}{" "}
                    al{" "}
                    {format(new Date(periodo.fin + "T00:00:00"), "d 'de' MMMM 'de' yyyy", {
                      locale: es,
                    })}
                  </p>
                  <p className="text-gray-600">
                    Horario: {periodo.horaInicio} - {periodo.horaFin}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Si crees que esto es un error, contacta al administrador.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}