"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContenidoEditor } from "@/components/contenido-editor";

type UnidadProps = {
  nUnidad: number;
  value?: {
    nombre: string;
    competencia: string;
    contenido: string;
    duracion: number;
  };
  onChange?: (data: {
    numero: number;
    nombre: string;
    competencia: string;
    contenido: string;
    duracion: number;
  }) => void;
};

export function Unidad({ nUnidad, value, onChange }: UnidadProps) {
  const [nombre, setNombre] = useState(value?.nombre || "");
  const [competencia, setCompetencia] = useState(value?.competencia || "");
  const [contenido, setContenido] = useState(value?.contenido || "");
  const [duracion, setDuracion] = useState<string>(String(value?.duracion || ""));

  // NUEVO: Actualizar estados cuando value cambia (cuando se cargan datos de BD)
  useEffect(() => {
    if (value) {
      setNombre(value.nombre || "");
      setCompetencia(value.competencia || "");
      setContenido(value.contenido || "");
      setDuracion(String(value.duracion || ""));
    }
  }, [value]);

  // Notificar cambios al padre
  useEffect(() => {
    if (onChange) {
      onChange({
        numero: nUnidad,
        nombre,
        competencia,
        contenido,
        duracion: Number(duracion) || 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, competencia, contenido, duracion, nUnidad]);

  const ta =
    "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl text-center">
          {nombre ? `UNIDAD ${nUnidad}. ${nombre}` : `UNIDAD ${nUnidad}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Nombre de la unidad */}
        <div>
          <Label className="mb-2 block">
            Nombre de la unidad <span className="text-red-500">*</span>
          </Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Funciones de una variable"
          />
        </div>

        {/* Competencia */}
        <div>
          <Label className="mb-2 block">
            Competencia <span className="text-red-500">*</span>
          </Label>
          <textarea
            className={ta}
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            placeholder="Describe la competencia que se desarrollará en esta unidad..."
          />
        </div>

        {/* Contenido - Editor estructurado */}
        <div>
          <Label className="mb-2 block">
            Contenido <span className="text-red-500">*</span>
          </Label>
          <ContenidoEditor
            numeroUnidad={nUnidad}
            value={contenido}
            onChange={setContenido}
          />
        </div>

        {/* Duración */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <Label className="mb-2 block">
              Duración (horas) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              placeholder="10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}