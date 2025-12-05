// app/(main)/alumno/aprendizaje/[plan_id]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LearningPlanTable from "../../../../../components/LearningPlanTable";
import { PLANES_MOCK, ENC_TO_PLAN } from "../../_data/planes.mock";

export default function AprendizajeDetallePage() {
  const params = useParams<{ plan_id: string }>();
  const rawParam = params?.plan_id ?? "";

  // Permite que si llega /aprendizaje/enc-a1 también funcione
  const planId = ENC_TO_PLAN[rawParam] ?? rawParam;
  const data = PLANES_MOCK[planId];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <Link href="/alumno/aprendizaje">
          <Button variant="outline" className="cursor-pointer">
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar
          </Button>
        </Link>
      </div>

      {!data ? (
        <p className="text-sm text-muted-foreground">No se encontró el plan.</p>
      ) : (
        <LearningPlanTable
          className="max-w-5xl mx-auto"
          header={data.header}
          rows={data.rows}
          onSubmit={(payload) => {
            console.log("Respuestas enviadas", { planId, ...payload });
          }}
        />
      )}
    </div>
  );
}
