// app/(main)/admin/ads/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Edit, Trash2, ChevronRight } from "lucide-react";
import { useConfirm } from "@/components/global-confirm-modal";

type Anuncio = {
  id: string;
  titulo: string;
  estado: "borrador" | "programado" | "enviado";
  metodo: string;
  destinatarios: string[];
  enviado_at: string | null;
};

export default function AdsListPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [ads, setAds] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    setLoading(true);
    const { data, error } = await supabase
      .from("anuncios")
      .select(
        "id, titulo, estado, metodo, destinatarios, enviado_at"
      )
      .order("enviado_at", { ascending: false });
    setLoading(false);
    if (error) {
      console.error("Error al cargar anuncios:", error);
    } else {
      setAds(data || []);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Eliminar anuncio",
      message: "¿Seguro que quieres eliminar este anuncio?",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    const { error } = await supabase
      .from("anuncios")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar anuncio:", error);
    } else {
      setAds((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mis Anuncios</h1>
        <Button
          onClick={() => router.push("/admin/ads/create")}
          variant="default"
          className="bg-[#00723F] text-white hover:bg-[#005e30] cursor-pointer"
        >
          Crear nuevo mensaje
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Destinatarios</TableHead>
            <TableHead>Fecha envío</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                Cargando…
              </TableCell>
            </TableRow>
          ) : ads.length > 0 ? (
            ads.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.titulo}</TableCell>
                <TableCell className="capitalize">{a.estado}</TableCell>
                <TableCell className="capitalize">{a.metodo}</TableCell>
                <TableCell>
                  {a.destinatarios.map((d) => (
                    <span
                      key={d}
                      className="inline-block px-2 py-0.5 mr-1 text-sm bg-gray-100 rounded"
                    >
                      {d}
                    </span>
                  ))}
                </TableCell>
                <TableCell>
                  {a.enviado_at
                    ? new Date(a.enviado_at).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell>
                  {(a.estado === "borrador" || a.estado === "programado") && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(
                            `/admin/ads/create?id=${encodeURIComponent(a.id)}`
                          )
                        }
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(a.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No hay anuncios.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
