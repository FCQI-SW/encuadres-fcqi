"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6 shadow-md">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/uabc_logo.png" 
            alt="Logo"
            width={80}
            height={80}
            className="mb-4"
          />
          <h2 className="text-2xl font-bold text-center">
            Sistema de revisión de encuadres
          </h2>
        </div>

        <CardContent>
          <form className="space-y-5">
            <div>
              <Label htmlFor="email" className="mb-1 block">
                CORREO ELECTRÓNICO
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Dirección de correo electrónico"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password">CONTRASEÑA</Label>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <Button type="button" className="w-full bg-green-600 hover:bg-green-700">
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
