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
    const { correo, nombre, contraseña, rol_id } = body;

    // Validaciones
    if (!correo || !nombre || !contraseña || !rol_id) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const correoLimpio = correo.trim().toLowerCase();

    // Verificar si el correo ya existe
    const { data: usuarioExistente } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("correo", correoLimpio)
      .single();

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este correo electrónico" },
        { status: 409 }
      );
    }

    // Hashear la contraseña
    const contraseñaHasheada = await bcrypt.hash(contraseña, 12);

    // Crear el usuario
    const { data: nuevoUsuario, error: errorUsuario } = await supabaseAdmin
      .from("usuarios")
      .insert({
        correo: correoLimpio,
        nombre: nombre.trim(),
        contraseña: contraseñaHasheada,
        rol_id: rol_id,
      })
      .select("id, correo, nombre")
      .single();

    if (errorUsuario) {
      console.error("Error al crear usuario:", errorUsuario);
      return NextResponse.json(
        { error: "Error al crear el usuario: " + errorUsuario.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario: nuevoUsuario,
    });
  } catch (error) {
    console.error("Error en crear usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
