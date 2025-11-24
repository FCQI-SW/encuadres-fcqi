"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Edit, AlertCircle } from "lucide-react";
import type { Materia } from "../app/(main)/admin/materias/page";

interface ModalEditarMateriaProps {
  estaAbierto: boolean;
  materiaAEditar: Materia;
  alCerrar: () => void;
  alCambiarInput: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  alActualizar: () => void;
  errores: string[];
}

export function ModalEditarMateria({
  estaAbierto,
  materiaAEditar,
  alCerrar,
  alCambiarInput,
  alActualizar,
  errores,
}: ModalEditarMateriaProps) {
  if (!estaAbierto) return null;

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
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Edit className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Editar Materia</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Modifica la información de la materia</p>
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
                  Clave
                </Label>
                <div className="relative">
                  <input
                    name="clave"
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm font-medium"
                    value={materiaAEditar.clave}
                    onChange={alCambiarInput}
                    disabled
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      No editable
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  La clave no puede modificarse una vez creada
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Estado <span className="text-red-500">*</span>
                </Label>
                <select
                  name="estado"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00723F]/20 focus:border-[#00723F] transition-all text-sm font-medium"
                  value={materiaAEditar.estado}
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
                value={materiaAEditar.nombre_materia}
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
                value={materiaAEditar.licenciatura}
                onChange={alCambiarInput}
              >
                <option value="">Selecciona una opción...</option>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <select
                  name="categoria"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00723F]/20 focus:border-[#00723F] transition-all text-sm"
                  value={materiaAEditar.categoria}
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
                  value={materiaAEditar.requisito}
                  onChange={alCambiarInput}
                >
                  <option value="obligatoria">Obligatoria</option>
                  <option value="optativa">Optativa</option>
                </select>
              </div>
            </div>

            {/* Info box sobre cambios */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Importante
                  </h4>
                  <p className="text-xs text-blue-700">
                    Los cambios realizados afectarán todos los encuadres y PUAs asociados a esta materia. 
                    Asegúrate de que la información sea correcta antes de guardar.
                  </p>
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
              onClick={alActualizar}
            >
              <Edit className="h-4 w-4 mr-2" />
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}