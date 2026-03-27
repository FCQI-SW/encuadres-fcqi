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
import { ContenidoEditor } from "@/components/contenido-editor";

type UnidadValue = {
  nombre: string;
  competencia: string;
  contenido: string;
  duracion: number;
  semana_inicio?: number | null;
  semana_fin?: number | null;
};

type UnidadChangeData = {
  numero: number;
  nombre: string;
  competencia: string;
  contenido: string;
  duracion: number;
  semana_inicio?: number | null;
  semana_fin?: number | null;
};

type UnidadProps = {
  nUnidad: number;
  value?: UnidadValue;
  onChange?: (data: UnidadChangeData) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Unidad({
  nUnidad,
  value,
  onChange,
  collapsed = false,
  onToggleCollapse,
}: UnidadProps) {
  const [nombre, setNombre] = useState(value?.nombre || "");
  const [competencia, setCompetencia] = useState(value?.competencia || "");
  const [contenido, setContenido] = useState(value?.contenido || "");
  const [duracion, setDuracion] = useState<string>(
    value?.duracion !== undefined && value?.duracion !== null
      ? String(value.duracion)
      : ""
  );
  const [semanaInicio, setSemanaInicio] = useState<string>(
    value?.semana_inicio !== undefined && value?.semana_inicio !== null
      ? String(value.semana_inicio)
      : ""
  );
  const [semanaFin, setSemanaFin] = useState<string>(
    value?.semana_fin !== undefined && value?.semana_fin !== null
      ? String(value.semana_fin)
      : ""
  );

  useEffect(() => {
    if (value) {
      setNombre(value.nombre || "");
      setCompetencia(value.competencia || "");
      setContenido(value.contenido || "");
      setDuracion(
        value.duracion !== undefined && value.duracion !== null
          ? String(value.duracion)
          : ""
      );
      setSemanaInicio(
        value.semana_inicio !== undefined && value.semana_inicio !== null
          ? String(value.semana_inicio)
          : ""
      );
      setSemanaFin(
        value.semana_fin !== undefined && value.semana_fin !== null
          ? String(value.semana_fin)
          : ""
      );
    }
  }, [value]);

  useEffect(() => {
    if (onChange) {
      onChange({
        numero: nUnidad,
        nombre,
        competencia,
        contenido,
        duracion: Number(duracion) || 0,
        semana_inicio: semanaInicio.trim() ? Number(semanaInicio) : null,
        semana_fin: semanaFin.trim() ? Number(semanaFin) : null,
      });
    }
  }, [
    nombre,
    competencia,
    contenido,
    duracion,
    semanaInicio,
    semanaFin,
    nUnidad,
    onChange,
  ]);

  const ta =
    "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  const tituloBase = nombre
    ? `UNIDAD ${nUnidad}. ${nombre}`
    : `UNIDAD ${nUnidad}`;

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex flex-col flex-1">
          <CardTitle className="text-xl text-center sm:text-left">
            {tituloBase}
          </CardTitle>
          {collapsed && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {competencia || "Sin competencia capturada"}
            </p>
          )}
        </div>

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
      </CardHeader>

      <CardContent className={`pt-6 space-y-4 ${collapsed ? "hidden" : ""}`}>
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

        <div>
          <Label className="mb-2 block">
            Contenido <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Los temas agregados aquí se usarán en el registro de avances.
          </p>
          <ContenidoEditor
            numeroUnidad={nUnidad}
            value={contenido}
            onChange={setContenido}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="mb-2 block">
              Duración (horas) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              placeholder="10"
            />
          </div>

          <div>
            <Label className="mb-2 block">
              Semana inicio <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={semanaInicio}
              onChange={(e) => setSemanaInicio(e.target.value)}
              placeholder="1"
            />
          </div>

          <div>
            <Label className="mb-2 block">
              Semana fin <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={semanaFin}
              onChange={(e) => setSemanaFin(e.target.value)}
              placeholder="3"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}