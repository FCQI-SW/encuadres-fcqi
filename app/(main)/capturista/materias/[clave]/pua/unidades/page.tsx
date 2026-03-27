"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  return {
    numero,
    nombre: "",
    competencia: "",
    contenido: "",
    duracion: 0,
    semana_inicio: null,
    semana_fin: null,
    temas: [],
  };
}

function normalizarUnidad(unidad?: Partial<UnidadData> | null): UnidadData {
  return {
    numero: Number(unidad?.numero ?? 0),
    nombre: unidad?.nombre ?? "",
    competencia: unidad?.competencia ?? "",
    contenido: unidad?.contenido ?? "",
    duracion: Number(unidad?.duracion ?? 0),
    semana_inicio:
      unidad?.semana_inicio === undefined ? null : unidad.semana_inicio,
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
  const clave = params?.clave;
  const confirm = useConfirm();

  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [unidadesData, setUnidadesData] = useState<Record<number, UnidadData>>(
    {}
  );

  const [unidadesCargadas, setUnidadesCargadas] = useState<UnidadData[]>([]);

  const [collapsedState, setCollapsedState] = useState<Record<number, boolean>>(
    {}
  );

  const { loading, guardarUnidades, cargarUnidades } = useUnidadesForm(
    programa?.id || ""
  );

  useEffect(() => {
    const fetchPrograma = async () => {
      if (!clave) return;

      setLoadingData(true);
      try {
        const { data: materiaData } = await supabase
          .from("materias")
          .select("id")
          .eq("clave", clave)
          .single();

        if (!materiaData) {
          setPrograma(null);
          setLoadingData(false);
          return;
        }

        const { data: programaData, error } = await supabase
          .from("programas")
          .select("id, materia_id, unidades, ht, hl")
          .eq("materia_id", materiaData.id)
          .single();

        if (error) {
          console.error("Error al obtener programa:", error);
          setPrograma(null);
        } else {
          setPrograma(programaData as Programa);
        }
      } catch (err) {
        console.error("Error:", err);
        setPrograma(null);
      } finally {
        setLoadingData(false);
      }
    };

    fetchPrograma();
  }, [clave]);

  useEffect(() => {
    if (!programa?.id) return;

    (async () => {
      const unidades = await cargarUnidades();

      const unidadesNormalizadas = (unidades || []).map((u: any) =>
        normalizarUnidad(u)
      );

      setUnidadesCargadas(unidadesNormalizadas);

      const collapsedInicial: Record<number, boolean> = {};
      unidadesNormalizadas.forEach((u) => {
        const tieneAlgo =
          !!u.nombre ||
          !!u.competencia ||
          !!u.contenido ||
          !!u.duracion ||
          !!u.semana_inicio ||
          !!u.semana_fin;
        collapsedInicial[u.numero] = tieneAlgo;
      });
      setCollapsedState(collapsedInicial);
    })();
  }, [programa?.id, cargarUnidades]);

  const handleBack = () => {
    router.push(`/capturista/materias/${clave}/pua`);
  };

  // ── useCallback para evitar el loop infinito con Unidad.useEffect ──
  const handleUnidadChange = useCallback((data: UnidadData) => {
    const unidadNormalizada = normalizarUnidad(data);
    setUnidadesData((prev) => ({
      ...prev,
      [unidadNormalizada.numero]: unidadNormalizada,
    }));
  }, []);

  const toggleCollapse = useCallback((numero: number) => {
    setCollapsedState((prev) => ({
      ...prev,
      [numero]: !prev[numero],
    }));
  }, []);
  // ──────────────────────────────────────────────────────────────────

  const unidadesFinales = useMemo(() => {
    if (!programa) return [];

    return Array.from({ length: programa.unidades }, (_, i) => i + 1).map(
      (num) => {
        const editada = unidadesData[num];
        const cargada = unidadesCargadas.find((u) => u.numero === num);

        if (editada) return normalizarUnidad(editada);
        if (cargada) return normalizarUnidad(cargada);
        return crearUnidadVacia(num);
      }
    );
  }, [programa, unidadesData, unidadesCargadas]);

  const handleContinuar = async () => {
    if (!programa) return;

    if (unidadesFinales.length < programa.unidades) {
      await confirm({
        title: "Unidades incompletas",
        message: `Debes completar todas las ${programa.unidades} unidades antes de continuar.`,
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    for (const unidad of unidadesFinales) {
      if (!unidad.nombre.trim()) {
        await confirm({
          title: "Campo requerido",
          message: `La Unidad ${unidad.numero} debe tener un nombre.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }

      if (!unidad.competencia.trim()) {
        await confirm({
          title: "Campo requerido",
          message: `La Unidad ${unidad.numero} debe tener una competencia.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }

      if (!unidad.contenido.trim()) {
        await confirm({
          title: "Campo requerido",
          message: `La Unidad ${unidad.numero} debe tener contenido.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }

      if (!esNumeroValido(unidad.duracion) || unidad.duracion <= 0) {
        await confirm({
          title: "Duración inválida",
          message: `La Unidad ${unidad.numero} debe tener una duración mayor a 0 horas.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }

      if (
        !esNumeroValido(unidad.semana_inicio) ||
        (unidad.semana_inicio ?? 0) <= 0
      ) {
        await confirm({
          title: "Semana inicial inválida",
          message: `La Unidad ${unidad.numero} debe tener una semana de inicio válida.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }

      if (
        !esNumeroValido(unidad.semana_fin) ||
        (unidad.semana_fin ?? 0) <= 0
      ) {
        await confirm({
          title: "Semana final inválida",
          message: `La Unidad ${unidad.numero} debe tener una semana final válida.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }

      if ((unidad.semana_fin ?? 0) < (unidad.semana_inicio ?? 0)) {
        await confirm({
          title: "Rango de semanas inválido",
          message: `La Unidad ${unidad.numero} no puede tener una semana final menor que la semana inicial.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }
    }

    const shouldSave = await confirm({
      title: "Guardar unidades",
      message: "¿Deseas guardar todas las unidades?",
      confirmText: "Guardar",
      cancelText: "Cancelar",
    });

    if (!shouldSave) return;

    const success = await guardarUnidades(unidadesFinales);

    if (success) {
      if ((programa.ht || 0) > 0) {
        await confirm({
          title: "¡Guardado exitoso!",
          message:
            "Las unidades se han guardado correctamente. Ahora continuarás con las prácticas de taller.",
          confirmText: "Continuar",
          cancelText: "",
        });

        router.push(`/capturista/materias/${clave}/pua/taller`);
        return;
      }

      if ((programa.hl || 0) > 0) {
        await confirm({
          title: "¡Guardado exitoso!",
          message:
            "Las unidades se han guardado correctamente. Ahora continuarás con las prácticas de laboratorio.",
          confirmText: "Continuar",
          cancelText: "",
        });

        router.push(`/capturista/materias/${clave}/pua/laboratorio`);
        return;
      }

      await confirm({
        title: "¡Guardado exitoso!",
        message:
          "Las unidades se han guardado correctamente. Esta materia no requiere prácticas de taller ni de laboratorio.",
        confirmText: "Finalizar",
        cancelText: "",
      });

      router.push(`/capturista/materias`);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!programa) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>No se encontró el programa</CardTitle>
              <CardDescription>
                Por favor regresa y completa los datos generales del PUA
                primero.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="cursor-pointer"
              >
                Volver a datos generales
              </Button>
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
          <Button
            variant="outline"
            onClick={handleBack}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Volver a datos generales
          </Button>
        </div>

        <div className="text-center py-4">
          <h1 className="text-2xl font-bold">V. DESARROLLO POR UNIDADES</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Captura el contenido de cada unidad, sus horas y el rango de semanas
            para integrarlo al plan de clases del encuadre.
          </p>
        </div>

        <div className="space-y-8">
          {nUnidades.map((num) => {
            const unidadCargada = unidadesCargadas.find((u) => u.numero === num);
            const unidadEditada = unidadesData[num];
            const unidadActual = unidadEditada
              ? normalizarUnidad(unidadEditada)
              : unidadCargada
              ? normalizarUnidad(unidadCargada)
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
            {loading ? "Guardando..." : "Guardar unidades"}
          </Button>
        </div>
      </div>
    </div>
  );
}