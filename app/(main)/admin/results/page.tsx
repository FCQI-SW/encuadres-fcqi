"use client";

import { useState, useEffect } from "react";
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
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

type MatchData = {
  id: number;
  licenciatura: string;
  materia: string;
  profesor: string;
  alumno: string;
  porcentaje: number;
  nivelDiscrepancia: "Coincidencia" | "Moderada" | "Alta";
};

const initialData: MatchData[] = [
  {
    id: 1,
    licenciatura: "FCQI",
    materia: "Inteligencia artificial",
    profesor: "Juan Reyes",
    alumno: "Juan Perez",
    porcentaje: 95,
    nivelDiscrepancia: "Coincidencia",
  },
  {
    id: 2,
    licenciatura: "FCQI",
    materia: "Base de datos",
    profesor: "Juan Reyes",
    alumno: "Leonardo Alba",
    porcentaje: 65,
    nivelDiscrepancia: "Moderada",
  },
  {
    id: 3,
    licenciatura: "FCQI",
    materia: "Electrónica avanzada",
    profesor: "Juan Reyes",
    alumno: "Miguel Segoviano",
    porcentaje: 45,
    nivelDiscrepancia: "Alta",
  },
  {
    id: 4,
    licenciatura: "FCQI",
    materia: "Inglés II",
    profesor: "Juan Reyes",
    alumno: "Juan Perez",
    porcentaje: 95,
    nivelDiscrepancia: "Coincidencia",
  },
  {
    id: 5,
    licenciatura: "FCQI",
    materia: "Estructura de datos",
    profesor: "Juan Reyes",
    alumno: "Luis Manríquez",
    porcentaje: 95,
    nivelDiscrepancia: "Coincidencia",
  },
];

export default function MatchingPage() {
  const router = useRouter(); // Inicializa el router
  const [selectedLicenciatura, setSelectedLicenciatura] = useState<string>("Todos");
  const [selectedMateria, setSelectedMateria] = useState<string>("Todos");
  const [selectedDiscrepancia, setSelectedDiscrepancia] = useState<string>("Todos");
  const [filteredData, setFilteredData] = useState<MatchData[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Actualiza el filtrado automáticamente cuando cambian los filtros
  useEffect(() => {
    let filtered = initialData;
    if (selectedLicenciatura !== "Todos") {
      filtered = filtered.filter(item => item.licenciatura === selectedLicenciatura);
    }
    if (selectedMateria !== "Todos") {
      filtered = filtered.filter(item => item.materia === selectedMateria);
    }
    if (selectedDiscrepancia !== "Todos") {
      filtered = filtered.filter(item => item.nivelDiscrepancia === selectedDiscrepancia);
    }
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [selectedLicenciatura, selectedMateria, selectedDiscrepancia]);

  // Paginación
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
          <Select onValueChange={setSelectedLicenciatura} defaultValue="Todos">
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Licenciatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="FCQI">FCQI</SelectItem>
              <SelectItem value="Otra">Otra</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedMateria} defaultValue="Todos">
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Materia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todas</SelectItem>
              {initialData.map((item, index) => (
                <SelectItem key={index} value={item.materia}>
                  {item.materia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedDiscrepancia} defaultValue="Todos">
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Nivel de discrepancia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Coincidencia">Coincidencia</SelectItem>
              <SelectItem value="Moderada">Moderada</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Licenciatura</TableHead>
            <TableHead>Materia</TableHead>
            <TableHead>Profesor</TableHead>
            <TableHead>Alumno</TableHead>
            <TableHead>% Coincidencia</TableHead>
            <TableHead>Nivel de discrepancia</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map(item => (
            <TableRow key={item.id}>
              <TableCell>{item.licenciatura}</TableCell>
              <TableCell>{item.materia}</TableCell>
              <TableCell>{item.profesor}</TableCell>
              <TableCell>{item.alumno}</TableCell>
              <TableCell>{item.porcentaje}%</TableCell>
              <TableCell className="flex items-center gap-2">
                {item.nivelDiscrepancia === "Coincidencia" && (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-1" /> Coincidencia
                  </span>
                )}
                {item.nivelDiscrepancia === "Moderada" && (
                  <span className="flex items-center text-yellow-500">
                    <AlertTriangle className="w-5 h-5 mr-1" /> Moderada
                  </span>
                )}
                {item.nivelDiscrepancia === "Alta" && (
                  <span className="flex items-center text-red-600">
                    <XCircle className="w-5 h-5 mr-1" /> Alta
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Button variant="outline" className="flex items-center">
                  <Search className="w-4 h-4 mr-2" /> Ver detalles
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
