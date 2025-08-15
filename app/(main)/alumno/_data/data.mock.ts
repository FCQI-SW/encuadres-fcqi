import { MateriaAsignada } from "./types";

export const MATERIAS_MOCK: MateriaAsignada[] = [
  {
    id: "1",
    nombre_materia: "Programación Orientada a Objetos",
    profesor_nombre: "Laura Méndez Ramírez",
    clave: "40111",
    grupo: "201",
    encuadre_id: "enc-a1",
  },
  {
    id: "2",
    nombre_materia: "Bases de Datos Avanzadas",
    profesor_nombre: "Carlos Iván Torres Pérez",
    clave: "40235",
    grupo: "305",
    encuadre_id: "enc-a2",
  },
  {
    id: "3",
    nombre_materia: "Redes de Computadoras",
    profesor_nombre: "María Fernanda López García",
    clave: "40322",
    grupo: "210",
    encuadre_id: "enc-a3",
  },
  {
    id: "4",
    nombre_materia: "Seguridad Informática",
    profesor_nombre: "Héctor Adrián Rodríguez Luna",
    clave: "40418",
    grupo: "412",
    encuadre_id: "enc-a4",
  },
  {
    id: "5",
    nombre_materia: "Ingeniería de Software",
    profesor_nombre: "Andrea Sofía Vega Martínez",
    clave: "40509",
    grupo: "301",
    encuadre_id: "enc-a5",
  },
  {
    id: "6",
    nombre_materia: "Cálculo Diferencial",
    profesor_nombre: "José Manuel Hernández Ruiz",
    clave: "40641",
    grupo: "110",
    encuadre_id: "enc-a6",
  },
];


// Simula un fetch con retardo
export async function fetchMateriasMock(delayMs = 500): Promise<MateriaAsignada[]> {
  await new Promise(res => setTimeout(res, delayMs));
  return JSON.parse(JSON.stringify(MATERIAS_MOCK));
}
