// lib/sidebar-items.ts

import {
  Users,
  FileSearch,
  BookOpen,
  Calendar,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

/**
 * Aquí definimos las opciones de menú para cada rol.
 * Ajusta nombres, íconos y rutas según tu necesidad.
 */

export const sidebarItemsByRole = {
  admin: [
    { title: "Manejo de usuarios", url: "/admin/usuarios", icon: Users },
    { title: "Revisión de resultados", url: "/admin/resultados", icon: FileSearch },
    { title: "Manejo de materias", url: "/admin/materias", icon: BookOpen },
    { title: "Alumnos invitados", url: "/admin/invitados", icon: AlertCircle },
    { title: "Establecer fecha de operación", url: "/admin/fechas", icon: Calendar },
  ],
  capturista: [
    { title: "Materias", url: "/capturista/materias", icon: BookOpen },
  ],
  profesor: [
    { title: "Mis Cursos", url: "/profesor/cursos", icon: GraduationCap },
  ],
  alumno: [
    { title: "Mis Cursos", url: "/alumno/cursos", icon: GraduationCap },
  ],
  lector: [
    { title: "Revisión de resultados", url: "/lector/resultados", icon: FileSearch },
    { title: "Historial de anuncios", url: "/lector/anuncios", icon: Calendar },
    { title: "Alumnos invitados", url: "/lector/invitados", icon: Users },
  ],
};