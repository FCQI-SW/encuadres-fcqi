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
                <div className="grid grid-cols-2 items-center justify-items-center pt-8 gap-8 mx-24 font-[family-name:var(--font-geist-sans)]">
                    <h1 className="text-center font-bold text-2xl ">Clave del curso:</h1>
                    <h1 className="text-center font-bold text-2xl ">{materia.clave}</h1>

                    <h1 className="text-center font-bold text-2xl ">Nombre del curso:</h1>
                    <h1 className="text-center font-bold text-2xl ">{materia.nombre}</h1>

                    <h1 className="text-center font-bold text-2xl ">Profesor del curso:</h1>
                    <Input className="w-[75%]  " placeholder="Profesor"></Input>

                    <h1 className="text-center font-bold text-2xl ">Periodo del curso:</h1>
                    <Input className="w-[75%]  " placeholder="Periodo"></Input>

                    <h1 className="text-center font-bold text-2xl ">Grupo del curso:</h1>
                    <Input className="w-[75%] " placeholder="Grupo"></Input>

                </div>
                <div className="py-8 justify-self-center">
                    <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">
                        <Link href={"./"}>Guardar</Link>
                    </Button>
                </div>
            </>)
    }
}

export default PuaMateria;