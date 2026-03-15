"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronLeft,
  FileText,
  ClipboardList,
  AlertCircle,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import EncuadreViewTab from "./EncuadreViewTab";
import AvancesTab from "./AvancesTab";
import { usePermisoOperacion, type PermisoOperacion } from "@/hooks/usePermisoOperacion";

type CursoInfo = {
  encuadreId: string;
  materiaClave: string;
  materiaNombre: string;
  grupo: string;
  periodo: string;
  docente: string;
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

export default function CursoAlumnoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  const { validarPermiso, loadingPermiso } = usePermisoOperacion();
  const encuadreId = params.id as string;

  const [cursoInfo, setCursoInfo] = useState<CursoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("encuadre");
  const [haFirmado, setHaFirmado] = useState(false);
  const [verificandoFirma, setVerificandoFirma] = useState(true);
  const [permisoOperacion, setPermisoOperacion] =
    useState<PermisoOperacion>(permisoDefault);

  useEffect(() => {
    if (session?.user?.id && encuadreId) {
      cargarInfoCurso();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, encuadreId]);

  const cargarInfoCurso = async () => {
    setLoading(true);

    try {
      const { data: inscripcion, error: errorInscripcion } = await supabase
        .from("encuadre_alumnos")
        .select("id")
        .eq("encuadre_id", encuadreId)
        .eq("alumno_id", session?.user?.id)
        .neq("estado", "revocada")
        .single();

      if (errorInscripcion || !inscripcion) {
        console.error("No tienes acceso a este curso");
        router.push("/alumno/cursos");
        return;
      }

      const { data: encuadre, error: errorEncuadre } = await supabase
        .from("encuadres")
        .select("id, programa_id, grupo, periodo, usuario_id")
        .eq("id", encuadreId)
        .single();

      if (errorEncuadre || !encuadre) {
        console.error("Error al cargar encuadre:", errorEncuadre);
        router.push("/alumno/cursos");
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

      const { data: docente } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("id", encuadre.usuario_id)
        .single();

      setCursoInfo({
        encuadreId: encuadre.id,
        materiaClave: materia?.clave || "N/A",
        materiaNombre: materia?.nombre_materia || "Sin información",
        grupo: encuadre.grupo,
        periodo: encuadre.periodo,
        docente: docente?.nombre || "Sin asignar",
      });

      const { data: firmaExistente } = await supabase
        .from("encuadre_firmas")
        .select("id")
        .eq("encuadre_id", encuadreId)
        .eq("alumno_id", session?.user?.id)
        .maybeSingle();

      setHaFirmado(!!firmaExistente);

      const permiso = await validarPermiso(encuadreId, "alumno");
      setPermisoOperacion(permiso || permisoDefault);
    } catch (err) {
      console.error("Error:", err);
    }

    setLoading(false);
    setVerificandoFirma(false);
  };

  const handleTabChange = (value: string) => {
    if (value === "avances") {
      if (!haFirmado) {
        toast.warning(
          "Debes firmar el encuadre antes de acceder al Registro de Avances."
        );
        return;
      }

      if (!permisoOperacion.puede_registrar_avances) {
        toast.warning(
          "No tienes permiso para registrar avances en este curso en este momento."
        );
        return;
      }
    }

    setActiveTab(value);
  };

  const mostrarAvisoCierre =
    !permisoOperacion.dentro_ventana_global &&
    !permisoOperacion.tiene_permiso_especial;

  const mostrarAvisoEspecial =
    !permisoOperacion.dentro_ventana_global &&
    permisoOperacion.tiene_permiso_especial;

  if (loading || verificandoFirma || loadingPermiso) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  if (!cursoInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No se encontró el curso</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {cursoInfo.materiaNombre}
            </h1>
            <p className="text-gray-600">
              {cursoInfo.materiaClave} • Grupo {cursoInfo.grupo} •{" "}
              {cursoInfo.periodo} • {cursoInfo.docente}
            </p>
          </div>

          <div>
            <Button
              variant="outline"
              onClick={() => router.push("/alumno/cursos")}
              className="cursor-pointer"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Regresar a Mis Cursos
            </Button>
          </div>
        </div>

        {mostrarAvisoCierre && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">
                  Periodo de operación cerrado
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Puedes revisar la información del curso, pero no podrás firmar
                  ni registrar avances a menos que un administrador te habilite
                  un permiso especial.
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
                  Este curso tiene un permiso especial fuera del periodo general
                  de operación.
                  {permisoOperacion.motivo
                    ? ` Motivo: ${permisoOperacion.motivo}`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger
              value="encuadre"
              className="flex items-center gap-2 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              Encuadre
            </TabsTrigger>

            <TabsTrigger
              value="avances"
              disabled={!haFirmado || !permisoOperacion.puede_registrar_avances}
              className={`flex items-center gap-2 ${
                !haFirmado || !permisoOperacion.puede_registrar_avances
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
              title={
                !haFirmado
                  ? "Debes firmar el encuadre antes de acceder a Registro de Avances"
                  : !permisoOperacion.puede_registrar_avances
                  ? "No tienes permiso para registrar avances en este momento"
                  : ""
              }
            >
              <ClipboardList className="h-4 w-4" />
              Registro de Avances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encuadre" className="mt-6">
            {!haFirmado && !permisoOperacion.puede_firmar ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">
                      Firma no disponible
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      En este momento puedes consultar el curso, pero no puedes
                      firmar el encuadre porque el periodo general está cerrado
                      y no tienes un permiso especial de firma.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <EncuadreViewTab
              encuadreId={encuadreId}
              materiaNombre={cursoInfo.materiaNombre}
              docente={cursoInfo.docente}
              onFirmaCompletada={() => {
                setHaFirmado(true);
                if (permisoOperacion.puede_registrar_avances) {
                  setActiveTab("avances");
                } else {
                  setActiveTab("encuadre");
                  toast.info(
                    "Tu firma se registró correctamente, pero no tienes permiso para registrar avances en este momento."
                  );
                }
              }}
            />
          </TabsContent>

          <TabsContent value="avances" className="mt-6">
            {!haFirmado ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg font-semibold mb-2">
                  Debes firmar el encuadre primero
                </p>
                <p className="text-sm">
                  Ve a la pestaña "Encuadre" y firma de enterado antes de
                  acceder al Registro de Avances.
                </p>
              </div>
            ) : !permisoOperacion.puede_registrar_avances ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg font-semibold mb-2">
                  Registro de avances no disponible
                </p>
                <p className="text-sm">
                  No tienes permiso para registrar avances en este curso en este
                  momento.
                </p>
              </div>
            ) : (
              <AvancesTab encuadreId={encuadreId} grupo={cursoInfo.grupo} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}