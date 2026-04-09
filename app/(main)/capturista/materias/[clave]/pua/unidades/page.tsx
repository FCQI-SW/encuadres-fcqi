"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Unidad } from "@/components/unidad";
import { useUnidadesForm } from "@/hooks/useUnidadesForm";
import { useConfirm } from "@/components/global-confirm-modal";

type Programa = {
  id: string;
  materia_id: string;
  unidades: number;
  ht: number;
  hl: number;
};

type TemaUnidad = {
  numero: string;
  nombre: string;
};

type UnidadData = {
  numero: number;
  nombre: string;
  competencia: string;
  contenido: string;
  duracion: number;
  semana_inicio?: number | null;
  semana_fin?: number | null;
  temas?: TemaUnidad[];
};

function crearUnidadVacia(numero: number): UnidadData {
  return { numero, nombre: "", competencia: "", contenido: "", duracion: 0, semana_inicio: null, semana_fin: null, temas: [] };
}

function normalizarUnidad(unidad?: Partial<UnidadData> | null): UnidadData {
  return {
    numero: Number(unidad?.numero ?? 0),
    nombre: unidad?.nombre ?? "",
    competencia: unidad?.competencia ?? "",
    contenido: unidad?.contenido ?? "",
    duracion: Number(unidad?.duracion ?? 0),
    semana_inicio: unidad?.semana_inicio === undefined ? null : unidad.semana_inicio,
    semana_fin: unidad?.semana_fin === undefined ? null : unidad.semana_fin,
    temas: unidad?.temas ?? [],
  };
}

function esNumeroValido(value: unknown) {
  return typeof value === "number" && !Number.isNaN(value);
}

