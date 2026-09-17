"use client";

import { useEffect, useState, useCallback } from "react";
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
import { ChevronLeft, Loader2, Plus, AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { PracticaTaller } from "@/components/practica-taller";
import {
  useTallerForm,
  type PracticaTaller as PracticaTallerType,
} from "@/hooks/useTallerForm";
import { usePermisoPua } from "@/hooks/usePermisoPua";
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

// Firma estable de una práctica, para no re-guardar lo idéntico
function firmaPractica(p: PracticaTallerType): string {
  return JSON.stringify([
    p.unidad,
    p.numero,
    p.competencia,
    p.descripcion,
    p.material_apoyo,
    p.duracion,
  ]);
}

export default function PuaMateriaTaller() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const searchParams = useSearchParams();
  const clave = params?.clave;
  const programaIdFromQuery = searchParams.get("programaId") || "";

  const confirm = useConfirm();
  const toast = useToast();

  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [practicasPorUnidad, setPracticasPorUnidad] = useState<Record<number, PracticaTallerType[]>>({});
  const [practicasCargadas, setPracticasCargadas] = useState(false);
  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>({});
  const [erroresPorPractica, setErroresPorPractica] = useState<Record<string, ErroresCampos>>({});

  const { loading, guardarPracticas, cargarPracticas } = useTallerForm(programa?.id || "");

  // ── PERMISO DE CAPTURA ───────────────────────────────────────
  const { permiso, puedeEditar: puedeEditarPua, loadingPermiso } =
    usePermisoPua(programa?.id || "");

  const puedeCapturar = !!programa?.id && puedeEditarPua && !loadingPermiso;
  const mostrarAvisoBloqueo = !!programa?.id && !loadingPermiso && !puedeEditarPua;

  useEffect(() => {
    const fetchPrograma = async () => {
      if (!programaIdFromQuery) { setPrograma(null); setLoadingData(false); return; }
      setLoadingData(true);
      try {
        const { data: programaData, error } = await supabase
          .from("programas")
          .select("id, materia_id, unidades, ht, hl")
          .eq("id", programaIdFromQuery)
          .maybeSingle();

        if (error || !programaData) {
          setPrograma(null);
        } else {
          const prog = programaData as Programa;
          if ((prog.ht || 0) <= 0) {
            if ((prog.hl || 0) > 0) {
              router.replace(`/capturista/materias/${clave}/pua/laboratorio?programaId=${prog.id}`);
            } else {
              router.replace(`/capturista/materias`);
            }
            return;
          }
          setPrograma(prog);
        }
      } catch (err) {
        setPrograma(null);
      } finally {
        setLoadingData(false);
      }
    };
    fetchPrograma();
  }, [programaIdFromQuery, clave, router]);

  useEffect(() => {
    if (!programa?.id || practicasCargadas) return;

    (async () => {
      const practicas = await cargarPracticas();
      const agrupadas: Record<number, PracticaTallerType[]> = {};
      const collapsedInicial: Record<string, boolean> = {};

      practicas.forEach((p) => {
        if (!agrupadas[p.unidad]) agrupadas[p.unidad] = [];
        agrupadas[p.unidad].push(p);
        collapsedInicial[`${p.unidad}-${p.numero}`] = true;
      });

      setPracticasPorUnidad(agrupadas);
      setCollapsedState(collapsedInicial);
      setPracticasCargadas(true);
    })();
  }, [programa?.id, practicasCargadas, cargarPracticas]);

  const handleBack = () => {
    router.push(`/capturista/materias/${clave}/pua/unidades?programaId=${programaIdFromQuery}`);
  };

  // Los setState anidados salieron del updater: React puede ejecutar
  // el updater dos veces en desarrollo y eso duplicaba efectos.
  const agregarPractica = (unidad: number) => {
    const practicasUnidad = practicasPorUnidad[unidad] || [];
    const nuevoNumero = practicasUnidad.length + 1;
    const nuevaPractica: PracticaTallerType = {
      unidad, numero: nuevoNumero, competencia: "", descripcion: "", material_apoyo: "", duracion: 0,
    };

    setPracticasPorUnidad((prev) => ({
      ...prev,
      [unidad]: [...(prev[unidad] || []), nuevaPractica],
    }));
    setCollapsedState((p) => ({ ...p, [`${unidad}-${nuevoNumero}`]: false }));
  };

  const eliminarPractica = (unidad: number, numero: number) => {
    const nuevasPracticas = (practicasPorUnidad[unidad] || [])
      .filter((p) => p.numero !== numero)
      .map((p, i) => ({ ...p, numero: i + 1 }));

    setPracticasPorUnidad((prev) => ({ ...prev, [unidad]: nuevasPracticas }));

    setCollapsedState((prevC) => {
      const nuevo: Record<string, boolean> = { ...prevC };
      nuevasPracticas.forEach((p) => {
        nuevo[`${p.unidad}-${p.numero}`] = prevC[`${p.unidad}-${p.numero}`] ?? true;
      });
      return nuevo;
    });

    setErroresPorPractica((prev) => {
      const n = { ...prev };
      delete n[`${unidad}-${numero}`];
      return n;
    });
  };

  // Guarda con comparación por firma: si nada cambió, devuelve el
  // mismo estado y React no vuelve a renderizar (evita el bucle).
  const handlePracticaChange = useCallback((data: PracticaTallerType) => {
    setPracticasPorUnidad((prev) => {
      const practicasUnidad = prev[data.unidad] || [];
      const index = practicasUnidad.findIndex((p) => p.numero === data.numero);

      if (index >= 0 && firmaPractica(practicasUnidad[index]) === firmaPractica(data)) {
        return prev;
      }

      const copia = [...practicasUnidad];
      if (index >= 0) copia[index] = data;
      else copia.push(data);

      return { ...prev, [data.unidad]: copia };
    });
  }, []);

  const toggleCollapse = (unidad: number, numero: number) => {
    const key = `${unidad}-${numero}`;
    setCollapsedState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const validarPracticas = (): Record<string, ErroresCampos> => {
    const errores: Record<string, ErroresCampos> = {};
    if (!programa) return errores;
    Object.values(practicasPorUnidad).flat().forEach((p) => {
      const key = `${p.unidad}-${p.numero}`;
      const e: ErroresCampos = {};
      if (!p.competencia?.trim()) e.competencia = "La competencia es obligatoria.";
      if (!p.descripcion?.trim()) e.descripcion = "La descripción es obligatoria.";
      if (!p.duracion || p.duracion <= 0) e.duracion = "La duración debe ser mayor a 0 horas.";
      if (Object.keys(e).length > 0) errores[key] = e;
    });
    return errores;
  };

  const handleGuardar = async () => {
    if (!puedeCapturar) {
      toast.error(permiso.motivo || "No tienes permiso para editar el PUA en este momento.");
      return;
    }

    const erroresValidacion = validarPracticas();
    setErroresPorPractica(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) { toast.error("Por favor completa todos los campos obligatorios antes de guardar."); return; }

    const totalPracticas = Object.values(practicasPorUnidad).reduce((sum, p) => sum + p.length, 0);
    if (totalPracticas === 0) { toast.error("Debes agregar al menos una práctica de taller antes de continuar."); return; }

    const shouldSave = await confirm({ title: "Guardar prácticas", message: "¿Deseas guardar todas las prácticas de taller?", confirmText: "Guardar", cancelText: "Cancelar" });
    if (!shouldSave || !programa) return;

    const success = await guardarPracticas(Object.values(practicasPorUnidad).flat());

    if (success) {
      if ((programa.hl || 0) > 0) {
        await confirm({ title: "¡Guardado exitoso!", message: "Las prácticas de taller se guardaron. Continuarás con las prácticas de laboratorio.", confirmText: "Continuar", cancelText: "" });
        router.push(`/capturista/materias/${clave}/pua/laboratorio?programaId=${programa.id}`);
      } else {
        await confirm({ title: "¡Guardado exitoso!", message: "Las prácticas de taller se guardaron correctamente. El PUA está completado.", confirmText: "Finalizar", cancelText: "" });
        router.push(`/capturista/materias`);
      }
    } else {
      toast.error("Error al guardar las prácticas de taller. Intenta de nuevo.");
    }
  };

  if (loadingData) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  if (!programa) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader><CardTitle>No se encontró el programa</CardTitle><CardDescription>Por favor regresa y completa los datos del PUA primero.</CardDescription></CardHeader>
            <CardContent className="flex justify-end gap-2"><Button variant="outline" onClick={handleBack} className="cursor-pointer">Volver</Button></CardContent>
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
          <Button variant="outline" onClick={handleBack} className="cursor-pointer">
            <ChevronLeft className="mr-2 h-5 w-5" /> Volver a unidades
          </Button>
        </div>

        <div className="text-center py-4">
          <h1 className="text-2xl font-bold">VI. ESTRUCTURA DE LAS PRÁCTICAS DE TALLER</h1>
          <p className="text-muted-foreground mt-2">Agrega prácticas para cada unidad. Es obligatorio agregar al menos una práctica.</p>
        </div>

        {/* Aviso: captura cerrada */}
        {mostrarAvisoBloqueo && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">Captura cerrada — modo consulta</p>
                  <p className="text-sm text-amber-800 mt-1">
                    {permiso.motivo ||
                      "El periodo de captura del PUA está cerrado. Puedes revisar las prácticas, pero no guardar cambios."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aviso: permiso especial */}
        {permiso.tiene_permiso_especial && puedeCapturar && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">Permiso especial activo</p>
                  <p className="text-sm text-green-800 mt-1">
                    {permiso.motivo ||
                      "El administrador te habilitó la captura de este PUA fuera del periodo general."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {totalErrores > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800">{totalErrores} práctica{totalErrores > 1 ? "s" : ""} con errores</h3>
                  <p className="text-sm text-red-700 mt-1">Por favor completa los campos marcados en rojo antes de guardar.</p>
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
                {puedeCapturar && (
                  <Button variant="outline" size="sm" onClick={() => agregarPractica(unidad)} className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" /> Agregar práctica
                  </Button>
                )}
              </div>
              {practicas.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No hay prácticas agregadas para esta unidad.</CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {practicas.map((practica) => {
                    const key = `${unidad}-${practica.numero}`;
                    return (
                      <PracticaTaller key={key} unidad={unidad} numero={practica.numero} value={practica}
                        collapsed={collapsedState[key] ?? false}
                        onToggleCollapse={() => toggleCollapse(unidad, practica.numero)}
                        onChange={handlePracticaChange}
                        onDelete={puedeCapturar ? () => eliminarPractica(unidad, practica.numero) : undefined}
                        errores={erroresPorPractica[key]} />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleBack} disabled={loading} className="cursor-pointer">
            {puedeCapturar ? "Cancelar" : "Volver"}
          </Button>

          {puedeCapturar && (
            <Button className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer" onClick={handleGuardar} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Guardando..." : "Guardar y finalizar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}