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
import { ChevronLeft, Loader2, Plus } from "lucide-react";
import { PracticaTaller } from "@/components/practica-taller";
import {
  useTallerForm,
  type PracticaTaller as PracticaTallerType,
} from "@/hooks/useTallerForm";
import { useConfirm } from "@/components/global-confirm-modal";

type Programa = {
  id: string;
  materia_id: string;
  unidades: number;
};

export default function PuaMateriaTaller() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave;
  const confirm = useConfirm();

  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [practicasPorUnidad, setPracticasPorUnidad] = useState<
    Record<number, PracticaTallerType[]>
  >({});

  const [practicasCargadas, setPracticasCargadas] = useState(false);

  // NUEVO: estado de colapsado por práctica (unidad-numero)
  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>(
    {}
  );

  const { loading, guardarPracticas, cargarPracticas } = useTallerForm(
    programa?.id || ""
  );

  // Obtener programa
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

  // Cargar prácticas existentes una sola vez
  useEffect(() => {
    if (!programa?.id || practicasCargadas) return;

    (async () => {
      const practicas = await cargarPracticas();

      const agrupadas: Record<number, PracticaTallerType[]> = {};
      const collapsedInicial: Record<string, boolean> = {};

      practicas.forEach((p) => {
        if (!agrupadas[p.unidad]) {
          agrupadas[p.unidad] = [];
        }
        agrupadas[p.unidad].push(p);

        // si quieres que las que vienen de BD lleguen ya minimizadas:
        const key = `${p.unidad}-${p.numero}`;
        collapsedInicial[key] = true;
      });

      setPracticasPorUnidad(agrupadas);
      setCollapsedState(collapsedInicial);
      setPracticasCargadas(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programa?.id, practicasCargadas]);

  const handleBack = () => {
    router.push(`/capturista/materias/${clave}/pua/unidades`);
  };

  const agregarPractica = (unidad: number) => {
    setPracticasPorUnidad((prev) => {
      const practicasUnidad = prev[unidad] || [];
      const nuevoNumero = practicasUnidad.length + 1;

      const nuevaPractica: PracticaTallerType = {
        unidad,
        numero: nuevoNumero,
        competencia: "",
        descripcion: "",
        material_apoyo: "",
        duracion: 0,
      };

      // La nueva práctica empieza expandida
      const key = `${unidad}-${nuevoNumero}`;
      setCollapsedState((prevCollapsed) => ({
        ...prevCollapsed,
        [key]: false,
      }));

      return {
        ...prev,
        [unidad]: [...practicasUnidad, nuevaPractica],
      };
    });
  };

  const eliminarPractica = (unidad: number, numero: number) => {
    setPracticasPorUnidad((prev) => {
      const practicasUnidad = prev[unidad] || [];
      const nuevasPracticas = practicasUnidad
        .filter((p) => p.numero !== numero)
        .map((p, index) => ({ ...p, numero: index + 1 }));

      // Limpiar estados de colapsado antiguos (opcional)
      setCollapsedState((prevCollapsed) => {
        const nuevo: Record<string, boolean> = {};
        nuevasPracticas.forEach((p) => {
          const key = `${p.unidad}-${p.numero}`;
          nuevo[key] = prevCollapsed[key] ?? true;
        });
        return { ...prevCollapsed, ...nuevo };
      });

      return {
        ...prev,
        [unidad]: nuevasPracticas,
      };
    });
  };

  const handlePracticaChange = (data: PracticaTallerType) => {
    setPracticasPorUnidad((prev) => {
      const practicasUnidad = [...(prev[data.unidad] || [])];
      const index = practicasUnidad.findIndex(
        (p) => p.numero === data.numero
      );

      if (index >= 0) {
        practicasUnidad[index] = data;
      } else {
        practicasUnidad.push(data);
      }

      return {
        ...prev,
        [data.unidad]: practicasUnidad,
      };
    });
  };

  // Toggle colapsado
  const toggleCollapse = (unidad: number, numero: number) => {
    const key = `${unidad}-${numero}`;
    setCollapsedState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleGuardar = async () => {
    if (!programa) return;

    const todasLasPracticas: PracticaTallerType[] = [];
    Object.values(practicasPorUnidad).forEach((practicas) => {
      todasLasPracticas.push(...practicas);
    });

    for (const practica of todasLasPracticas) {
      if (!practica.competencia.trim()) {
        await confirm({
          title: "Campo requerido",
          message: `La Unidad ${practica.unidad}, Práctica ${practica.numero} debe tener una competencia.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }

      if (!practica.descripcion.trim()) {
        await confirm({
          title: "Campo requerido",
          message: `La Unidad ${practica.unidad}, Práctica ${practica.numero} debe tener una descripción.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }

      if (practica.duracion <= 0) {
        await confirm({
          title: "Duración inválida",
          message: `La Unidad ${practica.unidad}, Práctica ${practica.numero} debe tener una duración mayor a 0 horas.`,
          confirmText: "Entendido",
          cancelText: "",
        });
        return;
      }
    }

    const shouldSave = await confirm({
      title: "Guardar prácticas",
      message: "¿Deseas guardar todas las prácticas de taller?",
      confirmText: "Guardar",
      cancelText: "Cancelar",
    });

    if (!shouldSave) return;

    const success = await guardarPracticas(todasLasPracticas);

    if (success) {
      await confirm({
        title: "¡Guardado exitoso!",
        message: "Las prácticas de taller se han guardado correctamente.",
        confirmText: "Continuar",
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
                Por favor regresa y completa los datos del PUA primero.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="cursor-pointer"
              >
                Volver
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
            Volver a unidades
          </Button>
        </div>

        <div className="text-center py-4">
          <h1 className="text-2xl font-bold">
            VI. ESTRUCTURA DE LAS PRÁCTICAS DE TALLER
          </h1>
        </div>

        {nUnidades.map((unidad) => {
          const practicas = practicasPorUnidad[unidad] || [];

          return (
            <div key={unidad} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">UNIDAD {unidad}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => agregarPractica(unidad)}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar práctica
                </Button>
              </div>

              {practicas.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No hay prácticas agregadas para esta unidad.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {practicas.map((practica) => {
                    const key = `${unidad}-${practica.numero}`;
                    const isCollapsed = collapsedState[key] ?? false;

                    return (
                      <PracticaTaller
                        key={key}
                        unidad={unidad}
                        numero={practica.numero}
                        value={practica}
                        collapsed={isCollapsed}
                        onToggleCollapse={() =>
                          toggleCollapse(unidad, practica.numero)
                        }
                        onChange={handlePracticaChange}
                        onDelete={() =>
                          eliminarPractica(unidad, practica.numero)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

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
            onClick={handleGuardar}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Guardando..." : "Guardar y finalizar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
