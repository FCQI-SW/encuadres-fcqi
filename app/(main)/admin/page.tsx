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
  Shield,
  Users,
  BookOpen,
  Calendar,
  Megaphone,
  BarChart3,
  CheckCircle,
} from "lucide-react";

export default function AdminPage() {
  const { data: session } = useSession();

  const nombreUsuario = session?.user?.name || "Administrador";

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Bienvenida */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Bienvenido(a), {nombreUsuario}
          </h1>
          <p className="text-gray-600 mt-2">
            Panel de Administración - Sistema ENCUADRES-FCQI
          </p>
        </div>

        {/* Instrucciones principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#00723F]" />
              Panel de Administración
            </CardTitle>
            <CardDescription>
              Gestione todos los aspectos del sistema desde este panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Módulos disponibles */}
            <div className="grid gap-3">
              {/* Usuarios */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">Manejo de Usuarios</h4>
                  <p className="text-gray-600 text-sm">
                    Cree, edite y elimine usuarios del sistema. Asigne roles
                    (profesor, alumno, capturista, lector) y gestione permisos
                    de acceso.
                  </p>
                </div>
              </div>

              {/* Resultados */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">Revisión de Resultados</h4>
                  <p className="text-gray-600 text-sm">
                    Consulte las estadísticas de coincidencia entre profesores y
                    alumnos. Identifique discrepancias en el registro de avances
                    y genere reportes.
                  </p>
                </div>
              </div>

              {/* Materias */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">Manejo de Materias</h4>
                  <p className="text-gray-600 text-sm">
                    Administre el catálogo de materias. Agregue nuevas materias,
                    active o desactive las existentes y gestione la información
                    curricular.
                  </p>
                </div>
              </div>

              {/* Fecha de Operación */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">Fecha de Operación</h4>
                  <p className="text-gray-600 text-sm">
                    Establezca el periodo y horario de operación del sistema.
                    Defina cuándo los usuarios pueden acceder y registrar
                    información.
                  </p>
                </div>
              </div>

              {/* Anuncios */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Megaphone className="h-5 w-5 text-[#00723F] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">Anuncios</h4>
                  <p className="text-gray-600 text-sm">
                    Envíe comunicados a profesores, alumnos y personal. Programe
                    envíos por correo electrónico o notificaciones del sistema.
                  </p>
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
                    • Configure las fechas de operación antes de iniciar cada
                    periodo.
                  </li>
                  <li>
                    • Verifique que los usuarios tengan los roles correctos
                    asignados.
                  </li>
                  <li>
                    • Revise periódicamente los resultados para identificar
                    posibles problemas.
                  </li>
                  <li>
                    • Utilice los anuncios para comunicar información importante
                    a tiempo.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#00723F] text-white rounded-lg hover:bg-[#005e30] transition-colors font-medium"
          >
            <Users className="h-4 w-4" />
            Gestionar Usuarios
          </Link>
          <Link
            href="/admin/resultados"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#00723F] text-[#00723F] rounded-lg hover:bg-[#00723F]/10 transition-colors font-medium"
          >
            <BarChart3 className="h-4 w-4" />
            Ver Resultados
          </Link>
        </div>
      </div>
    </div>
  );
}