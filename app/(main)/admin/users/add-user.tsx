"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Role {
  id: string;       // UUID en la tabla roles
  nombre: string;   // Nombre del rol
}

interface NewUser {
  email: string;    // Para "correo" en DB
  password: string; // Para "contrasena" en DB
  role_id: string;  // UUID del rol
  name: string;     // Para "nombre" en DB
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
}

export function AddUserModal({
  isOpen,
  newUser,
  onClose,
  onInputChange,
  onSave,
  errors,
  roles,
}: AddUserModalProps) {
  if (!isOpen) return null;

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

        {/* Lista de errores (si los hay) */}
        {errors.length > 0 && (
          <div className="mb-4 border border-red-300 bg-red-50 text-red-700 p-2 rounded">
            <ul className="list-disc ml-5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Campo Email */}
        <Label className="mb-1">Correo electrónico</Label>
        <input
          name="email"
          type="email"
          className="w-full mb-2 p-2 border rounded"
          value={newUser.email}
          onChange={onInputChange}
        />

        {/* Campo Nombre (para la columna nombre en DB) */}
        <Label className="mb-1">Nombre</Label>
        <input
          name="name"
          type="text"
          className="w-full mb-2 p-2 border rounded"
          value={newUser.name}
          onChange={onInputChange}
        />

        {/* Campo Password => se guardará en 'contrasena' en la BD */}
        <Label className="mb-1">Contraseña</Label>
        <input
          name="password"
          type="password"
          className="w-full mb-2 p-2 border rounded"
          value={newUser.password}
          onChange={onInputChange}
        />

        {/* Select para el Rol (ID => uuid) */}
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

        {/* Botones */}
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
