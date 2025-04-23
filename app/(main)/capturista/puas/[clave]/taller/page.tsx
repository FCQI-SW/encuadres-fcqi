'use client'

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

type Materia = {
    id: string;      // PK en tu tabla 'materias' (uuid o int)
    clave: string;   // 'clave' en DB
    unidades: number;    // 'nombre_materia' en DB
};

function PuaMateriaTaller({
    params,
}: {
    params: { clave: string };
}) {
    const [materia, setMateria] = useState<Materia>();

    useEffect(() => {
        const fetchData = async () => {
            const { data: materiaData, error: materiasError } = await supabase
                .from("programas")
                .select("id, materia_id, unidades")
                .eq("materia_id", params.clave);

            if (materiasError) {
                console.error("Error al obtener materias:", {
                    materiasError,
                });
                return;
            }

            // Mapeo
            const mappedMateria = (materiaData).map((m) => ({
                id: m.id,
                clave: m.materia_id,
                unidades: m.unidades,
            }));


            setMateria(mappedMateria[0]);
        };

        fetchData();
    }, []);

    const nUnidades = [];

    if (materia) {
        for (let i = 1; i <= materia?.unidades; i++) {
            nUnidades.push(i);
        }
    }
    else {
        for (let i = 1; i <= 5; i++) {
            nUnidades.push(i);
        }
    }

    return (<>
        <div className="h-auto w-auto m-8">
            <div className="items-center border-2 border-black bg-gray-200 justify-items-center py-8 gap-8 mx-24 my-12 font-[family-name:var(--font-geist-sans)]">
                <h1 className="text-center font-bold text-2xl col-span-2">VI. ESTRUCTURA DE LAS PRÁCTICAS DE TALLER</h1>
            </div>

            <div className="pb-8 justify-self-center">
                <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">
                    <Link href={`../`}>Continuar</Link>
                </Button>
            </div>
        </div>

    </>)
}
export default PuaMateriaTaller;