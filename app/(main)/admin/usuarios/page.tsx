"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  UserPlus,
  Users,
  Loader2,
} from "lucide-react";
import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";
import { AddUserModal } from "./add-user";
import * as XLSX from "xlsx";

type User = {
  id: string;
  email: string;
  name: string;
  role_id: string;
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
  const confirm = useConfirm();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    password: "",
    role_id: "",
    name: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [usuariosRes, rolesRes] = await Promise.all([
        supabase.from("usuarios").select("id, correo, nombre, rol_id"),
        supabase.from("roles").select("id, nombre"),
      ]);

      if (usuariosRes.error || rolesRes.error) {
        console.error(
          "Error al obtener datos:",
          usuariosRes.error,
          rolesRes.error
        );
        return;
      }

      const mappedUsers = (usuariosRes.data || []).map((u) => ({
        id: u.id,
        email: u.correo,
        name: u.nombre,
        role_id: u.rol_id,
      }));

      const rolMap = (rolesRes.data || []).reduce((acc, rol) => {
        acc[rol.id] = rol.nombre;
        return acc;
      }, {} as Record<string, string>);

      setUsers(mappedUsers);
      setRoles(rolesRes.data || []);
      setRolesMap(rolMap);
    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  }

  // Filtrado
  const filteredUsers = users.filter((user) => {
    const matchesRole =
      selectedRole === "Todos" || rolesMap[user.role_id] === selectedRole;
    const st = searchTerm.toLowerCase();
    const matchesSearch =
      user.email.toLowerCase().includes(st) ||
      user.name.toLowerCase().includes(st);
    return matchesRole && matchesSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Cambiar rol
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
    toast.success("Rol actualizado correctamente.");
  };

  // Eliminar usuario
  const handleDelete = async (userId: string) => {
    const userConfirmed = await confirm({
      title: "Eliminar usuario",
      message:
        "¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
    });
    if (!userConfirmed) return;

    const { error } = await supabase.from("usuarios").delete().eq("id", userId);
    if (error) {
      console.error("Error al eliminar usuario:", error.message);
      return;
    }

    const deletedUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (deletedUser) {
      toast.success(`Usuario "${deletedUser.email}" eliminado correctamente.`);
    }
  };

  // Modal handlers
  const handleOpenModal = () => {
    setNewUser({ email: "", password: "", role_id: "", name: "" });
    setErrors([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrors([]);
  };

  const handleNewUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setNewUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Crear usuario
  const handleSaveNewUser = async () => {
    setErrors([]);
    const tempErrors: string[] = [];

    // Validaciones
    if (!newUser.email.trim()) {
      tempErrors.push("El correo electrónico es obligatorio.");
    } else if (!isValidEmail(newUser.email)) {
      tempErrors.push("El correo electrónico no tiene un formato válido.");
    }

    if (!newUser.name.trim()) {
      tempErrors.push("El nombre es obligatorio.");
    } else if (newUser.name.trim().length < 3) {
      tempErrors.push("El nombre debe tener al menos 3 caracteres.");
    }

    if (!newUser.password.trim()) {
      tempErrors.push("La contraseña es obligatoria.");
    } else if (newUser.password.length < 6) {
      tempErrors.push("La contraseña debe tener al menos 6 caracteres.");
    }

    if (!newUser.role_id.trim()) {
      tempErrors.push("Debes seleccionar un rol.");
    }

    // Verificar si el correo ya existe
    if (newUser.email.trim() && isValidEmail(newUser.email)) {
      const emailExists = users.some(
        (u) => u.email.toLowerCase() === newUser.email.toLowerCase()
      );
      if (emailExists) {
        tempErrors.push("Ya existe un usuario con este correo electrónico.");
      }
    }

    if (tempErrors.length > 0) {
      setErrors(tempErrors);
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("usuarios").insert([
      {
        correo: newUser.email.trim(),
        nombre: newUser.name.trim(),
        contraseña: newUser.password,
        rol_id: newUser.role_id,
      },
    ]);

    if (error) {
      console.error("Error al crear usuario:", error.message);
      setErrors([`Error al crear el usuario: ${error.message}`]);
      setSaving(false);
      return;
    }

    setIsModalOpen(false);
    setErrors([]);
    toast.success(`Usuario "${newUser.email}" creado correctamente.`);
    setSaving(false);

    // Refrescar lista
    await fetchData();
  };

  // Importar desde Excel
  async function handleImportFromExcel(file: File) {
    try {
      setErrors([]);
      setSaving(true);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const rows = jsonData.slice(1);

      if (rows.length === 0) {
        setErrors(["El archivo Excel está vacío o no tiene datos válidos."]);
        setSaving(false);
        return;
      }

      const bulkUsers = rows
        .filter((row: any) => row[0] && row[1]) // Solo filas con email y nombre
        .map((row: any) => ({
          correo: String(row[0] || "").trim(),
          nombre: String(row[1] || "").trim(),
          contraseña: String(row[2] || "password123"),
          rol_id: String(row[3] || "").trim(),
        }));

      if (bulkUsers.length === 0) {
        setErrors(["No se encontraron usuarios válidos en el archivo."]);
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("usuarios").insert(bulkUsers);
      if (error) {
        console.error("Error al importar Excel:", error);
        setErrors([`Error al importar usuarios: ${error.message}`]);
        setSaving(false);
        return;
      }

      setIsModalOpen(false);
      setErrors([]);
      toast.success(
        `Se importaron ${bulkUsers.length} usuarios correctamente.`
      );
      setSaving(false);

      await fetchData();
    } catch (err: any) {
      console.error("Error leyendo Excel:", err);
      setErrors(["Error al leer el archivo Excel. Verifica el formato."]);
      setSaving(false);
    }
  }

  // Estadísticas
  const stats = {
    total: users.length,
    porRol: roles.map((r) => ({
      nombre: r.nombre,
      count: users.filter((u) => u.role_id === r.id).length,
    })),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manejo de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin")}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
          </Button>
          <Button
            onClick={handleOpenModal}
            className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Crear usuario
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total usuarios</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        {stats.porRol.slice(0, 4).map((r) => (
          <Card key={r.nombre}>
            <CardContent className="pt-4">
              <div>
                <p className="text-sm text-muted-foreground capitalize">
                  {r.nombre}
                </p>
                <p className="text-2xl font-bold">{r.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por correo o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select onValueChange={setSelectedRole} defaultValue="Todos">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos los roles</SelectItem>
                {roles.map((rol) => (
                  <SelectItem key={rol.id} value={rol.nombre}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron usuarios</p>
              <p className="text-sm">Intenta con otros filtros de búsqueda</p>
            </div>
          ) : (
            <>
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
                  {currentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={rolesMap[user.role_id] || "Desconocido"}
                          onValueChange={(val) =>
                            handleRoleChange(user.id, val)
                          }
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
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    className="cursor-pointer"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        className={
                          currentPage === pageNum
                            ? "bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
                            : "cursor-pointer"
                        }
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-2 py-2">...</span>}
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    className="cursor-pointer"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <AddUserModal
        isOpen={isModalOpen}
        newUser={newUser}
        onClose={handleCloseModal}
        onInputChange={handleNewUserChange}
        onSave={handleSaveNewUser}
        errors={errors}
        roles={roles}
        onImportFromExcel={handleImportFromExcel}
        saving={saving}
      />
    </div>
  );
}
