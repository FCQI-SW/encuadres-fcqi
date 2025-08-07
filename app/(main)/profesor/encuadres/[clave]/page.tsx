'use client'

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
import { useSession } from "next-auth/react";
import { Materia } from "@/components/materia";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useMemo } from 'react';


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

type Materia = {
    id: string;      // PK en tu tabla 'materias' (uuid o int)
    nombre: string;
    clave: string;   // 'clave' en DB
    estado: string;
    grupo: string;
};

function EncuadreMateria({
    params,
}: {
    params: { clave: string };
}) {
    //Una vez conectada a la BD, utilizar la clave para conseguir el registro con la información completa de la materia
    //En los requerimientos indica que el capturista ingrese también los criterios de evaluación sugeridos por la PUA, estos se deberán cargar a la tabla y podrán ser editados por el profesor.
    const { data: session } = useSession();
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [criteriosE, setCriteriosE] = useState([]);


    //const criteriosEvaluacion = data?.programa?.encuadres?.[0]?.criterios_evaluacion || [];

    const total = useMemo(() => {
        return criteriosE.reduce((sum, criterio) => {
            const valor = parseFloat(criterio.valor) || 0;
            return sum + valor;
        }, 0);
    }, [criteriosE]);

    const fetchCriteriosData = async (claveValue) => {
        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase
                .from("materias")
                .select(`
          id,
          clave,
          programas:programas!materia_id (
            id,
            encuadres:encuadres!programa_id (
              id,
              criterios_evaluacion:criterios_evaluacion!encuadre_id (*)
            )
          )
        `)
                .eq("clave", claveValue)
                .single();

            if (error) {
                console.log('owo');

                setError(error.message);
                setCriteriosE([]);
                return;
            }

            // Extract criterios_evaluacion safely
            const criteriosData = data?.programa?.encuadres?.[0]?.criterios_evaluacion || [];
            setCriteriosE(criteriosData);

        } catch (err) {
            setError(err.message);
            setCriteriosE([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.clave) {
            fetchCriteriosData(params.clave);
        }
    }, [params.clave]);

    // Handle field updates
    const updateCriterio = (id, field, value) => {
        setCriteriosE(prevCriterios =>
            prevCriterios.map(criterio =>
                criterio.id === id
                    ? { ...criterio, [field]: value }
                    : criterio
            )
        );
    };

    const addNewCriterioE = () => {
        const newId = Math.max(...criteriosE.map(c => c.id), 0) + 1;
        const newCriterioE = {
            id: newId,
            criterio: '',
            valor: 0,
            descripcion: ''
        };
        setCriteriosE(prev => [...prev, newCriterioE]);
    };

    // Remove criterio
    const removeCriterioE = (id) => {
        setCriteriosE(prev => prev.filter(criterio => criterio.id !== id));
    };

    const saveChanges = async () => {
        try {
            console.log('Saving criterios:', criteriosE);
            // Implement your save logic here
            // await supabase.from('criterios_evaluacion').upsert(criterios);
            alert('Changes saved successfully!');
        } catch (err) {
            console.error('Error saving:', err);
            alert('Error saving changes');
        }
    };

    // Render loading state
    if (loading) {
        return <div className="p-4">Cargando criterios...</div>;
    }


    if (error) {
        return (
            <div className="p-4 text-red-600">
                Error: {error}
                <Button onClick={() => fetchCriteriosData(params.clave)} className="ml-4">
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-center font-bold text-3xl">Evaluación del curso</h1>
                <h1 className="text-center font-bold text-xl">Clave de Materia: {params.clave}</h1>


                <div className="mb-4">
                    <h2 className="text-xl font-bold mb-4">Criterios de Evaluación</h2>
                    <p>Agregar valor a cada actividad</p>
                </div>

                <div className="flex gap-4 mb-4">
                    <Button onClick={addNewCriterioE}>
                        Agregar Criterio
                    </Button>
                    <Button onClick={saveChanges} className="bg-green-500 hover:bg-green-600">
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            {criteriosE.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No hay criterios de evaluación.
                    <Button onClick={addNewCriterioE} className="ml-2">
                        Agregar el primero
                    </Button>
                </div>
            ) : (
                <Table className="border-2">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3 text-left border font-medium">Criterio</th>
                            <th className="p-3 text-left border font-medium">Valor (%)</th>
                            <th className="p-3 text-left border font-medium">Descripción</th>
                            <th className="p-3 text-left border font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <TableBody>
                        {criteriosE.map((criterio) => (
                            <TableRow key={criterio.id}>
                                <TableCell className="font-medium">
                                    <Input
                                        value={criterio.criterio}
                                        onChange={(e) => updateCriterio(criterio.id, 'criterio', e.target.value)}
                                        placeholder="Nombre del criterio"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Input
                                        type="number"
                                        value={criterio.valor}
                                        onChange={(e) => updateCriterio(criterio.id, 'valor', e.target.value)}
                                        placeholder="0"
                                        className="w-20"
                                        min={1}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Input
                                        value={criterio.descripcion}
                                        onChange={(e) => updateCriterio(criterio.id, 'descripcion', e.target.value)}
                                        placeholder="Descripción del criterio"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Button
                                        onClick={() => removeCriterioE(criterio.id)}
                                        className="bg-red-500 hover:bg-red-600 text-xs px-2 py-1"
                                    >
                                        Eliminar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Total row */}
                        <TableRow className="bg-gray-50">
                            <TableCell className="font-bold border-2 border-black">
                                Total
                            </TableCell>
                            <TableCell className={`font-bold border-2 border-black ${total === 100 ? 'text-green-600' : total > 100 ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                {total.toFixed(1)}%
                            </TableCell>
                            <TableCell className="border-2 border-black">
                                {total === 100 ? '✓ Completo' :
                                    total > 100 ? 'Excede 100%' :
                                        'Incompleto'}
                            </TableCell>
                            <TableCell className="border-2 border-black"></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            )}

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
        </div>

    );

    //let total = 0;
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
                    {criteriosEvaluacion.map((criterio) => {
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