export default function PuaMateriaUnidades() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const searchParams = useSearchParams();
  const clave = params?.clave;
  const programaIdFromQuery = searchParams.get("programaId") || "";

  const confirm = useConfirm();

  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [unidadesData, setUnidadesData] = useState<Record<number, UnidadData>>({});
  const [collapsedState, setCollapsedState] = useState<Record<number, boolean>>({});

  const { loading: saving, guardarUnidades } = useUnidadesForm(programa?.id || "");

  // ── 1. Cargar programa ───────────────────────────────────────
  useEffect(() => {
    if (!programaIdFromQuery) {
      setPrograma(null);
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    supabase
      .from("programas")
      .select("id, materia_id, unidades, ht, hl")
      .eq("id", programaIdFromQuery)
      .maybeSingle()
      .then(({ data, error }) => {
        setPrograma(error || !data ? null : (data as Programa));
        setLoadingData(false);
      });
  }, [programaIdFromQuery]);

  // ── 2. Cargar unidades ───────────────────────────────────────
  // FIX CLAVE: inicializar unidadesData con los datos cargados.
  // El componente <Unidad> tiene un useEffect que llama onChange()
  // en el primer render con sus valores internos (inicialmente vacíos).
  // Si unidadesData está vacío, ese onChange sobreescribe los datos
  // cargados porque unidadesData tiene prioridad en unidadesFinales.
  // Al inicializar unidadesData con los datos reales, el onChange del
  // componente solo "confirma" lo que ya está — nunca sobreescribe.
  useEffect(() => {
    if (!programa?.id) return;

    let cancelled = false;
    setLoadingUnidades(true);

    supabase
      .from("unidades")
      .select("numero, nombre, competencia, contenido, duracion, semana_inicio, semana_fin")
      .eq("programa_id", programa.id)
      .order("numero", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error("Error al cargar unidades:", error); setLoadingUnidades(false); return; }

        const normalizadas = (data || []).map((u: any) => normalizarUnidad(u));

        // ── Inicializar unidadesData Y collapsedState en un solo paso ──
        const dataInicial: Record<number, UnidadData> = {};
        const collapsedInicial: Record<number, boolean> = {};

        normalizadas.forEach((u) => {
          dataInicial[u.numero] = u;
          collapsedInicial[u.numero] = !!(
            u.nombre || u.competencia || u.contenido || u.duracion || u.semana_inicio || u.semana_fin
          );
        });

        setUnidadesData(dataInicial);
        setCollapsedState(collapsedInicial);
        setLoadingUnidades(false);
      });

    return () => { cancelled = true; };
  }, [programa?.id]);

  const handleBack = () => {
    router.push(`/capturista/materias/${clave}/pua?programaId=${programaIdFromQuery}`);
  };

  const handleUnidadChange = useCallback((data: UnidadData) => {
    setUnidadesData((prev) => ({ ...prev, [data.numero]: normalizarUnidad(data) }));
  }, []);

  const toggleCollapse = useCallback((numero: number) => {
    setCollapsedState((prev) => ({ ...prev, [numero]: !prev[numero] }));
  }, []);

  // unidadesFinales ahora viene siempre de unidadesData (ya inicializado
  // con los datos cargados), así que no necesita fallback a unidadesCargadas
  const unidadesFinales = useMemo(() => {
    if (!programa) return [];
    return Array.from({ length: programa.unidades }, (_, i) => i + 1).map((num) =>
      unidadesData[num] ? normalizarUnidad(unidadesData[num]) : crearUnidadVacia(num)
    );
  }, [programa, unidadesData]);

  const handleContinuar = async () => {
    if (!programa) return;

    for (const unidad of unidadesFinales) {
      if (!unidad.nombre.trim()) {
        await confirm({ title: "Campo requerido", message: `La Unidad ${unidad.numero} debe tener un nombre.`, confirmText: "Entendido", cancelText: "" });
        return;
      }
      if (!unidad.competencia.trim()) {
        await confirm({ title: "Campo requerido", message: `La Unidad ${unidad.numero} debe tener una competencia.`, confirmText: "Entendido", cancelText: "" });
        return;
      }
      if (!unidad.contenido.trim()) {
        await confirm({ title: "Campo requerido", message: `La Unidad ${unidad.numero} debe tener contenido.`, confirmText: "Entendido", cancelText: "" });
        return;
      }
      if (!esNumeroValido(unidad.duracion) || unidad.duracion <= 0) {
        await confirm({ title: "Duración inválida", message: `La Unidad ${unidad.numero} debe tener una duración mayor a 0 horas.`, confirmText: "Entendido", cancelText: "" });
        return;
      }
      if (!esNumeroValido(unidad.semana_inicio) || (unidad.semana_inicio ?? 0) <= 0) {
        await confirm({ title: "Semana inicial inválida", message: `La Unidad ${unidad.numero} debe tener una semana de inicio válida.`, confirmText: "Entendido", cancelText: "" });
        return;
      }
      if (!esNumeroValido(unidad.semana_fin) || (unidad.semana_fin ?? 0) <= 0) {
        await confirm({ title: "Semana final inválida", message: `La Unidad ${unidad.numero} debe tener una semana final válida.`, confirmText: "Entendido", cancelText: "" });
        return;
      }
      if ((unidad.semana_fin ?? 0) < (unidad.semana_inicio ?? 0)) {
        await confirm({ title: "Rango de semanas inválido", message: `La Unidad ${unidad.numero} no puede tener semana final menor que la inicial.`, confirmText: "Entendido", cancelText: "" });
        return;
      }
    }

    const shouldSave = await confirm({ title: "Guardar unidades", message: "¿Deseas guardar todas las unidades?", confirmText: "Guardar", cancelText: "Cancelar" });
    if (!shouldSave) return;

    const success = await guardarUnidades(unidadesFinales);

    if (success) {
      if ((programa.ht || 0) > 0) {
        await confirm({ title: "¡Guardado exitoso!", message: "Las unidades se guardaron. Continuarás con las prácticas de taller.", confirmText: "Continuar", cancelText: "" });
        router.push(`/capturista/materias/${clave}/pua/taller?programaId=${programa.id}`);
        return;
      }
      if ((programa.hl || 0) > 0) {
        await confirm({ title: "¡Guardado exitoso!", message: "Las unidades se guardaron. Continuarás con las prácticas de laboratorio.", confirmText: "Continuar", cancelText: "" });
        router.push(`/capturista/materias/${clave}/pua/laboratorio?programaId=${programa.id}`);
        return;
      }
      await confirm({ title: "¡Guardado exitoso!", message: "Las unidades se guardaron correctamente. El PUA está completado.", confirmText: "Finalizar", cancelText: "" });
      router.push(`/capturista/materias`);
    }
  };

  if (loadingData || loadingUnidades) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!programa) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>No se encontró el programa</CardTitle>
              <CardDescription>Por favor regresa y completa los datos generales del PUA primero.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack} className="cursor-pointer">Volver a datos generales</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const nUnidades = Array.from({ length: programa.unidades }, (_, i) => i + 1);

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Button variant="outline" onClick={handleBack} className="cursor-pointer">
            <ChevronLeft className="mr-2 h-5 w-5" /> Volver a datos generales
          </Button>
        </div>

        <div className="text-center py-4">
          <h1 className="text-2xl font-bold">V. DESARROLLO POR UNIDADES</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Captura el contenido de cada unidad, sus horas y el rango de semanas para integrarlo al plan de clases del encuadre.
          </p>
        </div>

        <div className="space-y-8">
          {nUnidades.map((num) => {
            const unidadActual = unidadesData[num]
              ? normalizarUnidad(unidadesData[num])
              : crearUnidadVacia(num);
            const isCollapsed = collapsedState[num] ?? false;

            return (
              <Unidad
                key={num}
                nUnidad={num}
                value={unidadActual}
                onChange={handleUnidadChange}
                collapsed={isCollapsed}
                onToggleCollapse={() => toggleCollapse(num)}
              />
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleBack} disabled={saving} className="cursor-pointer">Cancelar</Button>
          <Button className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer" onClick={handleContinuar} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Guardando..." : "Guardar unidades"}
          </Button>
        </div>
      </div>
    </div>
  );
}