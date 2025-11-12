"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { TablaCriterios } from "@/components/criterios";

type Materia = {
  id: string;
  clave: string;
  nombre: string;
};

export default function PuaMateria() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave as string;

  const [materia, setMateria] = useState<Materia | null>(null);

  const [programaEducativo, setProgramaEducativo] = useState("");
  const [planEstudios, setPlanEstudios] = useState("");
  const [competenciaGeneral, setCompetenciaGeneral] = useState("");
  const [propositoUA, setPropositoUA] = useState("");
  const [competenciaUA, setCompetenciaUA] = useState("");
  const [evidencias, setEvidencias] = useState("");
  const [numUnidades, setNumUnidades] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia")
        .eq("clave", clave);

      if (error) {
        console.error("Error al obtener materia:", error);
        setMateria(null);
        return;
      }

      if (data && data.length > 0) {
        const m = data[0] as any;
        setMateria({ id: m.id, clave: m.clave, nombre: m.nombre_materia });
      } else {
        setMateria(null);
      }
    })();
  }, [clave]);

  if (!materia) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>No se encontró la materia</CardTitle>
              <CardDescription>
                Verifica la clave en la URL o regresa al listado.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => router.push("/capturista/materias")}
                className="cursor-pointer"
              >
                Regresar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ta =
    "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/capturista/materias")}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Plan de Unidad de Aprendizaje (PUA)</h1>
          <p className="text-sm text-muted-foreground">
            Completa la información de la unidad de aprendizaje antes de continuar.
          </p>
        </div>

        {/* I. Datos de identificación */}
        <Card>
          <CardHeader>
            <CardTitle>I. Datos de identificación</CardTitle>
            <CardDescription>Información general del curso</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Label className="mb-2 block">Clave del curso</Label>
              <Input value={materia.clave} disabled />
            </div>
            <div className="sm:col-span-8">
              <Label className="mb-2 block">Nombre del curso</Label>
              <Input value={materia.nombre} disabled />
            </div>

            <div className="sm:col-span-6">
              <Label className="mb-2 block">Programa educativo</Label>
              <Input
                value={programaEducativo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProgramaEducativo(e.target.value)
                }
                placeholder="Programa educativo"
              />
            </div>
            <div className="sm:col-span-6">
              <Label className="mb-2 block">Plan de estudios</Label>
              <Input
                value={planEstudios}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPlanEstudios(e.target.value)
                }
                placeholder="Plan de estudios"
              />
            </div>

            <div className="sm:col-span-12">
              <Label className="mb-2 block">Competencia general del curso</Label>
              <textarea
                className={ta}
                value={competenciaGeneral}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCompetenciaGeneral(e.target.value)
                }
                placeholder="Describe la competencia general del curso"
              />
            </div>
          </CardContent>
        </Card>

        {/* II. Propósito de la UA */}
        <Card>
          <CardHeader>
            <CardTitle>II. Propósito de la unidad de aprendizaje</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="mb-2 block">Propósito</Label>
            <textarea
              className={ta}
              value={propositoUA}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setPropositoUA(e.target.value)
              }
              placeholder="Ingresar propósito de la UA…"
            />
          </CardContent>
        </Card>

        {/* III. Competencia de la UA */}
        <Card>
          <CardHeader>
            <CardTitle>III. Competencia de la unidad de aprendizaje</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="mb-2 block">Competencia</Label>
            <textarea
              className={ta}
              value={competenciaUA}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCompetenciaUA(e.target.value)
              }
              placeholder="Ingresar competencia de la UA…"
            />
          </CardContent>
        </Card>

        {/* IV. Evidencias de desempeño */}
        <Card>
          <CardHeader>
            <CardTitle>IV. Evidencia(s) de desempeño</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="mb-2 block">Evidencias</Label>
            <textarea
              className={ta}
              value={evidencias}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEvidencias(e.target.value)
              }
              placeholder="Ingresar evidencias de desempeño…"
            />
          </CardContent>
        </Card>

        {/* Criterios sugeridos */}
        <Card>
          <CardHeader>
            <CardTitle>Criterios de evaluación sugeridos</CardTitle>
            <CardDescription>Ajusta los porcentajes/criterios según tu curso</CardDescription>
          </CardHeader>
          <CardContent>
            <TablaCriterios />
          </CardContent>
        </Card>

        {/* V. Desarrollo por unidades */}
        <Card>
          <CardHeader>
            <CardTitle>V. Desarrollo por unidades</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label className="mb-2 block">Número de unidades</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={numUnidades}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNumUnidades(e.target.value)
                }
                placeholder="Ej. 6"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            onClick={() => router.push(`/capturista/materias/${clave}/pua/unidades`)}
            disabled={!numUnidades}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}