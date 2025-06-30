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

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from "react";


const inviteSchema = z.object({
    email: z
        .string()
        .email("Ingrese una dirección de correo electrónica")
        .refine(
            (email) => email.endsWith("@uabc.edu.mx"),
            {
                message: "Sólo correos institucionales permitidos @uabc.edu.mx",
            }
        ),
});

export function Invite() {
    const [isOpen, setIsOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(inviteSchema),
    });

    const onSubmit = (data) => {
        // Handle form submission
        console.log("Valid email:", data.email);
        setIsOpen(false);

    };
    return (

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4 sm:grid-cols-1">
                        <div className="grid grid-cols-1 items-center">
                            <input
                                type="email"
                                {...register("email")}
                                placeholder="Correo Electrónico"
                            />
                            {errors.email && (
                                <p className="text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="px-8 bg-[#00723F] hover:bg-[#00A23F]">
                            Invitar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}