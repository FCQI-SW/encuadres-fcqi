"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  messages?: string[]; 
}

export function ErrorModal({
  isOpen,
  onClose,
  title = "Ocurrió un error",
  messages = [],
}: ErrorModalProps) {
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
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        {/* Lista de errores si existen */}
        {messages.length > 0 ? (
          <ul className="list-disc ml-6 text-red-600 mb-4">
            {messages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        ) : (
          <p className="text-red-600 mb-4">
            Ha ocurrido un error inesperado.
          </p>
        )}

        <div className="flex justify-end">
          <Button variant="default" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
