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
import { ChevronLeft, ChevronRight, Edit, Trash2, ToggleRight, ToggleLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

import { useConfirm } from "@/components/global-confirm-modal";
import { AddSubjectModal } from "./add-subject-modal";
import { EditSubjectModal } from "./edit-subject-modal";

export type Materia = {
  clave: string;
  nombre_materia: string;
  licenciatura: string;
  categoria: "Basica" | "Disciplinaria" | "Terminal";
  requisito: "obligatoria" | "optativa";
  estado: "Activa" | "Inactiva";
};

export default function Page() {
  const router = useRouter();

  // ==================== ESTADOS ====================
  const [data, setData] = useState<Materia[]>([]);
  const [filteredData, setFilteredData] = useState<Materia[]>([]);

  // Filtros: por licenciatura y búsqueda (clave o nombre)
  const [selectedLic, setSelectedLic] = useState("all");
  const [claveFilter, setClaveFilter] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal para agregar materia
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

  // Modal para editar materia
  const [showEditForm, setShowEditForm] = useState(false);
  const [editMateria, setEditMateria] = useState<Materia | null>(null);
  const [editErrors, setEditErrors] = useState<string[]>([]);

  // Mensaje de éxito
  const [successMessage, setSuccessMessage] = useState("");

  // Hook de confirmación para borrar
  const confirm = useConfirm();

  // ==================== CARGAR DATOS ====================
  const fetchMaterias = async () => {
    const { data: materias, error } = await supabase
      .from("materias")
      .select("clave, nombre_materia, licenciatura, categoria, requisito, estado");
    if (error) {
      console.error("Error al obtener materias:", error);
      return;
    }
    if (materias) {
      setData(materias);
      setFilteredData(materias);
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  // ==================== FILTRADO ====================
  useEffect(() => {
    let temp = [...data];
    if (selectedLic !== "all") {
      temp = temp.filter((item) => item.licenciatura === selectedLic);
    }
    if (claveFilter.trim() !== "") {
      const search = claveFilter.toLowerCase();
      temp = temp.filter(
        (item) =>
          item.clave.toLowerCase().includes(search) ||
          item.nombre_materia.toLowerCase().includes(search)
      );
    }
    setFilteredData(temp);
    setCurrentPage(1);
  }, [data, selectedLic, claveFilter]);

  const licenciaturas = Array.from(new Set(data.map((item) => item.licenciatura)));

  // ==================== TOGGLE ESTADO ====================
  async function toggleEstado(clave: string) {
    const materiaActual = data.find((d) => d.clave === clave);
    if (!materiaActual) return;
    const nuevoEstado = materiaActual.estado === "Activa" ? "Inactiva" : "Activa";
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
  }

  // ==================== ELIMINAR MATERIA ====================
  async function handleDelete(clave: string) {
    const confirmed = await confirm({
      title: "Eliminar materia",
      message: "¿Estás seguro de eliminar esta materia? Esta acción no se puede revertir.",
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
    setSuccessMessage(`Materia ${clave} eliminada con éxito.`);
  }

  // ==================== EDITAR MATERIA ====================
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

  function handleEditInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    if (!editMateria) return;
    const { name, value } = e.target;
    setEditMateria((prev) => (prev ? { ...prev, [name]: value } : null));
  }

  async function handleUpdateMateria() {
    if (!editMateria) return;
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
      setEditErrors([`Error de BD: ${error.message}`]);
      return;
    }
    setShowEditForm(false);
    await fetchMaterias();
  }

  // ==================== PAGINACIÓN ====================
  const totalPagesCalc = Math.ceil(filteredData.length / itemsPerPage);
  useEffect(() => {
    if (totalPagesCalc > 0 && currentPage > totalPagesCalc) {
      setCurrentPage(totalPagesCalc);
    } else if (totalPagesCalc === 0) {
      setCurrentPage(1);
    }
  }, [totalPagesCalc, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // ==================== HANDLERS PARA MODAL AGREGAR ====================
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

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setNewMateria((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  // Validaciones y creación de una materia individual
  async function handleSaveMateria() {
    setErrors([]);
    const tempErrors: string[] = [];

    if (!newMateria.clave.trim())
      tempErrors.push("La clave es obligatoria.");
    if (!newMateria.nombre_materia.trim())
      tempErrors.push("El nombre de la materia es obligatorio.");
    if (!newMateria.licenciatura.trim())
      tempErrors.push("Seleccione una licenciatura.");
    // Puedes agregar más validaciones según necesidad

    if (tempErrors.length > 0) {
      setErrors(tempErrors);
      return;
    }

    const { error } = await supabase.from("materias").insert([newMateria]);
    if (error) {
      console.error("Error al agregar materia:", error.message);
      setErrors([`Error de BD: ${error.message}`]);
      return;
    }

    setShowForm(false);
    setErrors([]);
    setSuccessMessage(`Materia ${newMateria.clave} agregada con éxito.`);
    await fetchMaterias();
  }

  // ==================== IMPORTAR DESDE EXCEL ====================
  async function handleImportFromExcel(file: File) {
    try {
      setErrors([]);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const rows = jsonData.slice(1);
      // Se espera que el Excel tenga columnas: clave, nombre_materia, licenciatura, categoria, requisito, estado
      const bulkMaterias = rows.map((row: any) => ({
        clave: row[0] || "",
        nombre_materia: row[1] || "",
        licenciatura: row[2] || "",
        categoria: row[3] || "Basica",
        requisito: row[4] || "obligatoria",
        estado: row[5] || "Activa",
      }));

      const { error } = await supabase.from("materias").insert(bulkMaterias);
      if (error) {
        console.error("Error al importar materias:"); //error
        setErrors([`Error al importar materias`]); //: ${error.message}
        return;
      }
      setShowForm(false);
      setErrors([]);
      setSuccessMessage(`Se importaron ${bulkMaterias.length} materias correctamente.`);
      const { data: materiasData } = await supabase
        .from("materias")
        .select("clave, nombre_materia, licenciatura, categoria, requisito, estado");
      if (materiasData) {
        setData(materiasData);
        setFilteredData(materiasData);
      }
    } catch (err: any) {
      console.error("Error leyendo Excel:", err);
      setErrors(["Error leyendo el archivo Excel."]);
    }
  }

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
          onClick={handleShowForm}
          className="bg-[#00723F] text-white hover:bg-[#005e30] cursor-pointer"
        >
          Agregar materia
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

      {/* FILTROS */}
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-medium">Filtrar por:</span>
          <Select onValueChange={setSelectedLic} defaultValue="all">
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Licenciatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {licenciaturas.map((lic) => (
                <SelectItem key={lic} value={lic}>
                  {lic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Label htmlFor="filtro-clave" className="font-medium">
              Buscar:
            </Label>
            <input
              id="filtro-clave"
              type="text"
              value={claveFilter}
              onChange={(e) => setClaveFilter(e.target.value)}
              placeholder="Clave o nombre..."
              className="border rounded px-2 py-1 w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Licenciatura</TableHead>
              <TableHead>Tipo (Categoría: Requisito)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((materia, index) => {
                const tipo = `${materia.categoria}: ${materia.requisito}`;
                return (
                  <TableRow key={`${materia.clave}-${index}`}>
                    <TableCell>{materia.clave}</TableCell>
                    <TableCell>{materia.nombre_materia}</TableCell>
                    <TableCell>{materia.licenciatura}</TableCell>
                    <TableCell>{tipo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            materia.estado === "Activa" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span>{materia.estado}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                          onClick={() => handleEdit(materia)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                          onClick={() => handleDelete(materia.clave)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-600 hover:text-gray-800"
                          title="Cambiar estado"
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
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No hay materias para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINACIÓN */}
      {totalPagesCalc > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button
            variant="default"
            disabled={currentPage === 1}
            className="bg-white hover:bg-white text-[#00723F] border border-[#00723F] cursor-pointer"
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {[...Array(totalPagesCalc)].map((_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? "default" : "outline"}
              className={
                currentPage === i + 1
                  ? "bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
                  : "border border-[#00723F] text-[#00723F] hover:bg-[#00723F] hover:text-white cursor-pointer"
              }
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="default"
            disabled={currentPage === totalPagesCalc}
            className="bg-white hover:bg-white text-[#00723F] border border-[#00723F] cursor-pointer"
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* MODAL AGREGAR MATERIA */}
      <AddSubjectModal
        isOpen={showForm}
        newMateria={newMateria}
        onClose={handleCloseForm}
        onInputChange={handleInputChange}
        onSave={handleSaveMateria}
        errors={errors}
        onImportFromExcel={handleImportFromExcel}
      />

      {/* MODAL EDITAR MATERIA */}
      {showEditForm && editMateria && (
        <EditSubjectModal
          isOpen={showEditForm}
          editMateria={editMateria}
          onClose={handleCloseEditForm}
          onInputChange={handleEditInputChange}
          onUpdate={handleUpdateMateria}
          errors={editErrors}
        />
      )}
    </div>
  );
}
