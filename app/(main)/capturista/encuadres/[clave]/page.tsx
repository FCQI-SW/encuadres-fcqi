"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
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
import { ChevronLeft } from "lucide-react";

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
  const pathname = usePathname();
  const params = useParams<{ clave: string }>();
  const clave = params?.clave as string;

  const parent = useMemo(() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    parts.pop();
    return "/" + parts.join("/");
  }, [pathname]);

  const [loading, setLoading] = useState(true);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [profesorId, setProfesorId] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [grupo, setGrupo] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);

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

      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [clave]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(parent || "/");
    }
  };

  const handleGuardar = () => {
    // aquí podrías hacer el insert/update en Supabase
    handleBack();
  };

  if (!loading && !materia) {
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
              <Button variant="outline" onClick={handleBack} className="cursor-pointer">
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
          <Button variant="outline" onClick={handleBack} className="cursor-pointer">
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Configurar encuadre</h1>
          <p className="text-sm text-muted-foreground">
            Completa la información del curso antes de guardar.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos de la materia</CardTitle>
            <CardDescription>Campos de solo lectura</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Label className="mb-2 block">Clave</Label>
              <Input value={materia?.clave ?? ""} disabled />
            </div>
            <div className="sm:col-span-8">
              <Label className="mb-2 block">Nombre</Label>
              <Input value={materia?.nombre ?? ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración del curso</CardTitle>
            <CardDescription>Asigna profesor, periodo y grupo</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-6">
              <Label className="mb-2 block">Profesor</Label>
              <Select
                value={profesorId}
                onValueChange={setProfesorId}
                disabled={loading || profesores.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loading ? "Cargando..." : "Seleccione un profesor"} />
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

            <div className="sm:col-span-3">
              <Label className="mb-2 block">Periodo</Label>
              <Input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="2025-1"
              />
            </div>

            <div className="sm:col-span-3">
              <Label className="mb-2 block">Grupo</Label>
              <Input
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                placeholder="301"
              />
            </div>

            <div className="sm:col-span-12 flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleBack} className="cursor-pointer">
                Cancelar
              </Button>
              <Button
                className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
                onClick={handleGuardar}
                disabled={loading || !profesorId || !periodo || !grupo}
              >
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
