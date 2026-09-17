"use client";

import { useState, useEffect, useRef } from "react";
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

// Firma estable para comparar por valor.
function firmaPractica(
  unidad: number,
  numero: number,
  competencia: string,
  descripcion: string,
  materialApoyo: string,
  duracion: number
): string {
  return JSON.stringify([unidad, numero, competencia, descripcion, materialApoyo, duracion]);
}

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
  const [materialApoyo, setMaterialApoyo] = useState(value?.material_apoyo || "");
  const [duracion, setDuracion] = useState<string>(String(value?.duracion || ""));

  // ── CLAVE: firma de lo último que este componente emitió ─────
  // El padre lo guarda y lo devuelve como `value` en el siguiente
  // render. Eso es un ECO, no un cambio externo. Sin reconocerlo,
  // se genera: emitir -> el padre actualiza -> nuevo value ->
  // sincronizar -> emitir -> ... bucle infinito.
  const ultimoEmitido = useRef<string>("");

  // onChange en un ref: si el padre lo recrea, no debe re-disparar.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // ── 1. Sincronizar desde `value` solo si es cambio externo ──
  useEffect(() => {
    if (!value) return;

    const entrante = firmaPractica(
      unidad,
      numero,
      value.competencia || "",
      value.descripcion || "",
      value.material_apoyo || "",
      Number(value.duracion) || 0
    );

    if (entrante === ultimoEmitido.current) return; // es nuestro eco

    const nuevaCompetencia = value.competencia || "";
    const nuevaDescripcion = value.descripcion || "";
    const nuevoMaterial = value.material_apoyo || "";
    const nuevaDuracion = String(value.duracion || "");

    setCompetencia((p) => (p === nuevaCompetencia ? p : nuevaCompetencia));
    setDescripcion((p) => (p === nuevaDescripcion ? p : nuevaDescripcion));
    setMaterialApoyo((p) => (p === nuevoMaterial ? p : nuevoMaterial));
    setDuracion((p) => (p === nuevaDuracion ? p : nuevaDuracion));
  }, [value, unidad, numero]);

  // ── 2. Avisar al padre solo cuando algo cambie de verdad ────
  useEffect(() => {
    const duracionNum = Number(duracion) || 0;

    const actual = firmaPractica(
      unidad,
      numero,
      competencia,
      descripcion,
      materialApoyo,
      duracionNum
    );

    if (actual === ultimoEmitido.current) return;

    ultimoEmitido.current = actual;
    onChangeRef.current?.({
      unidad,
      numero,
      competencia,
      descripcion,
      material_apoyo: materialApoyo,
      duracion: duracionNum,
    });
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

  const getTextareaClass = (fieldName: keyof ErroresCampos) => {
    const hasError = errores[fieldName];
    return hasError
      ? ta + " border-red-500 focus-visible:ring-red-500"
      : ta + " border-input";
  };

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

      {!collapsed && (
        <CardContent className="space-y-4">
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

          <div>
            <Label className="mb-2 block">Material de Apoyo</Label>
            <textarea
              className={ta + " border-input"}
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