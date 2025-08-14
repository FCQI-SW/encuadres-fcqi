"use client";

import * as React from "react";
import { SubjectCard } from "./SubjectCard";
import { MateriaAsignada } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  materias: MateriaAsignada[];
  loading?: boolean;
  onOpen: (m: MateriaAsignada) => void;
  buttonText?: string; // 👈 Nuevo prop
};

export function SubjectGrid({ materias, loading, onOpen, buttonText }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 shadow-sm bg-white">
            <Skeleton className="h-5 w-3/4 mb-3" />
            <Skeleton className="h-4 w-5/6 mb-1" />
            <Skeleton className="h-4 w-4/6 mb-1" />
            <Skeleton className="h-4 w-3/6 mb-4" />
            <Skeleton className="h-9 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (!materias?.length) {
    return <div className="text-muted-foreground">No tienes materias asignadas.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
      {materias.map((m) => (
        <SubjectCard
          key={m.id}
          materia={m}
          onOpen={onOpen}
          buttonText={buttonText} // 👈 Se pasa aquí
        />
      ))}
    </div>
  );
}
