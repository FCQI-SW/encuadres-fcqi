"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Importa useRouter
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

type User = {
  id: number;
  email: string;
  role: string;
};

const roles = ["Todos", "Administrador", "Profesor", "Capturista", "Lector", "Alumno"];

const initialUsers: User[] = Array(9).fill(null).map((_, i) => ({
  id: i + 1,
  email: `prueba.prueba@uabcs.edu.mx`,
  role: roles[i % roles.length], // Asigna roles de manera cíclica
}));

export default function UserManagementPage() {
  const router = useRouter(); // Inicializa el router
  const [selectedRole, setSelectedRole] = useState<string>("Todos"); // Estado del filtro
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // Manejar cambio de rol
  const handleRoleChange = (id: number, newRole: string) => {
    setUsers(users.map(user => (user.id === id ? { ...user, role: newRole } : user)));
  };

  // Eliminar usuario
  const handleDelete = (id: number) => {
    setUsers(users.filter(user => user.id !== id));
  };

  // Filtrado de usuarios
  const filteredUsers = selectedRole === "Todos" ? users : users.filter(user => user.role === selectedRole);

  // Paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="p-6">
      {/* Botón de regresar */}
      <Button variant="outline" className="mb-4" onClick={() => router.push("/admin")}>
        <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
      </Button>

      {/* Filtro por tipo de usuario */}
      <div className="flex justify-end mb-2">
        <Select onValueChange={setSelectedRole} defaultValue="Todos">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por: Todos los usuarios" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de usuarios */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentUsers.length > 0 ? (
            currentUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select onValueChange={value => handleRoleChange(user.id, value)} defaultValue={user.role}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={user.role} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.slice(1).map(role => ( // Evita "Todos" en la edición de roles
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="destructive" onClick={() => handleDelete(user.id)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4">
                No se encontraron usuarios.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {[...Array(totalPages)].map((_, i) => (
            <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "outline"} onClick={() => setCurrentPage(i + 1)}>
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
