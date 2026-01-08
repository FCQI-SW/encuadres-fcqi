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
import { Trash2, AlertCircle } from "lucide-react";

type ErroresCampos = {
  competencia?: string;
  descripcion?: string;
  duracion?: string;
};

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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  errores?: ErroresCampos;
};

export function PracticaTaller({
  unidad,
  numero,
  value,
  onChange,
  onDelete,
  collapsed = false,
  onToggleCollapse,
  errores = {},
}: PracticaTallerProps) {
  const [competencia, setCompetencia] = useState(value?.competencia || "");
  const [descripcion, setDescripcion] = useState(value?.descripcion || "");
  const [materialApoyo, setMaterialApoyo] = useState(
    value?.material_apoyo || ""
  );
  const [duracion, setDuracion] = useState<string>(
    String(value?.duracion || "")
  );

  // Sincronizar con value
  useEffect(() => {
    if (value) {
      setCompetencia(value.competencia || "");
      setDescripcion(value.descripcion || "");
      setMaterialApoyo(value.material_apoyo || "");
      setDuracion(String(value.duracion || ""));
    }
  }, [value]);

  // Avisar al padre cuando algo cambie
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
  }, [competencia, descripcion, materialApoyo, duracion, unidad, numero]);

  const ta =
    "min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  const inputBase =
    "w-full rounded-md border bg-background px-3 py-2 text-sm " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  // Clases dinámicas para textarea con error
  const getTextareaClass = (fieldName: keyof ErroresCampos) => {
    const hasError = errores[fieldName];
    return hasError
      ? ta + " border-red-500 focus-visible:ring-red-500"
      : ta + " border-input";
  };

  // Clases dinámicas para input con error
  const getInputClass = (fieldName: keyof ErroresCampos) => {
    const hasError = errores[fieldName];
    return hasError
      ? inputBase + " border-red-500 focus-visible:ring-red-500"
      : inputBase + " border-input";
  };

  const tieneErrores = Object.keys(errores).length > 0;

  return (
    <Card className={`border-2 ${tieneErrores ? "border-red-200 bg-red-50/30" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Práctica {numero}</CardTitle>
            {tieneErrores && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Faltan campos obligatorios</span>
              </div>
            )}
          </div>
          {collapsed && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {competencia || "Sin competencia capturada"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onToggleCollapse && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCollapse}
              className="cursor-pointer"
            >
              {collapsed ? "Editar" : "Minimizar"}
            </Button>
          )}

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
        </div>
      </CardHeader>

      {/* Solo mostramos el formulario si NO está colapsada */}
      {!collapsed && (
        <CardContent className="space-y-4">
          {/* Competencia */}
          <div>
            <Label className="mb-2 block">
              Competencia <span className="text-red-500">*</span>
            </Label>
            <textarea
              className={getTextareaClass("competencia")}
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              placeholder="Describe la competencia a desarrollar..."
            />
            {errores.competencia && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errores.competencia}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <Label className="mb-2 block">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <textarea
              className={getTextareaClass("descripcion")}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe las actividades de la práctica..."
            />
            {errores.descripcion && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errores.descripcion}
              </p>
            )}
          </div>

          {/* Material de Apoyo */}
          <div>
            <Label className="mb-2 block">Material de Apoyo</Label>
            <textarea
              className={ta + " border-input"}
              value={materialApoyo}
              onChange={(e) => setMaterialApoyo(e.target.value)}
              placeholder="Lista los materiales necesarios..."
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
                placeholder="2"
                className={getInputClass("duracion")}
              />
              {errores.duracion && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errores.duracion}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}