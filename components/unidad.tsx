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

// Firma estable de un conjunto de campos, para comparar por valor.
function firma(
  numero: number,
  nombre: string,
  competencia: string,
  contenido: string,
  duracion: number,
  semanaInicio: number | null,
  semanaFin: number | null
): string {
  return JSON.stringify([
    numero,
    nombre,
    competencia,
    contenido,
    duracion,
    semanaInicio,
    semanaFin,
  ]);
}

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

  // ── CLAVE: firma de lo último que ESTE componente le mandó al padre.
  // El padre guarda ese dato y lo devuelve como `value` en el siguiente
  // render. Eso es un ECO, no un cambio externo. Si lo tratamos como
  // cambio, sincronizamos -> render -> emitimos -> eco -> ... infinito.
  // Guardando la firma podemos reconocer nuestro propio reflejo e
  // ignorarlo por completo.
  const ultimoEmitido = useRef<string>("");

  // `onChange` en un ref para que no participe en las dependencias del
  // efecto: si el padre lo recrea, no queremos re-emitir por eso.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // ── 1. Sincronizar desde `value` SOLO si es un cambio externo ──
  useEffect(() => {
    if (!value) return;

    const entrante = firma(
      nUnidad,
      value.nombre || "",
      value.competencia || "",
      value.contenido || "",
      Number(value.duracion) || 0,
      value.semana_inicio ?? null,
      value.semana_fin ?? null
    );

    // Es nuestro propio eco -> ignorar.
    if (entrante === ultimoEmitido.current) return;

    const nuevoNombre = value.nombre || "";
    const nuevaCompetencia = value.competencia || "";
    const nuevoContenido = value.contenido || "";
    const nuevaDuracion =
      value.duracion !== undefined && value.duracion !== null
        ? String(value.duracion)
        : "";
    const nuevaSemanaInicio =
      value.semana_inicio !== undefined && value.semana_inicio !== null
        ? String(value.semana_inicio)
        : "";
    const nuevaSemanaFin =
      value.semana_fin !== undefined && value.semana_fin !== null
        ? String(value.semana_fin)
        : "";

    setNombre((prev) => (prev === nuevoNombre ? prev : nuevoNombre));
    setCompetencia((prev) => (prev === nuevaCompetencia ? prev : nuevaCompetencia));
    setContenido((prev) => (prev === nuevoContenido ? prev : nuevoContenido));
    setDuracion((prev) => (prev === nuevaDuracion ? prev : nuevaDuracion));
    setSemanaInicio((prev) => (prev === nuevaSemanaInicio ? prev : nuevaSemanaInicio));
    setSemanaFin((prev) => (prev === nuevaSemanaFin ? prev : nuevaSemanaFin));
  }, [value, nUnidad]);

  // ── 2. Notificar al padre solo cuando algo cambie de verdad ──
  useEffect(() => {
    const payload: UnidadChangeData = {
      numero: nUnidad,
      nombre,
      competencia,
      contenido,
      duracion: Number(duracion) || 0,
      semana_inicio: semanaInicio.trim() ? Number(semanaInicio) : null,
      semana_fin: semanaFin.trim() ? Number(semanaFin) : null,
    };

    const actual = firma(
      payload.numero,
      payload.nombre,
      payload.competencia,
      payload.contenido,
      payload.duracion,
      payload.semana_inicio ?? null,
      payload.semana_fin ?? null
    );

    if (actual === ultimoEmitido.current) return;

    ultimoEmitido.current = actual;
    onChangeRef.current?.(payload);
  }, [nombre, competencia, contenido, duracion, semanaInicio, semanaFin, nUnidad]);

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