"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useEncuadreForm } from "@/hooks/useEncuadreForm";
import { useConfirm } from "@/components/global-confirm-modal";

type Materia = {
  id: string;
  clave: string;
  nombre: string;
};

type Profesor = {
  id: string;
  nombre: string;
};

export default function EncuadreMateria() {
  const router = useRouter();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave as string;
  const confirm = useConfirm();

  const [loadingData, setLoadingData] = useState(true);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [profesorId, setProfesorId] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [grupo, setGrupo] = useState("");
  const [seccion, setSeccion] = useState(""); // ⬅️ AGREGADO

  const { guardarEncuadre, cargarEncuadre, loading, error } = useEncuadreForm(
    materia?.id || ""
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingData(true);

      const [{ data: matData }, { data: profData }] = await Promise.all([
        supabase
          .from("materias")
          .select("id, clave, nombre_materia")
          .eq("clave", clave),
        supabase
          .from("usuarios")
          .select("id, nombre, rol_id")
          .eq("rol_id", "bc3ab654-5fc8-401a-a6e2-97903b45cc93"),
      ]);

      if (!isMounted) return;

      if (matData && matData.length > 0) {
        const m = matData[0] as any;
        setMateria({ id: m.id, clave: m.clave, nombre: m.nombre_materia });
      } else {
        setMateria(null);
      }

      if (profData) {
        setProfesores(
          (profData as any[]).map((p) => ({ id: p.id, nombre: p.nombre }))
        );
      } else {
        setProfesores([]);
      }

      setLoadingData(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [clave]);

  // Cargar encuadre existente (si hay)
  useEffect(() => {
    if (!materia?.id) return;

    (async () => {
      const encuadre = await cargarEncuadre();
      if (encuadre) {
        setProfesorId(encuadre.usuario_id || "");
        setGrupo(encuadre.grupo || "");
        setPeriodo(encuadre.periodo || "");
        setSeccion(encuadre.seccion || ""); // ⬅️ AGREGADO
      }
    })();
  }, [materia?.id, cargarEncuadre]);

  const handleBack = async () => {
    // Si hay cambios sin guardar, preguntar
    if (profesorId || periodo || grupo || seccion) {
      const shouldLeave = await confirm({
        title: "¿Salir sin guardar?",
        message: "Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?",
        confirmText: "Sí, salir",
        cancelText: "Cancelar",
      });

      if (!shouldLeave) return;
    }

    router.push("/capturista/materias");
  };

  const handleGuardar = async () => {
    if (!materia) return;

    // Validaciones
    if (!profesorId) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor selecciona un profesor.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!periodo.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa el periodo.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!grupo.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa el grupo.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    if (!seccion.trim()) {
      await confirm({
        title: "Campo requerido",
        message: "Por favor ingresa la sección.",
        confirmText: "Entendido",
        cancelText: "",
      });
      return;
    }

    // Confirmar antes de guardar
    const shouldSave = await confirm({
      title: "Guardar encuadre",
      message: "¿Deseas guardar la configuración del encuadre?",
      confirmText: "Guardar",
      cancelText: "Cancelar",
    });

    if (!shouldSave) return;

    // Guardar
    const encuadreId = await guardarEncuadre({
      materiaId: materia.id,
      profesorId,
      periodo,
      grupo,
      seccion, // ⬅️ AGREGADO
    });

    if (encuadreId) {
      // Mostrar mensaje de éxito
      await confirm({
        title: "¡Guardado exitoso!",
        message: "El encuadre se ha guardado correctamente.",
        confirmText: "Aceptar",
        cancelText: "",
      });

      router.push("/capturista/materias");
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

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
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
          <h1 className="text-2xl font-bold">Configurar Encuadre</h1>
          <p className="text-sm text-muted-foreground">
            Completa la información del curso antes de guardar.
          </p>
        </div>

        {error && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Datos de la materia</CardTitle>
            <CardDescription>Campos de solo lectura</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Label className="mb-2 block">Clave</Label>
              <Input value={materia.clave} disabled />
            </div>
            <div className="sm:col-span-8">
              <Label className="mb-2 block">Nombre</Label>
              <Input value={materia.nombre} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración del curso</CardTitle>
            <CardDescription>Asigna profesor, periodo, grupo y sección</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-6">
              <Label className="mb-2 block">
                Profesor <span className="text-red-500">*</span>
              </Label>
              <Select
                value={profesorId}
                onValueChange={setProfesorId}
                disabled={loadingData || profesores.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingData ? "Cargando..." : "Seleccione un profesor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {profesores.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-6">
              <Label className="mb-2 block">
                Periodo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="2025-1"
              />
            </div>

            <div className="sm:col-span-6">
              <Label className="mb-2 block">
                Grupo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                placeholder="301"
              />
            </div>

            <div className="sm:col-span-6">
              <Label className="mb-2 block">
                Sección <span className="text-red-500">*</span>
              </Label>
              <Input
                value={seccion}
                onChange={(e) => setSeccion(e.target.value)}
                placeholder="A"
              />
            </div>

            <div className="sm:col-span-12 flex items-center justify-end gap-2 pt-2">
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
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}