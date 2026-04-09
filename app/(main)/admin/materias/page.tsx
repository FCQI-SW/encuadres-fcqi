"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Plus,
  Loader2,
  X,
  Copy,
  Archive,
  ArchiveRestore,
  FileText,
  ClipboardList,
  CalendarMinus,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";
import { ModalAgregarMateria } from "../../../../components/modal-agregar-materia";
import { ModalEditarMateria } from "../../../../components/modal-editar-materia";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Licenciatura = {
  id: string;
  nombre: string;
  activa: boolean;
};

export type Materia = {
  id?: string;
  programa_id?: string;
  clave: string;
  nombre_materia: string;
  licenciatura: string;
  licenciatura_id: string;
  categoria: "Basica" | "Disciplinaria" | "Terminal";
  requisito: "obligatoria" | "optativa";
  estado: "Activa" | "Inactiva";
  periodo: string;
  plan_estudios: string;
  archivada: boolean;
  editorPua?: string;
  edicionPua?: Date;
  editorEncuadre?: string;
  edicionEncuadre?: Date;
};

type ProgramaDB = {
  id: string;
  periodo?: string | null;
  plan_estudios?: string | null;
  activo?: boolean | null;
  archivado?: boolean | null;
  ultimo_editor_id: string | null;
  ultima_edicion: string | null;
};

