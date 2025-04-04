import { Materia } from "@/components/materia";
import React from "react";

const data = [
  {
    nombreMateria: "Aplicaciones Móviles",
    claveMateria: "40002",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "Por asignar"
  },
  {
    nombreMateria: "Desarrollo Web",
    claveMateria: "40003",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "Por asignar"
  },
  {
    nombreMateria: "Requerimientos",
    claveMateria: "40001",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "Por asignar"
  },
  {
    nombreMateria: "Programación Estructurada",
    claveMateria: "40005",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "Publicada"
  },
  {
    nombreMateria: "Estructura de Datos",
    claveMateria: "40004",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "Aceptada"
  },
  {
    nombreMateria: "Estructura de Datos",
    claveMateria: "40006",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "Aceptada"
  },
];

function Encuadre() {
  return (
    <>
      <div className="items-center justify-items-center gap-16 pt-8 font-[family-name:var(--font-geist-sans)]">
        <h1>Esta es la ruta /profesor/encuadres</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-10">
        <div className="justify-items-center">
          <h1 className="mb-8 text-xl font-bold">Por asignar</h1>
          {data.map((materiaInfo) => {
            if (materiaInfo.estadoMateria == "Por asignar") {
              return (
                <>
                  <Materia key={materiaInfo.claveMateria} btnText="Asignar" nombreMateria={materiaInfo.nombreMateria} claveMateria={materiaInfo.claveMateria} grupoMateria={materiaInfo.grupoMateria} profesorMateria={materiaInfo.profesorMateria} />
                </>
              );
            }
          })}
        </div>
        <div className="justify-items-center">
          <h1 className="mb-8 text-xl font-bold">Publicadas</h1>
          {data.map((materiaInfo) => {
            if (materiaInfo.estadoMateria == "Publicada") {
              return (
                <>
                  <Materia key={materiaInfo.claveMateria} btnText="Invitar" nombreMateria={materiaInfo.nombreMateria} claveMateria={materiaInfo.claveMateria} grupoMateria={materiaInfo.grupoMateria} profesorMateria={materiaInfo.profesorMateria} />
                </>
              );
            }
          })}

        </div>
        <div className="justify-items-center">
          <h1 className="mb-8 text-xl font-bold">Aceptadas</h1>
          {data.map((materiaInfo) => {
            if (materiaInfo.estadoMateria == "Aceptada") {
              return (
                <>
                  <Materia key={materiaInfo.claveMateria} btnText="Revisar" nombreMateria={materiaInfo.nombreMateria} claveMateria={materiaInfo.claveMateria} grupoMateria={materiaInfo.grupoMateria} profesorMateria={materiaInfo.profesorMateria} />
                </>
              );
            }
          })}

        </div>
      </div>
    </>
  );
}

export default Encuadre;
