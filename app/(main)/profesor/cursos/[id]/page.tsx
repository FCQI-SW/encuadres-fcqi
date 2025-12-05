"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Loader2, BookOpen, Users, ClipboardList } from "lucide-react";
import EncuadreTab from "./EncuadreTab";
import AlumnosTab from "./AlumnosTab";
import AvancesTab from "./AvancesTab";

type CursoInfo = {
  encuadre_id: string;
  materia_clave: string;
  materia_nombre: string;
  grupo: string;
  periodo: string;
};

export default function CursoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const encuadreId = params.id as string;
  const { data: session } = useSession();

  const [cursoInfo, setCursoInfo] = useState<CursoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("encuadre");

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
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Curso no encontrado
          </h1>
          <Button
            variant="outline"
            onClick={() => router.push("/profesor/cursos")}
          >
            Regresar a Mis Cursos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Botón regresar */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/profesor/cursos")}
            className="-ml-2 cursor-pointer"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Regresar a Mis Cursos
          </Button>
        </div>

        {/* Header centrado */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {cursoInfo.materia_clave} - {cursoInfo.materia_nombre}
          </h1>
          <p className="text-gray-600 mt-1">
            Grupo {cursoInfo.grupo} • Periodo {cursoInfo.periodo}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="encuadre" className="flex items-center gap-2 cursor-pointer">
              <BookOpen className="h-4 w-4" />
              Encuadre
            </TabsTrigger>
            <TabsTrigger value="avances" className="flex items-center gap-2 cursor-pointer">
              <ClipboardList className="h-4 w-4" />
              Registro de Avances
            </TabsTrigger>
            <TabsTrigger value="alumnos" className="flex items-center gap-2 cursor-pointer">
              <Users className="h-4 w-4" />
              Alumnos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encuadre">
            <EncuadreTab encuadreId={encuadreId} />
          </TabsContent>

          <TabsContent value="avances">
            <AvancesTab
              encuadreId={encuadreId}
              materiaNombre={cursoInfo.materia_nombre}
              grupo={cursoInfo.grupo}
              periodo={cursoInfo.periodo}
            />
          </TabsContent>

          <TabsContent value="alumnos">
            <AlumnosTab
              encuadreId={encuadreId}
              materiaNombre={cursoInfo.materia_nombre}
              grupo={cursoInfo.grupo}
              periodo={cursoInfo.periodo}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}