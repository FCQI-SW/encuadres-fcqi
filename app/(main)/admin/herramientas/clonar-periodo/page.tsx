"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Loader2,
  Copy,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/global-confirm-modal";

type MateriaOption = {
  id: string;
  clave: string;
  nombre_materia: string;
};

type ResultadoClonado = {
  ok: boolean;
  periodo_origen: string;
  periodo_destino: string;
  clave_materia: string | null;
  programas_copiados: number;
  unidades_copiadas: number;
  temas_copiados: number;
  practicas_taller_copiadas: number;
  practicas_laboratorio_copiadas: number;
  encuadres_copiados: number;
  criterios_evaluacion_copiados: number;
  criterios_acreditacion_copiados: number;
};

export default function ClonarPeriodoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();
  const confirm = useConfirm();

  const [loadingData, setLoadingData] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [periodos, setPeriodos] = useState<string[]>([]);
  const [materias, setMaterias] = useState<MateriaOption[]>([]);

  const [periodoOrigen, setPeriodoOrigen] = useState("");
  const [periodoDestino, setPeriodoDestino] = useState("");
  const [alcance, setAlcance] = useState<"todas" | "una">("todas");
  const [claveMateria, setClaveMateria] = useState("");

  const [resultado, setResultado] = useState<ResultadoClonado | null>(null);

  useEffect(() => {
    const cargarCatalogos = async () => {
      setLoadingData(true);

      const [{ data: encuadresData }, { data: materiasData }] =
        await Promise.all([
          supabase.from("encuadres").select("periodo").not("periodo", "is", null),
          supabase
            .from("materias")
            .select("id, clave, nombre_materia")
            .eq("estado", "Activa")
            .order("clave", { ascending: true }),
        ]);

      const periodosUnicos = Array.from(
        new Set((encuadresData || []).map((e: any) => e.periodo).filter(Boolean))
      ).sort();

      setPeriodos(periodosUnicos);
      setMaterias((materiasData || []) as MateriaOption[]);
      setLoadingData(false);
    };

    cargarCatalogos();
  }, []);

  const handleClonar = async () => {
    if (status === "loading") {
      toast.error("Espera un momento mientras se carga tu sesión.");
      return;
    }

    if (status === "unauthenticated" || !session?.user?.id) {
      toast.error("No se pudo validar tu sesión.");
      return;
    }

    if (!periodoOrigen.trim()) {
      toast.error("Selecciona el periodo origen.");
      return;
    }

    if (!periodoDestino.trim()) {
      toast.error("Ingresa el periodo destino.");
      return;
    }

    if (periodoOrigen === periodoDestino) {
      toast.error("El periodo origen y destino no pueden ser iguales.");
      return;
    }

    if (alcance === "una" && !claveMateria) {
      toast.error("Selecciona una materia.");
      return;
    }

    const ok = await confirm({
      title: "Crear copia de periodo",
      message:
        alcance === "todas"
          ? `Se clonará toda la estructura de ${periodoOrigen} hacia ${periodoDestino}.`
          : `Se clonará la materia ${claveMateria} de ${periodoOrigen} hacia ${periodoDestino}.`,
      confirmText: "Clonar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    setLoadingSubmit(true);
    setResultado(null);

    const { data, error } = await supabase.rpc("clonar_estructura_periodo", {
      p_periodo_origen: periodoOrigen,
      p_periodo_destino: periodoDestino,
      p_editor_id: session.user.id,
      p_clave_materia: alcance === "una" ? claveMateria : null,
    });

    if (error) {
      console.error(error);
      toast.error(error.message || "Error al clonar el periodo.");
      setLoadingSubmit(false);
      return;
    }

    setResultado(data as ResultadoClonado);
    toast.success("La copia del periodo se realizó correctamente.");
    setLoadingSubmit(false);
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Regresar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-[#00723F]" />
              Clonar estructura de periodo
            </CardTitle>
            <CardDescription>
              Copia PUA y encuadres a un nuevo periodo, sin arrastrar alumnos,
              firmas ni avances.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block">
                  Periodo origen <span className="text-red-500">*</span>
                </Label>
                <Select value={periodoOrigen} onValueChange={setPeriodoOrigen}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {periodos.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">
                  Periodo destino <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={periodoDestino}
                  onChange={(e) => setPeriodoDestino(e.target.value)}
                  placeholder="2026-1"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Alcance</Label>
              <Select
                value={alcance}
                onValueChange={(value) => setAlcance(value as "todas" | "una")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="todas">
                      Todas las materias del periodo
                    </SelectItem>
                    <SelectItem value="una">Solo una materia</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {alcance === "una" && (
              <div>
                <Label className="mb-2 block">
                  Materia <span className="text-red-500">*</span>
                </Label>
                <Select value={claveMateria} onValueChange={setClaveMateria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {materias.map((m) => (
                        <SelectItem key={m.id} value={m.clave}>
                          {m.clave} - {m.nombre_materia}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
              <p className="font-medium">Esta copia sí incluye:</p>
              <p>
                PUA, unidades, temas, prácticas, encuadres, criterios y
                asignaciones profesor/grupo.
              </p>
              <p className="font-medium pt-2">Esta copia no arrastra:</p>
              <p>
                alumnos, firmas, check-ins ni datos operativos del periodo
                anterior.
              </p>
              <p className="font-medium pt-2">Además limpia en la copia:</p>
              <p>descripción de producto, bibliografía y normas de conducta.</p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleClonar}
                disabled={loadingSubmit}
                className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
              >
                {loadingSubmit && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {loadingSubmit ? "Clonando..." : "Crear copia"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {resultado?.ok && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                Copia completada
              </CardTitle>
              <CardDescription>
                Se generó la estructura de {resultado.periodo_origen} hacia{" "}
                {resultado.periodo_destino}.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <strong>Programas:</strong> {resultado.programas_copiados}
              </div>
              <div>
                <strong>Unidades:</strong> {resultado.unidades_copiadas}
              </div>
              <div>
                <strong>Temas:</strong> {resultado.temas_copiados}
              </div>
              <div>
                <strong>Prácticas taller:</strong>{" "}
                {resultado.practicas_taller_copiadas}
              </div>
              <div>
                <strong>Prácticas laboratorio:</strong>{" "}
                {resultado.practicas_laboratorio_copiadas}
              </div>
              <div>
                <strong>Encuadres:</strong> {resultado.encuadres_copiados}
              </div>
              <div>
                <strong>Criterios evaluación:</strong>{" "}
                {resultado.criterios_evaluacion_copiados}
              </div>
              <div>
                <strong>Criterios acreditación:</strong>{" "}
                {resultado.criterios_acreditacion_copiados}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}