"use client";

import React, { useEffect, useState } from 'react';
import { Materia } from "@/components/materia";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";


/* const data = [
  {
    nombreMateria: "Aplicaciones Móviles",
    claveMateria: "40002",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "borrador"
  },
  {
    nombreMateria: "Desarrollo Web",
    claveMateria: "40003",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "borrador"
  },
  {
    nombreMateria: "Requerimientos",
    claveMateria: "40001",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "borrador"
  },
  {
    nombreMateria: "Programación Estructurada",
    claveMateria: "40005",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "publicada"
  },
  {
    nombreMateria: "Estructura de Datos",
    claveMateria: "40004",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "aceptada"
  },
  {
    nombreMateria: "Estructura de Datos",
    claveMateria: "40006",
    grupoMateria: "361",
    profesorMateria: "Guillermo Licea",
    estadoMateria: "aceptada"
  },
]; */

type Materia = {
  id: string;      // PK en tu tabla 'materias' (uuid o int)
  nombre: string;
  clave: string;   // 'clave' en DB
  estado: string;
  grupo: string;
};

function Encuadre() {
  const { data: session } = useSession();
  const [materias, setMaterias] = useState<Materia[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user && session?.user.role == 'profesor') {
        const { data: materiasData, error: materiasError } = await supabase
          .from("encuadres")
          .select("id, programa_id, estado_encuadre, usuario_id, grupo")
          .eq("usuario_id", session.user.id);

        if (materiasData && !materiasError && materiasData.length > 0) {
          // Step 2: Extract all programa_ids from the encuadres
          const programaIds = materiasData.map(encuadre => encuadre.programa_id);

          // Step 3: Get materia_ids from programa table
          const { data: programasData, error: programasError } = await supabase
            .from("programas")
            .select("id, materia_id")
            .in("id", programaIds);

          if (programasData && !programasError && programasData.length > 0) {
            // Step 4: Extract materia_ids
            const materiaIds = programasData.map(programa => programa.materia_id);

            // Step 5: Get the actual materia data
            const { data: finalMateriasData, error: finalMateriasError } = await supabase
              .from("materias")
              .select("*")
              .in("id", materiaIds);

            if (finalMateriasData && !finalMateriasError) {
              console.log("Materias:", finalMateriasData);
              // Use finalMateriasData - this contains your materia records
              const combinedData = materiasData.map(encuadre => {
                // Find the corresponding programa
                const programa = programasData.find(p => p.id === encuadre.programa_id);
                // Find the corresponding materia
                const materia = finalMateriasData.find(m => m.id === programa?.materia_id);

                return {
                  id: encuadre.id,
                  estado: encuadre.estado_encuadre,
                  grupo: encuadre.grupo,
                  nombre: materia?.nombre_materia,
                  clave: materia?.clave
                };
              });

              setMaterias(combinedData);

            } else {
              console.error("Error fetching materias:", finalMateriasError);
            }
          } else {
            console.error("Error fetching programas:", programasError);
          }
        } else {
          console.error("Error fetching encuadres:", materiasError);
        }
      }
    };

    fetchData();
  }, [session?.user]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-10">
      <div className="justify-items-center">
        <h1 className="mb-8 text-xl font-bold">Por Asignar</h1>
        {materias.map((materiaInfo) => {
          if (materiaInfo.estado == "borrador") {
            return (

              <Materia key={materiaInfo.id} btnText="Asignar" nombreMateria={materiaInfo.nombre} claveMateria={materiaInfo.clave} grupoMateria={materiaInfo.grupo} />

            );
          }
        })}
      </div>
      <div className="justify-items-center">
        <h1 className="mb-8 text-xl font-bold">Publicadas</h1>
        {materias.map((materiaInfo) => {
          if (materiaInfo.estado == "publicada") {
            return (

              <Materia key={materiaInfo.id} btnText="Invitar" nombreMateria={materiaInfo.nombre} claveMateria={materiaInfo.clave} grupoMateria={materiaInfo.grupo} />

            );
          }
        })}
      </div>
      <div className="justify-items-center">
        <h1 className="mb-8 text-xl font-bold">Aceptadas</h1>
        {materias.map((materiaInfo) => {
          if (materiaInfo.estado == "aceptada") {
            return (

              <Materia key={materiaInfo.id} btnText="Revisar" nombreMateria={materiaInfo.nombre} claveMateria={materiaInfo.clave} grupoMateria={materiaInfo.grupo} />

            );
          }
        })}
      </div>
    </div>

  );
}

export default Encuadre;
