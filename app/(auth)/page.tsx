"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Intentando iniciar sesión con:", { email });

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("Resultado de inicio de sesión:", result);

      if (result?.error) {
        setError("Credenciales inválidas. Por favor intente de nuevo.");
        console.error("Error de inicio de sesión:", result.error);
      } else if (result?.ok) {
        console.log("Inicio de sesión exitoso, redirigiendo...");
        router.push("/admin");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError(
        "Ocurrió un error al iniciar sesión. Por favor intente de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5F5F7]">
      <Card className="w-full max-w-md shadow-md py-4 border-0">
        <CardHeader className="flex flex-col items-center space-y-4 pb-6">
          <Image
            src="/uabc_logo.png"
            alt="UABC Logo"
            width={80}
            height={80}
            className="mb-4"
          />
          <h2 className="text-2xl font-bold text-center py-2 text-gray-800">
            Sistema de revisión de encuadres
          </h2>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-gray-400 uppercase text-xs font-bold"
              >
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Dirección de correo electrónico"
                required
                className="placeholder:text-gray-300 border-gray-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-gray-400 uppercase text-xs font-bold"
                >
                  Contraseña
                </Label>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-gray-400 font-normal"
                  asChild
                >
                  <a href="#">¿Olvidaste tu contraseña?</a>
                </Button>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="pr-10 placeholder:text-gray-300 border-gray-200"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#00723F] hover:bg-[#005a32] text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
