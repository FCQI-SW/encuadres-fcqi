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
    const { usuarios } = body;

    // Validaciones
    if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de usuarios" },
        { status: 400 }
      );
    }

    const usuariosCreados = [];
    const errores = [];

    // Procesar cada usuario
    for (const usuario of usuarios) {
      const { correo, nombre, contraseña, rol_id } = usuario;

      if (!correo || !nombre || !contraseña || !rol_id) {
        errores.push({
          correo: correo || "N/A",
          error: "Faltan campos requeridos",
        });
        continue;
      }

      const correoLimpio = correo.trim().toLowerCase();

      // Verificar si el correo ya existe
      const { data: usuarioExistente } = await supabaseAdmin
        .from("usuarios")
        .select("id")
        .eq("correo", correoLimpio)
        .single();

      if (usuarioExistente) {
        errores.push({
          correo: correoLimpio,
          error: "Ya existe un usuario con este correo",
        });
        continue;
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
        errores.push({
          correo: correoLimpio,
          error: errorUsuario.message,
        });
        continue;
      }

      usuariosCreados.push(nuevoUsuario);
    }

    return NextResponse.json({
      success: true,
      creados: usuariosCreados.length,
      errores: errores.length,
      detalles: {
        usuariosCreados,
        errores,
      },
    });
  } catch (error) {
    console.error("Error en crear usuarios masivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

