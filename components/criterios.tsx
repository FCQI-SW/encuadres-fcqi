import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,

} from "@/components/ui/table"


export function TablaCriterios() {
    let total = 0;

    return (<>
        <Table className="table-fixed w-[75%] justify-self-center border-solid border-1 border-black text-center m-4">

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
    </>
    )
}