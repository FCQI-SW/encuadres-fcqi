"use client"

import { Input } from "./ui/input"

export function Unidad({ nUnidad }: { nUnidad: number }) {
    return (<>

        <div className="grid grid-cols-4 items-center border-2 border-black bg-gray-200 justify-items-center py-8 gap-y-8 mx-24 my-12 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-center font-bold text-2xl col-span-4 pb-8">Unidad {nUnidad}</h1>

            <div className="col-span-2 grid grid-cols-2 mx-12">
                <h1>Nombre de la unidad: </h1>
                <Input className="w-[75%] border-black bg-gray-50" />
            </div>

            <div className="col-span-2 grid grid-cols-3 mx-12">
                <h1>Duración de la unidad: </h1>
                <Input className="w-[75%] border-black bg-gray-50" type="number"/>
                <h1 className="self-center">Horas</h1>
            </div>

            <div className="col-span-4 grid grid-cols-4 ">
                <h1 className="self-center mx-12">Competencia de la unidad: </h1>
                <Input className="self-center min-h-24 border-black bg-gray-50 col-span-3 w-[90%]" placeholder="Ingresar propósito..." />
            </div>

            <h1 className="self-center text-2xl col-span-4">Contenido de la unidad: </h1>
            <Input className="min-h-36 border-black bg-gray-50 col-span-4 w-[90%]" placeholder="[+] Agregar tema (1.1)" />

        </div>
    </>
    )
}
