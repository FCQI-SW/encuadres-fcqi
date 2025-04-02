import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "./ui/button";
import { Invite } from "./invite";


export function Materia({ btnText }: { btnText: string }) {
    const nombreMateria = "Aplicaciones Móviles";
    const claveMateria = "40002";
    const grupoMateria = "361";
    const profesorMateria = "Guillermo Licea";

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
                        <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">{btnText}</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }
}