"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EvalRow = {
  criterio: string;
  valor: string;
  descripcion?: string;
};

type RightExam = {
  titulo: string;
  bullets: string[];
};

export type FullEncuadreProps = {
  
  universidad: string;
  facultad: string;
  programa: string;
  logoSrc?: string;

  evaluacionRows: EvalRow[];
  totalValor: string;

  rights: RightExam[];
  rightsSubtitle?: string;

  descripcionProducto: string;
  normasConducta: string;

  onSave?: (data: { nombre: string; acepto: boolean }) => void;

  className?: string;
};

export default function FullEncuadreTable({
  universidad,
  facultad,
  programa,
  logoSrc = "/uabc_logo.png",
  evaluacionRows,
  totalValor,
  rights,
  rightsSubtitle = "Detallar claramente los criterios para exentar el examen ordinario",
  descripcionProducto,
  normasConducta,
  onSave,
  className,
}: FullEncuadreProps) {
  const [nombre, setNombre] = React.useState("");
  const [acepto] = React.useState(true);

  const handleSave = () => onSave?.({ nombre, acepto });

  return (
    <div className={cn("w-full space-y-6", className)}>
      <div className="flex items-start justify-between px-2 sm:px-6">
        <div className="flex-1 text-center">
          <p className="text-sm sm:text-base font-medium">{universidad}</p>
          <p className="text-xs sm:text-sm">{facultad}</p>
          <p className="text-xs sm:text-sm">{programa}</p>
        </div>
        <div className="hidden sm:block w-12 h-12 relative ml-4">
          <Image
            src={logoSrc}
            alt="Escudo"
            fill
            sizes="48px"
            className="object-contain"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={3} className="text-center font-bold">
                EVALUACIÓN DE CURSO
                <div className="text-xs font-normal">
                  Asignar valor a cada actividad
                </div>
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/40">
              <TableHead className="font-bold">CRITERIO</TableHead>
              <TableHead className="font-bold">VALOR</TableHead>
              <TableHead className="font-bold">DESCRIPCIÓN</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {evaluacionRows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="align-top">{r.criterio}</TableCell>
                <TableCell className="align-top">{r.valor}</TableCell>
                <TableCell className="align-top">
                  {r.descripcion ?? "—"}
                </TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell className="font-semibold">TOTAL</TableCell>
              <TableCell className="font-semibold">{totalValor}</TableCell>
              <TableCell />
            </TableRow>

            <TableRow>
              <TableCell colSpan={3} className="text-center font-bold">
                DERECHO EXAMEN ORDINARIO Y EXTRAORDINARIO
                <div className="text-xs font-normal">{rightsSubtitle}</div>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="align-top w-56">
                <div className="space-y-4">
                  {rights.map((r, idx) => (
                    <div key={idx}>
                      <div className="font-semibold">{r.titulo}</div>
                      <div className="text-xs text-muted-foreground">
                        Se evaluará todo el curso
                        <br />
                        La calificación final obtenida equivale al 100%
                      </div>
                    </div>
                  ))}
                </div>
              </TableCell>

              <TableCell colSpan={2} className="align-top">
                <div className="space-y-6">
                  {rights.map((r, idx) => (
                    <ul key={idx} className="list-disc pl-5 space-y-1">
                      {r.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  ))}
                </div>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center font-bold bg-muted/40"
              >
                DESCRIPCIÓN DE PRODUCTO O EVIDENCIA DE DESEMPEÑO
                <div className="text-xs font-normal">
                  (En caso de existir rúbrica del trabajo final, inclúyela en
                  este apartado)
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="whitespace-pre-line">
                {descripcionProducto}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center font-bold bg-muted/40"
              >
                NORMAS DE CONDUCTA DENTRO DEL SALÓN DE CLASES
                <div className="text-xs font-normal">
                  Describir las reglas de conducta, retardos, uso de celular,
                  alimentos, etc.
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="whitespace-pre-line">
                {normasConducta}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Escribe tu nombre completo"
          className="w-72"
        />
        <p className="text-sm font-semibold text-center">
          Estoy de acuerdo con los criterios de evaluación establecidos
        </p>
        <Button
          type="button"
          className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
          onClick={handleSave}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
