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

// Importa tu modal
import { AddUserModal } from "./add-user"; // Ajusta la ruta si tu componente está en otra carpeta

// Tipos para usuarios y roles
type User = {
  id: number;      // PK de tu tabla 'usuarios'
  email: string;   // Campo que mostrará el correo
  role_id: string; // ID del rol en la tabla 'roles'
};

type Role = {
  id: string;
  nombre: string;
};

// Si quisieras manejar más campos en el modal, agrégalos aquí
type NewUser = {
  email: string;
  role_id: string;
  password: string;
};

export default function UserManagementPage() {
  const router = useRouter();

  // Estado para usuarios, roles y mapa (id->nombre)
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({});

  // Estado para filtros y paginación
  const [selectedRole, setSelectedRole] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // ----------- ESTADOS PARA EL MODAL -----------
  // Controla si el modal está abierto/cerrado
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Datos del nuevo usuario (se sincroniza con el modal)
  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    role_id: "",
    password: "",
  });
  // Errores para mostrar en el modal
  const [errors, setErrors] = useState<string[]>([]);

  // Cargar datos de Supabase al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      // Obtén usuarios
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, correo, rol_id"); // Ajusta los campos según tu esquema

      // Obtén roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, nombre"); // Ajusta los campos según tu tabla de roles

      if (usuariosError || rolesError) {
        console.error("Error al obtener usuarios o roles:", {
          usuariosError,
          rolesError,
        });
        return;
      }

      // Mapeamos los usuarios para que cumplan con nuestro type User
      const mappedUsers = (usuariosData || []).map((u) => ({
        id: u.id,
        email: u.correo,
        role_id: u.rol_id,
      }));

      // Creamos un "mapa" para convertir role_id a nombre de rol
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

  // Filtrado por rol usando el mapa rolesMap
  const filteredUsers =
    selectedRole === "Todos"
      ? users
      : users.filter((user) => rolesMap[user.role_id] === selectedRole);

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Función para cambiar el rol de un usuario
  const handleRoleChange = async (userId: number, newRoleName: string) => {
    // Buscar en el array "roles" cuál tiene ese "nombre"
    const newRole = roles.find((r) => r.nombre === newRoleName);
    if (!newRole) return;

    // Actualizamos en Supabase
    const { error } = await supabase
      .from("usuarios")
      .update({ rol_id: newRole.id })
      .eq("id", userId);

    if (error) {
      console.error("Error al actualizar rol:", error);
      return;
    }

    // Si todo salió bien, reflejamos el cambio en el estado local
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role_id: newRole.id } : user
      )
    );
  };

  // Función para eliminar un usuario
  const handleDelete = async (userId: number) => {
    const { error } = await supabase.from("usuarios").delete().eq("id", userId);

    if (error) {
      console.error("Error al eliminar usuario:", error);
      return;
    }

    // Si la eliminación fue exitosa en Supabase, removemos del estado
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  // ----------- FUNCIONES PARA EL MODAL -----------
  // Abre el modal y limpia el estado del nuevo usuario
  const handleOpenModal = () => {
    setNewUser({ email: "", role_id: "", password: "" });
    setErrors([]);
    setIsModalOpen(true);
  };

  // Cierra el modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Maneja el cambio de inputs en el modal
  const handleNewUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setNewUser((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Lógica para guardar el nuevo usuario en Supabase
  const handleSaveNewUser = async () => {
    // Limpia errores previos
    setErrors([]);
    const tempErrors: string[] = [];

    // Validaciones sencillas (ajusta según tu caso)
    if (!newUser.email) tempErrors.push("El campo email es obligatorio.");
    if (!newUser.password) tempErrors.push("El campo contraseña es obligatorio.");
    if (!newUser.role_id) tempErrors.push("El campo rol es obligatorio.");

    if (tempErrors.length > 0) {
      setErrors(tempErrors);
      return;
    }

    // Inserta al nuevo usuario en la tabla "usuarios"
    // Ajusta a tus campos reales de BD. Ejemplo:
    //  - si tu campo en BD es "correo" en lugar de "email"
    //  - si manejas hashing de password en el backend
    const { error } = await supabase.from("usuarios").insert([
      {
        correo: newUser.email,
        rol_id: newUser.role_id,
        password: newUser.password, // Ten cuidado con la seguridad
      },
    ]);

    if (error) {
      console.error("Error al crear usuario:", error);
      setErrors(["Hubo un error al crear el usuario."]);
      return;
    }

    // Si todo fue bien, cierra el modal y recarga la lista de usuarios
    setIsModalOpen(false);
    // Opcional: refetch de la lista, o puedes "push" al estado
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
      {/* Encabezado: Botón de regresar y botón "Crear usuario" */}
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={() => router.push("/admin")}>
          <ChevronLeft className="mr-2 h-5 w-5" />
          Regresar
        </Button>

        {/* Cambiamos el onClick para abrir el modal en lugar de hacer push */}
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
                  {/* Select para cambiar el rol del usuario en tiempo real */}
                  <Select
                    defaultValue={rolesMap[user.role_id] || "Desconocido"}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
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

      {/* MODAL DE AGREGAR USUARIO */}
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
