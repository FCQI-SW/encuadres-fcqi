"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChevronLeft, Loader2 } from "lucide-react";
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
  const [puaCompleto, setPuaCompleto] = useState(false);
  const [programaId, setProgramaId] = useState<string>("");

  // Estados para los campos de la sección I
  const [unidadAcademica, setUnidadAcademica] = useState("");
  const [programaEducativo, setProgramaEducativo] = useState("");
  const [planEstudios, setPlanEstudios] = useState("");
  const [hc, setHc] = useState<string>("0");
  const [hl, setHl] = useState<string>("0");
  const [ht, setHt] = useState<string>("0");
  const [hpc, setHpc] = useState<string>("0");
  const [hcl, setHcl] = useState<string>("0");
  const [he, setHe] = useState<string>("0");
  const [cr, setCr] = useState<string>("0");
  const [etapaFormacion, setEtapaFormacion] = useState("");
  const [caracterUA, setCaracterUA] = useState("");
  const [requisitos, setRequisitos] = useState("");

  // Estados para las secciones II, III, IV, V
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
        setUnidadAcademica(pua.unidad_academica || "");
        setProgramaEducativo(pua.programa_educativo || "");
        setPlanEstudios(pua.plan_estudios || "");
        setHc(String(pua.hc || 0));
        setHl(String(pua.hl || 0));
        setHt(String(pua.ht || 0));
        setHpc(String(pua.hpc || 0));
        setHcl(String(pua.hcl || 0));
        setHe(String(pua.he || 0));
        setCr(String(pua.cr || 0));
        setEtapaFormacion(pua.etapa_formacion || "");
        setCaracterUA(pua.caracter_ua || "");
        setRequisitos(pua.requisitos || "");
        setPropositoUA(pua.proposito || "");
        setCompetenciaUA(pua.competencia || "");
        setEvidencias(pua.evidencias || "");
        setNumUnidades(String(pua.unidades || ""));

        // Obtener el programa_id y verificar si está completo
        const { data: programaData } = await supabase
          .from("programas")
          .select("id, unidades")
          .eq("materia_id", materia.id)
          .single();

        if (programaData) {
          setProgramaId(programaData.id);

          // Verificar si todas las unidades están completas
          const { data: unidades } = await supabase
            .from("unidades")
            .select("numero, nombre, competencia, contenido, duracion")
            .eq("programa_id", programaData.id);

          const numUnidadesEsperadas = programaData.unidades || 0;
          const unidadesCompletas = (unidades || []).filter(
            (u) =>
              u.nombre?.trim() &&
              u.competencia?.trim() &&
              u.contenido?.trim() &&
              u.duracion > 0
          );

          const todasUnidadesCompletas = unidadesCompletas.length === numUnidadesEsperadas;
          setPuaCompleto(todasUnidadesCompletas);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materia?.id]);

  const handleBack = async () => {
    router.push("/capturista/materias");
  };

  const handleContinuar = async () => {
    if (!materia) return;

    // Validaciones
    if (!unidadAcademica.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa la Unidad Académica.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!programaEducativo.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa el Programa Educativo.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!planEstudios.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa el Plan de Estudios.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!etapaFormacion.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor selecciona la Etapa de Formación.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!caracterUA.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor selecciona el Carácter de la Unidad de Aprendizaje.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

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

    if (!requisitos.trim()) {
      const shouldContinue = await confirm({
        title: "Campo vacío",
        message: "No has ingresado los requisitos para cursar la UA. Si no hay requisitos, puedes escribir 'Ninguno'. ¿Deseas continuar de todas formas?",
        confirmText: "Sí, continuar",
        cancelText: "Cancelar",
      });

      if (!shouldContinue) return;
    }

    // Guardar directamente sin modal de confirmación
    const savedProgramaId = await guardarPua({
      materiaId: materia.id,
      unidadAcademica,
      programaEducativo,
      planEstudios,
      hc: Number(hc),
      hl: Number(hl),
      ht: Number(ht),
      hpc: Number(hpc),
      hcl: Number(hcl),
      he: Number(he),
      cr: Number(cr),
      etapaFormacion,
      caracterUA,
      requisitos,
      propositoUA,
      competenciaUA,
      evidencias,
      numUnidades: Number(numUnidades),
    });

    if (savedProgramaId) {
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
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">
                1. Unidad Académica <span className="text-red-500">*</span>
              </Label>
              <textarea
                className={ta}
                value={unidadAcademica}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setUnidadAcademica(e.target.value)
                }
                placeholder="Ej: Facultad de Ingeniería, Mexicali; Facultad de Ciencias Químicas e Ingeniería, Tijuana..."
              />
            </div>

            <div>
              <Label className="mb-2 block">
                2. Programa Educativo <span className="text-red-500">*</span>
              </Label>
              <textarea
                className={ta}
                value={programaEducativo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setProgramaEducativo(e.target.value)
                }
                placeholder="Ej: Ingeniero Aeroespacial, Ingeniero Civil, Ingeniero Eléctrico, Ingeniero en Computación..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">
                  3. Plan de Estudios <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={planEstudios}
                  onChange={(e) => setPlanEstudios(e.target.value)}
                  placeholder="2019-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <Label className="mb-2 block">4. Nombre de la Unidad de Aprendizaje</Label>
                <Input value={materia.nombre} disabled />
              </div>
              <div className="sm:col-span-4">
                <Label className="mb-2 block">5. Clave</Label>
                <Input value={materia.clave} disabled />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">6. Horas y Créditos</Label>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                <div>
                  <Label className="mb-1 block text-xs">HC</Label>
                  <Input
                    type="number"
                    min={0}
                    value={hc}
                    onChange={(e) => setHc(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">HL</Label>
                  <Input
                    type="number"
                    min={0}
                    value={hl}
                    onChange={(e) => setHl(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">HT</Label>
                  <Input
                    type="number"
                    min={0}
                    value={ht}
                    onChange={(e) => setHt(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">HPC</Label>
                  <Input
                    type="number"
                    min={0}
                    value={hpc}
                    onChange={(e) => setHpc(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">HCL</Label>
                  <Input
                    type="number"
                    min={0}
                    value={hcl}
                    onChange={(e) => setHcl(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">HE</Label>
                  <Input
                    type="number"
                    min={0}
                    value={he}
                    onChange={(e) => setHe(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">CR</Label>
                  <Input
                    type="number"
                    min={0}
                    value={cr}
                    onChange={(e) => setCr(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                HC: Horas Clase | HL: Horas Laboratorio | HT: Horas Taller | HPC: Horas Práctica de Campo | HCL: Horas Clínicas | HE: Horas Extra Clase | CR: Créditos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">
                  7. Etapa de Formación a la que Pertenece <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={etapaFormacion}
                  onValueChange={setEtapaFormacion}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione una etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Básica">Básica</SelectItem>
                      <SelectItem value="Disciplinaria">Disciplinaria</SelectItem>
                      <SelectItem value="Terminal">Terminal</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">
                  8. Carácter de la Unidad de Aprendizaje <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={caracterUA}
                  onValueChange={setCaracterUA}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione el carácter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Obligatoria">Obligatoria</SelectItem>
                      <SelectItem value="Optativa">Optativa</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">9. Requisitos para Cursar la Unidad de Aprendizaje</Label>
              <Input
                value={requisitos}
                onChange={(e) => setRequisitos(e.target.value)}
                placeholder="Ej: Ninguno, Cálculo I, etc."
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
          
          {puaCompleto && (
            <Button
              variant="outline"
              onClick={() => router.push(`/capturista/materias/${clave}/pua/unidades`)}
              disabled={loading}
              className="cursor-pointer border-[#00723F] text-[#00723F] hover:bg-[#00723F] hover:text-white"
            >
              Editar unidades
            </Button>
          )}
          
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