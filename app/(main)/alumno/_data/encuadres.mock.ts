import { FullEncuadreProps } from "../../../../components/FullEncuadreTable";

type DataMap = Record<
  string,
  Omit<FullEncuadreProps, "universidad" | "facultad" | "programa" | "logoSrc" | "className" | "onSave">
>;

export const ENCUADRES_MOCK: DataMap = {
  "enc-a1": {
    evaluacionRows: [
      { criterio: "Proyecto 1", valor: "25%", descripcion: "Aplicación básica de POO" },
      { criterio: "Parcial 1", valor: "20%", descripcion: "Clases, objetos, herencia" },
      { criterio: "Tareas", valor: "15%", descripcion: "3 tareas integradoras" },
      { criterio: "Proyecto 2", valor: "25%", descripcion: "Patrones y polimorfismo" },
      { criterio: "Participación", valor: "15%", descripcion: "Foros y ejercicios en clase" },
    ],
    totalValor: "100%",
    rights: [
      { titulo: "Ordinario", bullets: ["≥ 80% de asistencias", "Promedio ≥ 85 para exentar"] },
      { titulo: "Extraordinario", bullets: ["≥ 60% de asistencias", "Entregar evidencias mínimas"] },
    ],
    descripcionProducto:
`Producto final: app de escritorio con GUI y persistencia. Se evalúa con rúbrica:
funcionalidad, arquitectura, pruebas y presentación.`,
    normasConducta:
`- Respetar horarios.
- No alimentos en laboratorio.
- Celulares en modo silencioso.
- Respeto entre compañeros y docente.`,
  },

  "enc-a2": {
    evaluacionRows: [
      { criterio: "Prácticas SQL", valor: "30%", descripcion: "Joins, subconsultas, índices" },
      { criterio: "Proyecto BD", valor: "40%", descripcion: "Modelo lógico/físico y optimización" },
      { criterio: "Examen", valor: "30%", descripcion: "Teórico-práctico" },
    ],
    totalValor: "100%",
    rights: [
      { titulo: "Ordinario", bullets: ["≥ 80% de asistencias", "Promedio prácticas ≥ 80"] },
      { titulo: "Extraordinario", bullets: ["≥ 60% de asistencias", "Entrega del proyecto BD"] },
    ],
    descripcionProducto:
`Documento técnico: modelo ER, normalización, scripts de creación e índices,
más consultas optimizadas.`,
    normasConducta:
`- Cuidar equipo y material.
- No compartir credenciales de BD.
- Integridad académica en trabajos.`,
  },
};
