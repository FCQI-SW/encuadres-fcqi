import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,

} from "@/components/ui/table"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const dataCriterios = [
    {
        id: "1",
        criterio: "Examen",
        valor: 20,
        descripcion: "2 Examenes durante el curso.",
    },
    {
        id: "2",
        criterio: "Prácticas de Taller",
        valor: 20,
        descripcion: "Prácticas realizadas fuera de clase.",
    },
    {
        id: "3",
        criterio: "Prácticas de Laboratorio",
        valor: 30,
        descripcion: "Prácticas realizadas durante de clase.",
    },
    {
        id: "4",
        criterio: "Tareas",
        valor: 10,
        descripcion: "Tareas realizadas fuera de clase.",
    },
    {
        id: "5",
        criterio: "Proyecto",
        valor: 20,
        descripcion: "Prototipo electrónico basado en microcontrolador.",
    },
];

const dataPlan = [
    {
        id: "1",
        unidad: "1.1",
        tema: "Machine Learning",
        semana: 0
    },
    {
        id: "2",
        unidad: "1.2",
        tema: "Machine Learning2",
        semana: 0
    },
    {
        id: "3",
        unidad: "1.3",
        tema: "Machine Learning3",
        semana: 0
    },
    {
        id: "4",
        unidad: "2.1",
        tema: "Inteligencia Artificial",
        semana: 0
    },
    {
        id: "5",
        unidad: "2.2",
        tema: "Inteligencia Artificial2",
        semana: 0
    },
];


function EncuadreMateria({
    params,
}: {
    params: { clave: string };
}) {
    //Una vez conectada a la BD, utilizar la clave para conseguir el registro con la información completa de la materia
    //En los requerimientos indica que el capturista ingrese también los criterios de evaluación sugeridos por la PUA, estos se deberán cargar a la tabla y podrán ser editados por el profesor.
    let total = 0;
    return (<>
        <div className="items-center justify-items-center gap-16 pt-8 font-[family-name:var(--font-geist-sans)]">
            <h1>Materia con clave: {params.clave} </h1>

            <h1 className="text-center font-bold text-2xl">Evaluación del curso</h1>
            <p>Agregar valor a cada actividad</p>
            <Table className="table-fixed w-[75%] justify-self-center border-solid border-1 border-black text-center m-4">

                <TableHeader className="hover:bg-gray-300 bg-gray-300">
                    <TableRow>
                        <TableHead className="border-solid border-1 border-black text-center text-lg ">Criterio</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Valor</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Descripción</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {dataCriterios.map((criterio) => {
                        total += criterio.valor;
                        return (
                            <TableRow key={criterio.id}>
                                <TableCell className="font-medium">
                                    <Input defaultValue={criterio.criterio}></Input>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Input type="number" defaultValue={criterio.valor}></Input>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Input defaultValue={criterio.descripcion}></Input>
                                </TableCell>
                            </TableRow>
                        );
                    })}

                    <TableRow>
                        <TableCell className="font-medium">
                            <Input placeholder={"Agregar"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input type="number" placeholder={"0"}></Input>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Input placeholder={"Descripción del criterio de evaluación."}></Input>
                        </TableCell>
                    </TableRow>

                    <TableRow >
                        <TableCell className="font-medium border-solid border-1 border-black">Total</TableCell>
                        <TableCell className="font-medium border-solid border-1 border-black">{total}%</TableCell>
                        <TableCell className="font-medium border-solid border-1 border-black"></TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <h1 className="text-center font-bold text-2xl pt-12">Criterios de acreditación</h1>
            <Table className="table-fixed w-[75%] justify-self-center border-solid border-1 border-black m-4">
                <TableHeader className="hover:bg-gray-300 bg-gray-300 text-center">
                    <TableRow>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Ordinario</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Extraordinario</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody >
                    <TableRow >
                        <TableCell className="font-medium border-solid border-1 border-black">
                            <p className="text-wrap">
                                Alumnos con 80 % o más de asistencias en clases impartidas (estatuto escolar art. 70).
                            </p>
                        </TableCell>
                        <TableCell className="font-medium border-solid border-1 border-black">
                            <p className="text-wrap">
                                Alumnos con 60 % o más de asistencias en clases impartidas (estatuto escolar art. 71).
                            </p>
                        </TableCell>
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

            <h1 className="text-center font-bold text-2xl pt-12">Plan de clases</h1>
            <p className="text-left w-[50%]">Competencia del curso: Experimentar con las técnicas y los algoritmos de aprendizaje en diferentes contextos de aplicación, por medio de la implementación de casos de uso académicos, con el propósito de conocer el alcance de la técnica y algoritmo, con actitud crítica y analítica.</p>
            <Table className="table-fixed w-[75%] justify-self-center border-solid border-1 border-black m-4">
                <TableHeader className="hover:bg-gray-300 bg-gray-300 text-center">
                    <TableRow>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Unidad de PUA</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Tema</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Semana</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {dataPlan.map((criterio) => {
                        return (
                            <TableRow key={criterio.id}>
                                <TableCell className="font-medium">
                                    <p className="ml-4">{criterio.unidad}</p>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <p className="ml-4">{criterio.tema}</p>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Input type="number" defaultValue={criterio.semana}></Input>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

        </div>
        <div className="py-8 justify-self-center grid grid-cols-3 gap-16">
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Restablecer</Button>
                </DialogTrigger>
                <DialogContent className=" w-5xl">
                    <DialogHeader>
                        <DialogTitle className="text-center">Restablecer cambios realizados</DialogTitle>
                        <DialogDescription className="text-black text-left">
                            Continuar con esta acción eliminará todos los cambios realizados en el encuadre, ¿Desea continuar?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button className="px-8 bg-(--destructive) hover:bg-[#FD0022]">Cancelar</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Confirmar</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger asChild>
                    <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Guardar borrador</Button>
                </DialogTrigger>
                <DialogContent className=" w-5xl">
                    <DialogHeader>
                        <DialogTitle className="text-center">Borrador guardado</DialogTitle>
                        <DialogDescription className="text-black text-left">
                            El progreso y cambios se han guardado exitosamente como borrador.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Aceptar</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger asChild>
                    <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Confirmar y publicar</Button>
                </DialogTrigger>
                <DialogContent className=" w-5xl">
                    <DialogHeader>
                        <DialogTitle className="text-center">Publicar cambios de encuadre</DialogTitle>
                        <DialogDescription className="text-black text-left">
                            Los cambios realizados se guardaran en sistema y serán publicados para revisión del jefe de grupo.
                            Esta acción no puede deshacerse, ¿Desea continuar?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button className="px-8 bg-(--destructive) hover:bg-[#FD0022]">Cancelar</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Confirmar</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

    </>)
}

export default EncuadreMateria;