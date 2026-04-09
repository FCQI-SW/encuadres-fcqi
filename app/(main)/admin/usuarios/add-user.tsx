"use client";

import React, { useRef, useState } from "react";
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
import { AlertCircle, Upload, Loader2, X, Eye, EyeOff, RefreshCw } from "lucide-react";
import { generarClaveSegura } from "@/lib/password-generator";

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
  const [showPassword, setShowPassword] = useState(false);

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

  function handleRoleSelect(value: string) {
    const syntheticEvent = {
      target: { name: "role_id", value },
    } as React.ChangeEvent<HTMLSelectElement>;
    onInputChange(syntheticEvent);
  }

  function handleGenerarPassword() {
    const nuevaClave = generarClaveSegura(12);
    const syntheticEvent = {
      target: { name: "password", value: nuevaClave },
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(syntheticEvent);
    setShowPassword(true); // Mostrar la contraseña generada
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

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@uabc.edu.mx"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerarPassword}
                  disabled={saving}
                  className="cursor-pointer text-xs text-[#00723F] hover:text-[#005e30] hover:bg-green-50 h-7 px-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generar
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 12 caracteres"
                  value={newUser.password}
                  onChange={onInputChange}
                  disabled={saving}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
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