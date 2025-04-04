"use client"

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "./ui/button";
import { Invite } from "./invite";
import Link from "next/link";
import { usePathname } from "next/navigation"

export function Materia({ btnText, nombreMateria, claveMateria, grupoMateria, profesorMateria }: { btnText: string, nombreMateria: string, claveMateria: string, grupoMateria: string, profesorMateria: string }) {
    const pathname = usePathname()
    const materiaInfo = <>
        <CardHeader>
            <CardTitle>{nombreMateria}</CardTitle>
        </CardHeader>
        <CardContent>
            <p>Profesor: {profesorMateria}</p>
            <p>Clave: {claveMateria}</p>
            <p>Grupo: {grupoMateria}</p>
        </CardContent>
    </>

    if (btnText == "Invitar") {
        return (
            <div className="h-auto w-auto lg:w-3xs m-8">
                <Card >
                    {materiaInfo}
                    <CardFooter className="self-center align-bottom">
                        <Invite />
                    </CardFooter>
                </Card>
            </div>
        )
    }
    else {
        return (
            <div className="h-auto w-auto lg:w-3xs m-8">
                <Card >
                    {materiaInfo}
                    <CardFooter className="self-center align-bottom">
                        <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">
                            <Link href={`${pathname}/${claveMateria}`}>{btnText}</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }
}