// useTallerForm.ts
import { useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

export type PracticaTaller = {
  id?: string;
  unidad: number;
  numero: number;
  competencia: string;
  descripcion: string;
  material_apoyo: string;
  duracion: number;
};

export function useTallerForm(programaId: string) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const guardarPracticas = async (practicas: PracticaTaller[]): Promise<boolean> => {
    setLoading(true);

    try {
      if (!session?.user?.id || !programaId) {
        console.error("Faltan datos de sesión o programa");
        setLoading(false);
        return false;
      }

      const userId = session.user.id;

      // Eliminar prácticas existentes
      await supabase
        .from("practicas_taller")
        .delete()
        .eq("programa_id", programaId);

      // Insertar nuevas prácticas
      if (practicas.length > 0) {
        const { error } = await supabase
          .from("practicas_taller")
          .insert(
            practicas.map((p) => ({
              programa_id: programaId,
              unidad: p.unidad,
              numero: p.numero,
              competencia: p.competencia,
              descripcion: p.descripcion,
              material_apoyo: p.material_apoyo,
              duracion: p.duracion,
            }))
          );

        if (error) {
          console.error("Error al guardar prácticas:", error);
          setLoading(false);
          return false;
        }
      }

      // Actualizar auditoría en el PUA
      const { error: errorAuditoria } = await supabase
        .from("programas")
        .update({
          ultimo_editor_id: userId,
          ultima_edicion: new Date().toISOString(),
        })
        .eq("id", programaId);

      if (errorAuditoria) {
        console.error("Error al actualizar auditoría del PUA:", errorAuditoria);
        // No retornamos false aquí porque las prácticas sí se guardaron
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error en guardarPracticas:", err);
      setLoading(false);
      return false;
    }
  };

  const cargarPracticas = async (): Promise<PracticaTaller[]> => {
    if (!programaId) return [];

    try {
      const { data, error } = await supabase
        .from("practicas_taller")
        .select("*")
        .eq("programa_id", programaId)
        .order("unidad", { ascending: true })
        .order("numero", { ascending: true });

      if (error) {
        console.error("Error al cargar prácticas:", error);
        return [];
      }

      return (data || []).map((p: any) => ({
        id: p.id,
        unidad: p.unidad,
        numero: p.numero,
        competencia: p.competencia,
        descripcion: p.descripcion,
        material_apoyo: p.material_apoyo,
        duracion: p.duracion,
      }));
    } catch (err) {
      console.error("Error en cargarPracticas:", err);
      return [];
    }
  };

  return {
    guardarPracticas,
    cargarPracticas,
    loading,
  };
}