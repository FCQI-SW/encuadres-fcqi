"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Unidad } from "@/components/unidad";

type Programa = {
  id: string;
  materia_id: string;
  unidades: number;
};

export default function PuaMateriaUnidades() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave;

  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograma = async () => {
      if (!clave) return;

      setLoading(true);
      try {
        const { data: materiaData } = await supabase
          .from("materias")
          .select("id")
          .eq("clave", clave)
          .single();

        if (!materiaData) {
          setPrograma(null);
          setLoading(false);
          return;
        }

        const { data: programaData, error } = await supabase
          .from("programas")
          .select("id, materia_id, unidades")
          .eq("materia_id", materiaData.id)
          .single();

        if (error) {
          console.error("Error al obtener programa:", error);
          setPrograma(null);
        } else {
          setPrograma(programaData);
        }
      } catch (err) {
        console.error("Error:", err);
        setPrograma(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograma();
  }, [clave]);

  const handleBack = () => {
    router.push(`/capturista/materias/${clave}/pua`);
  };

  const handleContinuar = () => {
    // TODO: Guardar las unidades en la base de datos
    router.push(`/capturista/materias/${clave}/pua/laboratorio`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!programa) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>No se encontró el programa</CardTitle>
              <CardDescription>
                Por favor regresa y completa los datos generales del PUA primero.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="cursor-pointer"
              >
                Volver a datos generales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const nUnidades = Array.from({ length: programa.unidades }, (_, i) => i + 1);

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Button
            variant="outline"
            onClick={handleBack}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Volver a datos generales
          </Button>
        </div>

        <div className="text-center">
          <Card className="border-2 border-gray-300 bg-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">
                V. DESARROLLO POR UNIDADES
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-8">
          {nUnidades.map((num) => (
            <Unidad key={num} nUnidad={num} />
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            onClick={handleContinuar}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}