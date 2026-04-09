"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
};

// ── FIX: incluir ht y hl para saber qué botones mostrar ─────────
type ProgramaInfo = {
  id: string;
  periodo: string;
  plan_estudios: string;
  ht: number;
  hl: number;
};

export default function PuaMateria() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const searchParams = useSearchParams();
  const clave = params?.clave as string;
  const programaIdFromQuery = searchParams.get("programaId") || "";

  const confirm = useConfirm();
  const toast = useToast();

  const [loadingData, setLoadingData] = useState(true);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [puaCompleto, setPuaCompleto] = useState(false);
  const [programaId, setProgramaId] = useState<string>(programaIdFromQuery);
  const [periodo, setPeriodo] = useState("");
  // ── FIX: guardar ht/hl para mostrar botones correctos ────────
  const [programaInfo, setProgramaInfo] = useState<ProgramaInfo | null>(null);

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

  const [propositoUA, setPropositoUA] = useState("");
  const [competenciaUA, setCompetenciaUA] = useState("");
  const [evidencias, setEvidencias] = useState("");
  const [numUnidades, setNumUnidades] = useState<string>("");

  const [metodoEncuadre, setMetodoEncuadre] = useState("");
  const [metodoEstrategiaDocente, setMetodoEstrategiaDocente] = useState("");
  const [metodoEstrategiaAlumno, setMetodoEstrategiaAlumno] = useState("");
  const [referenciaBasicas, setReferenciaBasicas] = useState("");
  const [referenciasComplementarias, setReferenciasComplementarias] = useState("");
  const [perfilDocente, setPerfilDocente] = useState("");

  const [valoresOriginales, setValoresOriginales] = useState<any>(null);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);

  const { guardarPua, cargarPua, loading, error } = usePuaForm(programaId);
  const [prevError, setPrevError] = useState<string | null>(null);

  useEffect(() => {
    if (error && error !== prevError) {
      toast.error(error);
      setPrevError(error);
    }
  }, [error, prevError, toast]);

  // ── 1. Cargar materia y programa ─────────────────────────────
  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoadingData(true);

      const { data, error: matError } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia, categoria, requisito")
        .eq("clave", clave)
        .maybeSingle();

      if (!isMounted) return;

      if (matError || !data) {
        setMateria(null);
        setLoadingData(false);
        return;
      }

      setMateria({ id: data.id, clave: data.clave, nombre: data.nombre_materia });
      setEtapaFormacion(data.categoria || "");
      setCaracterUA(data.requisito === "obligatoria" ? "Obligatoria" : "Optativa");

      if (programaIdFromQuery) {
        // ── FIX: obtener también ht y hl ────────────────────────
        const { data: programaData } = await supabase
          .from("programas")
          .select("id, periodo, plan_estudios, materia_id, ht, hl")
          .eq("id", programaIdFromQuery)
          .maybeSingle();

        if (programaData && programaData.materia_id === data.id) {
          setProgramaId(programaData.id);
          setPeriodo(programaData.periodo || "");
          setProgramaInfo({
            id: programaData.id,
            periodo: programaData.periodo || "",
            plan_estudios: programaData.plan_estudios || "",
            ht: programaData.ht || 0,
            hl: programaData.hl || 0,
          });
          if (programaData.plan_estudios) {
            setPlanEstudios(programaData.plan_estudios);
          }
        } else {
          setProgramaId("");
          setPeriodo("");
          setProgramaInfo(null);
          toast.error("El programa solicitado no corresponde a esta materia o no existe.");
        }
      } else {
        setProgramaId("");
        setPeriodo("");
        setProgramaInfo(null);
      }

      setLoadingData(false);
    })();

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, programaIdFromQuery]);

  // ── 2. Cargar PUA ─────────────────────────────────────────────
  useEffect(() => {
    if (!programaId) return;

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

        // ── FIX: actualizar ht/hl desde el PUA también ──────────
        // El PUA puede tener ht/hl distintos a los del programa si
        // el capturista los cambió manualmente en el formulario.
        // Actualizamos programaInfo para que los botones sean correctos.
        setProgramaInfo((prev) =>
          prev
            ? { ...prev, ht: pua.ht || prev.ht, hl: pua.hl || prev.hl }
            : prev
        );

        setValoresOriginales({
          unidadAcademica: pua.unidad_academica || "",
          programaEducativo: pua.programa_educativo || "",
          planEstudios: pua.plan_estudios || "",
          hc: String(pua.hc || 0),
          hl: String(pua.hl || 0),
          ht: String(pua.ht || 0),
          hpc: String(pua.hpc || 0),
          hcl: String(pua.hcl || 0),
          he: String(pua.he || 0),
          cr: String(pua.cr || 0),
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

        const { data: programaData } = await supabase
          .from("programas")
          .select("id, unidades")
          .eq("id", programaId)
          .maybeSingle();

        if (programaData) {
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
              Number(u.duracion) > 0
          );
          const todasUnidadesCompletas = unidadesCompletas.length === numUnidadesEsperadas;

          let practicasTallerCompletas = false;
          const { data: practicasTaller } = await supabase
            .from("practicas_taller")
            .select("competencia, descripcion, duracion")
            .eq("programa_id", programaData.id);

          if (practicasTaller && practicasTaller.length > 0) {
            const practicasValidas = practicasTaller.filter(
              (p) => p.competencia?.trim() && p.descripcion?.trim() && Number(p.duracion) > 0
            );
            practicasTallerCompletas = practicasValidas.length === practicasTaller.length;
          }

          setPuaCompleto(todasUnidadesCompletas && practicasTallerCompletas);
        }
      } else {
        setValoresOriginales(null);
        setPuaCompleto(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programaId]);

  // ── 3. Detectar cambios ──────────────────────────────────────
  useEffect(() => {
    if (!valoresOriginales) { setHayCambiosSinGuardar(false); return; }
    const valoresActuales = {
      unidadAcademica, programaEducativo, planEstudios,
      hc, hl, ht, hpc, hcl, he, cr,
      requisitos, propositoUA, competenciaUA, evidencias, numUnidades,
      metodoEncuadre, metodoEstrategiaDocente, metodoEstrategiaAlumno,
      referenciaBasicas, referenciasComplementarias, perfilDocente,
    };
    setHayCambiosSinGuardar(
      JSON.stringify(valoresOriginales) !== JSON.stringify(valoresActuales)
    );
  }, [
    valoresOriginales, unidadAcademica, programaEducativo, planEstudios,
    hc, hl, ht, hpc, hcl, he, cr,
    requisitos, propositoUA, competenciaUA, evidencias, numUnidades,
    metodoEncuadre, metodoEstrategiaDocente, metodoEstrategiaAlumno,
    referenciaBasicas, referenciasComplementarias, perfilDocente,
  ]);

  const handleNavegacion = async (ruta: string) => {
    if (hayCambiosSinGuardar) {
      const shouldLeave = await confirm({
        title: "Cambios sin guardar",
        message: "Tienes cambios sin guardar. ¿Deseas salir sin guardar?",
        confirmText: "Sí, salir", cancelText: "Cancelar",
      });
      if (!shouldLeave) return;
    }
    router.push(ruta);
  };

  const handleBack = async () => {
    await handleNavegacion("/capturista/materias");
  };

  const buildPayload = () => ({
    materiaId: materia!.id,
    unidadAcademica, programaEducativo, planEstudios,
    hc: Number(hc), hl: Number(hl), ht: Number(ht),
    hpc: Number(hpc), hcl: Number(hcl), he: Number(he), cr: Number(cr),
    etapaFormacion, caracterUA, requisitos,
    propositoUA, competenciaUA, evidencias,
    numUnidades: Number(numUnidades),
    metodoEncuadre, metodoEstrategiaDocente, metodoEstrategiaAlumno,
    referenciaBasicas, referenciasComplementarias, perfilDocente,
  });

  const actualizarValoresOriginales = () => {
    setValoresOriginales({
      unidadAcademica, programaEducativo, planEstudios,
      hc, hl, ht, hpc, hcl, he, cr,
      requisitos, propositoUA, competenciaUA, evidencias, numUnidades,
      metodoEncuadre, metodoEstrategiaDocente, metodoEstrategiaAlumno,
      referenciaBasicas, referenciasComplementarias, perfilDocente,
    });
  };

  const handleGuardarSoloEnEdicion = async () => {
    if (!materia || !programaId) {
      toast.error("No se encontró un programa válido para guardar.");
      return;
    }
    const savedProgramaId = await guardarPua(buildPayload());
    if (savedProgramaId) {
      actualizarValoresOriginales();
      // ── FIX: actualizar ht/hl en programaInfo desde los campos ──
      setProgramaInfo((prev) =>
        prev ? { ...prev, ht: Number(ht), hl: Number(hl) } : prev
      );
      toast.success("Los cambios se han guardado correctamente.");
    } else {
      toast.error("Error al guardar los cambios. Intenta de nuevo.");
    }
  };

  const handleContinuar = async () => {
    if (!materia || !programaId) {
      toast.error("No se encontró un programa válido para continuar.");
      return;
    }
    if (!unidadAcademica.trim()) { toast.error("Por favor ingresa la Unidad Académica."); return; }
    if (!programaEducativo.trim()) { toast.error("Por favor ingresa el Programa Educativo."); return; }
    if (!planEstudios.trim()) { toast.error("Por favor ingresa el Plan de Estudios."); return; }
    if (!propositoUA.trim()) { toast.error("Por favor ingresa el propósito de la UA."); return; }
    if (!competenciaUA.trim()) { toast.error("Por favor ingresa la competencia de la UA."); return; }
    if (!evidencias.trim()) { toast.error("Por favor ingresa las evidencias de desempeño."); return; }
    if (!numUnidades || Number(numUnidades) < 1) { toast.error("Por favor ingresa un número válido de unidades."); return; }

    const savedProgramaId = await guardarPua(buildPayload());
    if (savedProgramaId) {
      // ── FIX: actualizar ht/hl tras guardar para que los botones
      //   del modo "completo" sean correctos en el mismo render ────
      setProgramaInfo((prev) =>
        prev ? { ...prev, ht: Number(ht), hl: Number(hl) } : prev
      );
      router.push(`/capturista/materias/${clave}/pua/unidades?programaId=${savedProgramaId}`);
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
              <CardDescription>Verifica la clave en la URL o regresa al listado.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button variant="outline" onClick={handleBack} className="cursor-pointer">Regresar</Button>
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

  // ── FIX: leer ht/hl desde programaInfo o desde los campos ────
  // Usar los valores capturados en el form (ht/hl como strings) para
  // saber si hay taller/laboratorio, así los botones son inmediatos.
  const tieneTaller = Number(ht) > 0 || (programaInfo?.ht ?? 0) > 0;
  const tieneLaboratorio = Number(hl) > 0 || (programaInfo?.hl ?? 0) > 0;

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Button variant="outline" onClick={handleBack} className="cursor-pointer">
            <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Plan de Unidad de Aprendizaje (PUA)</h1>
          <p className="text-lg font-semibold text-[#00723F] mt-2">
            {materia.clave} - {materia.nombre}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Completa la información de la unidad de aprendizaje antes de continuar.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Periodo: <span className="font-medium">{periodo || "—"}</span>
          </p>
          {!programaId && (
            <p className="mt-2 text-sm font-medium text-red-600">
              ⚠️ No se encontró un programa válido para este periodo.
            </p>
          )}
        </div>

        {/* I. Datos de identificación */}
        <Card>
          <CardHeader>
            <CardTitle>I. Datos de identificación</CardTitle>
            <CardDescription>Información general del curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">1. Unidad Académica <span className="text-red-500">*</span></Label>
              <textarea className={ta} value={unidadAcademica}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUnidadAcademica(e.target.value)}
                disabled={!programaId}
                placeholder="Ej: Facultad de Ingeniería, Mexicali..." />
            </div>

            <div>
              <Label className="mb-2 block">2. Programa Educativo <span className="text-red-500">*</span></Label>
              <textarea className={ta} value={programaEducativo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProgramaEducativo(e.target.value)}
                disabled={!programaId}
                placeholder="Ej: Ingeniero en Computación..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">3. Plan de Estudios <span className="text-red-500">*</span></Label>
                <Input value={planEstudios} onChange={(e) => setPlanEstudios(e.target.value)}
                  disabled={!programaId} placeholder="2019-2" />
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
                {([
                  ["HC", hc, setHc], ["HL", hl, setHl], ["HT", ht, setHt],
                  ["HPC", hpc, setHpc], ["HCL", hcl, setHcl], ["HE", he, setHe],
                  ["CR", cr, setCr],
                ] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                  <div key={label}>
                    <Label className="mb-1 block text-xs">{label}</Label>
                    <Input type="number" min={0} value={val}
                      onChange={(e) => setter(e.target.value)}
                      disabled={!programaId} placeholder="0" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                HC: Horas Clase | HL: Horas Laboratorio | HT: Horas Taller | HPC: Horas Práctica de Campo | HCL: Horas Clínicas | HE: Horas Extra Clase | CR: Créditos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">7. Etapa de Formación <span className="text-red-500">*</span></Label>
                <Select value={etapaFormacion} onValueChange={setEtapaFormacion} disabled>
                  <SelectTrigger className="w-full bg-gray-50"><SelectValue placeholder="Seleccione una etapa" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Basica">Básica</SelectItem>
                      <SelectItem value="Disciplinaria">Disciplinaria</SelectItem>
                      <SelectItem value="Terminal">Terminal</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Se define al crear la materia.</p>
              </div>
              <div>
                <Label className="mb-2 block">8. Carácter de la UA <span className="text-red-500">*</span></Label>
                <Select value={caracterUA} onValueChange={setCaracterUA} disabled>
                  <SelectTrigger className="w-full bg-gray-50"><SelectValue placeholder="Seleccione el carácter" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Obligatoria">Obligatoria</SelectItem>
                      <SelectItem value="Optativa">Optativa</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Se define al crear la materia.</p>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">9. Requisitos para Cursar la UA</Label>
              <Input value={requisitos} onChange={(e) => setRequisitos(e.target.value)}
                disabled={!programaId} placeholder="Ej: Ninguno, Cálculo I, etc." />
            </div>

            <div>
              <Label className="mb-2 block">Periodo</Label>
              <Input value={periodo} disabled />
            </div>
          </CardContent>
        </Card>

        {/* II. Propósito */}
        <Card>
          <CardHeader><CardTitle>II. Propósito de la unidad de aprendizaje</CardTitle></CardHeader>
          <CardContent>
            <Label className="mb-2 block">Propósito <span className="text-red-500">*</span></Label>
            <textarea className={ta} value={propositoUA}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPropositoUA(e.target.value)}
              disabled={!programaId} placeholder="Ingresar propósito de la UA…" />
          </CardContent>
        </Card>

        {/* III. Competencia */}
        <Card>
          <CardHeader><CardTitle>III. Competencia de la unidad de aprendizaje</CardTitle></CardHeader>
          <CardContent>
            <Label className="mb-2 block">Competencia <span className="text-red-500">*</span></Label>
            <textarea className={ta} value={competenciaUA}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompetenciaUA(e.target.value)}
              disabled={!programaId} placeholder="Ingresar competencia de la UA…" />
          </CardContent>
        </Card>

        {/* IV. Evidencias */}
        <Card>
          <CardHeader><CardTitle>IV. Evidencia(s) de desempeño</CardTitle></CardHeader>
          <CardContent>
            <Label className="mb-2 block">Evidencias <span className="text-red-500">*</span></Label>
            <textarea className={ta} value={evidencias}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEvidencias(e.target.value)}
              disabled={!programaId} placeholder="Ingresar evidencias de desempeño…" />
          </CardContent>
        </Card>

        {/* V. Unidades */}
        <Card>
          <CardHeader><CardTitle>V. Desarrollo por unidades</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label className="mb-2 block">Número de unidades <span className="text-red-500">*</span></Label>
              <Input type="number" inputMode="numeric" min={1} value={numUnidades}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumUnidades(e.target.value)}
                disabled={!programaId} placeholder="Ej. 6" />
            </div>
          </CardContent>
        </Card>

        {/* VII. Método de Trabajo */}
        <Card>
          <CardHeader><CardTitle>VII. Método de Trabajo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block font-semibold">Encuadre</Label>
              <textarea className={ta} value={metodoEncuadre}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMetodoEncuadre(e.target.value)}
                disabled={!programaId} placeholder="Ingresar encuadre del método de trabajo..." />
            </div>
            <div>
              <Label className="mb-2 block font-semibold">Estrategia de enseñanza (docente)</Label>
              <textarea className={ta} value={metodoEstrategiaDocente}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMetodoEstrategiaDocente(e.target.value)}
                disabled={!programaId} placeholder="Ingresar estrategia de enseñanza del docente..." />
            </div>
            <div>
              <Label className="mb-2 block font-semibold">Estrategia de aprendizaje (alumno)</Label>
              <textarea className={ta} value={metodoEstrategiaAlumno}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMetodoEstrategiaAlumno(e.target.value)}
                disabled={!programaId} placeholder="Ingresar estrategia de aprendizaje del alumno..." />
            </div>
          </CardContent>
        </Card>

        {/* VIII. Referencias */}
        <Card>
          <CardHeader>
            <CardTitle>VIII. Referencias</CardTitle>
            <CardDescription>Bibliografía básica y complementaria del curso</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <Label className="mb-2 block font-semibold">Básicas</Label>
              <textarea className={ta} value={referenciaBasicas}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReferenciaBasicas(e.target.value)}
                disabled={!programaId} placeholder="Ingresar referencias bibliográficas básicas..." />
            </div>
            <div>
              <Label className="mb-2 block font-semibold">Complementarias</Label>
              <textarea className={ta} value={referenciasComplementarias}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReferenciasComplementarias(e.target.value)}
                disabled={!programaId} placeholder="Ingresar referencias bibliográficas complementarias..." />
            </div>
          </CardContent>
        </Card>

        {/* IX. Perfil Docente */}
        <Card>
          <CardHeader>
            <CardTitle>IX. Perfil del Docente</CardTitle>
            <CardDescription>Requisitos y características del docente para impartir esta UA</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea className={ta} value={perfilDocente}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPerfilDocente(e.target.value)}
              disabled={!programaId} placeholder="Ingresar perfil del docente..." />
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            {puaCompleto
              ? <span className="text-green-600 font-medium">PUA completo</span>
              : <span className="text-orange-600 font-medium">PUA pendiente</span>}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={handleBack} className="cursor-pointer">Cancelar</Button>

            {puaCompleto ? (
              <>
                {/* Siempre mostrar Ver Unidades */}
                <Button variant="outline" disabled={loading}
                  onClick={() => handleNavegacion(`/capturista/materias/${clave}/pua/unidades?programaId=${programaId}`)}
                  className="cursor-pointer border-[#00723F] text-[#00723F] hover:bg-[#00723F] hover:text-white">
                  Ver Unidades →
                </Button>

                {/* ── FIX: mostrar taller solo si HT > 0 ─────── */}
                {tieneTaller && (
                  <Button variant="outline" disabled={loading}
                    onClick={() => handleNavegacion(`/capturista/materias/${clave}/pua/taller?programaId=${programaId}`)}
                    className="cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                    Ver Prácticas de Taller →
                  </Button>
                )}

                {/* ── FIX: mostrar laboratorio solo si HL > 0 ── */}
                {tieneLaboratorio && (
                  <Button variant="outline" disabled={loading}
                    onClick={() => handleNavegacion(`/capturista/materias/${clave}/pua/laboratorio?programaId=${programaId}`)}
                    className="cursor-pointer border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">
                    Ver Prácticas de Laboratorio →
                  </Button>
                )}

                <Button onClick={handleGuardarSoloEnEdicion} disabled={loading || !programaId}
                  className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </>
            ) : (
              <Button onClick={handleContinuar} disabled={loading || !programaId}
                className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Guardando..." : "Guardar y Continuar →"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}