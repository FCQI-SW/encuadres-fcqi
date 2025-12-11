"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEncuadreProfesor } from "@/hooks/useEncuadreProfesor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, FileText, Search } from "lucide-react";

type Encuadre = {
  id: string;
  programa_id: string;
  materia_clave: string;
  materia_nombre: string;
  grupo: string;
  periodo: string;
  estado_encuadre: string;
  profesor_puede_modificar_criterios: boolean;
};

export default function EncuadresProfesor() {
  const router = useRouter();
  const { obtenerMisEncuadres, loading } = useEncuadreProfesor();

  const [encuadres, setEncuadres] = useState<Encuadre[]>([]);
  const [filteredEncuadres, setFilteredEncuadres] = useState<Encuadre[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    cargarEncuadres();
  }, []);

  const cargarEncuadres = async () => {
    setLoadingData(true);
    const data = await obtenerMisEncuadres();
    console.log("Encuadres cargados:", data);
    setEncuadres(data);
    setFilteredEncuadres(data);
    setLoadingData(false);
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEncuadres(encuadres);
    } else {
      const filtered = encuadres.filter(
        (e) =>
          e.materia_clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.materia_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.periodo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEncuadres(filtered);
    }
  }, [searchTerm, encuadres]);

  const handleVerEncuadre = (encuadreId: string) => {
    console.log("=== Navegando a encuadre ===");
    console.log("ID del encuadre:", encuadreId);
    console.log("Tipo del ID:", typeof encuadreId);
    console.log("URL destino:", `/profesor/encuadres/${encuadreId}`);
    router.push(`/profesor/encuadres/${encuadreId}`);
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mis Encuadres</h1>
            <p className="text-gray-600 mt-1">
              Administra y edita los encuadres de tus materias
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-5 w-5" />
            <span className="font-semibold">{encuadres.length}</span>
            <span>encuadres asignados</span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por clave, nombre de materia, grupo o periodo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {filteredEncuadres.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm ? "No se encontraron encuadres" : "Sin encuadres asignados"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Intenta con otros términos de búsqueda"
                    : "Aún no tienes encuadres asignados"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Encuadres</CardTitle>
              <CardDescription>
                Haz clic en un encuadre para ver detalles y editarlo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clave</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEncuadres.map((encuadre) => (
                      <TableRow
                        key={encuadre.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleVerEncuadre(encuadre.id)}
                      >
                        <TableCell className="font-medium">
                          {encuadre.materia_clave}
                        </TableCell>
                        <TableCell>{encuadre.materia_nombre}</TableCell>
                        <TableCell>{encuadre.periodo}</TableCell>
                        <TableCell>{encuadre.grupo}</TableCell>
                        <TableCell>
                          {encuadre.profesor_puede_modificar_criterios ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Edición completa
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Solo lectura
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              encuadre.estado_encuadre === "publicado"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {encuadre.estado_encuadre === "publicado"
                              ? "Publicado"
                              : "Borrador"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerEncuadre(encuadre.id);
                            }}
                            className="cursor-pointer"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}