"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MateriaAsignada } from "../app/(main)/alumno/_data/types";

type Props = {
  materia: MateriaAsignada;
  onOpen: (m: MateriaAsignada) => void;
  buttonText?: string; 
};

export function SubjectCard({
  materia,
  onOpen,
  buttonText = "Abrir encuadre", 
}: Props) {
  return (
    <Card className="rounded-lg shadow-sm bg-white border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold leading-tight">
          {materia.nombre_materia}
        </CardTitle>
        <Separator className="mt-2" />
      </CardHeader>

      <CardContent className="text-sm space-y-1">
        <p>
          <span className="font-medium">Profesor: </span>
          <span className="text-muted-foreground">
            {materia.profesor_nombre}
          </span>
        </p>
        <p>
          <span className="font-medium">Clave: </span>
          <span className="text-muted-foreground">{materia.clave}</span>
        </p>
        <p>
          <span className="font-medium">Grupo: </span>
          <span className="text-muted-foreground">{materia.grupo}</span>
        </p>

       
        <div className="mt-4 grid place-items-center">
          <Button
            onClick={() => onOpen(materia)}
            disabled={!materia.encuadre_id}
            className="cursor-pointer bg-[#00723F] hover:bg-[#005e30] text-white rounded-full px-5"
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
