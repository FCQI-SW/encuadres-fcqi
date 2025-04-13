"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Ajusta según los campos que realmente manejes para crear un usuario
interface NewUser {
  email: string;
  role_id: string;
  password: string;
  // Agrega más campos si los requieres, por ejemplo:
  // nombre: string;
  // estado: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  newUser: NewUser;
  onClose: () => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSave: () => void;
  errors: string[]; // Lista de errores a mostrar
  roles: { id: string; nombre: string }[]; // Lista de roles para llenar el select
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
  // Si no está abierto, no renderizar nada
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

        {/* Campo Email */}
        <Label className="mb-1">Correo electrónico</Label>
        <input
          name="email"
          type="email"
          className="w-full mb-2 p-2 border rounded"
          value={newUser.email}
          onChange={onInputChange}
        />

        {/* Campo Password (opcional según tu lógica) */}
        <Label className="mb-1">Contraseña</Label>
        <input
          name="password"
          type="password"
          className="w-full mb-2 p-2 border rounded"
          value={newUser.password}
          onChange={onInputChange}
        />

        {/* Select para elegir rol */}
        <Label className="mb-1">Rol</Label>
        <select
          name="role_id"
          className="w-full mb-2 p-2 border rounded"
          value={newUser.role_id}
          onChange={onInputChange}
        >
          <option value="">Selecciona un rol</option>
          {roles.map((rol) => (
            <option key={rol.id} value={rol.id}>
              {rol.nombre}
            </option>
          ))}
        </select>

        {/* 
          Si tu tabla de usuarios tiene más campos, agrégalos de forma similar:
          
          <Label className="mb-1">Nombre</Label>
          <input
            name="nombre"
            type="text"
            className="w-full mb-2 p-2 border rounded"
            value={newUser.nombre}
            onChange={onInputChange}
          />

          <Label className="mb-1">Estado</Label>
          <select
            name="estado"
            className="w-full mb-2 p-2 border rounded"
            value={newUser.estado}
            onChange={onInputChange}
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        */}

        {/* Botones */}
        <div className="flex justify-end gap-2 mt-4">
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
