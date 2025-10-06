"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SubjectGrid } from "../_components/SubjectGrid";
import type { MateriaAsignada } from "../_data/types";
import { fetchMateriasMock } from "../_data/data.mock";
import { ENC_TO_PLAN } from "../_data/planes.mock";

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
        setError("No se pudieron cargar las unidades de aprendizaje.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openPlan = (m: MateriaAsignada) => {
    if (!m.encuadre_id) return;

    const planId = ENC_TO_PLAN[m.encuadre_id] ?? m.encuadre_id;
    router.push(`/alumno/aprendizaje/${planId}`);
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="flex flex-col sm:grid sm:grid-cols-3 sm:items-center mb-6 gap-3 sm:gap-0">
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

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center">
          Unidades de aprendizaje
        </h1>

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
        onOpen={openPlan}
        buttonText="Abrir plan de aprendizaje"
      />
    </div>
  );
}
