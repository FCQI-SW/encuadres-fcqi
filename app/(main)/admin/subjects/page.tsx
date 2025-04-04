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

// IMPORTA tu cliente de Supabase
import { supabase } from "@/lib/supabase";

/**
 * Ajusta el tipo TS con las columnas reales de la tabla "materias".
 */
type Materia = {
  clave: string;
  nombre_materia: string;
  licenciatura: string;
  categoria: string; // "basica" | "disciplinaria" | "terminal"
  requisito: string; // "obligatoria" | "optativa"
  estado: string;    // "Activa" | "Inactiva", etc.
};

export default function Page() {
  const router = useRouter();

  // ESTADOS PRINCIPALES
  const [data, setData] = useState<Materia[]>([]);
  const [filteredData, setFilteredData] = useState<Materia[]>([]);

  // Filtros
  const [selectedLic, setSelectedLic] = useState("all");
  const [claveFilter, setClaveFilter] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /**
   * 1) Cargar datos reales desde Supabase
   *    Notar que seleccionamos las columnas TAL CUAL existen en la tabla:
   *    "clave", "nombre_materia", "licenciatura", "categoria", "requisito", "estado".
   */
  useEffect(() => {
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

    fetchMaterias();
  }, []);

  /**
   * 2) Actualizar la lista filtrada cuando cambien data, selectedLic, claveFilter
   */
  useEffect(() => {
    let temp = [...data];

    // Filtrar por licenciatura si no es "all"
    if (selectedLic !== "all") {
      temp = temp.filter((item) => item.licenciatura === selectedLic);
    }

    // Filtrar por clave si hay texto
    if (claveFilter.trim() !== "") {
      temp = temp.filter((item) =>
        item.clave.toLowerCase().includes(claveFilter.toLowerCase())
      );
    }

    setFilteredData(temp);
    setCurrentPage(1);
  }, [data, selectedLic, claveFilter]);

  // Licenciaturas únicas para el filtro
  const licenciaturas = Array.from(new Set(data.map((item) => item.licenciatura)));

  /**
   * 3) Función para cambiar estado "Activa" <-> "Inactiva"
   */
  async function toggleEstado(clave: string) {
    const materiaActual = data.find((d) => d.clave === clave);
    if (!materiaActual) return;

    const nuevoEstado = materiaActual.estado === "Activa" ? "Inactiva" : "Activa";

    // Actualiza en la BD
    const { error } = await supabase
      .from("materias")
      .update({ estado: nuevoEstado })
      .eq("clave", clave);

    if (error) {
      console.error("Error al actualizar estado:", error);
      return;
    }

    // Reflejar el cambio en el estado local
    setData((prevData) =>
      prevData.map((item) =>
        item.clave === clave
          ? { ...item, estado: nuevoEstado }
          : item
      )
    );
  }

  /**
   * 4) Paginación
   */
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
          onClick={() => alert("Aquí iría la lógica para agregar una nueva materia")}
          className="bg-[#00723F] text-white hover:bg-[#005e30] cursor-pointer"
        >
          Agregar materia
        </Button>
      </div>

      {/* FILTROS */}
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-medium">Filtrar por:</span>

          {/* Filtrar licenciatura */}
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

          {/* Filtrar por clave */}
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

      {/* TABLA DE MATERIAS */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Licenciatura</TableHead>
              <TableHead>Tipo (categoría: requisito)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((materia, index) => {
                // Combinar categoria + requisito para mostrarlo como un "tipo"
                const tipoCompleto = `${materia.categoria}: ${materia.requisito}`;
                return (
                  <TableRow key={`${materia.clave}-${index}`}>
                    <TableCell>{materia.clave}</TableCell>
                    <TableCell>{materia.nombre_materia}</TableCell>
                    <TableCell>{materia.licenciatura}</TableCell>
                    <TableCell>{tipoCompleto}</TableCell>
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
                        {/* Editar */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {/* Eliminar */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {/* Cambiar estado */}
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
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
