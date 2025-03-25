import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "./ui/button";


export function Materia({ estadoMateria }: { estadoMateria: string }) {
    const nombreMateria = "Aplicaciones Móviles";
    const claveMateria = "40002";
    const grupoMateria = "361";
    const profesorMateria = "Guillermo Licea";
    //const estadoMateria: "Por asignar" | "Publicada" | "Aceptada" = "Por asignar";
    let btnTextoEstado = "Abrir encuadre";
    if (estadoMateria == "Publicada") {
        btnTextoEstado = "Invitar"
    } else if (estadoMateria == "Aceptada") {
        btnTextoEstado = "Revisar";
    } else if (estadoMateria == "Por registrar") {
        btnTextoEstado = "Registrar avance";
    } else if (estadoMateria == "Registrada") {
        btnTextoEstado = "Revisar";
    }
    return (
        <div className="h-auto w-auto lg:w-3xs m-8">
            <Card >
                <CardHeader>
                    <CardTitle>{nombreMateria}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Profesor: {profesorMateria}</p>
                    <p>Clave: {claveMateria}</p>
                    <p>Grupo: {grupoMateria}</p>
                </CardContent>

                <CardFooter className="self-center align-bottom">
                    <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">{btnTextoEstado}</Button>
                </CardFooter>
            </Card>
        </div>
    )
}