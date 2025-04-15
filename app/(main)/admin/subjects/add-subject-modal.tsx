"use client";
import React, { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface Materia {
  clave: string;
  nombre_materia: string;
  licenciatura: string;
  categoria: "Basica" | "Disciplinaria" | "Terminal";
  requisito: "obligatoria" | "optativa";
  estado: "Activa" | "Inactiva";
}

export interface AddSubjectModalProps {
  isOpen: boolean;
  newMateria: Materia;
  onClose: () => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSave: () => void;
  errors: string[];
  // Si se desea agregar importación Excel, se puede agregar:
  onImportFromExcel?: (file: File) => void;
}

export function AddSubjectModal({
  isOpen,
  newMateria,
  onClose,
  onInputChange,
  onSave,
  errors,
  onImportFromExcel,
}: AddSubjectModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (onImportFromExcel) {
      onImportFromExcel(file);
    }
    e.target.value = "";
  }

  function handleExcelButtonClick() {
    fileInputRef.current?.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"
    >
      <div className="bg-white p-6 rounded shadow-md w-[400px]">
        <h2 className="text-xl font-bold mb-4">Agregar Materia</h2>

        {/* Mostrar errores solo en el modal */}
        {errors.length > 0 && (
          <div className="mb-4 border border-red-300 bg-red-50 text-red-700 p-2 rounded">
            <ul className="list-disc ml-5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <Label className="mb-1">Clave</Label>
        <input
          name="clave"
          type="text"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.clave}
          onChange={onInputChange}
        />

        <Label className="mb-1">Nombre de la materia</Label>
        <input
          name="nombre_materia"
          type="text"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.nombre_materia}
          onChange={onInputChange}
        />

        <Label className="mb-1">Licenciatura</Label>
        <select
          name="licenciatura"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.licenciatura}
          onChange={onInputChange}
        >
          <option value="">Seleccione una licenciatura</option>
          <option value="Tronco Común (Área de Ingeniería)">Tronco Común (Área de Ingeniería)</option>
          <option value="Tronco Común (Área de Ciencias Químicas)">Tronco Común (Área de Ciencias Químicas)</option>
          <option value="Ing. en Computación">Ing. en Computación</option>
          <option value="Ing. en Software y Tecnologías Emergentes">Ing. en Software y Tecnologías Emergentes</option>
          <option value="Ing. en Electrónica">Ing. en Electrónica</option>
          <option value="Ing. Industrial">Ing. Industrial</option>
          <option value="Ing. Químico">Ing. Químico</option>
          <option value="Químico Industrial">Químico Industrial</option>
          <option value="Químico Farmacobiólogo">Químico Farmacobiólogo</option>
          <option value="Químico Farmacéutico Biológico">Químico Farmacéutico Biológico</option>
        </select>

        <Label className="mb-1">Categoría</Label>
        <select
          name="categoria"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.categoria}
          onChange={onInputChange}
        >
          <option value="Basica">Básica</option>
          <option value="Disciplinaria">Disciplinaria</option>
          <option value="Terminal">Terminal</option>
        </select>

        <Label className="mb-1">Requisito</Label>
        <select
          name="requisito"
          className="w-full mb-2 p-2 border rounded"
          value={newMateria.requisito}
          onChange={onInputChange}
        >
          <option value="obligatoria">Obligatoria</option>
          <option value="optativa">Optativa</option>
        </select>

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

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
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

          {/* Sección para importar desde Excel */}
          <div className="border-t mt-4 pt-4">
            <Label className="mb-1 block">Agregar materias desde Excel:</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <Button variant="outline" onClick={handleExcelButtonClick}>
              Cargar materias desde Excel
            </Button>
            <p className="text-sm text-gray-500 mt-1">
              Selecciona un archivo .xlsx o .xls para importar múltiples materias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
