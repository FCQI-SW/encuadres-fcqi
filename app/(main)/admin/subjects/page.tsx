"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Importa useRouter
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
  Search,
} from "lucide-react";

type Materia = {
  clave: string;
  licenciatura: string;
  tipo: string;
  estado: string;
};

const initialData: Materia[] = [
  { clave: "MAT101", licenciatura: "Ingeniería en Computación", tipo: "Básica: Obligatoria", estado: "Activa" },
  { clave: "MAT102", licenciatura: "Ingeniería en Computación", tipo: "Básica: Optativa", estado: "Inactiva" },
  { clave: "MAT201", licenciatura: "Lic. en Administración", tipo: "Disciplinaria: Optativa", estado: "Activa" },
  { clave: "MAT301", licenciatura: "Lic. en Derecho", tipo: "Terminal: Obligatoria", estado: "Inactiva" },
  { clave: "MAT002", licenciatura: "Lic. en Administración", tipo: "Básica: Obligatoria", estado: "Activa" },
  { clave: "ABC001", licenciatura: "Lic. en Derecho", tipo: "Disciplinaria: Obligatoria", estado: "Activa" },
];

export default function Page() {
  const router = useRouter();
  // Estado para la data y filtros
  const [data, setData] = useState<Materia[]>(initialData);
  const [selectedLic, setSelectedLic] = useState<string>("all");
  const [claveFilter, setClaveFilter] = useState<string>("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtrado automático
  const [filteredData, setFilteredData] = useState<Materia[]>(initialData);

  useEffect(() => {
    let filtered = data;
    if (selectedLic !== "all") {
      filtered = filtered.filter((item) => item.licenciatura === selectedLic);
    }
    if (claveFilter.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.clave.toLowerCase().includes(claveFilter.toLowerCase())
      );
    }
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [selectedLic, claveFilter, data]);

  // Obtiene las licenciaturas únicas de la data actual
  const licenciaturas = Array.from(new Set(data.map((item) => item.licenciatura)));

  // Función para alternar el estado de una materia
  function toggleEstado(clave: string) {
    setData((prev) =>
      prev.map((item) =>
        item.clave === clave
          ? { ...item, estado: item.estado === "Activa" ? "Inactiva" : "Activa" }
          : item
      )
    );
  }

  // Paginación cálculos
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="p-6">
      {/* Encabezado: Botón de regresar a la izquierda */}
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={() => router.push("/admin")}>
          <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
        </Button>
      </div>

      {/* Sección de filtros */}
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-medium">Filtrar por:</span>
          {/* Filtro por Licenciatura */}
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
          {/* Filtro por Clave */}
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

      {/* Tabla de materias */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave de la materia</TableHead>
              <TableHead>Licenciatura</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((materia, index) => (
                <TableRow key={`${materia.clave}-${index}`}>
                  <TableCell>{materia.clave}</TableCell>
                  <TableCell>{materia.licenciatura}</TableCell>
                  <TableCell>{materia.tipo}</TableCell>
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
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No hay materias para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {/* Botón de anterior: fondo blanco, flecha verde */}
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
          {/* Botón de siguiente: fondo blanco, flecha verde */}
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
    </div>
  );
}
