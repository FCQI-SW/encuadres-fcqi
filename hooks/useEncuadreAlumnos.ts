import { useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { generarClaveSegura, validarCorreoInstitucional, validarFortalezaClave } from "@/lib/password-generator";

export type AlumnoEncuadre = {
  id: string;
  alumno_id: string;
  correo: string;
  nombre: string;
  estado: "pendiente" | "enviada" | "activa" | "revocada";
  invitado_at: string;
  correo_enviado_at: string | null;
  clave_expira_at: string | null;
  ultimo_acceso: string | null;
  reenvios: number;
};

export function useEncuadreAlumnos(encuadreId: string) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerAlumnos = async (): Promise<AlumnoEncuadre[]> => {
    if (!encuadreId) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error: errorQuery } = await supabase
        .from("encuadre_alumnos")
        .select(`
          id,
          alumno_id,
          estado,
          invitado_at,
          correo_enviado_at,
          clave_expira_at,
          ultimo_acceso,
          reenvios,
          usuarios:alumno_id (
            correo,
            nombre
          )
        `)
        .eq("encuadre_id", encuadreId)
        .order("invitado_at", { ascending: false });

      if (errorQuery) {
        console.error("Error al obtener alumnos:", errorQuery);
        setError("Error al cargar la lista de alumnos");
        setLoading(false);
        return [];
      }

      const alumnos: AlumnoEncuadre[] = (data || []).map((item: any) => ({
        id: item.id,
        alumno_id: item.alumno_id,
        correo: item.usuarios?.correo || "",
        nombre: item.usuarios?.nombre || "",
        estado: item.estado,
        invitado_at: item.invitado_at,
        correo_enviado_at: item.correo_enviado_at,
        clave_expira_at: item.clave_expira_at,
        ultimo_acceso: item.ultimo_acceso,
        reenvios: item.reenvios || 0,
      }));

      setLoading(false);
      return alumnos;
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado");
      setLoading(false);
      return [];
    }
  };

  const registrarAlumno = async (
    correo: string,
    clave: string,
    materiaNombre: string,
    grupo: string,
    periodo: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user?.id) {
      return { success: false, error: "No hay sesión activa" };
    }

    // Validar correo
    const validacionCorreo = validarCorreoInstitucional(correo);
    if (!validacionCorreo.valido) {
      return { success: false, error: validacionCorreo.error };
    }

    // Validar clave
    const validacionClave = validarFortalezaClave(clave);
    if (!validacionClave.valida) {
      return { success: false, error: "La clave no cumple con los requisitos de seguridad" };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/alumnos/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: correo.trim().toLowerCase(),
          clave,
          encuadreId,
          profesorId: session.user.id,
          materiaNombre,
          grupo,
          periodo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setLoading(false);
        return { success: false, error: data.error };
      }

      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error("Error:", err);
      setError("Error de conexión");
      setLoading(false);
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  const regenerarClave = async (
    alumnoId: string,
    correo: string,
    materiaNombre: string,
    grupo: string,
    periodo: string
  ): Promise<{ success: boolean; error?: string; clave?: string }> => {
    if (!session?.user?.id) {
      return { success: false, error: "No hay sesión activa" };
    }

    setLoading(true);

    try {
      const clave = generarClaveSegura(12);
      const bcrypt = await import("bcryptjs");
      const claveHasheada = await bcrypt.hash(clave, 12);

      const expiraAt = new Date();
      expiraAt.setDate(expiraAt.getDate() + 7);

      // Actualizar contraseña del usuario
      const { error: errorUpdate } = await supabase
        .from("usuarios")
        .update({
          contraseña: claveHasheada,
          debe_cambiar_password: true,
          password_expira_at: expiraAt.toISOString(),
        })
        .eq("id", alumnoId);

      if (errorUpdate) {
        setLoading(false);
        return { success: false, error: "Error al actualizar contraseña" };
      }

      // Actualizar estado en encuadre_alumnos
      await supabase
        .from("encuadre_alumnos")
        .update({
          estado: "pendiente",
          clave_expira_at: expiraAt.toISOString(),
        })
        .eq("encuadre_id", encuadreId)
        .eq("alumno_id", alumnoId);

      setLoading(false);
      return { success: true, clave };
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
      return { success: false, error: "Error inesperado" };
    }
  };

  const enviarCorreo = async (
    alumnoId: string,
    correo: string,
    clave: string,
    materiaNombre: string,
    grupo: string,
    periodo: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    try {
      // Verificar límite de reenvíos
      const { data: relacion } = await supabase
        .from("encuadre_alumnos")
        .select("reenvios")
        .eq("encuadre_id", encuadreId)
        .eq("alumno_id", alumnoId)
        .single();

      if (relacion && relacion.reenvios >= 3) {
        setLoading(false);
        return { success: false, error: "Se alcanzó el límite de 3 reenvíos por día" };
      }

      // Encolar correo
      const { error: errorCorreo } = await supabase.from("email_outbox").insert({
        user_id: alumnoId,
        email: correo,
        subject: `Acceso al Sistema ENCUADRES-FCQI - ${materiaNombre}`,
        body: `
¡Bienvenido al Sistema ENCUADRES-FCQI!

Materia: ${materiaNombre}
Grupo: ${grupo} | Periodo: ${periodo}

Credenciales:
- Correo: ${correo}
- Contraseña: ${clave}

La contraseña expira en 7 días. Cámbiala al ingresar.

---
ENCUADRES-FCQI | UABC
        `.trim(),
        status: "pending",
      });

      if (errorCorreo) {
        setLoading(false);
        return { success: false, error: "Error al encolar correo" };
      }

      // Actualizar estado y contador
      await supabase
        .from("encuadre_alumnos")
        .update({
          estado: "enviada",
          correo_enviado_at: new Date().toISOString(),
          reenvios: (relacion?.reenvios || 0) + 1,
        })
        .eq("encuadre_id", encuadreId)
        .eq("alumno_id", alumnoId);

      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
      return { success: false, error: "Error inesperado" };
    }
  };

  const revocarAcceso = async (alumnoId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("encuadre_alumnos")
        .update({ estado: "revocada" })
        .eq("encuadre_id", encuadreId)
        .eq("alumno_id", alumnoId);

      if (error) {
        setLoading(false);
        return { success: false, error: "Error al revocar acceso" };
      }

      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, error: "Error inesperado" };
    }
  };

  const reactivarAcceso = async (alumnoId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("encuadre_alumnos")
        .update({ estado: "enviada" })
        .eq("encuadre_id", encuadreId)
        .eq("alumno_id", alumnoId);

      if (error) {
        setLoading(false);
        return { success: false, error: "Error al reactivar acceso" };
      }

      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, error: "Error inesperado" };
    }
  };

  return {
    obtenerAlumnos,
    registrarAlumno,
    regenerarClave,
    enviarCorreo,
    revocarAcceso,
    reactivarAcceso,
    loading,
    error,
  };
}