type EncuadreDB = {
  id: string;
  ultimo_editor_id: string | null;
  ultima_edicion: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Eliminar por periodo
// ─────────────────────────────────────────────────────────────────────────────

type ItemEliminar = {
  programa_id: string;
  materia_id: string;
  clave: string;
  nombre_materia: string;
  periodo: string;
  licenciatura: string;
};

type ModalEliminarPeriodoProps = {
  isOpen: boolean;
  onClose: () => void;
  periodosDisponibles: string[];
  data: Materia[];
  onEliminar: (items: ItemEliminar[]) => Promise<void>;
  saving: boolean;
};

function ModalEliminarPeriodo({
  isOpen,
  onClose,
  periodosDisponibles,
  data,
  onEliminar,
  saving,
}: ModalEliminarPeriodoProps) {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const itemsDelPeriodo = useMemo<ItemEliminar[]>(() => {
    if (!periodoSeleccionado) return [];
    return data
      .filter((m) => m.periodo === periodoSeleccionado && m.programa_id)
      .map((m) => ({
        programa_id: m.programa_id!,
        materia_id: m.id!,
        clave: m.clave,
        nombre_materia: m.nombre_materia,
        periodo: m.periodo,
        licenciatura: m.licenciatura,
      }));
  }, [periodoSeleccionado, data]);

  useEffect(() => {
    setSeleccionados(new Set(itemsDelPeriodo.map((i) => i.programa_id)));
  }, [itemsDelPeriodo]);

  const toggleItem = (programaId: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(programaId) ? next.delete(programaId) : next.add(programaId);
      return next;
    });
  };

  const toggleTodos = () => {
    setSeleccionados(
      seleccionados.size === itemsDelPeriodo.length
        ? new Set()
        : new Set(itemsDelPeriodo.map((i) => i.programa_id))
    );
  };

  const handleConfirmar = async () => {
    if (seleccionados.size === 0) return;
    const itemsSeleccionados = itemsDelPeriodo.filter((i) =>
      seleccionados.has(i.programa_id)
    );
    await onEliminar(itemsSeleccionados);
    setPeriodoSeleccionado("");
    setSeleccionados(new Set());
  };

  const handleCerrar = () => {
    setPeriodoSeleccionado("");
    setSeleccionados(new Set());
    onClose();
  };

  if (!isOpen) return null;

  const todosSeleccionados =
    itemsDelPeriodo.length > 0 &&
    seleccionados.size === itemsDelPeriodo.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleCerrar} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
              <CalendarMinus className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Eliminar por periodo</h2>
              <p className="text-sm text-muted-foreground">
                Selecciona el periodo y las materias a eliminar
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCerrar} className="cursor-pointer">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Periodo a limpiar
            </label>
            <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecciona un periodo" />
              </SelectTrigger>
              <SelectContent>
                {periodosDisponibles.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {periodoSeleccionado && itemsDelPeriodo.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay materias en este periodo.
            </p>
          )}

          {itemsDelPeriodo.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={toggleTodos}
                  className="h-4 w-4 cursor-pointer accent-red-600"
                />
                <span className="text-sm font-medium">
                  {todosSeleccionados ? "Deseleccionar todas" : "Seleccionar todas"}{" "}
                  ({itemsDelPeriodo.length} materias)
                </span>
                <span className="ml-auto text-sm text-muted-foreground">
                  {seleccionados.size} seleccionadas
                </span>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto">
                {itemsDelPeriodo.map((item) => (
                  <label
                    key={item.programa_id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={seleccionados.has(item.programa_id)}
                      onChange={() => toggleItem(item.programa_id)}
                      className="h-4 w-4 cursor-pointer accent-red-600 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.clave} — {item.nombre_materia}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.licenciatura || "Sin licenciatura"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {seleccionados.size > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Esta acción no se puede deshacer.</p>
                <p>
                  Se eliminarán <strong>{seleccionados.size}</strong> materia(s) del
                  periodo <strong>{periodoSeleccionado}</strong>, incluyendo su PUA,
                  unidades, temas, prácticas y encuadres. Si la materia no tiene
                  otros periodos, también se eliminará del catálogo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
          <Button variant="outline" onClick={handleCerrar} disabled={saving} className="cursor-pointer">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={seleccionados.size === 0 || saving}
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Eliminando..." : `Eliminar ${seleccionados.size} materia(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: eliminar materia si quedó huérfana (sin programas)
// ─────────────────────────────────────────────────────────────────────────────

async function limpiarMateriaHuerfana(materiaId: string) {
  const { count } = await supabase
    .from("programas")
    .select("*", { count: "exact", head: true })
    .eq("materia_id", materiaId);

  if ((count ?? 0) === 0) {
    await supabase.from("materias").delete().eq("id", materiaId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principal
// ─────────────────────────────────────────────────────────────────────────────

export default function MateriasPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const { data: session, status } = useSession();

  const [data, setData] = useState<Materia[]>([]);
  const [filteredData, setFilteredData] = useState<Materia[]>([]);
  const [licenciaturas, setLicenciaturas] = useState<Licenciatura[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLic, setSelectedLic] = useState("all");
  const [selectedCategoria, setSelectedCategoria] = useState("all");
  const [selectedRequisito, setSelectedRequisito] = useState("all");
  const [selectedEstado, setSelectedEstado] = useState("all");
  const [selectedArchivado, setSelectedArchivado] = useState("no-archivadas");
  const [selectedPeriodo, setSelectedPeriodo] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showForm, setShowForm] = useState(false);
  const [newMateria, setNewMateria] = useState<Materia>({
    clave: "",
    nombre_materia: "",
    licenciatura: "",
    licenciatura_id: "",
    categoria: "Basica",
    requisito: "obligatoria",
    estado: "Activa",
    periodo: "",
    plan_estudios: "",
    archivada: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editMateria, setEditMateria] = useState<Materia | null>(null);
  const [editErrors, setEditErrors] = useState<string[]>([]);

  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [savingEliminar, setSavingEliminar] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────
  const eToTime = (v: string | null) => (v ? new Date(v).getTime() : 0);
  const sortLicenciaturas = (list: Licenciatura[]) =>
    [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  const normalizeText = (v: string) => v.trim().toLowerCase();
  const formatearFecha = (fecha: Date) =>
    fecha.toLocaleDateString("es-MX", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const obtenerInfoEdicion = (m: Materia) => {
    const p = !!m.editorPua, e = !!m.editorEncuadre;
    if (p && e) return { tipo: "ambos" as const, pua: { editor: m.editorPua!, fecha: m.edicionPua! }, encuadre: { editor: m.editorEncuadre!, fecha: m.edicionEncuadre! } };
    if (p) return { tipo: "pua" as const, pua: { editor: m.editorPua!, fecha: m.edicionPua! } };
    if (e) return { tipo: "encuadre" as const, encuadre: { editor: m.editorEncuadre!, fecha: m.edicionEncuadre! } };
    return null;
  };

  // ── Fetch ────────────────────────────────────────────────────
  const fetchLicenciaturas = async () => {
    const { data: licData, error } = await supabase
      .from("licenciaturas").select("id, nombre, activa").eq("activa", true).order("nombre");
    if (error) { toast.error("No se pudieron cargar las licenciaturas."); return; }
    setLicenciaturas(sortLicenciaturas((licData || []) as Licenciatura[]));
  };

  const fetchMaterias = async () => {
    setLoading(true);
    try {
      const { data: materias, error } = await supabase
        .from("materias")
        .select("id, clave, nombre_materia, licenciatura, licenciatura_id, categoria, requisito")
        .order("nombre_materia", { ascending: true });

      if (error) { toast.error("No se pudieron cargar las materias."); setLoading(false); return; }

      const filas: Materia[] = [];

      for (const m of (materias || []) as any[]) {
        const { data: programas, error: errP } = await supabase
          .from("programas")
          .select("id, periodo, plan_estudios, activo, archivado, ultimo_editor_id, ultima_edicion")
          .eq("materia_id", m.id)
          .order("periodo", { ascending: false });

        if (errP || !programas || programas.length === 0) continue;

        for (const programa of programas as ProgramaDB[]) {
          let editorPua: string | undefined, edicionPua: Date | undefined;
          let editorEncuadre: string | undefined, edicionEncuadre: Date | undefined;

          if (programa.ultimo_editor_id) {
            const { data: ed } = await supabase.from("usuarios").select("nombre").eq("id", programa.ultimo_editor_id).maybeSingle();
            editorPua = ed?.nombre;
            edicionPua = programa.ultima_edicion ? new Date(programa.ultima_edicion) : undefined;
          }

          const { data: encuadres } = await supabase
            .from("encuadres").select("id, ultimo_editor_id, ultima_edicion").eq("programa_id", programa.id);
          const encuadresLista = (encuadres || []) as EncuadreDB[];
          const reciente = [...encuadresLista]
            .filter((e) => e.ultima_edicion)
            .sort((a, b) => eToTime(b.ultima_edicion) - eToTime(a.ultima_edicion))[0];

          if (reciente?.ultimo_editor_id) {
            const { data: ed } = await supabase.from("usuarios").select("nombre").eq("id", reciente.ultimo_editor_id).maybeSingle();
            editorEncuadre = ed?.nombre;
            edicionEncuadre = reciente.ultima_edicion ? new Date(reciente.ultima_edicion) : undefined;
          }

          filas.push({
            id: m.id, programa_id: programa.id,
            clave: m.clave, nombre_materia: m.nombre_materia,
            licenciatura: m.licenciatura || "", licenciatura_id: m.licenciatura_id || "",
            categoria: m.categoria, requisito: m.requisito,
            estado: programa.activo === false ? "Inactiva" : "Activa",
            periodo: programa.periodo || "", plan_estudios: programa.plan_estudios || "",
            archivada: programa.archivado ?? false,
            editorPua, edicionPua, editorEncuadre, edicionEncuadre,
          });
        }
      }

      filas.sort((a, b) => {
        const n = a.nombre_materia.localeCompare(b.nombre_materia, "es", { sensitivity: "base" });
        return n !== 0 ? n : (b.periodo || "").localeCompare(a.periodo || "");
      });

      setData(filas);
      setFilteredData(filas);
    } catch { toast.error("Ocurrió un error al cargar las materias."); }
    setLoading(false);
  };

  useEffect(() => {
    void (async () => { await Promise.all([fetchMaterias(), fetchLicenciaturas()]); })();
  }, []);

  // ── Periodos únicos ──────────────────────────────────────────
  const periodosUnicos = useMemo(() => {
    let base = [...data];
    if (selectedArchivado === "no-archivadas") base = base.filter((m) => !m.archivada);
    else if (selectedArchivado === "archivadas") base = base.filter((m) => m.archivada);
    const set = new Set(base.map((m) => m.periodo).filter(Boolean));
    return [...set].sort((a, b) => b.localeCompare(a, "es", { numeric: true }));
  }, [data, selectedArchivado]);

  const todosLosPeriodos = useMemo(() => {
    const set = new Set(data.filter((m) => m.programa_id).map((m) => m.periodo).filter(Boolean));
    return [...set].sort((a, b) => b.localeCompare(a, "es", { numeric: true }));
  }, [data]);

  // ── Filtros ──────────────────────────────────────────────────
  const handleClearFilters = () => {
    setSearchTerm(""); setSelectedLic("all"); setSelectedCategoria("all");
    setSelectedRequisito("all"); setSelectedEstado("all");
    setSelectedArchivado("no-archivadas"); setSelectedPeriodo("all");
  };

  const hasActiveFilters =
    !!searchTerm || selectedLic !== "all" || selectedCategoria !== "all" ||
    selectedRequisito !== "all" || selectedEstado !== "all" ||
    selectedArchivado !== "no-archivadas" || selectedPeriodo !== "all";

  useEffect(() => {
    let temp = [...data];
    if (selectedArchivado === "no-archivadas") temp = temp.filter((i) => !i.archivada);
    else if (selectedArchivado === "archivadas") temp = temp.filter((i) => i.archivada);
    if (selectedLic !== "all") temp = temp.filter((i) => i.licenciatura_id === selectedLic);
    if (selectedCategoria !== "all") temp = temp.filter((i) => i.categoria === selectedCategoria);
    if (selectedRequisito !== "all") temp = temp.filter((i) => i.requisito === selectedRequisito);
    if (selectedEstado !== "all") temp = temp.filter((i) => i.estado === selectedEstado);
    if (selectedPeriodo !== "all") temp = temp.filter((i) => i.periodo === selectedPeriodo);
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      temp = temp.filter((i) =>
        i.clave.toLowerCase().includes(s) || i.nombre_materia.toLowerCase().includes(s) ||
        (i.licenciatura || "").toLowerCase().includes(s) ||
        (i.periodo || "").toLowerCase().includes(s) ||
        (i.plan_estudios || "").toLowerCase().includes(s)
      );
    }
    setFilteredData(temp);
    setCurrentPage(1);
  }, [data, selectedLic, selectedCategoria, selectedRequisito, selectedEstado, selectedArchivado, selectedPeriodo, searchTerm]);

  // ── Normalizadores ───────────────────────────────────────────
  const catMap: Record<string, string> = { basica: "Basica", básica: "Basica", disciplinaria: "Disciplinaria", terminal: "Terminal" };
  const reqMap: Record<string, string> = { obligatoria: "obligatoria", optativa: "optativa", opt: "optativa" };
  const estMap: Record<string, string> = { activa: "Activa", activo: "Activa", "1": "Activa", inactiva: "Inactiva", inactivo: "Inactiva", "0": "Inactiva" };
  const normCat = (v: string) => catMap[v.trim().toLowerCase()] || "Basica";
  const normReq = (v: string) => reqMap[v.trim().toLowerCase()] || "obligatoria";
  const normEst = (v: string) => estMap[v.trim().toLowerCase()] || "Activa";

  function traducirErrorBD(error: any): string {
    const msg = error?.message || "", code = error?.code || "";
    if (code === "23505" || msg.includes("duplicate key")) return "Ya existe un registro con esos datos.";
    if (code === "23503") return "Error de integridad referencial.";
    if (code === "23502") return "Faltan campos obligatorios.";
    return `Error al guardar: ${msg}`;
  }

  // ── CRUD individual ──────────────────────────────────────────
  async function toggleEstado(materia: Materia) {
    if (!materia.programa_id) return toast.error("No se encontró el programa.");
    if (materia.archivada) return toast.error("No puedes cambiar el estado de un periodo archivado.");
    const nuevoActivo = materia.estado !== "Activa";
    const { error } = await supabase.from("programas").update({ activo: nuevoActivo }).eq("id", materia.programa_id);
    if (error) return toast.error("No se pudo actualizar el estado.");
    setData((prev) => prev.map((i) => i.programa_id === materia.programa_id ? { ...i, estado: nuevoActivo ? "Activa" : "Inactiva" } : i));
    toast.success(`Periodo ${materia.periodo} de "${materia.clave}" → ${nuevoActivo ? "Activa" : "Inactiva"}.`);
  }

  async function toggleArchivado(materia: Materia) {
    if (!materia.programa_id) return toast.error("No se encontró el programa.");
    if (status === "loading") return toast.error("Espera mientras se carga tu sesión.");
    if (!session?.user?.id) return toast.error("No se pudo validar tu sesión.");
    const nuevoArchivado = !materia.archivada;
    const confirmed = await confirm({
      title: nuevoArchivado ? "Archivar periodo" : "Desarchivar periodo",
      message: nuevoArchivado
        ? `El periodo ${materia.periodo} de "${materia.clave}" dejará de mostrarse por defecto.`
        : `El periodo ${materia.periodo} de "${materia.clave}" volverá a estar disponible.`,
      confirmText: nuevoArchivado ? "Sí, archivar" : "Sí, desarchivar",
      cancelText: "Cancelar",
    });
    if (!confirmed) return;
    const payload = nuevoArchivado
      ? { archivado: true, archivada_at: new Date().toISOString(), archivada_por: session.user.id }
      : { archivado: false, archivada_at: null, archivada_por: null };
    const { error } = await supabase.from("programas").update(payload).eq("id", materia.programa_id);
    if (error) return toast.error("No se pudo actualizar el archivo.");
    setData((prev) => prev.map((i) => i.programa_id === materia.programa_id ? { ...i, archivada: nuevoArchivado } : i));
    toast.success(nuevoArchivado ? `Periodo ${materia.periodo} archivado.` : `Periodo ${materia.periodo} desarchivado.`);
  }

  // ── FIX 2: limpiar materia huérfana después de eliminar ──────
  async function handleDelete(materia: Materia) {
    if (!materia.programa_id) return toast.error("No se encontró el programa.");
    const confirmed = await confirm({
      title: "Eliminar periodo",
      message: `¿Eliminar el periodo ${materia.periodo} de "${materia.clave}"? Esta acción no se puede revertir.`,
      confirmText: "Sí, eliminar", cancelText: "Cancelar",
    });
    if (!confirmed) return;

    const { error } = await supabase.rpc("eliminar_programa_periodo", { p_programa_id: materia.programa_id });
    if (error) return toast.error(error.message || "No se pudo eliminar.");

    // Limpiar del estado local
    setData((prev) => prev.filter((i) => i.programa_id !== materia.programa_id));

    // Si la materia quedó sin programas, eliminarla también de la BD
    if (materia.id) {
      await limpiarMateriaHuerfana(materia.id);
    }

    toast.success(`Periodo ${materia.periodo} de "${materia.clave}" eliminado.`);
  }

  // ── FIX 2: limpiar huérfanas también en bulk ─────────────────
  async function handleEliminarPorPeriodo(items: ItemEliminar[]) {
    const confirmed = await confirm({
      title: "Confirmar eliminación",
      message: `¿Eliminar ${items.length} materia(s)? Se borrarán PUA, unidades, encuadres y todo lo relacionado. Si la materia no tiene otros periodos, también se eliminará del catálogo. Esta acción es irreversible.`,
      confirmText: `Sí, eliminar ${items.length} materia(s)`,
      cancelText: "Cancelar",
    });
    if (!confirmed) return;

    setSavingEliminar(true);
    let eliminados = 0;
    const fallidos: string[] = [];

    for (const item of items) {
      const { error } = await supabase.rpc("eliminar_programa_periodo", { p_programa_id: item.programa_id });
      if (error) {
        fallidos.push(item.clave);
      } else {
        eliminados++;
        // Limpiar materia huérfana
        await limpiarMateriaHuerfana(item.materia_id);
      }
    }

    // Actualizar estado local: quitar los programas eliminados
    const programaIdsEliminados = new Set(
      items.filter((i) => !fallidos.includes(i.clave)).map((i) => i.programa_id)
    );
    setData((prev) => prev.filter((i) => !programaIdsEliminados.has(i.programa_id || "")));

    setSavingEliminar(false);
    setShowModalEliminar(false);

    if (fallidos.length > 0) {
      toast.error(`Se eliminaron ${eliminados} de ${items.length}. Fallaron: ${fallidos.join(", ")}.`);
    } else {
      toast.success(`Se eliminaron ${eliminados} materia(s) correctamente.`);
    }
  }

  const handleEdit = (materia: Materia) => {
    if (materia.archivada) return toast.error("No puedes editar un periodo archivado.");
    setEditMateria(materia); setEditErrors([]); setShowEditForm(true);
  };

  const handleCloseEditForm = () => { setShowEditForm(false); setEditMateria(null); setEditErrors([]); };

  function handleEditInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editMateria) return;
    setEditMateria((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : null);
  }

  function handleEditSelectChange(name: string, value: string) {
    if (!editMateria) return;
    if (name === "licenciatura_id") {
      const lic = licenciaturas.find((l) => l.id === value);
      setEditMateria((prev) => prev ? { ...prev, licenciatura_id: value, licenciatura: lic?.nombre || "" } : null);
      return;
    }
    setEditMateria((prev) => prev ? { ...prev, [name]: value } : null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewMateria((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSelectChange(name: string, value: string) {
    if (name === "licenciatura_id") {
      const lic = licenciaturas.find((l) => l.id === value);
      setNewMateria((prev) => ({ ...prev, licenciatura_id: value, licenciatura: lic?.nombre || "" }));
      return;
    }
    setNewMateria((prev) => ({ ...prev, [name]: value }));
  }

  // ── Licenciaturas CRUD ───────────────────────────────────────
  async function crearLicenciatura(nombre: string): Promise<Licenciatura | null> {
    const n = nombre.trim();
    if (!n) { toast.error("El nombre es obligatorio."); return null; }
    if (licenciaturas.some((l) => normalizeText(l.nombre) === normalizeText(n))) { toast.error("Esa licenciatura ya existe."); return null; }
    const { data: nueva, error } = await supabase.from("licenciaturas").insert({ nombre: n, activa: true }).select("id, nombre, activa").single();
    if (error || !nueva) { toast.error(traducirErrorBD(error)); return null; }
    const creada = nueva as Licenciatura;
    setLicenciaturas((prev) => sortLicenciaturas([...prev, creada]));
    toast.success(`Licenciatura "${creada.nombre}" agregada.`);
    return creada;
  }

  async function actualizarLicenciatura(id: string, nuevoNombre: string): Promise<Licenciatura | null> {
    const n = nuevoNombre.trim();
    if (!n) { toast.error("El nombre es obligatorio."); return null; }
    const actual = licenciaturas.find((l) => l.id === id);
    if (!actual) { toast.error("No se encontró la licenciatura."); return null; }
    if (licenciaturas.some((l) => l.id !== id && normalizeText(l.nombre) === normalizeText(n))) { toast.error("Ya existe otra con ese nombre."); return null; }
    const { error } = await supabase.from("licenciaturas").update({ nombre: n }).eq("id", id);
    if (error) { toast.error(traducirErrorBD(error)); return null; }
    await supabase.from("materias").update({ licenciatura: n }).eq("licenciatura_id", id);
    setLicenciaturas((prev) => sortLicenciaturas(prev.map((l) => l.id === id ? { ...l, nombre: n } : l)));
    setData((prev) => prev.map((m) => m.licenciatura_id === id ? { ...m, licenciatura: n } : m));
    setNewMateria((prev) => prev.licenciatura_id === id ? { ...prev, licenciatura: n } : prev);
    setEditMateria((prev) => prev && prev.licenciatura_id === id ? { ...prev, licenciatura: n } : prev);
    toast.success(`Licenciatura actualizada a "${n}".`);
    return { ...actual, nombre: n };
  }

  async function eliminarLicenciatura(id: string): Promise<boolean> {
    const lic = licenciaturas.find((l) => l.id === id);
    if (!lic) { toast.error("No se encontró la licenciatura."); return false; }
    const { count } = await supabase.from("materias").select("*", { count: "exact", head: true }).eq("licenciatura_id", id);
    if ((count || 0) > 0) { toast.error(`No se puede eliminar "${lic.nombre}" porque tiene ${count} materia(s).`); return false; }
    const ok = await confirm({ title: "Quitar licenciatura", message: `¿Eliminar "${lic.nombre}"?`, confirmText: "Sí, quitar", cancelText: "Cancelar" });
    if (!ok) return false;
    const { error } = await supabase.from("licenciaturas").delete().eq("id", id);
    if (error) { toast.error(traducirErrorBD(error)); return false; }
    setLicenciaturas((prev) => prev.filter((l) => l.id !== id));
    setNewMateria((prev) => prev.licenciatura_id === id ? { ...prev, licenciatura_id: "", licenciatura: "" } : prev);
    setEditMateria((prev) => prev && prev.licenciatura_id === id ? { ...prev, licenciatura_id: "", licenciatura: "" } : prev);
    toast.success(`Licenciatura "${lic.nombre}" eliminada.`);
    return true;
  }

  // ── Save materia ─────────────────────────────────────────────
  async function handleSaveMateria() {
    setErrors([]);
    const errs: string[] = [];
    if (!newMateria.clave.trim()) errs.push("La clave es obligatoria.");
    if (!newMateria.nombre_materia.trim()) errs.push("El nombre es obligatorio.");
    if (!newMateria.licenciatura_id.trim()) errs.push("Selecciona una licenciatura.");
    if (!newMateria.periodo.trim()) errs.push("El periodo es obligatorio.");
    if (!newMateria.plan_estudios.trim()) errs.push("El plan de estudios es obligatorio.");
    if (errs.length > 0) { setErrors(errs); return; }

    setSaving(true);
    const payload = {
      clave: newMateria.clave.trim(), nombre_materia: newMateria.nombre_materia.trim(),
      licenciatura_id: newMateria.licenciatura_id, licenciatura: newMateria.licenciatura,
      categoria: newMateria.categoria, requisito: newMateria.requisito,
      estado: "Activa", periodo: newMateria.periodo.trim(),
      plan_estudios: newMateria.plan_estudios.trim(), archivada: false,
    };

    const { data: creada, error } = await supabase.from("materias").insert([payload]).select("id, periodo, plan_estudios").single();
    if (error) { setErrors([traducirErrorBD(error)]); setSaving(false); return; }

    if (creada?.id) {
      await supabase.from("programas").insert({
        materia_id: creada.id, unidades: 0,
        periodo: creada.periodo, plan_estudios: creada.plan_estudios,
        estado_programa: "borrador", activo: true, archivado: false,
      });
    }

    setShowForm(false); setErrors([]);
    toast.success(`Materia "${newMateria.clave}" agregada.`);
    setSaving(false);
    await fetchMaterias();
  }

  async function handleUpdateMateria() {
    if (!editMateria) return;
    const errs: string[] = [];
    if (!editMateria.nombre_materia.trim()) errs.push("El nombre es obligatorio.");
    if (!editMateria.licenciatura_id.trim()) errs.push("Selecciona una licenciatura.");
    if (!editMateria.periodo.trim()) errs.push("El periodo es obligatorio.");
    if (!editMateria.plan_estudios.trim()) errs.push("El plan de estudios es obligatorio.");
    if (errs.length > 0) { setEditErrors(errs); return; }

    setSaving(true);
    const { error: errMat } = await supabase.from("materias")
      .update({ nombre_materia: editMateria.nombre_materia.trim(), licenciatura_id: editMateria.licenciatura_id, licenciatura: editMateria.licenciatura, categoria: editMateria.categoria, requisito: editMateria.requisito })
      .eq("id", editMateria.id);
    if (errMat) { setEditErrors([traducirErrorBD(errMat)]); setSaving(false); return; }

    if (editMateria.programa_id) {
      const { error: errProg } = await supabase.from("programas")
        .update({ periodo: editMateria.periodo.trim(), plan_estudios: editMateria.plan_estudios.trim() })
        .eq("id", editMateria.programa_id);
      if (errProg) { setEditErrors(["La materia se actualizó, pero no se sincronizó el programa."]); setSaving(false); return; }
    }

    setShowEditForm(false); setEditMateria(null); setEditErrors([]);
    toast.success(`Materia "${editMateria.clave}" actualizada.`);
    setSaving(false);
    await fetchMaterias();
  }

  // ── FIX 1: upsert en importador ──────────────────────────────
  async function handleImportFromExcel(file: File) {
    try {
      setErrors([]); setSaving(true);
      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[]).slice(1);

      if (rows.length === 0) { setErrors(["El archivo está vacío."]); setSaving(false); return; }

      const licMap = new Map(licenciaturas.map((l) => [normalizeText(l.nombre), l]));
      const faltantes = new Set<string>();

      const bulk = rows
        .filter((r: any) => r[0] && r[1] && r[2] && r[5] && r[6])
        .map((r: any) => {
          const nombreLic = String(r[2] || "").trim();
          const lic = licMap.get(normalizeText(nombreLic));
          if (!lic) { faltantes.add(nombreLic); return null; }
          return {
            clave: String(r[0]).trim(),
            nombre_materia: String(r[1]).trim(),
            licenciatura_id: lic.id,
            licenciatura: lic.nombre,
            categoria: normCat(String(r[3] || "")) as "Basica" | "Disciplinaria" | "Terminal",
            requisito: normReq(String(r[4] || "")) as "obligatoria" | "optativa",
            periodo: String(r[5]).trim(),
            plan_estudios: String(r[6]).trim(),
            estado: normEst(String(r[7] || "")) as "Activa" | "Inactiva",
            archivada: false,
          };
        })
        .filter(Boolean) as Materia[];

      if (faltantes.size > 0) {
        setErrors([`Licenciaturas no encontradas: ${[...faltantes].join(", ")}. Agrégalas primero.`]);
        setSaving(false); return;
      }
      if (bulk.length === 0) { setErrors(["No se encontraron materias válidas."]); setSaving(false); return; }

      // ── FIX 1: upsert en lugar de insert ────────────────────
      // Si la materia ya existe por clave (ej. fue "eliminada" via RPC
      // pero el registro de materias quedó), la actualiza en lugar de fallar.
      const { data: creadas, error } = await supabase
        .from("materias")
        .upsert(bulk, { onConflict: "clave", ignoreDuplicates: false })
        .select("id, periodo, plan_estudios");

      if (error) { setErrors([traducirErrorBD(error)]); setSaving(false); return; }

      if (creadas && creadas.length > 0) {
        // Para cada materia upsertada, crear programa solo si no existe ya uno
        // con ese mismo periodo (evita duplicados en reimportación).
        for (const m of creadas as any[]) {
          const { count } = await supabase
            .from("programas")
            .select("*", { count: "exact", head: true })
            .eq("materia_id", m.id)
            .eq("periodo", m.periodo);

          if ((count ?? 0) === 0) {
            await supabase.from("programas").insert({
              materia_id: m.id, unidades: 0,
              periodo: m.periodo, plan_estudios: m.plan_estudios,
              estado_programa: "borrador", activo: true, archivado: false,
            });
          }
        }
      }

      setShowForm(false); setErrors([]);
      toast.success(`Se importaron ${bulk.length} materias correctamente.`);
      setSaving(false);
      await fetchMaterias();
    } catch {
      setErrors(["Error al leer el archivo Excel."]);
      setSaving(false);
    }
  }

  // ── Paginación ───────────────────────────────────────────────
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
    else if (totalPages === 0) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleShowForm = () => {
    setNewMateria({ clave: "", nombre_materia: "", licenciatura: "", licenciatura_id: "", categoria: "Basica", requisito: "obligatoria", estado: "Activa", periodo: "", plan_estudios: "", archivada: false });
    setErrors([]); setShowForm(true);
  };

  const stats = useMemo(() => {
    const noArch = data.filter((m) => !m.archivada);
    return {
      total: noArch.length,
      activas: noArch.filter((m) => m.estado === "Activa").length,
      inactivas: noArch.filter((m) => m.estado === "Inactiva").length,
      archivadas: data.filter((m) => m.archivada).length,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00723F]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="outline" onClick={() => router.push("/admin")} className="cursor-pointer">
          <ChevronLeft className="mr-2 h-4 w-4" /> Regresar
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => router.push("/admin/herramientas/clonar-periodo")}
            className="cursor-pointer border-blue-300 text-blue-700 hover:bg-blue-50">
            <Copy className="mr-2 h-4 w-4" /> Clonar periodo
          </Button>
          <Button variant="outline" onClick={() => setShowModalEliminar(true)}
            className="cursor-pointer border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
            <CalendarMinus className="mr-2 h-4 w-4" /> Eliminar por periodo
          </Button>
          <Button onClick={handleShowForm} className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> Agregar materia
          </Button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total visibles", value: stats.total, color: "text-foreground" },
          { label: "Activas", value: stats.activas, color: "text-green-600" },
          { label: "Inactivas", value: stats.inactivas, color: "text-red-600" },
          { label: "Archivadas", value: stats.archivadas, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filtros ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por clave, materia, periodo o plan" className="pl-9" />
            </div>
            <Select value={selectedLic} onValueChange={setSelectedLic}>
              <SelectTrigger><SelectValue placeholder="Licenciatura" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las licenciaturas</SelectItem>
                {licenciaturas.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger><SelectValue placeholder="Periodo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los periodos</SelectItem>
                {periodosUnicos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="Basica">Básica</SelectItem>
                <SelectItem value="Disciplinaria">Disciplinaria</SelectItem>
                <SelectItem value="Terminal">Terminal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedRequisito} onValueChange={setSelectedRequisito}>
              <SelectTrigger><SelectValue placeholder="Requisito" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="obligatoria">Obligatoria</SelectItem>
                <SelectItem value="optativa">Optativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedEstado} onValueChange={setSelectedEstado}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Activa">Activa</SelectItem>
                <SelectItem value="Inactiva">Inactiva</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedArchivado} onValueChange={setSelectedArchivado}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Archivado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no-archivadas">No archivadas</SelectItem>
                <SelectItem value="archivadas">Archivadas</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}
                className="cursor-pointer border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
                <X className="mr-2 h-4 w-4" /> Limpiar filtros
              </Button>
            )}
            <span className="ml-auto text-sm text-muted-foreground">
              {filteredData.length} de {data.length} registros
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabla ───────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {currentItems.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              No se encontraron materias con los filtros seleccionados.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clave</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Requisito</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Última edición</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((materia) => {
                      const info = obtenerInfoEdicion(materia);
                      return (
                        <TableRow key={`${materia.id}-${materia.programa_id ?? "sp"}-${materia.periodo}`}>
                          <TableCell className="font-medium whitespace-nowrap">{materia.clave}</TableCell>
                          <TableCell className="min-w-[240px]">{materia.nombre_materia}</TableCell>
                          <TableCell>
                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">{materia.categoria}</span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">{materia.requisito}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{materia.periodo || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">{materia.plan_estudios || "—"}</TableCell>
                          <TableCell className="min-w-[220px]">
                            <div className="space-y-1 text-sm">
                              {info ? (
                                <>
                                  {(info.tipo === "pua" || info.tipo === "ambos") && (
                                    <div className="flex items-start gap-2 text-green-700">
                                      <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <span className="font-medium">PUA:</span> {info.pua.editor}
                                        <div className="text-muted-foreground text-xs">{formatearFecha(info.pua.fecha)}</div>
                                      </div>
                                    </div>
                                  )}
                                  {(info.tipo === "encuadre" || info.tipo === "ambos") && (
                                    <div className="flex items-start gap-2 text-blue-700">
                                      <ClipboardList className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <span className="font-medium">Encuadre:</span> {info.encuadre.editor}
                                        <div className="text-muted-foreground text-xs">{formatearFecha(info.encuadre.fecha)}</div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground text-xs">Sin ediciones</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {materia.archivada ? (
                              <div className="flex items-center gap-1.5 text-amber-700 text-sm">
                                <span className="h-2 w-2 rounded-full bg-amber-500" /> Archivada
                              </div>
                            ) : (
                              <div className={`flex items-center gap-1.5 text-sm ${materia.estado === "Activa" ? "text-green-600" : "text-red-600"}`}>
                                <span className={`h-2 w-2 rounded-full ${materia.estado === "Activa" ? "bg-green-500" : "bg-red-500"}`} />
                                {materia.estado}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" title={materia.archivada ? "No disponible" : "Editar"} onClick={() => handleEdit(materia)} disabled={materia.archivada} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Eliminar periodo" onClick={() => handleDelete(materia)} className="text-red-600 hover:text-red-800 cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title={materia.archivada ? "No disponible" : materia.estado === "Activa" ? "Desactivar" : "Activar"} onClick={() => toggleEstado(materia)} disabled={materia.archivada} className="text-green-600 hover:text-green-800 cursor-pointer">
                                {materia.estado === "Activa" ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                              </Button>
                              <Button variant="ghost" size="icon" title={materia.archivada ? "Desarchivar" : "Archivar"} onClick={() => toggleArchivado(materia)} className="text-amber-600 hover:text-amber-700 cursor-pointer">
                                {materia.archivada ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredData.length)} de {filteredData.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="cursor-pointer">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Página {currentPage} de {totalPages}</span>
                    <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="cursor-pointer">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Modales ─────────────────────────────────────────── */}
      <ModalAgregarMateria
        isOpen={showForm}
        materia={newMateria}
        onClose={() => { setShowForm(false); setErrors([]); }}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onSave={handleSaveMateria}
        errors={errors}
        onImportFromExcel={handleImportFromExcel}
        saving={saving}
        licenciaturas={licenciaturas}
        onCreateLicenciatura={crearLicenciatura}
        onUpdateLicenciatura={actualizarLicenciatura}
        onDeleteLicenciatura={eliminarLicenciatura}
      />

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
          onCreateLicenciatura={crearLicenciatura}
          onUpdateLicenciatura={actualizarLicenciatura}
          onDeleteLicenciatura={eliminarLicenciatura}
        />
      )}

      <ModalEliminarPeriodo
        isOpen={showModalEliminar}
        onClose={() => setShowModalEliminar(false)}
        periodosDisponibles={todosLosPeriodos}
        data={data}
        onEliminar={handleEliminarPorPeriodo}
        saving={savingEliminar}
      />
    </div>
  );
}