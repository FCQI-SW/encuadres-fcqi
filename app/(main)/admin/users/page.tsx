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
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Hook para confirmación de borrado
import { useConfirm } from "@/components/global-confirm-modal";
import { AddUserModal } from "./add-user";

// Tipos para usuarios, roles, etc.
type User = {
  id: string;      // PK en tu tabla 'usuarios' (uuid o int)
  email: string;   // 'correo' en DB
  name: string;    // 'nombre' en DB
  role_id: string; // 'rol_id' en DB
};

type Role = {
  id: string;      
  nombre: string;  
};

type NewUser = {
  email: string;
  password: string;
  role_id: string;
  name: string;    
};

export default function UserManagementPage() {
  const router = useRouter();

  // ==================== ESTADOS ====================
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({});

  // Filtro por rol y texto
  const [selectedRole, setSelectedRole] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // Modal crear usuario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    password: "",
    role_id: "",
    name: "",
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Mensaje de éxito (crear/eliminar) con autodescarga
  const [successMessage, setSuccessMessage] = useState("");

  // Confirm hook para borrar
  const confirm = useConfirm();

  // ==================== EFECTOS ====================
  // 1) Cargar usuarios y roles
  useEffect(() => {
    const fetchData = async () => {
      // Trae usuarios (including nombre)
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, correo, nombre, rol_id");

      // Trae roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, nombre");

      if (usuariosError || rolesError) {
        console.error("Error al obtener usuarios/roles:", {
          usuariosError,
          rolesError,
        });
        return;
      }

      // Mapeo
      const mappedUsers = (usuariosData || []).map((u) => ({
        id: u.id,
        email: u.correo,
        name: u.nombre,
        role_id: u.rol_id,
      }));

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

  // 2) Quitar mensaje de éxito a los 7 seg
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 7000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ==================== FILTRO DE USUARIOS ====================
  // Filtrar por rol y por searchTerm (correo o nombre)
  const filteredUsers = users.filter((user) => {
    const matchesRole =
      selectedRole === "Todos"
        ? true
        : rolesMap[user.role_id] === selectedRole;

    // Filtramos por searchTerm en email o name (case-insensitive)
    const st = searchTerm.toLowerCase();
    const matchesSearch =
      user.email.toLowerCase().includes(st) ||
      user.name.toLowerCase().includes(st);

    return matchesRole && matchesSearch;
  });

  // ==================== PAGINACIÓN DINÁMICA ====================
  // Calcula total de páginas
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Si se borró un usuario y la página actual quedó vacía,
  // ajustamos la currentPage a la última con contenido (o 1 si totalPages=0)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      // No hay usuarios filtrados => forzamos a la página 1 
      // (aunque no haya paginación en pantalla, evita “quedarse” en 2)
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Indices y slice para la página actual
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // ==================== HANDLERS ====================
  // Cambiar rol de un usuario
  const handleRoleChange = async (userId: string, newRoleName: string) => {
    const newRole = roles.find((r) => r.nombre === newRoleName);
    if (!newRole) return;

    const { error } = await supabase
      .from("usuarios")
      .update({ rol_id: newRole.id })
      .eq("id", userId);

    if (error) {
      console.error("Error al actualizar rol:", error.message);
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role_id: newRole.id } : user
      )
    );
  };

  // Borrar usuario con confirm
  const handleDelete = async (userId: string) => {
    const userConfirmed = await confirm({
      title: "Eliminar usuario",
      message: "¿Estás seguro de eliminar este usuario?",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
    });
    if (!userConfirmed) return;

    const { error } = await supabase.from("usuarios").delete().eq("id", userId);
    if (error) {
      console.error("Error al eliminar usuario:", error.message);
      return;
    }

    // Saca del estado
    const deletedUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (deletedUser) {
      setSuccessMessage(`Usuario ${deletedUser.email} eliminado con éxito.`);
    }
  };

  // Abrir/cerrar modal crear
  const handleOpenModal = () => {
    setNewUser({ email: "", password: "", role_id: "", name: "" });
    setErrors([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Inputs del modal
  const handleNewUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setNewUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Crear usuario (con validaciones ya agregadas en tu “handleSaveNewUser”)
  // Aquí un ejemplo simple; personaliza según tus validaciones
  const handleSaveNewUser = async () => {
    setErrors([]);
    const tempErrors: string[] = [];

    // Validaciones rápidas
    if (!newUser.email.trim()) tempErrors.push("El correo es obligatorio.");
    if (!newUser.password.trim()) tempErrors.push("La contraseña es obligatoria.");
    if (!newUser.role_id.trim()) tempErrors.push("Selecciona un rol.");
    if (!newUser.name.trim()) tempErrors.push("El nombre es obligatorio.");

    if (tempErrors.length > 0) {
      setErrors(tempErrors);
      return;
    }

    // Insert en BD
    const { error } = await supabase
      .from("usuarios")
      .insert([
        {
          correo: newUser.email,
          nombre: newUser.name,
          contraseña: newUser.password,
          rol_id: newUser.role_id,
        },
      ]);

    if (error) {
      console.error("Error al crear usuario:", error.message);
      setErrors([`Hubo un error al crear el usuario: ${error.message}`]);
      return;
    }

    setIsModalOpen(false);

    // Refrescamos
    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id, correo, nombre, rol_id");
    if (usuariosData) {
      setUsers(
        usuariosData.map((u) => ({
          id: u.id,
          email: u.correo,
          name: u.nombre,
          role_id: u.rol_id,
        }))
      );
    }

    // Mensaje de éxito
    setSuccessMessage(`Usuario ${newUser.email} creado con éxito.`);
  };

  // ==================== RENDER ====================
  return (
    <div className="p-6">
      {/* ENCABEZADO */}
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

      {/* MENSAJE DE ÉXITO */}
      {successMessage && (
        <div className="mb-4 p-3 border border-green-500 bg-green-50 text-green-800 rounded">
          <div className="flex items-center justify-between">
            <span>{successMessage}</span>
            <Button variant="outline" size="sm" onClick={() => setSuccessMessage("")}>
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {/* FILTROS: ROL y BUSCADOR (correo/nombre) */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="font-medium">Filtrar por Rol:</span>
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

        {/* Buscar por correo o nombre */}
        <div className="flex items-center gap-2">
          <Label htmlFor="searchTerm" className="font-medium">
            Buscar:
          </Label>
          <input
            id="searchTerm"
            type="text"
            placeholder="Correo o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-2 py-1 w-[200px]"
          />
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Correo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentUsers.length > 0 ? (
            currentUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>
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
                  <Button variant="destructive" onClick={() => handleDelete(user.id)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                No se encontraron usuarios.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* PAGINACIÓN */}
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
              key={i + 1}
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
