"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin() {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Error al iniciar sesión");
        return;
      }

      const data = await res.json();
      alert(`Bienvenido, rol: ${data.user.role}`);

      // Guardamos el rol en localStorage
      localStorage.setItem("userRole", data.user.role);

      // 🔥 Redirigir al usuario según su rol (ejemplo: /admin, /profesor, /alumno)
      router.push(`/${data.user.role}`);
    } catch (error) {
      console.error("Error al hacer login:", error);
      alert("Ocurrió un error al iniciar sesión");
    }
  }

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
          {/* Form con onSubmit para manejar "Enter" */}
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div>
              <Label htmlFor="email" className="mb-1 block">
                CORREO ELECTRÓNICO
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Dirección de correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
