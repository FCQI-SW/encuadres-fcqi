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

interface Role {
  id: string;
  nombre: string;
}

interface NewUser {
  email: string;
  password: string;
  role_id: string;
  name: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  newUser: NewUser;
  onClose: () => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSave: () => void;
  errors: string[];
  roles: Role[];
  onImportFromExcel?: (file: File) => void;
  saving?: boolean;
}

export function AddUserModal({
  isOpen,
  newUser,
  onClose,
  onInputChange,
  onSave,
  errors,
  roles,
  onImportFromExcel,
  saving = false,
}: AddUserModalProps) {
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

  // Handler para el select de rol
  function handleRoleSelect(value: string) {
    const syntheticEvent = {
      target: { name: "role_id", value },
    } as React.ChangeEvent<HTMLSelectElement>;
    onInputChange(syntheticEvent);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
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
          <CardTitle>Agregar Usuario</CardTitle>
          <CardDescription>
            Crea un nuevo usuario o importa desde Excel
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
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={newUser.email}
                onChange={onInputChange}
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Nombre del usuario"
                value={newUser.name}
                onChange={onInputChange}
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUser.password}
                onChange={onInputChange}
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <Label>Rol *</Label>
              <Select
                value={newUser.role_id}
                onValueChange={handleRoleSelect}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones principales */}
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

          {/* Importar desde Excel */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Importar usuarios desde Excel
            </Label>
            <p className="text-xs text-muted-foreground">
              El archivo debe tener columnas: Correo, Nombre, Contraseña, Rol_ID
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
              onClick={handleExcelButtonClick}
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