"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FullEncuadreTable from "../../../../../components/FullEncuadreTable";
import { ENCUADRES_MOCK } from "../../_data/encuadres.mock";

export default function SubjectEncuadrePage() {
  const params = useParams<{ encuadre_id: string }>();
  const encuadre_id = params?.encuadre_id;

  const data = encuadre_id ? ENCUADRES_MOCK[encuadre_id] : undefined;
  if (!data) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/alumno/encuadres">
            <Button variant="outline" className="cursor-pointer">
              <ChevronLeft className="mr-2 h-5 w-5" />
              Regresar
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          No se encontró el encuadre solicitado.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <Link href="/alumno/encuadres">
          <Button variant="outline" className="cursor-pointer">
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar
          </Button>
        </Link>
      </div>

      <FullEncuadreTable
        className="max-w-5xl mx-auto"
        universidad="Universidad Autónoma de Baja California"
        facultad="Facultad de Ciencias Químicas e Ingeniería"
        programa="Ingeniero en Computación / Ingeniero en Software y Tecnologías Emergentes"
        evaluacionRows={data.evaluacionRows}
        totalValor={data.totalValor}
        rights={data.rights}
        descripcionProducto={data.descripcionProducto}
        normasConducta={data.normasConducta}
        onSave={(payload) => {
        
          console.log("Guardar aceptación:", { encuadre_id, ...payload });
        }}
      />
    </div>
  );
}
