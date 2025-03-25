// lib/sidebar-items.ts

import {
    Users,
    FileSearch,
    BookOpen,
    Calendar,
    AlertCircle,
    Edit,
  } from "lucide-react"
  
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
      { title: "Encuadres", url: "/capturista/encuadres", icon: FileSearch },
      { title: "PUA", url: "/capturista/pua", icon: BookOpen },
    ],
    profesor: [
      { title: "Sistema de revisión de encuadres", url: "/profesor/encuadres", icon: FileSearch },
      { title: "Registro de avances", url: "/profesor/avances", icon: Edit },
    ],
    alumno: [
      { title: "Sistema de revisión de encuadres", url: "/alumno/encuadres", icon: FileSearch },
      { title: "Sistema de unidad de aprendizaje", url: "/alumno/unidad", icon: BookOpen },
    ],
    lector: [
      { title: "Revisión de resultados", url: "/lector/resultados", icon: FileSearch },
      { title: "Historial de anuncios", url: "/lector/anuncios", icon: Calendar },
      { title: "Alumnos invitados", url: "/lector/invitados", icon: Users },
    ],
  }
  