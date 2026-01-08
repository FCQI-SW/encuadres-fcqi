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
  FileEdit,
  BookOpen,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function CapturistaPage() {
  const { data: session } = useSession();

  const nombreUsuario = session?.user?.name || "Capturista";

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
              <FileEdit className="h-5 w-5 text-[#00723F]" />
              ¿Cómo utilizar el sistema?
            </CardTitle>
            <CardDescription>
              Siga las instrucciones a continuación para capturar la información
              de las materias
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
                  Acceda a &quot;Materias&quot;
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  En la barra lateral izquierda, seleccione la opción{" "}
                  <strong>&quot;Materias&quot;</strong>. Se mostrará la lista de
                  todas las materias disponibles para captura en el periodo
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
                  Revise el estado de cada materia
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  En la tabla podrá ver el nombre del curso, la clave, la última
                  edición realizada y el estado de captura. Los estados pueden
                  ser <strong className="text-green-600">Completo</strong> o{" "}
                  <strong className="text-orange-600">Pendiente</strong>.
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
                  Complete la información de cada materia
                </h3>

                <div className="grid gap-3">
                  {/* Encuadre */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Ver Encuadre
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Capture los criterios de evaluación, bibliografía, normas
                        de conducta y requisitos para exámenes ordinario y
                        extraordinario según la información proporcionada por el
                        profesor.
                      </p>
                    </div>
                  </div>

                  {/* PUA */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Ver PUA
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Capture el Programa de Unidad de Aprendizaje (PUA) con
                        las unidades temáticas y contenidos de la materia.
                        Verifique que corresponda con el programa oficial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#00723F] text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  Guarde los cambios
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Una vez completada la captura, asegúrese de guardar los
                  cambios. El sistema registrará la fecha, hora y usuario que
                  realizó la última edición.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advertencia */}
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">
                  Importante
                </h3>
                <p className="text-sm text-yellow-700">
                  Como capturista, usted puede editar la información del
                  encuadre y el PUA, pero no puede registrar alumnos ni avances.
                  Estas funciones están reservadas para el profesor asignado al
                  curso.
                </p>
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
                    • Verifique la información con el profesor antes de
                    capturar.
                  </li>
                  <li>
                    • Utilice el filtro de progreso para identificar materias
                    pendientes.
                  </li>
                  <li>
                    • Guarde sus cambios frecuentemente para evitar pérdida de
                    información.
                  </li>
                  <li>
                    • Para cualquier duda, contacte al administrador del
                    sistema.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceso rápido */}
        <div className="text-center">
          <Link
            href="/capturista/materias"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00723F] text-white rounded-lg hover:bg-[#005e30] transition-colors font-medium"
          >
            Ir a Materias
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}