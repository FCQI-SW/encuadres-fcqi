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
import { ChevronLeft, Loader2, Plus, AlertCircle } from "lucide-react";
import { PracticaTaller } from "@/components/practica-taller";
import {
  useTallerForm,
  type PracticaTaller as PracticaTallerType,
} from "@/hooks/useTallerForm";
import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";

type Programa = {
  id: string;
  materia_id: string;
  unidades: number;
  ht: number;
  hl: number;
};

type ErroresCampos = {
  competencia?: string;
  descripcion?: string;
  duracion?: string;
};

export default function PuaMateriaTaller() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave;
  const confirm = useConfirm();
  const toast = useToast();

  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [practicasPorUnidad, setPracticasPorUnidad] = useState<
    Record<number, PracticaTallerType[]>
  >({});

  const [practicasCargadas, setPracticasCargadas] = useState(false);

  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>(
    {}
  );

  const [erroresPorPractica, setErroresPorPractica] = useState<
    Record<string, ErroresCampos>
  >({});

  const { loading, guardarPracticas, cargarPracticas } = useTallerForm(
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
          const programaObtenido = programaData as Programa;

          // Seguridad: si no tiene taller, no debería estar aquí
          if ((programaObtenido.ht || 0) <= 0) {
            if ((programaObtenido.hl || 0) > 0) {
              router.replace(`/capturista/materias/${clave}/pua/laboratorio`);
            } else {
              router.replace(`/capturista/materias`);
            }
            return;
          }

          setPrograma(programaObtenido);
        }
      } catch (err) {
        console.error("Error:", err);
        setPrograma(null);
      } finally {
        setLoadingData(false);
      }
    };

    fetchPrograma();
  }, [clave, router]);

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

        const key = `${p.unidad}-${p.numero}`;
        collapsedInicial[key] = true;
      });

      setPracticasPorUnidad(agrupadas);
      setCollapsedState(collapsedInicial);
      setPracticasCargadas(true);
    })();
  }, [programa?.id, practicasCargadas, cargarPracticas]);

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

      setCollapsedState((prevCollapsed) => {
        const nuevo: Record<string, boolean> = {};
        nuevasPracticas.forEach((p) => {
          const key = `${p.unidad}-${p.numero}`;
          nuevo[key] = prevCollapsed[key] ?? true;
        });
        return { ...prevCollapsed, ...nuevo };
      });

      setErroresPorPractica((prevErrores) => {
        const nuevo = { ...prevErrores };
        delete nuevo[`${unidad}-${numero}`];
        return nuevo;
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

  const toggleCollapse = (unidad: number, numero: number) => {
    const key = `${unidad}-${numero}`;
    setCollapsedState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const validarPracticas = (): Record<string, ErroresCampos> => {
    const erroresPorPract: Record<string, ErroresCampos> = {};

    if (!programa) return erroresPorPract;

    const todasLasPracticas: PracticaTallerType[] = [];
    Object.values(practicasPorUnidad).forEach((practicas) => {
      todasLasPracticas.push(...practicas);
    });

    todasLasPracticas.forEach((practica) => {
      const key = `${practica.unidad}-${practica.numero}`;
      const errores: ErroresCampos = {};

      if (!practica.competencia || !practica.competencia.trim()) {
        errores.competencia = "La competencia es obligatoria.";
      }

      if (!practica.descripcion || !practica.descripcion.trim()) {
        errores.descripcion = "La descripción es obligatoria.";
      }

      if (!practica.duracion || practica.duracion <= 0) {
        errores.duracion = "La duración debe ser mayor a 0 horas.";
      }

      if (Object.keys(errores).length > 0) {
        erroresPorPract[key] = errores;
      }
    });

    return erroresPorPract;
  };

  const handleGuardar = async () => {
    const erroresValidacion = validarPracticas();
    setErroresPorPractica(erroresValidacion);

    if (Object.keys(erroresValidacion).length > 0) {
      toast.error(
        "Por favor completa todos los campos obligatorios antes de guardar."
      );
      return;
    }

    const totalPracticas = Object.values(practicasPorUnidad).reduce(
      (sum, practicas) => sum + practicas.length,
      0
    );

    if (totalPracticas === 0) {
      toast.error(
        "Debes agregar al menos una práctica de taller antes de continuar."
      );
      return;
    }

    const shouldSave = await confirm({
      title: "Guardar prácticas",
      message: "¿Deseas guardar todas las prácticas de taller?",
      confirmText: "Guardar",
      cancelText: "Cancelar",
    });

    if (!shouldSave || !programa) return;

    const todasLasPracticas: PracticaTallerType[] = [];
    Object.values(practicasPorUnidad).forEach((practicas) => {
      todasLasPracticas.push(...practicas);
    });

    const success = await guardarPracticas(todasLasPracticas);

    if (success) {
      if ((programa.hl || 0) > 0) {
        await confirm({
          title: "¡Guardado exitoso!",
          message:
            "Las prácticas de taller se han guardado correctamente. Ahora continuarás con las prácticas de laboratorio.",
          confirmText: "Continuar",
          cancelText: "",
        });
        router.push(`/capturista/materias/${clave}/pua/laboratorio`);
      } else {
        await confirm({
          title: "¡Guardado exitoso!",
          message:
            "Las prácticas de taller se han guardado correctamente. El PUA está completado.",
          confirmText: "Finalizar",
          cancelText: "",
        });
        router.push(`/capturista/materias`);
      }
    } else {
      toast.error("Error al guardar las prácticas de taller. Intenta de nuevo.");
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
  const totalErrores = Object.keys(erroresPorPractica).length;

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
          <p className="text-muted-foreground mt-2">
            Agrega prácticas para cada unidad. Es obligatorio agregar al menos
            una práctica.
          </p>
        </div>

        {totalErrores > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800">
                    {totalErrores} práctica{totalErrores > 1 ? "s" : ""} con errores
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Por favor completa los campos marcados en rojo antes de guardar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                        errores={erroresPorPractica[key]}
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