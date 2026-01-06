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
  Edit,
  Trash2,
  ToggleRight,
  ToggleLeft,
  Search,
  BookOpen,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";
import { ModalAgregarMateria } from "../../../../components/modal-agregar-materia";
import { ModalEditarMateria } from "../../../../components/modal-editar-materia";

export type Materia = {
  clave: string;
  nombre_materia: string;
  licenciatura: string;
  categoria: "Basica" | "Disciplinaria" | "Terminal";
  requisito: "obligatoria" | "optativa";
  estado: "Activa" | "Inactiva";
};

export default function MateriasPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();

  const [data, setData] = useState<Materia[]>([]);
  const [filteredData, setFilteredData] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLic, setSelectedLic] = useState("all");
  const [selectedCategoria, setSelectedCategoria] = useState("all");
  const [selectedRequisito, setSelectedRequisito] = useState("all");
  const [selectedEstado, setSelectedEstado] = useState("all");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal agregar
  const [showForm, setShowForm] = useState(false);
  const [newMateria, setNewMateria] = useState<Materia>({
    clave: "",
    nombre_materia: "",
    licenciatura: "",
    categoria: "Basica",
    requisito: "obligatoria",
    estado: "Activa",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Modal editar
  const [showEditForm, setShowEditForm] = useState(false);
  const [editMateria, setEditMateria] = useState<Materia | null>(null);
  const [editErrors, setEditErrors] = useState<string[]>([]);

  // Cargar datos
  const fetchMaterias = async () => {
    setLoading(true);
    try {
      const { data: materias, error } = await supabase
        .from("materias")
        .select(
          "clave, nombre_materia, licenciatura, categoria, requisito, estado"
        )
        .order("nombre_materia", { ascending: true });

      if (error) {
        console.error("Error al obtener materias:", error);
        return;
      }
      if (materias) {
        setData(materias);
        setFilteredData(materias);
      }
    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedLic("all");
    setSelectedCategoria("all");
    setSelectedRequisito("all");
    setSelectedEstado("all");
  };

  // Verificar si hay filtros activos
  const hasActiveFilters =
    searchTerm ||
    selectedLic !== "all" ||
    selectedCategoria !== "all" ||
    selectedRequisito !== "all" ||
    selectedEstado !== "all";

  // Filtrado
  useEffect(() => {
    let temp = [...data];

    // Filtro por licenciatura
    if (selectedLic !== "all") {
      temp = temp.filter((item) => item.licenciatura === selectedLic);
    }

    // Filtro por categoría
    if (selectedCategoria !== "all") {
      temp = temp.filter((item) => item.categoria === selectedCategoria);
    }

    // Filtro por requisito
    if (selectedRequisito !== "all") {
      temp = temp.filter((item) => item.requisito === selectedRequisito);
    }

    // Filtro por estado
    if (selectedEstado !== "all") {
      temp = temp.filter((item) => item.estado === selectedEstado);
    }

    // Búsqueda por texto
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      temp = temp.filter(
        (item) =>
          item.clave.toLowerCase().includes(search) ||
          item.nombre_materia.toLowerCase().includes(search)
      );
    }

    setFilteredData(temp);
    setCurrentPage(1);
  }, [
    data,
    selectedLic,
    selectedCategoria,
    selectedRequisito,
    selectedEstado,
    searchTerm,
  ]);

  const licenciaturas = Array.from(
    new Set(data.map((item) => item.licenciatura))
  );

  // Toggle estado
  async function toggleEstado(clave: string) {
    const materiaActual = data.find((d) => d.clave === clave);
    if (!materiaActual) return;
    const nuevoEstado =
      materiaActual.estado === "Activa" ? "Inactiva" : "Activa";

    const { error } = await supabase
      .from("materias")
      .update({ estado: nuevoEstado })
      .eq("clave", clave);

    if (error) {
      console.error("Error al actualizar estado:", error.message);
      return;
    }

    setData((prev) =>
      prev.map((item) =>
        item.clave === clave ? { ...item, estado: nuevoEstado } : item
      )
    );
    toast.success(`Estado de materia "${clave}" actualizado a ${nuevoEstado}.`);
  }

  // Eliminar
  async function handleDelete(clave: string) {
    const confirmed = await confirm({
      title: "Eliminar materia",
      message:
        "¿Estás seguro de eliminar esta materia? Esta acción no se puede revertir.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
    });
    if (!confirmed) return;

    const { error } = await supabase
      .from("materias")
      .delete()
      .eq("clave", clave);
    if (error) {
      console.error("Error al eliminar materia:", error.message);
      return;
    }

    setData((prev) => prev.filter((item) => item.clave !== clave));
    toast.success(`Materia "${clave}" eliminada correctamente.`);
  }

  // Editar
  const handleEdit = (materia: Materia) => {
    setEditMateria(materia);
    setEditErrors([]);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditMateria(null);
    setEditErrors([]);
  };

  function handleEditInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editMateria) return;
    const { name, value } = e.target;
    setEditMateria((prev) => (prev ? { ...prev, [name]: value } : null));
  }

  function handleEditSelectChange(name: string, value: string) {
    if (!editMateria) return;
    setEditMateria((prev) => (prev ? { ...prev, [name]: value } : null));
  }

  async function handleUpdateMateria() {
    if (!editMateria) return;

    const tempErrors: string[] = [];
    if (!editMateria.nombre_materia.trim())
      tempErrors.push("El nombre de la materia es obligatorio.");
    if (!editMateria.licenciatura.trim())
      tempErrors.push("Debe seleccionar una licenciatura.");

    if (tempErrors.length > 0) {
      setEditErrors(tempErrors);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("materias")
      .update({
        nombre_materia: editMateria.nombre_materia,
        licenciatura: editMateria.licenciatura,
        categoria: editMateria.categoria,
        requisito: editMateria.requisito,
        estado: editMateria.estado,
      })
      .eq("clave", editMateria.clave);

    if (error) {
      console.error("Error al actualizar materia:", error);
      setEditErrors([traducirErrorBD(error)]);
      setSaving(false);
      return;
    }

    setShowEditForm(false);
    toast.success(`Materia "${editMateria.clave}" actualizada correctamente.`);
    setSaving(false);
    await fetchMaterias();
  }

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Modal agregar handlers
  const handleShowForm = () => {
    setNewMateria({
      clave: "",
      nombre_materia: "",
      licenciatura: "",
      categoria: "Basica",
      requisito: "obligatoria",
      estado: "Activa",
    });
    setErrors([]);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setErrors([]);
  };

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewMateria((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleSelectChange(name: string, value: string) {
    setNewMateria((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function traducirErrorBD(error: any): string {
    const errorMessage = error.message || "";
    const errorCode = error.code || "";

    if (errorCode === "23505" || errorMessage.includes("duplicate key")) {
      return `La clave ya existe. Por favor usa una clave diferente.`;
    }
    if (errorCode === "23503") {
      return "Error de integridad referencial. Verifica que los datos sean correctos.";
    }
    if (errorCode === "23502") {
      return "Faltan campos obligatorios. Por favor completa todos los campos requeridos.";
    }
    return `Error al guardar: ${errorMessage}`;
  }

  async function handleSaveMateria() {
    setErrors([]);
    const tempErrors: string[] = [];

    if (!newMateria.clave.trim()) tempErrors.push("La clave es obligatoria.");
    if (!newMateria.nombre_materia.trim())
      tempErrors.push("El nombre de la materia es obligatorio.");
    if (!newMateria.licenciatura.trim())
      tempErrors.push("Seleccione una licenciatura.");

    if (tempErrors.length > 0) {
      setErrors(tempErrors);
      return;
    }

    // Verificar clave existente
    const { data: materiaExistente } = await supabase
      .from("materias")
      .select("clave")
      .eq("clave", newMateria.clave.trim())
      .single();

    if (materiaExistente) {
      setErrors([
        `La clave "${newMateria.clave}" ya existe. Por favor usa una clave diferente.`,
      ]);
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("materias").insert([newMateria]);

    if (error) {
      console.error("Error al agregar materia:", error.message);
      setErrors([traducirErrorBD(error)]);
      setSaving(false);
      return;
    }

    setShowForm(false);
    setErrors([]);
    toast.success(`Materia "${newMateria.clave}" agregada correctamente.`);
    setSaving(false);
    await fetchMaterias();
  }

  // Importar Excel
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

      const bulkMaterias = rows
        .filter((row: any) => row[0] && row[1])
        .map((row: any) => ({
          clave: String(row[0] || "").trim(),
          nombre_materia: String(row[1] || "").trim(),
          licenciatura: String(row[2] || "").trim(),
          categoria: row[3] || "Basica",
          requisito: row[4] || "obligatoria",
          estado: row[5] || "Activa",
        }));

      if (bulkMaterias.length === 0) {
        setErrors(["No se encontraron materias válidas en el archivo."]);
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("materias").insert(bulkMaterias);

      if (error) {
        console.error("Error al importar materias:", error);
        setErrors([`Error al importar: ${traducirErrorBD(error)}`]);
        setSaving(false);
        return;
      }

      setShowForm(false);
      setErrors([]);
      toast.success(
        `Se importaron ${bulkMaterias.length} materias correctamente.`
      );
      setSaving(false);
      await fetchMaterias();
    } catch (err: any) {
      console.error("Error leyendo Excel:", err);
      setErrors(["Error al leer el archivo Excel. Verifica el formato."]);
      setSaving(false);
    }
  }

  // Estadísticas
  const stats = {
    total: data.length,
    activas: data.filter((m) => m.estado === "Activa").length,
    inactivas: data.filter((m) => m.estado === "Inactiva").length,
    obligatorias: data.filter((m) => m.requisito === "obligatoria").length,
    optativas: data.filter((m) => m.requisito === "optativa").length,
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
          <h1 className="text-2xl font-bold">Manejo de Materias</h1>
          <p className="text-muted-foreground">
            Administra el catálogo de materias
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
            onClick={handleShowForm}
            className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" /> Agregar materia
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activas}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactivas</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.inactivas}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Obligatorias</p>
              <p className="text-2xl font-bold">{stats.obligatorias}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Optativas</p>
              <p className="text-2xl font-bold">{stats.optativas}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por clave o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Filtros por categorías */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedLic} onValueChange={setSelectedLic}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Licenciatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las licenciaturas</SelectItem>
                  {licenciaturas.map((lic) => (
                    <SelectItem key={lic} value={lic}>
                      {lic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedCategoria}
                onValueChange={setSelectedCategoria}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="Basica">Básica</SelectItem>
                  <SelectItem value="Disciplinaria">Disciplinaria</SelectItem>
                  <SelectItem value="Terminal">Terminal</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedRequisito}
                onValueChange={setSelectedRequisito}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Requisito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="obligatoria">Obligatoria</SelectItem>
                  <SelectItem value="optativa">Optativa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Activa">Activa</SelectItem>
                  <SelectItem value="Inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>

              {/* Botón limpiar filtros */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground cursor-pointer"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            {/* Contador de resultados */}
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredData.length} de {data.length} materias
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron materias</p>
              <p className="text-sm">Intenta con otros filtros de búsqueda</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clave</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Licenciatura</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Requisito</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((materia) => (
                    <TableRow key={materia.clave}>
                      <TableCell className="font-medium">
                        {materia.clave}
                      </TableCell>
                      <TableCell>{materia.nombre_materia}</TableCell>
                      <TableCell>{materia.licenciatura}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                          {materia.categoria}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            materia.requisito === "obligatoria"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {materia.requisito}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              materia.estado === "Activa"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span
                            className={
                              materia.estado === "Activa"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {materia.estado}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="Editar"
                            onClick={() => handleEdit(materia)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            title="Eliminar"
                            onClick={() => handleDelete(materia.clave)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`cursor-pointer ${
                              materia.estado === "Activa"
                                ? "text-green-600 hover:text-green-800"
                                : "text-gray-600 hover:text-gray-800"
                            }`}
                            title={
                              materia.estado === "Activa"
                                ? "Desactivar"
                                : "Activar"
                            }
                            onClick={() => toggleEstado(materia.clave)}
                          >
                            {materia.estado === "Activa" ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
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

      {/* Modal Agregar */}
      <ModalAgregarMateria
        isOpen={showForm}
        materia={newMateria}
        onClose={handleCloseForm}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onSave={handleSaveMateria}
        errors={errors}
        onImportFromExcel={handleImportFromExcel}
        saving={saving}
        licenciaturas={licenciaturas}
      />

      {/* Modal Editar */}
      {showEditForm && editMateria && (
        <ModalEditarMateria
          isOpen={showEditForm}
          materia={editMateria}
          onClose={handleCloseEditForm}
          onInputChange={handleEditInputChange}
          onSelectChange={handleEditSelectChange}
          onSave={handleUpdateMateria}
          errors={editErrors}
          saving={saving}
          licenciaturas={licenciaturas}
        />
      )}
    </div>
  );
}
