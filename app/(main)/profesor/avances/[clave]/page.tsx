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

function AvanceMateria({
    params,
}: {
    params: { clave: string };
}) {
    return (<>
        <div className="items-center justify-items-center gap-16 pt-8 font-[family-name:var(--font-geist-sans)]">
            <h1>Materia con clave: {params.clave} </h1>
            <h1 className="text-center font-bold text-2xl pt-12">Plan de clases</h1>
            <Table className="table-fixed w-[75%] justify-self-center border-solid border-1 border-black m-4">
                <TableHeader className="hover:bg-gray-300 bg-gray-300 text-center">
                    <TableRow>
                        <TableHead className="border-solid border-1 border-black text-center text-lg w-[20%]">Unidad de PUA</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Tema</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg w-[15%]">Semana</TableHead>
                        <TableHead className="border-solid border-1 border-black text-center text-lg">Unidad vista</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {dataPlan.map((registro) => {
                        return (
                            <TableRow key={registro.id}>
                                <TableCell className="font-medium">
                                    <p className="ml-4">{registro.unidad}</p>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <p className="ml-4">{registro.tema}</p>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <p className="ml-4">{registro.semana}</p>
                                </TableCell>
                                <TableCell className="font-medium grid grid-cols-4 justify-start">
                                    <div>
                                        <div>
                                            <input type="radio" id={registro.id} name={registro.id} value="Si" />
                                            <label htmlFor="Si">Si</label>
                                        </div>
                                        <div>
                                            <input type="radio" id={registro.id} name={registro.id} value="No" />
                                            <label htmlFor="No">No</label>
                                        </div>
                                    </div>
                                    <div className="justify-end col-span-3">
                                        <Input type="text" placeholder="Justificación" ></Input>
                                    </div>

                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

        </div>
        <div className="py-8 justify-self-center">
            <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Registrar Avance</Button>
        </div>

    </>)
}


export default AvanceMateria;