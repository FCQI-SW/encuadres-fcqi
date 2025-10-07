"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";

type Materia = {
  id: string;
  clave: string;
  nombre: string;
  estado: string;
};

export default function Encuadres() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [fetched, setFetched] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia, estado")
        .eq("estado", "Activa");

      if (error) {
        console.error("Error al obtener materias:", error);
        setMaterias([]);
      } else {
        setMaterias(
          (data ?? []).map((m: any) => ({
            id: m.id,
            clave: m.clave,
            nombre: m.nombre_materia,
            estado: m.estado,
          }))
        );
      }
      setFetched(true);
    })();
  }, []);

  return (
    <div className="px-4 py-8">
      <h1 className="mb-4 text-center text-2xl font-bold">Encuadres de materias</h1>

      <div className="mx-auto max-w-5xl overflow-x-auto rounded-md border">
        <Table className="table-fixed w-full text-sm">
          <TableCaption>
            {fetched && materias.length === 0 ? "No hay materias activas." : ""}
          </TableCaption>

          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Nombre del curso</TableHead>
              <TableHead className="w-[18%] text-center">Clave</TableHead>
              <TableHead className="w-[18%] text-center">Estado</TableHead>
              <TableHead className="w-[14%] text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {fetched && materias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  No hay materias activas.
                </TableCell>
              </TableRow>
            ) : (
              materias.map((m) => {
                const href = `${pathname}/${m.clave}`;
                return (
                  <TableRow key={m.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link
                        href={href}
                        className="text-primary hover:underline block max-w-[32ch] truncate"
                      >
                        {m.nombre}
                      </Link>
                    </TableCell>

                    <TableCell className="tabular-nums text-center">{m.clave}</TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${
                            m.estado === "Activa" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        {m.estado}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#00723F] text-white hover:bg-[#005e30] cursor-pointer"
                      >
                        <Link href={href}>Ver encuadre</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
