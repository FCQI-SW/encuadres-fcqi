"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, CheckCircle } from "lucide-react";
import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";

type FirmaData = {
  id: string;
  nombre_firma: string;
  firmado_at: string;
};

type CriterioCalificacion = {
  id: string;
  criterio: string;
  valor: number;
  descripcion: string;
};

type EncuadreViewTabProps = {
  encuadreId: string;
  materiaNombre: string;
  docente: string;
  onFirmaCompletada?: () => void;
};

export default function EncuadreViewTab({
  encuadreId,
  materiaNombre,
  docente,
  onFirmaCompletada,
}: EncuadreViewTabProps) {
  const { data: session } = useSession();
  const confirm = useConfirm();
  const toast = useToast();

  const [encuadre, setEncuadre] = useState<any>(null);
  const [criterios, setCriterios] = useState<CriterioCalificacion[]>([]);
  const [materiaClave, setMateriaClave] = useState("");
  const [firma, setFirma] = useState<FirmaData | null>(null);
  const [nombreFirma, setNombreFirma] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (session?.user?.id && encuadreId) {
      cargarDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, encuadreId]);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const { data: encuadreData, error: errorEncuadre } = await supabase
        .from("encuadres")
        .select("*")
        .eq("id", encuadreId)
        .single();

      if (errorEncuadre || !encuadreData) {
        console.error("Error al cargar encuadre:", errorEncuadre);
        setLoading(false);
        return;
      }

      setEncuadre(encuadreData);

      const { data: criteriosData, error: errorCriterios } = await supabase
        .from("criterios_evaluacion")
        .select("id, criterio, valor, descripcion")
        .eq("encuadre_id", encuadreId)
        .order("id", { ascending: true });

      if (!errorCriterios) {
        setCriterios(criteriosData || []);
      }

      if (encuadreData.programa_id) {
        const { data: programa } = await supabase
          .from("programas")
          .select("id, materia_id")
          .eq("id", encuadreData.programa_id)
          .single();

        if (programa?.materia_id) {
          const { data: materia } = await supabase
            .from("materias")
            .select("clave")
            .eq("id", programa.materia_id)
            .single();

          if (materia) {
            setMateriaClave(materia.clave);
          }
        }
      }

      const { data: firmaExistente } = await supabase
        .from("encuadre_firmas")
        .select("id, nombre_firma, firmado_at")
        .eq("encuadre_id", encuadreId)
        .eq("alumno_id", session?.user?.id)
        .maybeSingle();

      if (firmaExistente) {
        setFirma(firmaExistente);
      }
    } catch (err) {
      console.error("Error general:", err);
    }

    setLoading(false);
  };

  const handleFirmar = async () => {
    if (!nombreFirma.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Debes escribir tu nombre completo para firmar.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (nombreFirma.trim().length < 5) {
      await confirm({
        title: "Nombre muy corto",
        message: "El nombre debe tener al menos 5 caracteres.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    const shouldSign = await confirm({
      title: "Confirmar firma de enterado",
      message: `Al firmar, confirmas que has leído y estás de acuerdo con los criterios de evaluación establecidos.\n\nNombre: ${nombreFirma}`,
      confirmText: "Firmar",
      cancelText: "Cancelar",
    });

    if (!shouldSign) return;

    setGuardando(true);

    try {
      const { data, error } = await supabase
        .from("encuadre_firmas")
        .insert({
          encuadre_id: encuadreId,
          alumno_id: session?.user?.id,
          nombre_firma: nombreFirma.trim(),
        })
        .select("id, nombre_firma, firmado_at")
        .single();

      if (error) {
        console.error("Error al firmar:", error);
        toast.error("No se pudo registrar tu firma. Intenta nuevamente.");
      } else {
        setFirma(data);
        toast.success("Tu firma de enterado ha sido registrada correctamente.");
        // Notificar al componente padre que la firma fue completada
        if (onFirmaCompletada) {
          onFirmaCompletada();
        }
      }
    } catch (err) {
      console.error("Error:", err);
    }

    setGuardando(false);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPorcentaje = criterios.reduce((sum, c) => sum + (c.valor || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  if (!encuadre) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No se encontró información del encuadre</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header institucional */}
      <div className="flex items-start justify-between px-2 sm:px-6">
        <div className="flex-1 text-center">
          <p className="text-sm sm:text-base font-medium">
            Universidad Autónoma de Baja California
          </p>
          <p className="text-xs sm:text-sm">
            Facultad de Ciencias Químicas e Ingeniería
          </p>
          <p className="text-xs sm:text-sm font-medium mt-1">
            {materiaClave && `${materiaClave} - `}
            {materiaNombre}
          </p>
          <p className="text-xs text-muted-foreground">
            Grupo {encuadre.grupo} • {encuadre.periodo} • Docente: {docente}
          </p>
        </div>
        <div className="hidden sm:block w-12 h-12 relative ml-4">
          <Image
            src="/uabc_logo.png"
            alt="Escudo UABC"
            fill
            sizes="48px"
            className="object-contain"
          />
        </div>
      </div>

      {/* Tabla principal */}
      <div className="overflow-x-auto rounded-md border max-w-5xl mx-auto">
        <Table>
          <TableBody>
            {/* EVALUACIÓN DE CURSO */}
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center font-bold bg-muted/40"
              >
                EVALUACIÓN DE CURSO
              </TableCell>
            </TableRow>

            {encuadre.descripcion_evaluacion && (
              <TableRow>
                <TableCell colSpan={3} className="whitespace-pre-line">
                  {encuadre.descripcion_evaluacion}
                </TableCell>
              </TableRow>
            )}

            <TableRow className="bg-muted/20">
              <TableCell className="font-bold">CRITERIO</TableCell>
              <TableCell className="font-bold text-center">VALOR</TableCell>
              <TableCell className="font-bold">DESCRIPCIÓN</TableCell>
            </TableRow>

            {criterios.length > 0 ? (
              <>
                {criterios.map((crit) => (
                  <TableRow key={crit.id}>
                    <TableCell className="align-top">{crit.criterio}</TableCell>
                    <TableCell className="align-top text-center">
                      {crit.valor}%
                    </TableCell>
                    <TableCell className="align-top">
                      {crit.descripcion || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">TOTAL</TableCell>
                  <TableCell
                    className={`font-semibold text-center ${
                      totalPorcentaje === 100
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {totalPorcentaje}%
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-4"
                >
                  No se han definido criterios de evaluación
                </TableCell>
              </TableRow>
            )}

            {/* DERECHO EXAMEN ORDINARIO Y EXTRAORDINARIO */}
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center font-bold bg-muted/40"
              >
                DERECHO EXAMEN ORDINARIO Y EXTRAORDINARIO
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top w-56">
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold">Derecho a Ordinario</div>
                    <div className="text-xs text-muted-foreground">
                      Se evaluará todo el curso
                      <br />
                      La calificación final obtenida equivale al 100%
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">
                      Derecho a Extraordinario
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Se evaluará todo el curso
                      <br />
                      La calificación final obtenida equivale al 100%
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell colSpan={2} className="align-top">
                <div className="space-y-4">
                  <div className="whitespace-pre-line">
                    {encuadre.derecho_ordinario || "No especificado"}
                  </div>
                  <div className="whitespace-pre-line border-t pt-4 mt-4">
                    {encuadre.derecho_extraordinario || "No especificado"}
                  </div>
                </div>
              </TableCell>
            </TableRow>

            {/* DESCRIPCIÓN DE PRODUCTO O EVIDENCIA */}
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center font-bold bg-muted/40"
              >
                DESCRIPCIÓN DE PRODUCTO O EVIDENCIA DE DESEMPEÑO
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="whitespace-pre-line">
                {encuadre.descripcion_producto || "No especificado"}
              </TableCell>
            </TableRow>

            {/* BIBLIOGRAFÍA */}
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center font-bold bg-muted/40"
              >
                BIBLIOGRAFÍA, REFERENCIAS Y RECURSOS DE LA RED
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="whitespace-pre-line">
                {encuadre.bibliografia_basica || "No especificado"}
              </TableCell>
            </TableRow>

            {/* NORMAS DE CONDUCTA */}
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center font-bold bg-muted/40"
              >
                NORMAS DE CONDUCTA DENTRO DEL SALÓN DE CLASES
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="whitespace-pre-line">
                {encuadre.normas_conducta || "No especificado"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Sección de firma */}
      <div className="flex flex-col items-center gap-3 pt-2 max-w-5xl mx-auto">
        {firma ? (
          <div className="text-center space-y-2 p-4 bg-green-50 border border-green-200 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                Firma de Enterado Registrada
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Nombre: <span className="font-medium">{firma.nombre_firma}</span>
            </p>
            <p className="text-sm text-gray-600">
              Fecha:{" "}
              <span className="font-medium">
                {formatearFecha(firma.firmado_at)}
              </span>
            </p>
          </div>
        ) : (
          <>
            <Input
              value={nombreFirma}
              onChange={(e) => setNombreFirma(e.target.value)}
              placeholder="Escribe tu nombre completo"
              className="w-72"
            />
            <p className="text-sm font-semibold text-center">
              Estoy de acuerdo con los criterios de evaluación establecidos
            </p>
            <Button
              type="button"
              className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
              onClick={handleFirmar}
              disabled={guardando}
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
