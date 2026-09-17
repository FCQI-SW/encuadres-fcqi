import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

export type PracticaLaboratorio = {
  id?: string;
  unidad: number;
  numero: number;
  competencia: string;
  descripcion: string;
  material_apoyo: string;
  duracion: number;
};

export function useLaboratorioForm(programaId: string) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  // ── FIX: useCallback para evitar stale closure en useEffect ──
  // Sin useCallback, cargarPracticas/guardarPracticas son funciones
  // nuevas en cada render. El useEffect de la página las captura en
  // el primer render cuando programaId todavía es "", por lo que
  // aunque el programa cargue después, siguen consultando con "".
  const guardarPracticas = useCallback(
    async (practicas: PracticaLaboratorio[]): Promise<boolean> => {
      setLoading(true);

      try {
        if (!session?.user?.id || !programaId) {
          console.error("Faltan datos de sesión o programa");
          setLoading(false);
          return false;
        }

        const userId = session.user.id;

        await supabase
          .from("practicas_laboratorio")
          .delete()
          .eq("programa_id", programaId);

        if (practicas.length > 0) {
          const { error } = await supabase
            .from("practicas_laboratorio")
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
            console.error("Error al guardar prácticas de laboratorio:", error);
            setLoading(false);
            return false;
          }
        }

        const { error: errorAuditoria } = await supabase
          .from("programas")
          .update({
            ultimo_editor_id: userId,
            ultima_edicion: new Date().toISOString(),
          })
          .eq("id", programaId);

        if (errorAuditoria) {
          console.error("Error al actualizar auditoría del PUA:", errorAuditoria);
        }

        setLoading(false);
        return true;
      } catch (err) {
        console.error("Error en guardarPracticas laboratorio:", err);
        setLoading(false);
        return false;
      }
    },
    [programaId, session?.user?.id]
  );

  const cargarPracticas = useCallback(
    async (): Promise<PracticaLaboratorio[]> => {
      if (!programaId) return [];

      try {
        const { data, error } = await supabase
          .from("practicas_laboratorio")
          .select("*")
          .eq("programa_id", programaId)
          .order("unidad", { ascending: true })
          .order("numero", { ascending: true });

        if (error) {
          console.error("Error al cargar prácticas de laboratorio:", error);
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
        console.error("Error en cargarPracticas laboratorio:", err);
        return [];
      }
    },
    [programaId]
  );

  return {
    guardarPracticas,
    cargarPracticas,
    loading,
  };
}