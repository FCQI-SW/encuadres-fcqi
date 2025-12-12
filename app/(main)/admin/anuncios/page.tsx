"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Megaphone,
  Mail,
  Bell,
  Send,
  Clock,
  FileText,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import { useConfirm } from "@/components/global-confirm-modal";

type Anuncio = {
  id: string;
  titulo: string;
  estado: "borrador" | "programado" | "enviado";
  metodo: string;
  destinatarios: string[];
  enviado_at: string | null;
  created_at: string;
};

export default function AnunciosPage() {
  const router = useRouter();
  const confirm = useConfirm();

  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [filteredAnuncios, setFilteredAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("all");
  const [selectedMetodo, setSelectedMetodo] = useState("all");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAnuncios();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filtrado
  useEffect(() => {
    let filtered = [...anuncios];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((a) =>
        a.titulo.toLowerCase().includes(term)
      );
    }

    if (selectedEstado !== "all") {
      filtered = filtered.filter((a) => a.estado === selectedEstado);
    }

    if (selectedMetodo !== "all") {
      filtered = filtered.filter((a) => a.metodo === selectedMetodo);
    }

    setFilteredAnuncios(filtered);
    setCurrentPage(1);
  }, [anuncios, searchTerm, selectedEstado, selectedMetodo]);

  async function fetchAnuncios() {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("anuncios")
        .select("id, titulo, estado, metodo, destinatarios, enviado_at, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error al cargar anuncios:", fetchError);
        setError("Error al cargar los anuncios. Por favor, recarga la página.");
        setAnuncios([]);
      } else {
        setAnuncios(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Ocurrió un error inesperado.");
      setAnuncios([]);
    }

    setLoading(false);
  }

  async function handleDelete(id: string) {
    const anuncio = anuncios.find((a) => a.id === id);

    if (!anuncio) {
      setError("No se encontró el anuncio a eliminar.");
      return;
    }

    if (anuncio.estado === "enviado") {
      setError("No se puede eliminar un anuncio que ya fue enviado.");
      return;
    }

    const ok = await confirm({
      title: "Eliminar anuncio",
      message: `¿Estás seguro de eliminar el anuncio "${anuncio.titulo}"? Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    try {
      const { error: deleteError } = await supabase
        .from("anuncios")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error al eliminar anuncio:", deleteError);
        setError("Error al eliminar el anuncio. Intenta de nuevo.");
      } else {
        setAnuncios((prev) => prev.filter((a) => a.id !== id));
        setSuccessMessage(`Anuncio "${anuncio.titulo}" eliminado correctamente.`);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Ocurrió un error inesperado al eliminar.");
    }
  }

  function handleEdit(anuncio: Anuncio) {
    if (anuncio.estado === "enviado") {
      setError("No se puede editar un anuncio que ya fue enviado.");
      return;
    }
    router.push(`/admin/anuncios/crear?id=${encodeURIComponent(anuncio.id)}`);
  }

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedEstado("all");
    setSelectedMetodo("all");
  };

  const hasActiveFilters =
    searchTerm || selectedEstado !== "all" || selectedMetodo !== "all";

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "enviado":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
            <Send className="w-3 h-3" /> Enviado
          </span>
        );
      case "programado":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3" /> Programado
          </span>
        );
      case "borrador":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
            <FileText className="w-3 h-3" /> Borrador
          </span>
        );
      default:
        return estado;
    }
  };

  const getMetodoIcon = (metodo: string) => {
    switch (metodo) {
      case "correo":
        return <Mail className="w-4 h-4 text-blue-600" />;
      case "notificacion":
        return <Bell className="w-4 h-4 text-yellow-600" />;
      case "ambos":
        return (
          <div className="flex gap-1">
            <Mail className="w-4 h-4 text-blue-600" />
            <Bell className="w-4 h-4 text-yellow-600" />
          </div>
        );
      default:
        return null;
    }
  };

  // Paginación
  const totalPages = Math.ceil(filteredAnuncios.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAnuncios.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Estadísticas
  const stats = {
    total: anuncios.length,
    enviados: anuncios.filter((a) => a.estado === "enviado").length,
    programados: anuncios.filter((a) => a.estado === "programado").length,
    borradores: anuncios.filter((a) => a.estado === "borrador").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Anuncios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los mensajes y notificaciones
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
            onClick={() => router.push("/admin/anuncios/crear")}
            className="bg-[#00723F] text-white hover:bg-[#005e30] cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" /> Crear anuncio
          </Button>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-green-700">{successMessage}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuccessMessage("")}
                className="cursor-pointer"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje de error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError("")}
                className="cursor-pointer"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Megaphone className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold text-green-600">{stats.enviados}</p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Programados</p>
                <p className="text-2xl font-bold text-blue-600">{stats.programados}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Borradores</p>
                <p className="text-2xl font-bold text-gray-600">{stats.borradores}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
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
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedMetodo} onValueChange={setSelectedMetodo}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="correo">Correo</SelectItem>
                  <SelectItem value="notificacion">Notificación</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>

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

            {/* Contador */}
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredAnuncios.length} de {anuncios.length} anuncios
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          {filteredAnuncios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay anuncios</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? "Intenta con otros filtros de búsqueda"
                  : "Crea tu primer anuncio para comenzar"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Destinatarios</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((anuncio) => (
                      <TableRow key={anuncio.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {anuncio.titulo}
                        </TableCell>
                        <TableCell>{getEstadoBadge(anuncio.estado)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMetodoIcon(anuncio.metodo)}
                            <span className="capitalize text-sm hidden sm:inline">
                              {anuncio.metodo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {anuncio.destinatarios.map((d) => (
                              <span
                                key={d}
                                className="px-2 py-0.5 text-xs bg-gray-100 rounded capitalize"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {anuncio.enviado_at
                            ? new Date(anuncio.enviado_at).toLocaleDateString(
                                "es-MX",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {anuncio.estado !== "enviado" ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                  onClick={() => handleEdit(anuncio)}
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-800 cursor-pointer"
                                  onClick={() => handleDelete(anuncio.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground px-2">
                                No editable
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

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
                        variant={currentPage === pageNum ? "default" : "outline"}
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
    </div>
  );
}