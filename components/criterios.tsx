"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export type Criterio = {
  id: string;
  criterio: string;
  valor: number;            // porcentaje 0..100
  descripcion?: string;
};

export function TablaCriterios({
  initialRows = [],
  onChange,
}: {
  initialRows?: Criterio[];
  onChange?: (rows: Criterio[]) => void;
}) {
  const [rows, setRows] = React.useState<Criterio[]>(
    initialRows.length
      ? initialRows
      : [{ id: crypto.randomUUID(), criterio: "", valor: 0, descripcion: "" }]
  );

  const total = rows.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

  const update = (i: number, patch: Partial<Criterio>) => {
    setRows((prev) => {
      const next = prev.map((r, idx) =>
        idx === i ? { ...r, ...patch, valor: patch.valor !== undefined ? Number(patch.valor) : r.valor } : r
      );
      onChange?.(next);
      return next;
    });
  };

  const addRow = () =>
    setRows((prev) => [...prev, { id: crypto.randomUUID(), criterio: "", valor: 0, descripcion: "" }]);

  const removeRow = (i: number) =>
    setRows((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      onChange?.(next);
      return next.length ? next : [{ id: crypto.randomUUID(), criterio: "", valor: 0, descripcion: "" }];
    });

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="table-fixed w-full text-sm">
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[40%] font-bold">Criterio</TableHead>
            <TableHead className="w-[15%] text-center font-bold">Valor (%)</TableHead>
            <TableHead className="w-[35%] font-bold">Descripción</TableHead>
            <TableHead className="w-[10%]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={r.id}>
              <TableCell>
                <Input
                  value={r.criterio}
                  onChange={(e) => update(i, { criterio: e.target.value })}
                  placeholder="Ej. Examen"
                />
              </TableCell>
              <TableCell className="text-center">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  value={String(r.valor)}
                  onChange={(e) => update(i, { valor: Number(e.target.value) })}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={r.descripcion ?? ""}
                  onChange={(e) => update(i, { descripcion: e.target.value })}
                  placeholder="Detalles…"
                />
              </TableCell>
              <TableCell className="text-center">
                <Button size="icon" variant="ghost" className="cursor-pointer" onClick={() => removeRow(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          <TableRow>
            <TableCell className="font-semibold">Total</TableCell>
            <TableCell className="text-center font-semibold">{total}%</TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex justify-end p-2">
        <Button variant="secondary" size="sm" className="cursor-pointer" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar criterio
        </Button>
      </div>
    </div>
  );
}
