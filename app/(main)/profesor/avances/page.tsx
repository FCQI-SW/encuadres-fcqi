import { Materia } from "@/components/materia";
import React from "react";

function Avances() {
  return (
    <>
      <div className="items-center justify-items-center gap-16 pt-8 font-[family-name:var(--font-geist-sans)]">
        <h1>Esta es la ruta /profesor/avances</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2   justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-10">
        <div className="justify-items-center">
          <h1 className="mb-8 ">Por registrar</h1>
          <Materia estadoMateria="Por registrar"/>
          <Materia estadoMateria="Por registrar"/>
          <Materia estadoMateria="Por registrar"/>

        </div>
        <div className="justify-items-center">
          <h1 className="mb-8 ">Registradas</h1>
          <Materia estadoMateria="Registrada"/>

        </div>
      </div>
    </>
  );
}

export default Avances;
