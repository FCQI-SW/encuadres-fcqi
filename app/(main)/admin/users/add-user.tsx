"use client";
import React, { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Role {
  id: string;       // UUID en la tabla roles
  nombre: string;   // Nombre del rol
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
  onSave: () => void;         // Crear un usuario individual
  errors: string[];           // Errores a mostrar en este modal
  roles: Role[];

  // Función para manejar la importación desde Excel
  onImportFromExcel?: (file: File) => void;
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
}: AddUserModalProps) {

  // Referencia al <input type="file"> para Excel
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Cuando el usuario selecciona el archivo .xlsx / .xls
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (onImportFromExcel) {
      onImportFromExcel(file);
    }
    e.target.value = ""; // para permitir re-seleccionar el mismo archivo si se desea
  }

  // Al presionar el botón, abrimos el diálogo de archivos
  function handleExcelButtonClick() {
    fileInputRef.current?.click();
  }

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-white/50
        backdrop-blur-sm
      "
    >
      <div className="bg-white p-6 rounded shadow-md w-[400px]">
        <h2 className="text-xl font-bold mb-4">Agregar Usuario</h2>

        {/* LISTA DE ERRORES (VISIBLES SÓLO EN EL MODAL) */}
        {errors.length > 0 && (
          <div className="mb-4 border border-red-300 bg-red-50 text-red-700 p-2 rounded">
            <ul className="list-disc ml-5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* CAMPOS PARA CREAR UN USUARIO INDIVIDUAL */}
        <Label className="mb-1">Correo electrónico</Label>
        <input
          name="email"
          type="email"
          className="w-full mb-2 p-2 border rounded"
          value={newUser.email}
          onChange={onInputChange}
        />

        <Label className="mb-1">Nombre</Label>
        <input
          name="name"
          type="text"
          className="w-full mb-2 p-2 border rounded"
          value={newUser.name}
          onChange={onInputChange}
        />

        <Label className="mb-1">Contraseña</Label>
        <input
          name="password"
          type="password"
          className="w-full mb-2 p-2 border rounded"
          value={newUser.password}
          onChange={onInputChange}
        />

        <Label className="mb-1">Rol</Label>
        <select
          name="role_id"
          className="w-full mb-4 p-2 border rounded"
          value={newUser.role_id}
          onChange={onInputChange}
        >
          <option value="">Seleccionar rol</option>
          {roles.map((rol) => (
            <option key={rol.id} value={rol.id}>
              {rol.nombre}
            </option>
          ))}
        </select>

        {/* BOTONES */}
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

          {/* SECCIÓN PARA CARGAR USUARIOS DESDE EXCEL */}
          <div className="border-t mt-4 pt-4">
            <Label className="mb-1 block">Agregar usuarios desde Excel:</Label>
            {/* Input oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <Button variant="outline" onClick={handleExcelButtonClick}>
              Cargar usuarios desde Excel
            </Button>
            <p className="text-sm text-gray-500 mt-1">
              Selecciona un archivo .xlsx o .xls para importar múltiples usuarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
