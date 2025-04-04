"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";

// Tipos para las “opciones” que se pueden mostrar en el modal
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;   // Texto de botón de confirmación
  cancelText?: string;    // Texto de botón de cancelar
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const [resolveFn, setResolveFn] = useState<((value: boolean) => void) | null>(null);

  // Esta función se llamará cuando en el código hagas “confirm({ message, ... })”
  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);

    // Retornamos una promesa que se resolverá cuando el usuario elija
    return new Promise<boolean>((resolve) => {
      setResolveFn(() => resolve);
    });
  };

  // Se llama cuando el usuario presiona “Aceptar”
  const handleConfirm = () => {
    if (resolveFn) resolveFn(true);
    setIsOpen(false);
  };

  // Se llama cuando el usuario presiona “Cancelar”
  const handleCancel = () => {
    if (resolveFn) resolveFn(false);
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Aquí se define el modal global de confirmación */}
      {isOpen && (
        <div
          className="
            fixed inset-0 z-50 flex items-center justify-center
            bg-black/30
            backdrop-blur-sm
          "
        >
          <div className="bg-white p-6 rounded shadow-md w-[380px]">
            <h2 className="text-lg font-semibold mb-4">
              {options.title ?? "Confirmación"}
            </h2>
            <p className="mb-6 text-gray-700">{options.message}</p>

            <div className="flex justify-end gap-2">
              {/* Botón Cancelar */}
              <Button
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
                onClick={handleCancel}
              >
                {options.cancelText ?? "Cancelar"}
              </Button>

              {/* Botón Aceptar */}
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleConfirm}
              >
                {options.confirmText ?? "Aceptar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
