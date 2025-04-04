"use client";

import React, { useState, useEffect } from "react";
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
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { AddSubjectModal } from "./add-subject-modal";
import { EditSubjectModal } from "./edit-subject-modal";

// Importa useConfirm del ConfirmProvider
import { useConfirm } from "@/components/global-confirm-modal";

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

  const [data, setData] = useState<Materia[]>([]);
  const [filteredData, setFilteredData] = useState<Materia[]>([]);

  // Filtros
  const [selectedLic, setSelectedLic] = useState("all");
  const [claveFilter, setClaveFilter] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // == MODAL DE "AGREGAR MATERIA" ==
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

  // == MODAL DE "EDITAR MATERIA" (con su estado e info)
  const [showEditForm, setShowEditForm] = useState(false);
  const [editMateria, setEditMateria] = useState<Materia | null>(null);
  const [editErrors, setEditErrors] = useState<string[]>([]);

  // 1) Obtener datos de Supabase
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

  // 2) Filtrar
  useEffect(() => {
    let temp = [...data];
    if (selectedLic !== "all") {
      temp = temp.filter((item) => item.licenciatura === selectedLic);
    }
    if (claveFilter.trim() !== "") {
      temp = temp.filter((item) =>
        item.clave.toLowerCase().includes(claveFilter.toLowerCase())
      );
    }
    setFilteredData(temp);
    setCurrentPage(1);
  }, [data, selectedLic, claveFilter]);

  const licenciaturas = Array.from(new Set(data.map((item) => item.licenciatura)));

  // 3) Toggle Estado
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
      console.error("Error al actualizar estado:", error);
      return;
    }

    setData((prev) =>
      prev.map((item) =>
        item.clave === clave ? { ...item, estado: nuevoEstado } : item
      )
    );
  }

  // === useConfirm para eliminar con modal global ===
  const confirm = useConfirm();

  // Eliminar con confirm
  async function handleDelete(clave: string) {
    const userConfirmed = await confirm({
      title: "Eliminar materia",
      message:
        "¿Estás seguro de eliminar esta materia? Esta acción no se puede revertir.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
    });
    if (!userConfirmed) {
      // El usuario canceló
      return;
    }

    // Procede a eliminar en Supabase
    const { error } = await supabase
      .from("materias")
      .delete()
      .eq("clave", clave);

    if (error) {
      console.error("Error al eliminar materia:", error);
      return;
    }

    // Actualizar estado local
    setData((prev) => prev.filter((item) => item.clave !== clave));
  }

  // -- ABRIR MODAL Y LIMPIAR FORM (AGREGAR) --
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
  };

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setNewMateria((prev) => ({ ...prev, [name]: value as Materia[keyof Materia] }));
  }

  // 4) Guardar Materia (AGREGAR)
  async function handleSaveMateria() {
    // (A) Valida la materia (si lo deseas)
    // const validationErrors = validateMateria(newMateria);
    // if (validationErrors.length > 0) {
    //   setErrors(validationErrors);
    //   return;
    // }

    // (B) Insertar en Supabase
    const { error } = await supabase.from("materias").insert([newMateria]);
    if (error) {
      console.error("Error al agregar materia:", error.message || error);
      setErrors([`Error de BD: ${error.message}`]);
      return;
    }

    setShowForm(false);
    await fetchMaterias();
  }

  // ================================
  // LÓGICA PARA EDITAR MATERIA
  // ================================
  const handleEdit = (materia: Materia) => {
    setEditMateria(materia);
    setEditErrors([]);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
  };

  function handleEditInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    if (!editMateria) return;
    const { name, value } = e.target;
    setEditMateria((prev) =>
      prev ? { ...prev, [name]: value as Materia[keyof Materia] } : null
    );
  }

  async function handleUpdateMateria() {
    if (!editMateria) return;

    // Ejemplo: update en Supabase
    // .eq("clave", editMateria.clave) para filtrar la misma clave
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

  // 5) Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
              Clave:
            </Label>
            <input
              id="filtro-clave"
              type="text"
              value={claveFilter}
              onChange={(e) => setClaveFilter(e.target.value)}
              placeholder="Buscar..."
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
                            materia.estado === "Activa"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span>{materia.estado}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* BOTÓN EDITAR (igual que en el snippet original) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                          onClick={() => handleEdit(materia)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* BOTÓN ELIMINAR con useConfirm */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                          onClick={() => handleDelete(materia.clave)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        {/* BOTÓN CAMBIAR ESTADO */}
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
                <TableCell colSpan={6} className="text-center">
                  No hay materias para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button
            variant="default"
            disabled={currentPage === 1}
            className="bg-white hover:bg-white text-[#00723F] border border-[#00723F] cursor-pointer"
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
            disabled={currentPage === totalPages}
            className="bg-white hover:bg-white text-[#00723F] border border-[#00723F] cursor-pointer"
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* MODAL AGREGAR */}
      <AddSubjectModal
        isOpen={showForm}
        newMateria={newMateria}
        onClose={handleCloseForm}
        onInputChange={handleInputChange}
        onSave={handleSaveMateria}
        errors={errors}
      />

      {/* MODAL EDITAR MATERIA */}
      <EditSubjectModal
        isOpen={showEditForm}
        editMateria={
          editMateria || {
            clave: "",
            nombre_materia: "",
            licenciatura: "",
            categoria: "Basica",
            requisito: "obligatoria",
            estado: "Activa",
          }
        }
        onClose={handleCloseEditForm}
        onInputChange={handleEditInputChange}
        onUpdate={handleUpdateMateria}
        errors={editErrors}
      />
    </div>
  );
}
