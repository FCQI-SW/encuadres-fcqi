'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Materia = {
    id: string;      // PK en tu tabla 'materias' (uuid o int)
    clave: string;   // 'clave' en DB
    nombre: string;    // 'nombre_materia' en DB
};

type Profesor = {
    id: string;
    nombre: string;
}

function EncuadreMateria({
    params,
}: {
    params: { clave: string };
}) {

    const [materia, setMateria] = useState<Materia>();
    const [profesores, setProfesores] = useState<Profesor[]>();

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
    },[]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: profesoresData, error: profesoresError } = await supabase
                .from("usuarios")
                .select("id, nombre, rol_id")
                .eq("rol_id", "bc3ab654-5fc8-401a-a6e2-97903b45cc93");

            if (profesoresError) {
                console.error("Error al obtener materias:", {
                    profesoresError,
                });
                return;
            }

            // Mapeo
            const mappedProfesores = (profesoresData).map((m) => ({
                id: m.id,
                nombre: m.nombre,
            }));


            setProfesores(mappedProfesores);
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
                    <Select>
                        <SelectTrigger className="w-[50%]">
                            <SelectValue placeholder="Seleccione un profesor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {profesores?.map((p) => {
                                    return <>
                                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                    </>
                                })}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <h1 className="text-center font-bold text-2xl ">Periodo del curso:</h1>
                    <Input className="w-[50%]" placeholder="Periodo"></Input>

                    <h1 className="text-center font-bold text-2xl ">Grupo del curso:</h1>
                    <Input className="w-[50%]" placeholder="Grupo"></Input>

                </div>
                <div className="py-8 justify-self-center">
                    <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">
                        <Link href={"./"}>Guardar</Link>
                    </Button>
                </div>
            </>)
    }
}

export default EncuadreMateria;