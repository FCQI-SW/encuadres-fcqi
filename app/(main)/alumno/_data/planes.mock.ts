// app/(main)/alumno/_data/planes.mock.ts
import type { CourseHeader, PlanRow } from "../../../../components/LearningPlanTable";

/**
 * Relación encuadre_id -> plan_id
 * Si añades más encuadres, mapea aquí el id del encuadre al id del plan.
 */
export const ENC_TO_PLAN: Record<string, string> = {
  "enc-a1": "plan-ml",
  "enc-a2": "plan-bd",
  // "enc-a3": "plan-otro", // <-- agrega los que necesites
  // ...
};

/**
 * Datos de los planes de aprendizaje (mock)
 */
export const PLANES_MOCK: Record<string, { header: CourseHeader; rows: PlanRow[] }> = {
  "plan-ml": {
    header: {
      asignatura: "Inteligencia Artificial",
      clave: "40641",
      grupo: "110",
      seccion: "A",
      docente: "José Manuel Hernández Ruiz",
      inicioCurso: "29 de enero",
      finCurso: "30 de mayo",
      vacaciones: "14 al 18 de abril",
      suspensiones:
        "3, 24 de febrero; 17 marzo, 1 y 19 de mayo (De acuerdo al calendario escolar UABC).",
    },
    rows: [
      { unidad: "1.1", tema: "Machine Learning", semana: 1 },
      { unidad: "1.2", tema: "Algoritmos de aprendizaje", semana: 2 },
      { unidad: "1.3", tema: "Técnicas de preprocesamiento", semana: 3 },
      { unidad: "1.4", tema: "Deep Learning", semana: 4 },
      { unidad: "1.5", tema: "Plataformas de aprendizaje automático", semana: 5 },
      { unidad: "1.6", tema: "Aplicaciones innovadoras", semana: 6 },
    ],
  },

  "plan-bd": {
    header: {
      asignatura: "Bases de Datos Avanzadas",
      clave: "40235",
      grupo: "305",
      seccion: "B",
      docente: "Carlos Iván Torres Pérez",
      inicioCurso: "29 de enero",
      finCurso: "30 de mayo",
      vacaciones: "14 al 18 de abril",
      suspensiones: "3 y 24 de febrero; 17 de marzo; 1 y 19 de mayo.",
    },
    rows: [
      { unidad: "1.1", tema: "Modelado relacional avanzado", semana: 1 },
      { unidad: "1.2", tema: "Consultas optimizadas", semana: 2 },
      { unidad: "1.3", tema: "Índices y particionamiento", semana: 3 },
      { unidad: "1.4", tema: "Transacciones y concurrencia", semana: 4 },
      { unidad: "1.5", tema: "Técnicas de replicación", semana: 5 },
      { unidad: "1.6", tema: "Seguridad y auditoría", semana: 6 },
    ],
  },
};
