"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, X } from "lucide-react";

type Materia = {
  clave: string;
  nombre_materia: string;
  licenciatura: string;
  categoria: "Basica" | "Disciplinaria" | "Terminal";
  requisito: "obligatoria" | "optativa";
  estado: "Activa" | "Inactiva";
};

interface ModalEditarMateriaProps {
  isOpen: boolean;
  materia: Materia;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onSave: () => void;
  errors: string[];
  saving?: boolean;
  licenciaturas: string[];
}

export function ModalEditarMateria({
  isOpen,
  materia,
  onClose,
  onInputChange,
  onSelectChange,
  onSave,
  errors,
  saving = false,
  licenciaturas,
}: ModalEditarMateriaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 cursor-pointer"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle>Editar Materia</CardTitle>
          <CardDescription>
            Modifica los datos de la materia {materia.clave}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Errores */}
          {errors.length > 0 && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Campos */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-clave">Clave</Label>
              <Input
                id="edit-clave"
                name="clave"
                value={materia.clave}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground">
                La clave no se puede modificar
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-nombre">Nombre de la materia *</Label>
              <Input
                id="edit-nombre"
                name="nombre_materia"
                value={materia.nombre_materia}
                onChange={onInputChange}
                disabled={saving}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Máximo 50 caracteres
              </p>
            </div>

            <div className="space-y-1">
              <Label>Licenciatura *</Label>
              <Select
                value={materia.licenciatura}
                onValueChange={(value) => onSelectChange("licenciatura", value)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {licenciaturas.map((lic) => (
                    <SelectItem key={lic} value={lic}>
                      {lic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select
                  value={materia.categoria}
                  onValueChange={(value) => onSelectChange("categoria", value)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basica">Básica</SelectItem>
                    <SelectItem value="Disciplinaria">Disciplinaria</SelectItem>
                    <SelectItem value="Terminal">Terminal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Requisito</Label>
                <Select
                  value={materia.requisito}
                  onValueChange={(value) => onSelectChange("requisito", value)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obligatoria">Obligatoria</SelectItem>
                    <SelectItem value="optativa">Optativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Estado</Label>
              <Select
                value={materia.estado}
                onValueChange={(value) => onSelectChange("estado", value)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activa">Activa</SelectItem>
                  <SelectItem value="Inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              disabled={saving}
              className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
