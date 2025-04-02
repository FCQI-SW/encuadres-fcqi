import { Materia } from "@/components/materia";
import React from "react";

function Encuadre() {
  return (
    <>
      <div className="items-center justify-items-center gap-16 pt-8 font-[family-name:var(--font-geist-sans)]">
        <h1>Esta es la ruta /profesor/encuadres</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3   justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-10">
        <div className="justify-items-center">
          <h1 className="mb-8 text-xl font-bold">Por asignar</h1>
          <Materia btnText="Asignar"/>
          <Materia btnText="Asignar"/>
          <Materia btnText="Asignar"/>

        </div>
        <div className="justify-items-center">
          <h1 className="mb-8 text-xl font-bold">Publicadas</h1>
          <Materia btnText="Invitar"/>

        </div>
        <div className="justify-items-center">
          <h1 className="mb-8 text-xl font-bold">Aceptadas</h1>
          <Materia btnText="Revisar"/>

        </div>
      </div>
    </>
  );
}

export default Encuadre;
