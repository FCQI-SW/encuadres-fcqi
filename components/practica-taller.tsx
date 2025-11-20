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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type PracticaTallerProps = {
  unidad: number;
  numero: number;
  value?: {
    competencia: string;
    descripcion: string;
    material_apoyo: string;
    duracion: number;
  };
  onChange?: (data: {
    unidad: number;
    numero: number;
    competencia: string;
    descripcion: string;
    material_apoyo: string;
    duracion: number;
  }) => void;
  onDelete?: () => void;
};

export function PracticaTaller({
  unidad,
  numero,
  value,
  onChange,
  onDelete,
}: PracticaTallerProps) {
  const [competencia, setCompetencia] = useState(value?.competencia || "");
  const [descripcion, setDescripcion] = useState(value?.descripcion || "");
  const [materialApoyo, setMaterialApoyo] = useState(
    value?.material_apoyo || ""
  );
  const [duracion, setDuracion] = useState<string>(
    String(value?.duracion || "")
  );

  // Sincronizar con el value que viene del padre
  useEffect(() => {
    if (value) {
      setCompetencia(value.competencia || "");
      setDescripcion(value.descripcion || "");
      setMaterialApoyo(value.material_apoyo || "");
      setDuracion(String(value.duracion || ""));
    }
  }, [value]);

  // Avisar al padre cuando cambian los campos
  useEffect(() => {
    if (onChange) {
      onChange({
        unidad,
        numero,
        competencia,
        descripcion,
        material_apoyo: materialApoyo,
        duracion: Number(duracion) || 0,
      });
    }
    // IMPORTANTE: NO incluir onChange aquí para evitar el bucle infinito
  }, [competencia, descripcion, materialApoyo, duracion, unidad, numero]);

  const ta =
    "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Práctica {numero}</CardTitle>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block">
            Competencia <span className="text-red-500">*</span>
          </Label>
          <textarea
            className={ta}
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            placeholder="Describe la competencia a desarrollar..."
          />
        </div>

        <div>
          <Label className="mb-2 block">
            Descripción <span className="text-red-500">*</span>
          </Label>
          <textarea
            className={ta}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe las actividades de la práctica..."
          />
        </div>

        <div>
          <Label className="mb-2 block">Material de Apoyo</Label>
          <textarea
            className={ta}
            value={materialApoyo}
            onChange={(e) => setMaterialApoyo(e.target.value)}
            placeholder="Lista los materiales necesarios..."
          />
        </div>

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
              placeholder="2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
