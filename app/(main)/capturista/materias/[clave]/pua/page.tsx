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
import { useToast } from "@/components/ui/toast";

type Materia = {
  id: string;
  clave: string;
  nombre: string;
  plan_estudios: string;
};

export default function PuaMateria() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave as string;
  const confirm = useConfirm();
  const toast = useToast();

  const [loadingData, setLoadingData] = useState(true);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [puaCompleto, setPuaCompleto] = useState(false);
  const [programaId, setProgramaId] = useState<string>("");

  const [horasTaller, setHorasTaller] = useState(0);
  const [horasLaboratorio, setHorasLaboratorio] = useState(0);

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

  // Estados para las secciones VII, VIII, IX
  const [metodoEncuadre, setMetodoEncuadre] = useState("");
  const [metodoEstrategiaDocente, setMetodoEstrategiaDocente] = useState("");
  const [metodoEstrategiaAlumno, setMetodoEstrategiaAlumno] = useState("");
  const [referenciaBasicas, setReferenciaBasicas] = useState("");
  const [referenciasComplementarias, setReferenciasComplementarias] =
    useState("");
  const [perfilDocente, setPerfilDocente] = useState("");

  // Estados para detectar cambios sin guardar
  const [valoresOriginales, setValoresOriginales] = useState<any>(null);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);

  const { guardarPua, cargarPua, loading, error } = usePuaForm(
    materia?.id || ""
  );
  const [prevError, setPrevError] = useState<string | null>(null);

  useEffect(() => {
    if (error && error !== prevError) {
      toast.error(error);
      setPrevError(error);
    }
  }, [error, prevError, toast]);

  useEffect(() => {
    (async () => {
      setLoadingData(true);

      const { data, error } = await supabase
        .from("materias")
        .select(
          "id, clave, nombre_materia, categoria, requisito, plan_estudios"
        )
        .eq("clave", clave);

      if (error) {
        console.error("Error al obtener materia:", error);
        setMateria(null);
        setLoadingData(false);
        return;
      }

      if (data && data.length > 0) {
        const m = data[0] as any;

        setMateria({
          id: m.id,
          clave: m.clave,
          nombre: m.nombre_materia,
          plan_estudios: m.plan_estudios || "",
        });

        // Pre-cargar datos desde la materia
        setEtapaFormacion(m.categoria || "");
        setCaracterUA(
          m.requisito === "obligatoria" ? "Obligatoria" : "Optativa"
        );
        setPlanEstudios(m.plan_estudios || "");
      } else {
        setMateria(null);
      }

      setLoadingData(false);
    })();
  }, [clave]);

  // Cargar PUA existente
  useEffect(() => {
    if (!materia?.id) return;

    (async () => {
      const pua = await cargarPua();

      if (pua) {
        setUnidadAcademica(pua.unidad_academica || "");
        setProgramaEducativo(pua.programa_educativo || "");

        // NO sobrescribir planEstudios porque viene desde la materia
        setHc(String(pua.hc || 0));
        setHl(String(pua.hl || 0));
        setHt(String(pua.ht || 0));
        setHpc(String(pua.hpc || 0));
        setHcl(String(pua.hcl || 0));
        setHe(String(pua.he || 0));
        setCr(String(pua.cr || 0));

        setRequisitos(pua.requisitos || "");
        setPropositoUA(pua.proposito || "");
        setCompetenciaUA(pua.competencia || "");
        setEvidencias(pua.evidencias || "");
        setNumUnidades(String(pua.unidades || ""));

        setMetodoEncuadre(pua.metodo_encuadre || "");
        setMetodoEstrategiaDocente(pua.metodo_estrategia_docente || "");
        setMetodoEstrategiaAlumno(pua.metodo_estrategia_alumno || "");
        setReferenciaBasicas(pua.referencias_basicas || "");
        setReferenciasComplementarias(pua.referencias_complementarias || "");
        setPerfilDocente(pua.perfil_docente || "");

        const { data: programaData } = await supabase
          .from("programas")
          .select("id, unidades, ht, hl")
          .eq("materia_id", materia.id)
          .single();

        if (programaData) {
          setProgramaId(programaData.id);
          setHorasTaller(Number(programaData.ht || 0));
          setHorasLaboratorio(Number(programaData.hl || 0));

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

          const todasUnidadesCompletas =
            unidadesCompletas.length === numUnidadesEsperadas;

          // Verificar prácticas de taller
          let practicasTallerCompletas = true;

          if (Number(programaData.ht || 0) > 0) {
            const { data: practicasTaller } = await supabase
              .from("practicas_taller")
              .select("competencia, descripcion, duracion")
              .eq("programa_id", programaData.id);

            if (practicasTaller && practicasTaller.length > 0) {
              const practicasValidas = practicasTaller.filter(
                (p) =>
                  p.competencia?.trim() &&
                  p.descripcion?.trim() &&
                  p.duracion > 0
              );
              practicasTallerCompletas =
                practicasValidas.length === practicasTaller.length;
            } else {
              practicasTallerCompletas = false;
            }
          }

          // Verificar prácticas de laboratorio
          let practicasLaboratorioCompletas = true;

          if (Number(programaData.hl || 0) > 0) {
            const { data: practicasLaboratorio } = await supabase
              .from("practicas_laboratorio")
              .select("competencia, descripcion, duracion")
              .eq("programa_id", programaData.id);

            if (practicasLaboratorio && practicasLaboratorio.length > 0) {
              const practicasValidas = practicasLaboratorio.filter(
                (p) =>
                  p.competencia?.trim() &&
                  p.descripcion?.trim() &&
                  p.duracion > 0
              );
              practicasLaboratorioCompletas =
                practicasValidas.length === practicasLaboratorio.length;
            } else {
              practicasLaboratorioCompletas = false;
            }
          }

          setPuaCompleto(
            todasUnidadesCompletas &&
              practicasTallerCompletas &&
              practicasLaboratorioCompletas
          );
        }

        setValoresOriginales({
          unidadAcademica: pua.unidad_academica || "",
          programaEducativo: pua.programa_educativo || "",
          planEstudios: materia.plan_estudios || "",
          hc: String(pua.hc || 0),
          hl: String(pua.hl || 0),
          ht: String(pua.ht || 0),
          hpc: String(pua.hpc || 0),
          hcl: String(pua.hcl || 0),
          he: String(pua.he || 0),
          cr: String(pua.cr || 0),
          etapaFormacion,
          caracterUA,
          requisitos: pua.requisitos || "",
          propositoUA: pua.proposito || "",
          competenciaUA: pua.competencia || "",
          evidencias: pua.evidencias || "",
          numUnidades: String(pua.unidades || ""),
          metodoEncuadre: pua.metodo_encuadre || "",
          metodoEstrategiaDocente: pua.metodo_estrategia_docente || "",
          metodoEstrategiaAlumno: pua.metodo_estrategia_alumno || "",
          referenciaBasicas: pua.referencias_basicas || "",
          referenciasComplementarias: pua.referencias_complementarias || "",
          perfilDocente: pua.perfil_docente || "",
        });
      } else {
        // Si todavía no existe programa, valores base
        setValoresOriginales({
          unidadAcademica: "",
          programaEducativo: "",
          planEstudios: materia.plan_estudios || "",
          hc: "0",
          hl: "0",
          ht: "0",
          hpc: "0",
          hcl: "0",
          he: "0",
          cr: "0",
          etapaFormacion,
          caracterUA,
          requisitos: "",
          propositoUA: "",
          competenciaUA: "",
          evidencias: "",
          numUnidades: "",
          metodoEncuadre: "",
          metodoEstrategiaDocente: "",
          metodoEstrategiaAlumno: "",
          referenciaBasicas: "",
          referenciasComplementarias: "",
          perfilDocente: "",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materia?.id]);

  useEffect(() => {
    if (!valoresOriginales) {
      setHayCambiosSinGuardar(false);
      return;
    }

    const valoresActuales = {
      unidadAcademica,
      programaEducativo,
      planEstudios,
      hc,
      hl,
      ht,
      hpc,
      hcl,
      he,
      cr,
      etapaFormacion,
      caracterUA,
      requisitos,
      propositoUA,
      competenciaUA,
      evidencias,
      numUnidades,
      metodoEncuadre,
      metodoEstrategiaDocente,
      metodoEstrategiaAlumno,
      referenciaBasicas,
      referenciasComplementarias,
      perfilDocente,
    };

    const hayCambios =
      JSON.stringify(valoresOriginales) !== JSON.stringify(valoresActuales);
    setHayCambiosSinGuardar(hayCambios);
  }, [
    valoresOriginales,
    unidadAcademica,
    programaEducativo,
    planEstudios,
    hc,
    hl,
    ht,
    hpc,
    hcl,
    he,
    cr,
    etapaFormacion,
    caracterUA,
    requisitos,
    propositoUA,
    competenciaUA,
    evidencias,
    numUnidades,
    metodoEncuadre,
    metodoEstrategiaDocente,
    metodoEstrategiaAlumno,
    referenciaBasicas,
    referenciasComplementarias,
    perfilDocente,
  ]);

  const handleNavegacion = async (ruta: string) => {
    if (hayCambiosSinGuardar) {
      const shouldLeave = await confirm({
        title: "Cambios sin guardar",
        message: "Tienes cambios sin guardar. ¿Deseas salir sin guardar?",
        confirmText: "Sí, salir",
        cancelText: "Cancelar",
      });

      if (!shouldLeave) return;
    }

    router.push(ruta);
  };

  const handleBack = async () => {
    await handleNavegacion("/capturista/materias");
  };

  const handleGuardarSoloEnEdicion = async () => {
    if (!materia) return;

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
      metodoEncuadre,
      metodoEstrategiaDocente,
      metodoEstrategiaAlumno,
      referenciaBasicas,
      referenciasComplementarias,
      perfilDocente,
    });

    if (savedProgramaId) {
      setProgramaId(savedProgramaId);
      setHorasTaller(Number(ht || 0));
      setHorasLaboratorio(Number(hl || 0));

      setValoresOriginales({
        unidadAcademica,
        programaEducativo,
        planEstudios,
        hc,
        hl,
        ht,
        hpc,
        hcl,
        he,
        cr,
        etapaFormacion,
        caracterUA,
        requisitos,
        propositoUA,
        competenciaUA,
        evidencias,
        numUnidades,
        metodoEncuadre,
        metodoEstrategiaDocente,
        metodoEstrategiaAlumno,
        referenciaBasicas,
        referenciasComplementarias,
        perfilDocente,
      });

      toast.success("Los cambios se han guardado correctamente.");
    } else {
      toast.error("Error al guardar los cambios. Intenta de nuevo.");
    }
  };

  const handleContinuar = async () => {
    if (!materia) return;

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
        title: "Plan de estudios no configurado",
        message:
          "Esta materia no tiene un plan de estudios asignado por el administrador. Solicita al administrador que lo configure antes de continuar.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!propositoUA.trim()) {
      await confirm({
        title: "Campo requerido",
        message:
          "Por favor ingresa el propósito de la unidad de aprendizaje.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!competenciaUA.trim()) {
      await confirm({
        title: "Campo requerido",
        message:
          "Por favor ingresa la competencia de la unidad de aprendizaje.",
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
        message:
          "Por favor ingresa un número válido de unidades (mínimo 1).",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!requisitos.trim()) {
      const shouldContinue = await confirm({
        title: "Campo vacío",
        message:
          "No has ingresado los requisitos para cursar la UA. Si no hay requisitos, puedes escribir 'Ninguno'. ¿Deseas continuar de todas formas?",
        confirmText: "Sí, continuar",
        cancelText: "Cancelar",
      });

      if (!shouldContinue) return;
    }

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
      metodoEncuadre,
      metodoEstrategiaDocente,
      metodoEstrategiaAlumno,
      referenciaBasicas,
      referenciasComplementarias,
      perfilDocente,
    });

    if (savedProgramaId) {
      setProgramaId(savedProgramaId);
      setHorasTaller(Number(ht || 0));
      setHorasLaboratorio(Number(hl || 0));
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
          <h1 className="text-2xl font-bold">
            Plan de Unidad de Aprendizaje (PUA)
          </h1>
          <p className="text-lg font-semibold text-[#00723F] mt-2">
            {materia.clave} - {materia.nombre}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Completa la información de la unidad de aprendizaje antes de
            continuar.
          </p>
        </div>

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
                  readOnly
                  className="bg-white text-black opacity-100 cursor-default"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <Label className="mb-2 block">
                  4. Nombre de la Unidad de Aprendizaje
                </Label>
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
                HC: Horas Clase | HL: Horas Laboratorio | HT: Horas Taller | HPC:
                Horas Práctica de Campo | HCL: Horas Clínicas | HE: Horas Extra
                Clase | CR: Créditos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">
                  7. Etapa de Formación a la que Pertenece{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={etapaFormacion}
                  onValueChange={setEtapaFormacion}
                  disabled={true}
                >
                  <SelectTrigger className="w-full bg-gray-50">
                    <SelectValue placeholder="Seleccione una etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Basica">Básica</SelectItem>
                      <SelectItem value="Disciplinaria">Disciplinaria</SelectItem>
                      <SelectItem value="Terminal">Terminal</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Este campo se define al crear la materia y no puede
                  modificarse aquí.
                </p>
              </div>

              <div>
                <Label className="mb-2 block">
                  8. Carácter de la Unidad de Aprendizaje{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={caracterUA}
                  onValueChange={setCaracterUA}
                  disabled={true}
                >
                  <SelectTrigger className="w-full bg-gray-50">
                    <SelectValue placeholder="Seleccione el carácter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Obligatoria">Obligatoria</SelectItem>
                      <SelectItem value="Optativa">Optativa</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Este campo se define al crear la materia y no puede
                  modificarse aquí.
                </p>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                9. Requisitos para Cursar la Unidad de Aprendizaje
              </Label>
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

        {/* VII. Método de Trabajo */}
        <Card>
          <CardHeader>
            <CardTitle>VII. Método de Trabajo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block font-semibold">Encuadre</Label>
              <textarea
                className={ta}
                value={metodoEncuadre}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setMetodoEncuadre(e.target.value)
                }
                placeholder="Ingresar encuadre del método de trabajo..."
              />
            </div>

            <div>
              <Label className="mb-2 block font-semibold">
                Estrategia de enseñanza (docente)
              </Label>
              <textarea
                className={ta}
                value={metodoEstrategiaDocente}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setMetodoEstrategiaDocente(e.target.value)
                }
                placeholder="Ingresar estrategia de enseñanza del docente..."
              />
            </div>

            <div>
              <Label className="mb-2 block font-semibold">
                Estrategia de aprendizaje (alumno)
              </Label>
              <textarea
                className={ta}
                value={metodoEstrategiaAlumno}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setMetodoEstrategiaAlumno(e.target.value)
                }
                placeholder="Ingresar estrategia de aprendizaje del alumno..."
              />
            </div>
          </CardContent>
        </Card>

        {/* VIII. Referencias */}
        <Card>
          <CardHeader>
            <CardTitle>VIII. Referencias</CardTitle>
            <CardDescription>
              Bibliografía básica y complementaria del curso
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <Label className="mb-2 block font-semibold">Básicas</Label>
              <textarea
                className={ta}
                value={referenciaBasicas}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReferenciaBasicas(e.target.value)
                }
                placeholder="Ingresar referencias bibliográficas básicas..."
              />
            </div>
            <div>
              <Label className="mb-2 block font-semibold">
                Complementarias
              </Label>
              <textarea
                className={ta}
                value={referenciasComplementarias}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReferenciasComplementarias(e.target.value)
                }
                placeholder="Ingresar referencias bibliográficas complementarias..."
              />
            </div>
          </CardContent>
        </Card>

        {/* IX. Perfil del Docente */}
        <Card>
          <CardHeader>
            <CardTitle>IX. Perfil del Docente</CardTitle>
            <CardDescription>
              Requisitos y características del docente para impartir esta UA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className={ta}
              value={perfilDocente}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setPerfilDocente(e.target.value)
              }
              placeholder="Ingresar perfil del docente..."
            />
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancelar
          </Button>

          {puaCompleto ? (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  handleNavegacion(`/capturista/materias/${clave}/pua/unidades`)
                }
                disabled={loading}
                className="cursor-pointer border-[#00723F] text-[#00723F] hover:bg-[#00723F] hover:text-white"
              >
                Ver Unidades →
              </Button>

              {horasTaller > 0 && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleNavegacion(`/capturista/materias/${clave}/pua/taller`)
                  }
                  disabled={loading}
                  className="cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  Ver Prácticas de Taller →
                </Button>
              )}

              {horasLaboratorio > 0 && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleNavegacion(
                      `/capturista/materias/${clave}/pua/laboratorio`
                    )
                  }
                  disabled={loading}
                  className="cursor-pointer border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                >
                  Ver Prácticas de Laboratorio →
                </Button>
              )}

              <Button
                className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
                onClick={handleGuardarSoloEnEdicion}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </>
          ) : (
            <Button
              className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
              onClick={handleContinuar}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Guardando..." : "Guardar y Continuar →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}