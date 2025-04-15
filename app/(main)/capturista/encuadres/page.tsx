"use client";


import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,

} from "@/components/ui/table"
import { supabase } from "@/lib/supabase";
import Link from 'next/link';
import { usePathname } from "next/navigation"

export enum categoria_enum {
    BASICA = "Basica",
    DISCIPLINARIA = "Disciplinaria",
    TERMINAL = "Terminal"
}

export enum requisito_enum {
    OBLIGATORIA = "Obligatoria",
    OPTATIVA = "Optativa"
}


type Materia = {
    id: string;      // PK en tu tabla 'materias' (uuid o int)
    clave: string;   // 'clave' en DB
    nombre: string;    // 'nombre_materia' en DB
    estado: string;
};

function Encuadres() {
    const [materias, setMaterias] = useState<Materia[]>([]);
    const pathname = usePathname()

    useEffect(() => {
        const fetchData = async () => {
            // Trae usuarios (including nombre)
            const { data: materiasData, error: materiasError } = await supabase
                .from("materias")
                .select("id, clave, nombre_materia, estado");

            if (materiasError) {
                console.error("Error al obtener materias:", {
                    materiasError,
                });
                return;
            }

            // Mapeo
            const mappedMaterias = (materiasData || []).map((m) => ({
                id: m.id,
                clave: m.clave,
                nombre: m.nombre_materia,
                estado: m.estado,
            }));


            setMaterias(mappedMaterias);
        };

        fetchData();
    }, []);



    return (<>
        <div className="items-center justify-items-center gap-16 pt-8 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-center font-bold text-2xl">Encuadres de materias</h1>
            <Table className="table-fixed w-[75%] justify-self-center border-solid border-1 border-black m-4">
                <TableHeader className="hover:bg-gray-300 bg-gray-300 text-center">
                    <TableRow>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Nombre del curso</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Clave del curso</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Estado</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {materias.map((m) => {
                        return (
                            <TableRow key={m.id}>
                                <TableCell className="font-medium">
                                    <Link href={`${pathname}/${m.clave}`}>
                                        <p className="ml-4">{m.nombre}</p>
                                    </Link>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Link href={`${pathname}/${m.clave}`}>
                                        <p className="ml-4">{m.clave}</p>
                                    </Link>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Link href={`${pathname}/${m.clave}`}>
                                        <p className="ml-4">{m.estado}</p>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

        </div>
        <div className="py-8 justify-self-center">
            <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Avanzar</Button>
        </div>

    </>)
}

export default Encuadres



