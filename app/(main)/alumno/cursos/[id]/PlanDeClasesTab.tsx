"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Props = {
  encuadreId: string;
};

type FilaPlan = {
  unidad: string;
  nombre: string;
  contenido: string;
  semana: string;
};

function formatearSemana(
  semanaInicio?: number | null,
  semanaFin?: number | null
) {
  if (semanaInicio && semanaFin) {
    if (semanaInicio === semanaFin) {
      return `Semana ${semanaInicio}`;
    }
    return `Semanas ${semanaInicio} – ${semanaFin}`;
  }
  return "-";
}

export default function PlanDeClasesTab({ encuadreId }: Props) {
  const [loading, setLoading] = useState(true);
  const [competenciaCurso, setCompetenciaCurso] = useState("");
  const [filas, setFilas] = useState<FilaPlan[]>([]);

  useEffect(() => {
    if (!encuadreId) return;

    let mounted = true;

    (async () => {
      setLoading(true);

      try {
        const { data: encuadre, error: encuadreError } = await supabase
          .from("encuadres")
          .select("programa_id")
          .eq("id", encuadreId)
          .single();

        if (encuadreError || !encuadre) {
          console.error("Error al obtener encuadre:", encuadreError);
          if (mounted) {
            setCompetenciaCurso("");
            setFilas([]);
            setLoading(false);
          }
          return;
        }

        const { data: programa, error: programaError } = await supabase
          .from("programas")
          .select("id, competencia")
          .eq("id", encuadre.programa_id)
          .single();

        if (programaError || !programa) {
          console.error("Error al obtener programa:", programaError);
          if (mounted) {
            setCompetenciaCurso("");
            setFilas([]);
            setLoading(false);
          }
          return;
        }

        const { data: unidades, error: unidadesError } = await supabase
          .from("unidades")
          .select("numero, nombre, contenido, semana_inicio, semana_fin")
          .eq("programa_id", programa.id)
          .order("numero", { ascending: true });

        if (unidadesError) {
          console.error("Error al obtener unidades:", unidadesError);
          if (mounted) {
            setCompetenciaCurso(programa.competencia || "");
            setFilas([]);
            setLoading(false);
          }
          return;
        }

        const filasPlan: FilaPlan[] = (unidades || []).map((u: any) => ({
          unidad: `Unidad ${u.numero ?? "-"}`,
          nombre: u.nombre?.trim() || "",
          contenido: u.contenido?.trim() || "",
          semana: formatearSemana(u.semana_inicio, u.semana_fin),
        }));

        if (!mounted) return;

        setCompetenciaCurso(programa.competencia || "");
        setFilas(filasPlan);
      } catch (error) {
        console.error("Error cargando plan de clases:", error);
        if (mounted) {
          setCompetenciaCurso("");
          setFilas([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [encuadreId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan de clases</CardTitle>
          <CardDescription>
            Información del curso tomada de la PUA.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Competencia del curso */}
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              Competencia del curso
            </p>
            <p className="text-sm whitespace-pre-wrap">
              {competenciaCurso?.trim() || "Sin competencia registrada."}
            </p>
          </div>

          {/* Tabla plan de clases */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium px-4 py-3 w-[18%]">
                    Unidad del PUA
                  </th>
                  <th className="text-left font-medium px-4 py-3 w-[62%]">
                    Tema
                  </th>
                  <th className="text-left font-medium px-4 py-3 w-[20%]">
                    Semana
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center text-muted-foreground py-8 px-4"
                    >
                      No hay plan de clases disponible todavía.
                    </td>
                  </tr>
                ) : (
                  filas.map((fila, index) => (
                    <tr
                      key={index}
                      className={`border-b last:border-0 ${
                        index % 2 === 0 ? "bg-white" : "bg-muted/20"
                      }`}
                    >
                      {/* Columna unidad */}
                      <td className="px-4 py-3 align-top font-semibold text-[#00723F]">
                        {fila.unidad}
                      </td>

                      {/* Columna tema: nombre + separador + contenido preservando formato */}
                      <td className="px-4 py-3 align-top">
                        {fila.nombre || fila.contenido ? (
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {fila.nombre && fila.contenido
                              ? `${fila.nombre} — ${fila.contenido}`
                              : fila.nombre || fila.contenido}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">
                            Sin tema
                          </span>
                        )}
                      </td>

                      {/* Columna semana */}
                      <td className="px-4 py-3 align-top text-muted-foreground whitespace-nowrap">
                        {fila.semana}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}