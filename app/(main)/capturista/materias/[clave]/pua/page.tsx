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
import { ChevronLeft, Loader2 } from "lucide-react";
import { TablaCriterios } from "@/components/criterios";
import { usePuaForm } from "@/hooks/usePuaForm";
import { useConfirm } from "@/components/global-confirm-modal";

type Materia = {
  id: string;
  clave: string;
  nombre: string;
};

export default function PuaMateria() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave as string;
  const confirm = useConfirm();

  const [loadingData, setLoadingData] = useState(true);
  const [materia, setMateria] = useState<Materia | null>(null);

  const [programaEducativo, setProgramaEducativo] = useState("");
  const [planEstudios, setPlanEstudios] = useState("");
  const [competenciaGeneral, setCompetenciaGeneral] = useState("");
  const [propositoUA, setPropositoUA] = useState("");
  const [competenciaUA, setCompetenciaUA] = useState("");
  const [evidencias, setEvidencias] = useState("");
  const [numUnidades, setNumUnidades] = useState<string>("");

  const { guardarPua, cargarPua, loading, error } = usePuaForm(materia?.id || "");

  useEffect(() => {
    (async () => {
      setLoadingData(true);

      const { data, error } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia")
        .eq("clave", clave);

      if (error) {
        console.error("Error al obtener materia:", error);
        setMateria(null);
        setLoadingData(false);
        return;
      }

      if (data && data.length > 0) {
        const m = data[0] as any;
        setMateria({ id: m.id, clave: m.clave, nombre: m.nombre_materia });
      } else {
        setMateria(null);
      }

      setLoadingData(false);
    })();
  }, [clave]);

  // Cargar PUA existente (si hay)
  useEffect(() => {
    if (!materia?.id) return;

    (async () => {
      const pua = await cargarPua();
      if (pua) {
        setProgramaEducativo(pua.programa_educativo || "");
        setPlanEstudios(pua.plan_estudios || "");
        setCompetenciaGeneral(pua.competencia_general || "");
        setPropositoUA(pua.proposito || "");
        setCompetenciaUA(pua.competencia || "");
        setEvidencias(pua.evidencias || "");
        setNumUnidades(String(pua.unidades || ""));
      }
    })();
  }, [materia?.id, cargarPua]);

  const handleBack = async () => {
    // Si hay cambios sin guardar, preguntar
    if (propositoUA || competenciaUA || evidencias || numUnidades || programaEducativo || planEstudios || competenciaGeneral) {
      const shouldLeave = await confirm({
        title: "¿Salir sin guardar?",
        message: "Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?",
        confirmText: "Sí, salir",
        cancelText: "Cancelar",
      });

      if (!shouldLeave) return;
    }

    router.push("/capturista/materias");
  };

  const handleContinuar = async () => {
    if (!materia) return;

    // Validaciones
    if (!propositoUA.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa el propósito de la unidad de aprendizaje.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!competenciaUA.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa la competencia de la unidad de aprendizaje.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!evidencias.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa las evidencias de desempeño.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!numUnidades || Number(numUnidades) < 1) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa un número válido de unidades (mínimo 1).",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    // Confirmar antes de guardar
    const shouldSave = await confirm({
      title: "Guardar PUA",
      message: "¿Deseas guardar la información del PUA y continuar con las unidades?",
      confirmText: "Guardar y continuar",
      cancelText: "Cancelar",
    });

    if (!shouldSave) return;

    // Guardar
    const programaId = await guardarPua({
      materiaId: materia.id,
      programaEducativo,
      planEstudios,
      competenciaGeneral,
      propositoUA,
      competenciaUA,
      evidencias,
      numUnidades: Number(numUnidades),
    });

    if (programaId) {
      // Mostrar mensaje de éxito
      await confirm({
        title: "¡Guardado exitoso!",
        message: "El PUA se ha guardado correctamente.",
        confirmText: "Continuar a unidades",
        cancelText: "",
      });

      // Ir a unidades
      router.push(`/capturista/materias/${clave}/pua/unidades`);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
                onClick={handleBack}
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
            onClick={handleBack}
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

        {error && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

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
            <Label className="mb-2 block">
              Propósito <span className="text-red-500">*</span>
            </Label>
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
            <Label className="mb-2 block">
              Competencia <span className="text-red-500">*</span>
            </Label>
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
            <Label className="mb-2 block">
              Evidencias <span className="text-red-500">*</span>
            </Label>
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



        {/* V. Desarrollo por unidades */}
        <Card>
          <CardHeader>
            <CardTitle>V. Desarrollo por unidades</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label className="mb-2 block">
                Número de unidades <span className="text-red-500">*</span>
              </Label>
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
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            onClick={handleContinuar}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Guardando..." : "Guardar y continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}