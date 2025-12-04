import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clave de servicio para operaciones admin
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { correo, clave, encuadreId, profesorId, materiaNombre, grupo, periodo } = body;

    // Validaciones
    if (!correo || !clave || !encuadreId || !profesorId) {
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
        { error: "Ya existe un usuario registrado con este correo electrónico" },
        { status: 409 }
      );
    }

    // Obtener el rol de Alumno
    const { data: rolAlumno, error: errorRol } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("nombre", "Alumno")
      .single();

    if (errorRol || !rolAlumno) {
      return NextResponse.json(
        { error: "No se encontró el rol de Alumno en el sistema" },
        { status: 500 }
      );
    }

    // Hashear la contraseña
    const claveHasheada = await bcrypt.hash(clave, 12);

    // Calcular fecha de expiración (7 días)
    const expiraAt = new Date();
    expiraAt.setDate(expiraAt.getDate() + 7);

    // Crear el usuario
    const { data: nuevoUsuario, error: errorUsuario } = await supabaseAdmin
      .from("usuarios")
      .insert({
        correo: correoLimpio,
        contraseña: claveHasheada,
        nombre: correoLimpio.split("@")[0], // Nombre temporal basado en el correo
        rol_id: rolAlumno.id,
        debe_cambiar_password: true,
        password_expira_at: expiraAt.toISOString(),
      })
      .select("id")
      .single();

    if (errorUsuario) {
      console.error("Error al crear usuario:", errorUsuario);
      return NextResponse.json(
        { error: "Error al crear el usuario" },
        { status: 500 }
      );
    }

    // Crear la relación encuadre-alumno
    const { error: errorRelacion } = await supabaseAdmin
      .from("encuadre_alumnos")
      .insert({
        encuadre_id: encuadreId,
        alumno_id: nuevoUsuario.id,
        estado: "pendiente",
        clave_expira_at: expiraAt.toISOString(),
        invitado_por: profesorId,
      });

    if (errorRelacion) {
      // Si falla, eliminar el usuario creado
      await supabaseAdmin.from("usuarios").delete().eq("id", nuevoUsuario.id);
      console.error("Error al crear relación:", errorRelacion);
      return NextResponse.json(
        { error: "Error al registrar al alumno en el encuadre" },
        { status: 500 }
      );
    }

    // Agregar correo a la cola de envío
    const { error: errorCorreo } = await supabaseAdmin
      .from("email_outbox")
      .insert({
        user_id: nuevoUsuario.id,
        email: correoLimpio,
        subject: `Acceso al Sistema ENCUADRES-FCQI - ${materiaNombre}`,
        body: generarCuerpoCorreo(correoLimpio, clave, materiaNombre, grupo, periodo),
        status: "pending",
      });

    if (errorCorreo) {
      console.error("Error al encolar correo:", errorCorreo);
      // No es crítico, continuamos
    }

    return NextResponse.json({
      success: true,
      alumnoId: nuevoUsuario.id,
      message: "Alumno registrado exitosamente",
    });
  } catch (error) {
    console.error("Error en registro de alumno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

function generarCuerpoCorreo(
  correo: string,
  clave: string,
  materia: string,
  grupo: string,
  periodo: string
): string {
  return `
¡Bienvenido al Sistema ENCUADRES-FCQI!

Se te ha registrado en el curso:
- Materia: ${materia}
- Grupo: ${grupo}
- Periodo: ${periodo}

Tus credenciales de acceso son:
- Correo: ${correo}
- Contraseña temporal: ${clave}

IMPORTANTE:
- Esta contraseña es temporal y expira en 7 días.
- Al ingresar por primera vez, deberás cambiarla.
- No compartas esta información con nadie.

Para acceder al sistema, visita:
[URL del sistema]

Si tienes problemas para acceder, contacta a tu profesor o al soporte técnico.

---
Sistema ENCUADRES-FCQI
Facultad de Ciencias Químicas e Ingeniería
Universidad Autónoma de Baja California
  `.trim();
}