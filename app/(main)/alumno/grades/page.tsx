"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubjectGrid } from "../_components/SubjectGrid";
import type { MateriaAsignada } from "../types";
import { fetchMateriasMock } from "../data.mock";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [materias, setMaterias] = React.useState<MateriaAsignada[]>([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchMateriasMock(450);
        setMaterias(data);
      } catch {
        setError("No se pudieron cargar las materias.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openEncuadre = (m: MateriaAsignada) => {
    if (!m.encuadre_id) return;
    router.push(`/alumno/encuadres/${m.encuadre_id}`);
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="flex flex-col sm:grid sm:grid-cols-3 sm:items-center mb-6 gap-3 sm:gap-0">
        {/* Botón regresar */}
        <div className="flex justify-center sm:justify-start">
          <Button
            variant="outline"
            onClick={() => router.push("/alumno")}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar
          </Button>
        </div>

        {/* Título */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center">
          Materias asignadas
        </h1>

        {/* Espacio vacío para balancear */}
        <div className="hidden sm:block" />
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <SubjectGrid
        materias={materias}
        loading={loading}
        onOpen={openEncuadre}
        buttonText="Abrir unidad de aprendizaje" 
      />
    </div>
  );
}
