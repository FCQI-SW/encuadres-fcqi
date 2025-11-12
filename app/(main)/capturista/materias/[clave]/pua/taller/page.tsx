"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Materia = {
  id: string;
  clave: string;
  unidades: number;
};

export default function PuaMateriaTaller() {
  const params = useParams<{ clave: string }>();
  const clave = params?.clave;
  const [materia, setMateria] = useState<Materia>();

  useEffect(() => {
    const fetchData = async () => {
      const { data: materiaData, error: materiasError } = await supabase
        .from("programas")
        .select("id, materia_id, unidades")
        .eq("materia_id", clave);

      if (materiasError) {
        console.error("Error al obtener materias:", {
          materiasError,
        });
        return;
      }

      const mappedMateria = (materiaData || []).map((m) => ({
        id: m.id,
        clave: m.materia_id,
        unidades: m.unidades,
      }));

      setMateria(mappedMateria[0]);
    };

    fetchData();
  }, [clave]);

  const nUnidades = [];

  if (materia) {
    for (let i = 1; i <= materia?.unidades; i++) {
      nUnidades.push(i);
    }
  } else {
    for (let i = 1; i <= 5; i++) {
      nUnidades.push(i);
    }
  }

  return (
    <>
      <div className="h-auto w-auto m-8">
        <div className="items-center border-2 border-black bg-gray-200 justify-items-center py-8 gap-8 mx-24 my-12 font-[family-name:var(--font-geist-sans)]">
          <h1 className="text-center font-bold text-2xl col-span-2">
            VI. ESTRUCTURA DE LAS PRÁCTICAS DE TALLER
          </h1>
          {nUnidades.map((m) => {
            return (
              <div key={m} className="my-16">
                <h1 className="text-center font-bold text-2xl pt-8">
                  UNIDAD {m}
                </h1>
                <h2 className="text-center font-bold mt-8">Práctica #1</h2>
                <div className="grid grid-cols-4 gap-x-4 my-8">
                  <h2>Nombre de la práctica: </h2>
                  <Input
                    className="border-black bg-gray-50"
                    placeholder="Ingresar nombre..."
                  />
                  <h2>Duración de la práctica: </h2>
                  <Input className="border-black bg-gray-50" type="number" />
                </div>
                <h2 className="text-center font-bold mt-8">
                  [+] Agregar práctica (#2)
                </h2>
              </div>
            );
          })}
        </div>

        <div className="pb-8 justify-self-center">
          <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">
            <Link href={`/capturista/materias`}>Finalizar</Link>
          </Button>
        </div>
      </div>
    </>
  );
}