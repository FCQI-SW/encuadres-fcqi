"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Importa el modal
import { AddUserModal } from "./add-user";

// Tipos para usuarios y roles
type User = {
  id: string;      // o number, si tu PK es integer
  email: string;   // 'correo' en DB
  role_id: string; // UUID del rol
};

type Role = {
  id: string;      // UUID en la tabla 'roles'
  nombre: string;  // Nombre del rol
};

type NewUser = {
  email: string;
  password: string;
  role_id: string;
  name: string;    // Para la columna 'nombre'
};

export default function UserManagementPage() {
  const router = useRouter();

  // Estado para usuarios, roles y mapa (id->nombre)
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({});

  // Filtro y paginación
  const [selectedRole, setSelectedRole] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // -- Estados para el modal de agregar usuario --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    password: "",
    role_id: "",
    name: "",
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Carga de datos inicial
  useEffect(() => {
    const fetchData = async () => {
      // Obtén usuarios de la tabla 'usuarios'
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, correo, rol_id"); 

      // Obtén roles de la tabla 'roles'
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, nombre");

      if (usuariosError || rolesError) {
        console.error("Error al obtener usuarios o roles:", {
          usuariosError,
          rolesError,
        });
        return;
      }

      // Mapeamos a nuestro tipo "User"
      const mappedUsers = (usuariosData || []).map((u) => ({
        id: u.id,
        email: u.correo,    // en la BD se llama 'correo'
        role_id: u.rol_id,  
      }));

      // Mapa id -> nombre del rol
      const rolMap = (rolesData || []).reduce((acc, rol) => {
        acc[rol.id] = rol.nombre;
        return acc;
      }, {} as Record<string, string>);

      setUsers(mappedUsers);
      setRoles(rolesData || []);
      setRolesMap(rolMap);
    };

    fetchData();
  }, []);

  // Filtrar según rol
  const filteredUsers =
    selectedRole === "Todos"
      ? users
      : users.filter((user) => rolesMap[user.role_id] === selectedRole);

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Cambiar rol de un usuario
  const handleRoleChange = async (userId: string, newRoleName: string) => {
    // Buscar en el array "roles" el que tenga ese nombre
    const newRole = roles.find((r) => r.nombre === newRoleName);
    if (!newRole) return;

    const { error } = await supabase
      .from("usuarios")
      .update({ rol_id: newRole.id })
      .eq("id", userId);

    if (error) {
      console.error("Error al actualizar rol:", error.message || error);
      return;
    }

    // Actualiza en el estado local
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role_id: newRole.id } : user
      )
    );
  };

  // Eliminar usuario
  const handleDelete = async (userId: string) => {
    const { error } = await supabase.from("usuarios").delete().eq("id", userId);
    if (error) {
      console.error("Error al eliminar usuario:", error.message || error);
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // -- Lógica del modal: abrir, cerrar, etc.
  const handleOpenModal = () => {
    // Reseteamos el estado de newUser y errors
    setNewUser({ email: "", password: "", role_id: "", name: "" });
    setErrors([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleNewUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setNewUser((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Crear usuario en DB (insert)
  const handleSaveNewUser = async () => {
    setErrors([]);
    const tempErrors: string[] = [];

    // Validaciones mínimas
    if (!newUser.email) tempErrors.push("El correo es obligatorio.");
    if (!newUser.name) tempErrors.push("El nombre es obligatorio.");
    if (!newUser.password) tempErrors.push("La contraseña es obligatoria.");
    if (!newUser.role_id) tempErrors.push("Selecciona un rol.");

    if (tempErrors.length > 0) {
      setErrors(tempErrors);
      return;
    }

    // Insertar en DB => Ajustar nombres de columnas
    // OJO: tu tabla de 'usuarios' tiene "nombre" (NOT NULL), "correo", "contrasena", "rol_id", ...
    const { error } = await supabase
      .from("usuarios")
      .insert([
        {
          // Campos en la BD
          correo: newUser.email,    
          nombre: newUser.name,     // Aquí enviamos 'nombre', que es NOT NULL
          contraseña: newUser.password, 
          rol_id: newUser.role_id, 
        },
      ]);

    if (error) {
      console.error("Error al crear usuario:", error.message || error);
      setErrors([`Hubo un error al crear el usuario: ${error.message}`]);
      return;
    }

    // Si todo ok, cierra modal y refresca
    setIsModalOpen(false);

    // Recargar la lista de usuarios
    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id, correo, rol_id");

    if (usuariosData) {
      setUsers(
        usuariosData.map((u) => ({
          id: u.id,
          email: u.correo,
          role_id: u.rol_id,
        }))
      );
    }
  };

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={() => router.push("/admin")}>
          <ChevronLeft className="mr-2 h-5 w-5" />
          Regresar
        </Button>
        <Button
          variant="default"
          className="bg-[#00723F] hover:bg-[#005e30] text-white"
          onClick={handleOpenModal}
        >
          Crear usuario
        </Button>
      </div>

      {/* Filtro por rol */}
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-medium">Filtrar por:</span>
          <Select onValueChange={setSelectedRole} defaultValue="Todos">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los usuarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {roles.map((rol) => (
                <SelectItem key={rol.id} value={rol.nombre}>
                  {rol.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            currentUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {/* Select para cambiar rol en vivo */}
                  <Select
                    defaultValue={rolesMap[user.role_id] || "Desconocido"}
                    onValueChange={(val) => handleRoleChange(user.id, val)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((rol) => (
                        <SelectItem key={rol.id} value={rol.nombre}>
                          {rol.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(user.id)}
                  >
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
          <Button
            variant="default"
            disabled={currentPage === 1}
            className="bg-white hover:bg-white text-[#00723F] border border-[#00723F]"
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? "default" : "outline"}
              className={
                currentPage === i + 1
                  ? "bg-[#00723F] hover:bg-[#005e30] text-white"
                  : "border border-[#00723F] text-[#00723F] hover:bg-[#00723F] hover:text-white"
              }
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="default"
            disabled={currentPage === totalPages}
            className="bg-white hover:bg-white text-[#00723F] border border-[#00723F]"
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* MODAL PARA AGREGAR USUARIO */}
      <AddUserModal
        isOpen={isModalOpen}
        newUser={newUser}
        onClose={handleCloseModal}
        onInputChange={handleNewUserChange}
        onSave={handleSaveNewUser}
        errors={errors}
        roles={roles}
      />
    </div>
  );
}
