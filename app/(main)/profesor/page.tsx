"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GraduationCap,
  BookOpen,
  Users,
  ClipboardList,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function ProfesorPage() {
  const { data: session } = useSession();

  const nombreUsuario = session?.user?.name || "Profesor";

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Bienvenida */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Bienvenido(a), {nombreUsuario}
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema de Gestión de Encuadres - Facultad de Ciencias Químicas e
            Ingeniería
          </p>
        </div>

        {/* Instrucciones principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#00723F]" />
              ¿Cómo utilizar el sistema?
            </CardTitle>
            <CardDescription>
              Siga las instrucciones a continuación para gestionar sus cursos de
              manera eficiente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Paso 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#00723F] text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  Acceda a &quot;Mis Cursos&quot;
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  En la barra lateral izquierda, seleccione la opción{" "}
                  <strong>&quot;Mis Cursos&quot;</strong>. Se mostrará la lista de
                  todas las materias que le han sido asignadas para el periodo
                  actual.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#00723F] text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  Seleccione un curso
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Haga clic en el curso que desea gestionar. Dentro de cada
                  curso encontrará tres secciones principales organizadas en
                  pestañas.
                </p>
              </div>
            </div>

            {/* Paso 3 - Secciones */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#00723F] text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Gestione las secciones del curso
                </h3>

                <div className="grid gap-3">
                  {/* Encuadre */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Encuadre</h4>
                      <p className="text-gray-600 text-sm">
                        Revise y edite la información del encuadre: criterios de
                        evaluación, bibliografía, normas de conducta y
                        requisitos para exámenes ordinario y extraordinario.
                      </p>
                    </div>
                  </div>

                  {/* Alumnos */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Alumnos</h4>
                      <p className="text-gray-600 text-sm">
                        Registre a los alumnos de su curso mediante su correo
                        institucional. El sistema generará credenciales de
                        acceso que podrá enviar a cada estudiante para que
                        puedan consultar el encuadre y registrar sus avances.
                      </p>
                    </div>
                  </div>

                  {/* Registro de Avances */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Registro de Avances
                      </h4>
                      <p className="text-gray-600 text.sm">
                        Lleve el control del avance programático de su curso.
                        Registre los temas cubiertos en cada sesión y dé
                        seguimiento al cumplimiento del programa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="border-[#00723F]/30 bg-[#00723F]/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  Recomendaciones
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • Complete la información del encuadre antes de registrar
                    alumnos.
                  </li>
                  <li>
                    • Verifique que los correos de los alumnos sean
                    institucionales (@uabc.edu.mx).
                  </li>
                  <li>
                    • Guarde sus cambios frecuentemente para evitar pérdida de
                    información.
                  </li>
                  <li>
                    • Para cualquier duda o soporte técnico, contacte al
                    administrador del sistema.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceso rápido */}
        <div className="text-center">
          <Link
            href="/profesor/cursos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00723F] text-white rounded-lg hover:bg-[#005e30] transition-colors font-medium"
          >
            Ir a Mis Cursos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
