import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { correo, encuadreId, profesorId, clave } = body;

    // Validaciones
    if (!correo || !encuadreId || !profesorId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const correoLimpio = correo.trim().toLowerCase();

    // Verificar si el correo existe
    const { data: usuarioExistente, error: errorBuscarUsuario } =
      await supabaseAdmin
        .from("usuarios")
        .select("id, rol_id, roles(nombre)")
        .eq("correo", correoLimpio)
        .single();

    if (errorBuscarUsuario || !usuarioExistente) {
      return NextResponse.json(
        { error: "No se encontró un usuario con este correo electrónico" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga rol de alumno
    const rolNombre = (usuarioExistente as any).roles?.nombre;
    if (rolNombre !== "alumno") {
      return NextResponse.json(
        { error: "El usuario existe pero no tiene el rol de alumno" },
        { status: 400 }
      );
    }

    // Verificar si ya está agregado a este encuadre
    const { data: relacionExistente } = await supabaseAdmin
      .from("encuadre_alumnos")
      .select("id")
      .eq("encuadre_id", encuadreId)
      .eq("alumno_id", usuarioExistente.id)
      .single();

    if (relacionExistente) {
      return NextResponse.json(
        { error: "El alumno ya está registrado en este curso" },
        { status: 409 }
      );
    }

    // Calcular fecha de expiración (7 días)
    const expiraAt = new Date();
    expiraAt.setDate(expiraAt.getDate() + 7);

    // Si se proporciona una clave, actualizar la contraseña del usuario
    if (clave && clave.trim() !== "") {
      const claveHasheada = await bcrypt.hash(clave, 12);
      const { error: errorPassword } = await supabaseAdmin
        .from("usuarios")
        .update({
          contraseña: claveHasheada,
          debe_cambiar_password: true,
          password_expira_at: expiraAt.toISOString(),
        })
        .eq("id", usuarioExistente.id);

      if (errorPassword) {
        console.error("Error al actualizar contraseña:", errorPassword);
        return NextResponse.json(
          { error: "Error al actualizar la contraseña del usuario" },
          { status: 500 }
        );
      }
    }

    // Crear la relación encuadre-alumno
    const { error: errorRelacion } = await supabaseAdmin
      .from("encuadre_alumnos")
      .insert({
        encuadre_id: encuadreId,
        alumno_id: usuarioExistente.id,
        estado: "pendiente",
        clave_expira_at: expiraAt.toISOString(),
        invitado_por: profesorId,
      });

    if (errorRelacion) {
      console.error("Error al crear relación:", errorRelacion);
      return NextResponse.json(
        { error: "Error al agregar al alumno al curso" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alumnoId: usuarioExistente.id,
      message: clave
        ? "Alumno agregado al curso y clave actualizada exitosamente"
        : "Alumno agregado al curso exitosamente",
      claveGenerada: clave || null,
    });
  } catch (error) {
    console.error("Error en agregar alumno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
