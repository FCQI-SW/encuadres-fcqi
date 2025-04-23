'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";


type Materia = {
    id: string;      // PK en tu tabla 'materias' (uuid o int)
    clave: string;   // 'clave' en DB
    nombre: string;    // 'nombre_materia' en DB
};

function PuaMateria({
    params,
}: {
    params: { clave: string };
}) {

    const [materia, setMateria] = useState<Materia>();

    useEffect(() => {
        const fetchData = async () => {
            const { data: materiaData, error: materiasError } = await supabase
                .from("materias")
                .select("id, clave, nombre_materia")
                .eq("clave", params.clave);

            if (materiasError) {
                console.error("Error al obtener materias:", {
                    materiasError,
                });
                return;
            }

            // Mapeo
            const mappedMateria = (materiaData).map((m) => ({
                id: m.id,
                clave: m.clave,
                nombre: m.nombre_materia,
            }));


            setMateria(mappedMateria[0]);
        };

        fetchData();
    }, []);
    if (materia != null) {
        return (
            <>
                <div className="grid grid-cols-2 items-center border-2 border-black bg-gray-200 justify-items-center py-8 gap-y-8 mx-24 my-12 font-[family-name:var(--font-geist-sans)]">
                    <h1 className="text-center font-bold text-2xl col-span-2">I. DATOS DE IDENTIFICACIÓN</h1>
                    <div className="grid grid-cols-2">
                        <h1 className="text-2xl">Clave del curso: </h1>
                        <Input className="w-[75%] border-black bg-gray-50" disabled value={materia.clave} />

                    </div>

                    <div className="grid grid-cols-2">
                        <h1 className="text-2xl">Programa educativo: </h1>
                        <Input className="w-[75%] border-black bg-gray-50" disabled value={materia.nombre} />

                    </div>

                    <div className="grid grid-cols-2">
                        <h1 className="text-2xl">Nombre del curso: </h1>
                        <Input className="w-[75%] border-black bg-gray-50" placeholder="Nombre del curso" />
                    </div>

                    <div className="grid grid-cols-2">
                        <h1 className="text-2xl">Plan de estudios: </h1>
                        <Input className="w-[75%] border-black bg-gray-50" placeholder="Plan de estudios" />
                    </div>

                </div>

                <div className="items-center border-2 border-black bg-gray-200 justify-items-center py-8 gap-8 mx-24 my-12 font-[family-name:var(--font-geist-sans)]">
                    <h1 className="text-center font-bold text-2xl col-span-2 pb-8">II. PROPÓSITO DE LA UNIDAD DE APRENDIZAJE</h1>
                    <div className="grid grid-cols-4 justify-items-stretch w-[90%]">
                        <h1 className="self-center text-2xl">Propósito de la unidad de aprendizaje: </h1>
                        <Input className="min-h-36 border-black bg-gray-50 col-span-3" placeholder="Ingresar propósito..." />
                    </div>
                </div>

                <div className="items-center border-2 border-black bg-gray-200 justify-items-center py-8 gap-8 mx-24 my-12 font-[family-name:var(--font-geist-sans)]">
                    <h1 className="text-center font-bold text-2xl col-span-2 pb-8">III. COMPETENCIA DE LA UNIDAD DE APRENDIZAJE</h1>
                    <div className="grid grid-cols-4 justify-items-stretch w-[90%]">
                        <h1 className="self-center text-2xl">Competencia de la unidad de aprendizaje: </h1>
                        <Input className="min-h-36 border-black bg-gray-50 col-span-3" placeholder="Ingresar competencia..." />
                    </div>
                </div>

                <div className="items-center border-2 border-black bg-gray-200 justify-items-center py-8 gap-8 mx-24 my-12 font-[family-name:var(--font-geist-sans)]">
                    <h1 className="text-center font-bold text-2xl col-span-2 pb-8">IV. EVIDENCIA(S) DE DESEMPEÑO</h1>
                    <div className="grid grid-cols-4 justify-items-stretch w-[90%]">
                        <h1 className="self-center text-2xl">Evidencia(s) de desempeño: </h1>
                        <Input className="min-h-36 border-black bg-gray-50 col-span-3" placeholder="Ingresar evidencias..." />
                    </div>
                </div>

                <div className="items-center border-2 border-black bg-gray-200 justify-items-center py-8 gap-8 mx-24 my-12 font-[family-name:var(--font-geist-sans)]">
                    <h1 className="text-center font-bold text-2xl col-span-2 pb-8">V. DESARROLLO POR UNIDADES</h1>
                    <div className="grid grid-cols-3 justify-items-stretch w-[90%]">
                        <h1 className="self-center text-2xl">Número de unidades: </h1>
                        <Input type="number" className=" border-black bg-gray-50 col-span-1" placeholder="Ingresar número de unidades..." />
                    </div>
                </div>

                <div className="pb-8 justify-self-center">
                    <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">
                        <Link href={`./${params.clave}/unidades`}>Continuar</Link>
                    </Button>
                </div>


            </>)
    }
}

export default PuaMateria;