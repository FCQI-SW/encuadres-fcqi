"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export type CourseHeader = {
  asignatura: string;
  clave: string;
  grupo: string;
  seccion: string;
  docente: string;
  inicioCurso?: string;
  finCurso?: string;
  vacaciones?: string;
  suspensiones?: string;
};

export type PlanRow = {
  unidad: string;   // "1.1", "1.2", ...
  tema: string;
  semana: string | number;
};

export type LearningPlanProps = {
  header: CourseHeader;
  rows: PlanRow[];
  onSubmit?: (payload: {
    respuestas: Record<string, { vista: "si" | "no" | null; comentario: string }>;
  }) => void;
  className?: string;
};

export default function LearningPlanTable({
  header,
  rows,
  onSubmit,
  className,
}: LearningPlanProps) {
  // estado por unidad
  const [respuestas, setRespuestas] = React.useState<
    Record<string, { vista: "si" | "no" | null; comentario: string; showComment: boolean }>
  >(() =>
    Object.fromEntries(
      rows.map((r) => [r.unidad, { vista: null, comentario: "", showComment: false }]),
    )
  );

  const setVista = (unidad: string, valor: "si" | "no") =>
    setRespuestas((prev) => ({ ...prev, [unidad]: { ...prev[unidad], vista: valor } }));

  const toggleComment = (unidad: string) =>
    setRespuestas((prev) => ({
      ...prev,
      [unidad]: { ...prev[unidad], showComment: !prev[unidad].showComment },
    }));

  const setComentario = (unidad: string, value: string) =>
    setRespuestas((prev) => ({ ...prev, [unidad]: { ...prev[unidad], comentario: value } }));

  const handleSubmit = () => {
    const payload = Object.fromEntries(
      Object.entries(respuestas).map(([k, v]) => [k, { vista: v.vista, comentario: v.comentario }]),
    );
    onSubmit?.({ respuestas: payload });
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Tabla del encabezado/curso */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={4} className="text-center font-bold">
                UNIVERSIDAD AUTÓNOMA DE BAJA CALIFORNIA
                <div className="text-xs font-normal">
                  COORDINACIÓN GENERAL DE FORMACIÓN PROFESIONAL<br />
                  PROGRAMA DE UNIDAD DE APRENDIZAJE
                </div>
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/40">
              <TableHead className="font-bold">UNIDAD DE APRENDIZAJE (ASIGNATURA)</TableHead>
              <TableHead className="font-bold">CLAVE</TableHead>
              <TableHead className="font-bold">GRUPO</TableHead>
              <TableHead className="font-bold">SECCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{header.asignatura}</TableCell>
              <TableCell>{header.clave}</TableCell>
              <TableCell>{header.grupo}</TableCell>
              <TableCell>{header.seccion}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} className="text-center font-semibold">
                NOMBRE DEL DOCENTE
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4}>{header.docente}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Notas/fechas (texto bajo la tabla de encabezado) */}
      <div className="text-sm space-y-2">
        {header.inicioCurso && (
          <p>
            <span className="font-medium">Inicio de curso:</span>&nbsp;{header.inicioCurso}
          </p>
        )}
        {header.finCurso && (
          <p>
            <span className="font-medium">Fin de curso:</span>&nbsp;{header.finCurso}
          </p>
        )}
        {header.vacaciones && (
          <p>
            <span className="font-medium">Vacaciones:</span>&nbsp;{header.vacaciones}
          </p>
        )}
        {header.suspensiones && (
          <p>
            <span className="font-medium">SUSPENSIÓN DE LABORES OFICIALES:</span>&nbsp;
            {header.suspensiones}
          </p>
        )}
      </div>

      {/* Plan de clases (una sola tabla) */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={5} className="text-center font-bold">
                PLAN DE CLASES
                <div className="text-xs font-normal">
                  <span className="font-semibold">Competencia del curso:</span>&nbsp;
                  Experimentar con las técnicas y los algoritmos de aprendizaje en diferentes
                  contextos de aplicación, por medio de la implementación de casos de usos académicos,
                  con el propósito de conocer el alcance de la técnica y algoritmo, con actitud crítica
                  y analítica.
                </div>
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/40">
              <TableHead className="font-bold">UNIDAD DEL PUA</TableHead>
              <TableHead className="font-bold">TEMA</TableHead>
              <TableHead className="font-bold">SEMANA</TableHead>
              <TableHead className="font-bold">UNIDAD VISTA</TableHead>
              <TableHead className="font-bold">COMENTARIO</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r) => {
              const state = respuestas[r.unidad];
              return (
                <TableRow key={r.unidad}>
                  <TableCell className="w-[90px]">{r.unidad}</TableCell>
                  <TableCell className="min-w-[220px]">{r.tema}</TableCell>
                  <TableCell className="w-[90px]">{String(r.semana)}</TableCell>

                  {/* Si / No */}
                  <TableCell className="w-[120px]">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={state?.vista === "si"}
                          onCheckedChange={(v) => v && setVista(r.unidad, "si")}
                        />
                        <span>Si</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={state?.vista === "no"}
                          onCheckedChange={(v) => v && setVista(r.unidad, "no")}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </TableCell>

                  {/* Comentario */}
                  <TableCell className="min-w-[220px]">
                    {!state?.showComment ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => toggleComment(r.unidad)}
                      >
                        Comentario
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Escribe un comentario…"
                          value={state?.comentario ?? ""}
                          onChange={(e) => setComentario(r.unidad, e.target.value)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="cursor-pointer"
                          onClick={() => toggleComment(r.unidad)}
                        >
                          Cerrar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Enviar respuestas */}
      <div className="flex justify-center pt-2">
        <Button
          className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
          onClick={handleSubmit}
        >
          Enviar respuestas
        </Button>
      </div>
    </div>
  );
}
