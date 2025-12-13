"use client";

import type React from "react";
import { useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales inválidas. Por favor intente de nuevo.");
        console.error("Error de inicio de sesión:", result.error);
      } else if (result?.ok) {
        window.location.href = "/admin";
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
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#00723F] relative overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          {/* Logo sin fondo */}
          <Image
            src="/uabc_logo.png"
            alt="UABC Logo"
            width={180}
            height={180}
            className="mb-8 drop-shadow-2xl"
          />

          {/* Título */}
          <h1 className="text-4xl font-bold text-center mb-4">ENCUADRES FCQI</h1>
          <div className="w-16 h-1 bg-[#DD971A] rounded-full mb-6" />

          {/* Subtítulo */}
          <p className="text-xl text-center text-white/90 mb-2">
            Sistema de Gestión Académica
          </p>
          <p className="text-center text-white/70 max-w-sm">
            Facultad de Ciencias Químicas e Ingeniería
          </p>

          {/* Footer del panel */}
          <div className="absolute bottom-8 text-center">
            <p className="text-sm text-white/60">
              Universidad Autónoma de Baja California
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Image
              src="/uabc_logo.png"
              alt="UABC Logo"
              width={100}
              height={100}
              className="mb-4"
            />
            <h1 className="text-2xl font-bold text-[#00723F]">ENCUADRES</h1>
            <p className="text-sm text-gray-500">FCQI - UABC</p>
          </div>

          {/* Card del formulario */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Bienvenido
              </h2>
              <p className="text-gray-500 mt-2">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de correo */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@uabc.edu.mx"
                    required
                    className="pl-10 h-12 border-gray-200 focus:border-[#00723F] focus:ring-[#00723F]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Campo de contraseña */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Contraseña
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-[#00723F] hover:text-[#005e30] font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-[#00723F] focus:ring-[#00723F]"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Botón de envío */}
              <Button
                type="submit"
                className="w-full h-12 bg-[#00723F] hover:bg-[#005e30] text-white font-medium text-base rounded-lg transition-all duration-200 shadow-lg shadow-[#00723F]/25 hover:shadow-xl hover:shadow-[#00723F]/30"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}