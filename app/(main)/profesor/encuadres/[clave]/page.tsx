import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,

} from "@/components/ui/table"

function EncuadreMateria({
    params,
}: {
    params: { clave: string };
}) {
    //Una vez conectada a la BD, utilizar la clave para conseguir el registro con la información completa de la materia
    //En los requerimientos indica que el capturista ingrese también los criterios de evaluación sugeridos por la PUA, estos se deberán cargar a la tabla y podrán ser editados por el profesor.
    return (<>
        <div className="items-center justify-items-center gap-16 pt-8 font-[family-name:var(--font-geist-sans)]">
            <h1>Materia con clave: {params.clave} </h1>
            <h1 className="text-center font-bold text-xl">Evaluación del curso</h1>
            <p>Agregar valor a cada actividad</p>
            <Table className="w-[75%] justify-self-center border-solid border-1 border-black text-center bg-blue">
                <TableHeader className="hover:bg-gray-300 bg-gray-300">
                    <TableRow>
                        <TableHead className="border-solid border-1 border-black text-center text-lg ">Criterio</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Valor</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Descripción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">
                            <Input defaultValue={"Examen"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input type="number" defaultValue={"20"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input defaultValue={"2 Examenes durante el curso."}></Input>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">
                            <Input defaultValue={"Prácticas de Taller"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input type="number" defaultValue={"20"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input defaultValue={"Prácticas realizadas fuera de clase."}></Input>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">
                            <Input defaultValue={"Prácticas de Laboratorio"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input type="number" defaultValue={"30"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input defaultValue={"Prácticas realizadas durante de clase."}></Input>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">
                            <Input defaultValue={"Tareas"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input type="number" defaultValue={"10"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input defaultValue={"Tareas realizadas fuera de clase."}></Input>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">
                            <Input defaultValue={"Proyecto"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input type="number" defaultValue={"20"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input defaultValue={"Prototipo electrónico basado en microcontrolador"}></Input>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">
                            <Input placeholder={"Agregar..."}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input type="number" placeholder={"Agregar..."}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input placeholder={"Agregar..."}></Input>
                        </TableCell>
                    </TableRow>
                    <TableRow >

                        <TableCell className="font-medium border-solid border-1 border-black">Total</TableCell>
                        <TableCell className="font-medium border-solid border-1 border-black">100%</TableCell>
                        <TableCell className="font-medium border-solid border-1 border-black"></TableCell>

                    </TableRow>
                </TableBody>
            </Table>

            <h1 className="text-center font-bold text-xl pt-12">Criterios de acreditación</h1>
            <Table className="w-[75%] justify-self-center border-solid border-1 border-black text-center" >
                <TableHeader className="hover:bg-gray-300 bg-gray-300">
                    <TableRow>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Ordinario</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Extraordinario</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium border-solid border-1 border-black text-balance">Alumnos con 80 % o más de asistencias en clases impartidas (estatuto escolar art. 70).</TableCell>
                        <TableCell className="font-medium border-solid border-1 border-black">Alumnos con 60 % o más de asistencias en clases impartidas (estatuto escolar art. 71).</TableCell>
                    </TableRow>
                    <TableRow >
                        <TableCell className="font-medium">
                            <Input placeholder={"Agregar criterio..."}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input placeholder={"Agregar criterio..."}></Input>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <div className="pt-8">

            </div>
        </div>
    </>)
}

export default EncuadreMateria;