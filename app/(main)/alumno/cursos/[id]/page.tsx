"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText, ClipboardList } from "lucide-react";
import EncuadreViewTab from "./EncuadreViewTab";
import AvancesTab from "./AvancesTab";

type CursoInfo = {
  encuadreId: string;
  materiaClave: string;
  materiaNombre: string;
  grupo: string;
  periodo: string;
  docente: string;
};

export default function CursoAlumnoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const encuadreId = params.id as string;

  const [cursoInfo, setCursoInfo] = useState<CursoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("encuadre");

  useEffect(() => {
    if (session?.user?.id && encuadreId) {
      cargarInfoCurso();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, encuadreId]);

  const cargarInfoCurso = async () => {
    setLoading(true);

    try {
      // Verificar que el alumno está inscrito en este encuadre
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

      // Obtener información del encuadre
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

      // Obtener programa y materia
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

      // Obtener docente
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
    } catch (err) {
      console.error("Error:", err);
    }

    setLoading(false);
  };

  if (loading) {
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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/alumno/cursos")}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {cursoInfo.materiaNombre}
            </h1>
            <p className="text-gray-600">
              {cursoInfo.materiaClave} • Grupo {cursoInfo.grupo} • {cursoInfo.periodo} • {cursoInfo.docente}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="encuadre" className="flex items-center gap-2 cursor-pointer">
              <FileText className="h-4 w-4" />
              Encuadre
            </TabsTrigger>
            <TabsTrigger value="avances" className="flex items-center gap-2 cursor-pointer">
              <ClipboardList className="h-4 w-4" />
              Registro de Avances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encuadre" className="mt-6">
            <EncuadreViewTab
              encuadreId={encuadreId}
              materiaNombre={cursoInfo.materiaNombre}
              docente={cursoInfo.docente}
            />
          </TabsContent>

          <TabsContent value="avances" className="mt-6">
            <AvancesTab
              encuadreId={encuadreId}
              grupo={cursoInfo.grupo}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}