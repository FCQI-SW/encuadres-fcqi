import { Button } from "./ui/button";
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
import { Input } from "./ui/input";


export function Invite() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Invitar</Button>
            </DialogTrigger>
            <DialogContent className=" w-5xl">
                <DialogHeader>
                    <DialogTitle className="text-center">Invitar alumno a confirmar encuadre de curso</DialogTitle>
                    <DialogDescription className="text-black text-left">
                        Ingrese la dirección de correo del alumno asignado para acordar los criterios del encuadre del curso.
                        Si ya ha invitado a un alumno previamente, este perderá el acceso al invitar uno nuevo.
                    </DialogDescription>

                </DialogHeader>
                <div className="grid gap-4 py-4 sm:grid-cols-1">
                    <div className="grid grid-cols-1 items-center">
                        <p>Correo Electrónico:</p>
                        <Input type="email" id="email" placeholder="example@example.com" className="sm:w-[60%] " />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="submit" className="px-8 bg-[#00723F] hover:bg-[#00A23F]">Invitar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}