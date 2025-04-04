"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Materia } from "./page"; // Ajusta la ruta si "Materia" está en otro lado.

interface AddSubjectModalProps {
  isOpen: boolean;
  newMateria: Materia;
  onClose: () => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSave: () => void;
  errors: string[]; // Aquí recibimos la lista de errores
}

export function AddSubjectModal({
  isOpen,
  newMateria,
  onClose,
  onInputChange,
  onSave,
  errors,
}: AddSubjectModalProps) {
  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-white/50
        backdrop-blur-sm  /* Hace el desenfoque del fondo */
      "
    >
      <div className="bg-white p-6 rounded shadow-md w-[400px]">
        <h2 className="text-xl font-bold mb-4">Agregar Materia</h2>

        {/* Mostrar lista de errores si hay */}
        {errors.length > 0 && (
          <div className="mb-4 border border-red-300 bg-red-50 text-red-700 p-2 rounded">
            <ul className="list-disc ml-5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Clave */}
        <Label className="mb-1">Clave</Label>
        <input
          name="clave"
          type="text"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.clave}
          onChange={onInputChange}
        />

        {/* Nombre */}
        <Label className="mb-1">Nombre de la materia</Label>
        <input
          name="nombre_materia"
          type="text"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.nombre_materia}
          onChange={onInputChange}
        />

        {/* Licenciatura */}
        <Label className="mb-1">Licenciatura</Label>
        <select
          name="licenciatura"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.licenciatura}
          onChange={onInputChange}
        >
          <option value="">Seleccione una opción</option>
          <option value="Tronco Común (Área de Ingeniería)">
            Tronco Común (Área de Ingeniería)
          </option>
          <option value="Tronco Común (Área de Ciencias Químicas)">
            Tronco Común (Área de Ciencias Químicas)
          </option>
          <option value="Ing. en Computación">Ing. en Computación</option>
          <option value="Ing. en Software y Tecnologías Emergentes">
            Ing. en Software y Tecnologías Emergentes
          </option>
          <option value="Ing. en Electrónica">Ing. en Electrónica</option>
          <option value="Ing. Industrial">Ing. Industrial</option>
          <option value="Ing. Químico">Ing. Químico</option>
          <option value="Químico Industrial">Químico Industrial</option>
          <option value="Químico Farmacobiólogo">Químico Farmacobiólogo</option>
          <option value="Químico Farmacéutico Biológico">
            Químico Farmacéutico Biológico
          </option>
        </select>

        {/* Categoria (Basica, Disciplinaria, Terminal) */}
        <Label className="mb-1">Categoría</Label>
        <select
          name="categoria"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.categoria}
          onChange={onInputChange}
        >
          <option value="Basica">Basica</option>
          <option value="Disciplinaria">Disciplinaria</option>
          <option value="Terminal">Terminal</option>
        </select>

        {/* Requisito (obligatoria, optativa) */}
        <Label className="mb-1">Requisito</Label>
        <select
          name="requisito"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.requisito}
          onChange={onInputChange}
        >
          <option value="obligatoria">obligatoria</option>
          <option value="optativa">optativa</option>
        </select>

        {/* Estado (Activa / Inactiva) */}
        <Label className="mb-1">Estado</Label>
        <select
          name="estado"
          className="w-full mb-4 p-2 border rounded"
          value={newMateria.estado}
          onChange={onInputChange}
        >
          <option value="Activa">Activa</option>
          <option value="Inactiva">Inactiva</option>
        </select>

        {/* BOTONES */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="default"
            className="bg-[#00723F] text-white hover:bg-[#005e30]"
            onClick={onSave}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
