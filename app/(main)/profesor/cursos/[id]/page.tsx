"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Loader2,
  BookOpen,
  Users,
  ClipboardList,
  ShieldCheck,
  Lock,
  AlertCircle,
} from "lucide-react";
import EncuadreTab from "./EncuadreTab";
import AlumnosTab from "./AlumnosTab";
import AvancesTab from "./AvancesTab";
import {
  usePermisoOperacion,
  type PermisoOperacion,
} from "@/hooks/usePermisoOperacion";

type CursoInfo = {
  encuadre_id: string;
  materia_clave: string;
  materia_nombre: string;
  grupo: string;
  periodo: string;
};

const permisoDefault: PermisoOperacion = {
  puede_ver: true,
  dentro_ventana_global: false,
  tiene_permiso_especial: false,
  solo_lectura: false,
  puede_editar_encuadre: false,
  puede_gestionar_alumnos: false,
  puede_firmar: false,
  puede_registrar_avances: false,
  motivo: "",
};

export default function CursoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const encuadreId = params.id as string;
  const { data: session } = useSession();
  const { validarPermiso, loadingPermiso } = usePermisoOperacion();

  const [cursoInfo, setCursoInfo] = useState<CursoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("encuadre");
  const [permisoOperacion, setPermisoOperacion] =
    useState<PermisoOperacion>(permisoDefault);

  useEffect(() => {
    if (encuadreId && session?.user?.id) {
      cargarInfoCurso();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadreId, session?.user?.id]);

  const cargarInfoCurso = async () => {
    setLoading(true);

    try {
      const { data: encuadre, error: errorEncuadre } = await supabase
        .from("encuadres")
        .select("id, programa_id, grupo, periodo, usuario_id")
        .eq("id", encuadreId)
        .single();

      if (errorEncuadre || !encuadre) {
        console.error("Error al obtener encuadre:", errorEncuadre);
        setLoading(false);
        return;
      }

      if (encuadre.usuario_id !== session?.user?.id) {
        console.error("No tienes permiso para ver este curso");
        router.push("/profesor/cursos");
        return;
      }

      const { data: programa } = await supabase
        .from("programas")
        .select("id, materia_id")
        .eq("id", encuadre.programa_id)
        .single();

      const { data: materia } = await supabase
        .from("materias")
        .select("clave, nombre_materia")
        .eq("id", programa?.materia_id)
        .single();

      setCursoInfo({
        encuadre_id: encuadre.id,
        materia_clave: materia?.clave || "N/A",
        materia_nombre: materia?.nombre_materia || "Sin información",
        grupo: encuadre.grupo,
        periodo: encuadre.periodo,
      });

      const permiso = await validarPermiso(encuadreId, "profesor");
      setPermisoOperacion(permiso || permisoDefault);
    } catch (err) {
      console.error("Error:", err);
    }

    setLoading(false);
  };

  const handleTabChange = (value: string) => {
    if (value === "alumnos" && !permisoOperacion.puede_gestionar_alumnos) {
      return;
    }

    setActiveTab(value);
  };

  const mostrarAvisoCierre =
    !permisoOperacion.dentro_ventana_global &&
    !permisoOperacion.tiene_permiso_especial;

  const mostrarAvisoEspecial =
    !permisoOperacion.dentro_ventana_global &&
    permisoOperacion.tiene_permiso_especial;

  if (loading || loadingPermiso) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  if (!cursoInfo) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Curso no encontrado
          </h1>
          <Button
            variant="outline"
            onClick={() => router.push("/profesor/cursos")}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar a Mis Cursos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/profesor/cursos")}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar a Mis Cursos
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {cursoInfo.materia_clave} - {cursoInfo.materia_nombre}
          </h1>
          <p className="text-gray-600 mt-1">
            Grupo {cursoInfo.grupo} • Periodo {cursoInfo.periodo}
          </p>
        </div>

        {mostrarAvisoCierre && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">
                  Periodo general cerrado
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Puedes consultar el curso, pero no puedes operar acciones de
                  edición porque el periodo general está cerrado y este encuadre
                  no tiene un permiso especial activo.
                </p>
              </div>
            </div>
          </div>
        )}

        {mostrarAvisoEspecial && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">
                  Acceso especial habilitado
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Este encuadre tiene un permiso especial fuera del periodo general.
                  {permisoOperacion.motivo
                    ? ` Motivo: ${permisoOperacion.motivo}`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {permisoOperacion.solo_lectura && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">Modo solo lectura</p>
                <p className="text-sm text-blue-700 mt-1">
                  Puedes revisar la información del curso, pero no realizar cambios.
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger
              value="encuadre"
              className="flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="h-4 w-4" />
              Encuadre
            </TabsTrigger>

            <TabsTrigger
              value="avances"
              className="flex items-center gap-2 cursor-pointer"
            >
              <ClipboardList className="h-4 w-4" />
              Registro de Avances
            </TabsTrigger>

            <TabsTrigger
              value="alumnos"
              disabled={!permisoOperacion.puede_gestionar_alumnos}
              className={`flex items-center gap-2 ${
                !permisoOperacion.puede_gestionar_alumnos
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
              title={
                !permisoOperacion.puede_gestionar_alumnos
                  ? "No tienes permiso para gestionar alumnos en este momento"
                  : ""
              }
            >
              <Users className="h-4 w-4" />
              Alumnos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encuadre">
            <EncuadreTab
              encuadreId={encuadreId}
              puedeEditar={
                permisoOperacion.puede_editar_encuadre &&
                !permisoOperacion.solo_lectura
              }
              motivoPermiso={permisoOperacion.motivo}
            />
          </TabsContent>

          <TabsContent value="avances">
            <AvancesTab
              encuadreId={encuadreId}
              materiaNombre={cursoInfo.materia_nombre}
              grupo={cursoInfo.grupo}
              periodo={cursoInfo.periodo}
              puedeEditar={
                permisoOperacion.puede_registrar_avances &&
                !permisoOperacion.solo_lectura
              }
              motivoPermiso={permisoOperacion.motivo}
            />
          </TabsContent>

          <TabsContent value="alumnos">
            {permisoOperacion.puede_gestionar_alumnos ? (
              <AlumnosTab
                encuadreId={encuadreId}
                materiaNombre={cursoInfo.materia_nombre}
                grupo={cursoInfo.grupo}
                periodo={cursoInfo.periodo}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg font-semibold mb-2">
                  Gestión de alumnos no disponible
                </p>
                <p className="text-sm">
                  No tienes permiso para administrar alumnos en este encuadre en este momento.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}