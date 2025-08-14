import { MateriaAsignada } from "./types";

export const MATERIAS_MOCK: MateriaAsignada[] = [
  {
    id: "1",
    nombre_materia: "Minería de datos",
    profesor_nombre: "Mauricio Alonso Sánchez Herrera",
    clave: "40021",
    grupo: "308",
    encuadre_id: "enc-1",
  },
  {
    id: "2",
    nombre_materia: "Desarrollo de aplicaciones innovadoras",
    profesor_nombre: "Mauricio Alonso Sánchez Herrera",
    clave: "40021",
    grupo: "308",
    encuadre_id: "enc-2",
  },
  {
    id: "3",
    nombre_materia: "Inglés II",
    profesor_nombre: "Mauricio Alonso Sánchez Herrera",
    clave: "40021",
    grupo: "308",
    encuadre_id: "enc-3",
  },
  {
    id: "4",
    nombre_materia: "Aplicaciones web",
    profesor_nombre: "Mauricio Alonso Sánchez Herrera",
    clave: "40021",
    grupo: "308",
    encuadre_id: "enc-4",
  },
  {
    id: "5",
    nombre_materia: "Estadística avanzada",
    profesor_nombre: "Mauricio Alonso Sánchez Herrera",
    clave: "40021",
    grupo: "308",
    encuadre_id: "enc-5",
  },
  {
    id: "6",
    nombre_materia: "Inteligencia artificial",
    profesor_nombre: "Mauricio Alonso Sánchez Herrera",
    clave: "40021",
    grupo: "308",
    encuadre_id: "enc-6",
  },
];

// Simula un fetch con retardo
export async function fetchMateriasMock(delayMs = 500): Promise<MateriaAsignada[]> {
  await new Promise(res => setTimeout(res, delayMs));
  return JSON.parse(JSON.stringify(MATERIAS_MOCK));
}
