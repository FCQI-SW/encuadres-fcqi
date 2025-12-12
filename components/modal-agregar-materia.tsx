"use client";

import React, { useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Upload, Loader2, X } from "lucide-react";

type Materia = {
  clave: string;
  nombre_materia: string;
  licenciatura: string;
  categoria: "Basica" | "Disciplinaria" | "Terminal";
  requisito: "obligatoria" | "optativa";
  estado: "Activa" | "Inactiva";
};

interface ModalAgregarMateriaProps {
  isOpen: boolean;
  materia: Materia;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onSave: () => void;
  errors: string[];
  onImportFromExcel?: (file: File) => void;
  saving?: boolean;
  licenciaturas: string[];
}

export function ModalAgregarMateria({
  isOpen,
  materia,
  onClose,
  onInputChange,
  onSelectChange,
  onSave,
  errors,
  onImportFromExcel,
  saving = false,
  licenciaturas,
}: ModalAgregarMateriaProps) {
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
          <CardTitle>Agregar Materia</CardTitle>
          <CardDescription>
            Crea una nueva materia o importa desde Excel
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

          {/* Campos del formulario */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="clave">Clave *</Label>
              <Input
                id="clave"
                name="clave"
                placeholder="Ej: MAT101"
                value={materia.clave}
                onChange={onInputChange}
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="nombre_materia">Nombre de la materia *</Label>
              <Input
                id="nombre_materia"
                name="nombre_materia"
                placeholder="Ej: Cálculo Diferencial"
                value={materia.nombre_materia}
                onChange={onInputChange}
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <Label>Licenciatura *</Label>
              <Select
                value={materia.licenciatura}
                onValueChange={(value) => onSelectChange("licenciatura", value)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar licenciatura" />
                </SelectTrigger>
                <SelectContent>
                  {licenciaturas.length > 0 ? (
                    licenciaturas.map((lic) => (
                      <SelectItem key={lic} value={lic}>
                        {lic}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Ingeniería en Computación">
                        Ingeniería en Computación
                      </SelectItem>
                      <SelectItem value="Ingeniería Industrial">
                        Ingeniería Industrial
                      </SelectItem>
                      <SelectItem value="Ingeniería Química">
                        Ingeniería Química
                      </SelectItem>
                    </>
                  )}
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
                "Guardar"
              )}
            </Button>
          </div>

          <Separator />

          {/* Importar Excel */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Importar desde Excel</Label>
            <p className="text-xs text-muted-foreground">
              Columnas: Clave, Nombre, Licenciatura, Categoría, Requisito, Estado
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="w-full cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Seleccionar archivo Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}