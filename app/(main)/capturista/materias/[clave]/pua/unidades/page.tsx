"use client";

import { useEffect, useState } from "react";
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
};

type UnidadData = {
  numero: number;
  nombre: string;
  competencia: string;
  contenido: string;
  duracion: number;
};

export default function PuaMateriaUnidades() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave;
  const confirm = useConfirm();

  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Datos que se van editando en esta pantalla
  const [unidadesData, setUnidadesData] = useState<Record<number, UnidadData>>(
    {}
  );

  // Unidades cargadas desde BD
  const [unidadesCargadas, setUnidadesCargadas] = useState<UnidadData[]>([]);

  // NUEVO: estado de colapsado por unidad (1,2,3...)
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
          .select("id, materia_id, unidades")
          .eq("materia_id", materiaData.id)
          .single();

        if (error) {
          console.error("Error al obtener programa:", error);
          setPrograma(null);
        } else {
          setPrograma(programaData);
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

  // Cargar unidades existentes
  useEffect(() => {
    if (!programa?.id) return;

    (async () => {
      const unidades = await cargarUnidades();
      setUnidadesCargadas(unidades);

      // NUEVO: las unidades que ya tienen info llegan minimizadas
      const collapsedInicial: Record<number, boolean> = {};
      unidades.forEach((u) => {
        const tieneAlgo =
          !!u.nombre || !!u.competencia || !!u.contenido || !!u.duracion;
        collapsedInicial[u.numero] = tieneAlgo;
      });
      setCollapsedState(collapsedInicial);
    })();
  }, [programa?.id, cargarUnidades]);

  const handleBack = () => {
    router.push(`/capturista/materias/${clave}/pua`);
  };

  const handleUnidadChange = (data: UnidadData) => {
    setUnidadesData((prev) => ({
      ...prev,
      [data.numero]: data,
    }));
  };

  // NUEVO: alternar colapsado
  const toggleCollapse = (numero: number) => {
    setCollapsedState((prev) => ({
      ...prev,
      [numero]: !prev[numero],
    }));
  };

  const handleContinuar = async () => {
    if (!programa) return;

    // Tomar lo que se ha editado en esta pantalla
    const unidadesArray = Object.values(unidadesData);

    if (unidadesArray.length < programa.unidades) {
      await confirm({
        title: "Unidades incompletas",
        message: `Debes completar todas las ${programa.unidades} unidades antes de continuar.`,
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    for (const unidad of unidadesArray) {
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

      if (unidad.duracion <= 0) {
        await confirm({
          title: "Duración inválida",
          message: `La Unidad ${unidad.numero} debe tener una duración mayor a 0 horas.`,
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

    const success = await guardarUnidades(unidadesArray);

    if (success) {
      await confirm({
        title: "¡Guardado exitoso!",
        message: "Las unidades se han guardado correctamente.",
        confirmText: "Continuar",
        cancelText: "",
      });

      router.push(`/capturista/materias/${clave}/pua/taller`);
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
        {/* Botón regresar */}
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

        {/* Título */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold">V. DESARROLLO POR UNIDADES</h1>
        </div>

        {/* Unidades */}
        <div className="space-y-8">
          {nUnidades.map((num) => {
            const unidadCargada = unidadesCargadas.find(
              (u) => u.numero === num
            );

            const isCollapsed = collapsedState[num] ?? false;

            return (
              <Unidad
                key={num}
                nUnidad={num}
                value={unidadCargada}
                onChange={handleUnidadChange}
                collapsed={isCollapsed}
                onToggleCollapse={() => toggleCollapse(num)}
              />
            );
          })}
        </div>

        {/* Botones de acción */}
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
