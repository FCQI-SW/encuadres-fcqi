"use client";
import React, { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, BookOpen, Upload, AlertCircle } from "lucide-react";

export interface Materia {
  clave: string;
  nombre_materia: string;
  licenciatura: string;
  categoria: "Basica" | "Disciplinaria" | "Terminal";
  requisito: "obligatoria" | "optativa";
  estado: "Activa" | "Inactiva";
}

export interface ModalAgregarMateriaProps {
  estaAbierto: boolean;
  nuevaMateria: Materia;
  alCerrar: () => void;
  alCambiarInput: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  alGuardar: () => void;
  errores: string[];
  alImportarDesdeExcel?: (file: File) => void;
}

export function ModalAgregarMateria({
  estaAbierto,
  nuevaMateria,
  alCerrar,
  alCambiarInput,
  alGuardar,
  errores,
  alImportarDesdeExcel,
}: ModalAgregarMateriaProps) {
  const referenciaArchivoInput = useRef<HTMLInputElement | null>(null);

  if (!estaAbierto) return null;

  function manejarCambioArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const archivo = e.target.files[0];
    if (alImportarDesdeExcel) {
      alImportarDesdeExcel(archivo);
    }
    e.target.value = "";
  }

  function manejarClickBotonExcel() {
    referenciaArchivoInput.current?.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          animation: "modalEnter 0.3s ease-out"
        }}
      >
        <style jsx>{`
          @keyframes modalEnter {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>

        {/* Header minimalista */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-[#00723F]/10 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-[#00723F]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Nueva Materia</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Agrega una materia al sistema</p>
                </div>
              </div>
            </div>
            <button
              onClick={alCerrar}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Errores con mejor diseño */}
          {errores.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">
                    Corrige los siguientes errores:
                  </h4>
                  <ul className="space-y-1">
                    {errores.map((err, i) => (
                      <li key={i} className="text-sm text-red-700 flex items-start">
                        <span className="mr-2 text-red-400">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Formulario con mejor espaciado */}
          <div className="space-y-6">
            {/* Grid de 2 columnas para campos pequeños */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Clave <span className="text-red-500">*</span>
                </Label>
                <input
                  name="clave"
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00723F]/20 focus:border-[#00723F] transition-all text-sm font-medium"
                  value={nuevaMateria.clave}
                  onChange={alCambiarInput}
                  placeholder="MAT101"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Estado <span className="text-red-500">*</span>
                </Label>
                <select
                  name="estado"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00723F]/20 focus:border-[#00723F] transition-all text-sm font-medium"
                  value={nuevaMateria.estado}
                  onChange={alCambiarInput}
                >
                  <option value="Activa">✓ Activa</option>
                  <option value="Inactiva">✕ Inactiva</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Nombre de la materia <span className="text-red-500">*</span>
              </Label>
              <input
                name="nombre_materia"
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00723F]/20 focus:border-[#00723F] transition-all text-sm"
                value={nuevaMateria.nombre_materia}
                onChange={alCambiarInput}
                placeholder="Cálculo Diferencial"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Licenciatura <span className="text-red-500">*</span>
              </Label>
              <select
                name="licenciatura"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00723F]/20 focus:border-[#00723F] transition-all text-sm"
                value={nuevaMateria.licenciatura}
                onChange={alCambiarInput}
              >
                <option value="">Selecciona una opción...</option>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <select
                  name="categoria"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00723F]/20 focus:border-[#00723F] transition-all text-sm"
                  value={nuevaMateria.categoria}
                  onChange={alCambiarInput}
                >
                  <option value="Basica">Básica</option>
                  <option value="Disciplinaria">Disciplinaria</option>
                  <option value="Terminal">Terminal</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Requisito <span className="text-red-500">*</span>
                </Label>
                <select
                  name="requisito"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00723F]/20 focus:border-[#00723F] transition-all text-sm"
                  value={nuevaMateria.requisito}
                  onChange={alCambiarInput}
                >
                  <option value="obligatoria">Obligatoria</option>
                  <option value="optativa">Optativa</option>
                </select>
              </div>
            </div>

            {/* Card de importación */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-dashed border-gray-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Upload className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Importación por lotes
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Sube un archivo Excel para importar varias materias simultáneamente
                  </p>
                  <input
                    ref={referenciaArchivoInput}
                    type="file"
                    accept=".xlsx, .xls"
                    style={{ display: "none" }}
                    onChange={manejarCambioArchivo}
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={manejarClickBotonExcel}
                    className="cursor-pointer bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Elegir archivo Excel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer elegante */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Los campos marcados con <span className="text-red-500">*</span> son obligatorios
          </p>
          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={alCerrar}
              className="cursor-pointer px-6"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#00723F] text-white hover:bg-[#005e30] cursor-pointer px-6 shadow-lg shadow-[#00723F]/20"
              onClick={alGuardar}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Guardar materia
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}