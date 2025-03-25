"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft } from "lucide-react"

const roles = ["Administrador", "Profesor", "Capturista", "Lector", "Alumno"]

export default function CreateUserPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState(roles[0])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Aquí puedes agregar la lógica para crear el usuario
    console.log("Creando usuario:", { email, role })
    router.push("/admin/users")
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      {/* Botón de regresar en la parte superior izquierda */}
      <Button variant="outline" className="mb-4 self-start" onClick={() => router.back()}>
        <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
      </Button>

      <h1 className="text-2xl font-bold mb-4">Crear Usuario</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="block mb-1">
            Correo
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="role" className="block mb-1">
            Rol
          </Label>
          <Select onValueChange={(value) => setRole(value)} defaultValue={roles[0]}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(r => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full bg-[#00723F] hover:bg-[#005e30] text-white">
          Crear Usuario
        </Button>
      </form>
    </div>
  )
}
