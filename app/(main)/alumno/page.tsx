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
  ClipboardList,
  ArrowRight,
  CheckCircle,
  FileText,
} from "lucide-react";

export default function AlumnoPage() {
  const { data: session } = useSession();

  const nombreUsuario = session?.user?.name || "Alumno";

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
              Siga las instrucciones a continuación para consultar sus encuadres
              y registrar sus avances
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
                  <strong>&quot;Mis Cursos&quot;</strong>. Se mostrará la lista
                  de todos los cursos en los que está inscrito para el periodo
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
                  Haga clic en el curso que desea consultar. Dentro de cada
                  curso encontrará dos secciones principales organizadas en
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
                  Consulte y registre información
                </h3>

                <div className="grid gap-3">
                  {/* Encuadre */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Encuadre</h4>
                      <p className="text-gray-600 text-sm">
                        Revise la información del encuadre: criterios de
                        evaluación, bibliografía, normas de conducta y
                        requisitos para exámenes ordinario y extraordinario.
                        Debe firmar de enterado antes de poder acceder al
                        Registro de Avances.
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
                      <p className="text-gray-600 text-sm">
                        Registre su avance en los temas del curso. Marque los
                        temas que ya ha estudiado. Si marca &quot;No&quot;,
                        puede agregar una observación explicando por qué.
                        Recuerde guardar sus cambios.
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
                    • Debe firmar el encuadre antes de poder registrar sus
                    avances.
                  </li>
                  <li>
                    • Revise cuidadosamente los criterios de evaluación antes de
                    firmar.
                  </li>
                  <li>
                    • Mantenga actualizado su registro de avances durante todo
                    el periodo.
                  </li>
                  <li>
                    • Si marca un tema como &quot;No estudiado&quot;, agregue
                    una observación explicando el motivo.
                  </li>
                  <li>
                    • Para cualquier duda o soporte técnico, contacte a su
                    profesor o al administrador del sistema.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceso rápido */}
        <div className="text-center">
          <Link
            href="/alumno/cursos"
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
