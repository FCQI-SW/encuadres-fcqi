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
  BookOpen,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  X,
  Copy,
  Archive,
  ArchiveRestore,
  FileText,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";
import { ModalAgregarMateria } from "../../../../components/modal-agregar-materia";
import { ModalEditarMateria } from "../../../../components/modal-editar-materia";

export type Licenciatura = {
  id: string;
  nombre: string;
  activa: boolean;
};

export type Materia = {
  id?: string;
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
  ultimo_editor_id: string | null;
  ultima_edicion: string | null;
};

type EncuadreDB = {
  id: string;
  ultimo_editor_id: string | null;
  ultima_edicion: string | null;
};

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
  const [selectedArchivado, setSelectedArchivado] =
    useState("no-archivadas");

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

  const sortLicenciaturas = (list: Licenciatura[]) =>
    [...list].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    );

  const normalizeText = (value: string) => value.trim().toLowerCase();

  const formatearFecha = (fecha: Date) => {
    const opciones: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return fecha.toLocaleDateString("es-MX", opciones);
  };

  const obtenerInfoEdicion = (m: Materia) => {
    const editoPua = !!m.editorPua;
    const editoEncuadre = !!m.editorEncuadre;

    if (editoPua && editoEncuadre) {
      return {
        tipo: "ambos" as const,
        pua: {
          editor: m.editorPua!,
          fecha: m.edicionPua!,
        },
        encuadre: {
          editor: m.editorEncuadre!,
          fecha: m.edicionEncuadre!,
        },
      };
    } else if (editoPua) {
      return {
        tipo: "pua" as const,
        pua: {
          editor: m.editorPua!,
          fecha: m.edicionPua!,
        },
      };
    } else if (editoEncuadre) {
      return {
        tipo: "encuadre" as const,
        encuadre: {
          editor: m.editorEncuadre!,
          fecha: m.edicionEncuadre!,
        },
      };
    }

    return null;
  };

  const fetchLicenciaturas = async () => {
    const { data: licData, error } = await supabase
      .from("licenciaturas")
      .select("id, nombre, activa")
      .eq("activa", true)
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error al obtener licenciaturas:", error);
      toast.error("No se pudieron cargar las licenciaturas.");
      return;
    }

    setLicenciaturas(sortLicenciaturas((licData || []) as Licenciatura[]));
  };

  const fetchMaterias = async () => {
    setLoading(true);

    try {
      const { data: materias, error } = await supabase
        .from("materias")
        .select(
          "id, clave, nombre_materia, licenciatura, licenciatura_id, categoria, requisito, estado, periodo, plan_estudios, archivada"
        )
        .order("nombre_materia", { ascending: true });

      if (error) {
        console.error("Error al obtener materias:", error);
        toast.error("No se pudieron cargar las materias.");
        setLoading(false);
        return;
      }

      const normalizadas = await Promise.all(
        ((materias || []) as any[]).map(async (m) => {
          let editorPua: string | undefined;
          let edicionPua: Date | undefined;
          let editorEncuadre: string | undefined;
          let edicionEncuadre: Date | undefined;

          const { data: programa } = await supabase
            .from("programas")
            .select("id, ultimo_editor_id, ultima_edicion")
            .eq("materia_id", m.id)
            .maybeSingle();

          const programaData = programa as ProgramaDB | null;

          if (programaData?.ultimo_editor_id) {
            const { data: editorPrograma } = await supabase
              .from("usuarios")
              .select("nombre")
              .eq("id", programaData.ultimo_editor_id)
              .maybeSingle();

            editorPua = editorPrograma?.nombre;
            edicionPua = programaData.ultima_edicion
              ? new Date(programaData.ultima_edicion)
              : undefined;
          }

          if (programaData?.id) {
            const { data: encuadres } = await supabase
              .from("encuadres")
              .select("id, ultimo_editor_id, ultima_edicion")
              .eq("programa_id", programaData.id);

            const encuadresLista = (encuadres || []) as EncuadreDB[];

            const encuadreMasReciente = [...encuadresLista]
              .filter((e) => e.ultima_edicion)
              .sort((a, b) => {
                const fechaA = a.ultima_edicion
                  ? new Date(a.ultima_edicion).getTime()
                  : 0;
                const fechaB = b.ultima_edicion
                  ? new Date(b.ultima_edicion).getTime()
                  : 0;
                return fechaB - fechaA;
              })[0];

            if (encuadreMasReciente?.ultimo_editor_id) {
              const { data: editorEncuadreData } = await supabase
                .from("usuarios")
                .select("nombre")
                .eq("id", encuadreMasReciente.ultimo_editor_id)
                .maybeSingle();

              editorEncuadre = editorEncuadreData?.nombre;
              edicionEncuadre = encuadreMasReciente.ultima_edicion
                ? new Date(encuadreMasReciente.ultima_edicion)
                : undefined;
            }
          }

          return {
            id: m.id,
            clave: m.clave,
            nombre_materia: m.nombre_materia,
            licenciatura: m.licenciatura || "",
            licenciatura_id: m.licenciatura_id || "",
            categoria: m.categoria,
            requisito: m.requisito,
            estado: m.estado,
            periodo: m.periodo || "",
            plan_estudios: m.plan_estudios || "",
            archivada: m.archivada ?? false,
            editorPua,
            edicionPua,
            editorEncuadre,
            edicionEncuadre,
          } as Materia;
        })
      );

      setData(normalizadas);
      setFilteredData(normalizadas);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Ocurrió un error al cargar las materias.");
    }

    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchMaterias(), fetchLicenciaturas()]);
    })();
  }, []);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedLic("all");
    setSelectedCategoria("all");
    setSelectedRequisito("all");
    setSelectedEstado("all");
    setSelectedArchivado("no-archivadas");
  };

  const hasActiveFilters =
    !!searchTerm ||
    selectedLic !== "all" ||
    selectedCategoria !== "all" ||
    selectedRequisito !== "all" ||
    selectedEstado !== "all" ||
    selectedArchivado !== "no-archivadas";

  useEffect(() => {
    let temp = [...data];

    if (selectedArchivado === "no-archivadas") {
      temp = temp.filter((item) => !item.archivada);
    } else if (selectedArchivado === "archivadas") {
      temp = temp.filter((item) => item.archivada);
    }

    if (selectedLic !== "all") {
      temp = temp.filter((item) => item.licenciatura_id === selectedLic);
    }

    if (selectedCategoria !== "all") {
      temp = temp.filter((item) => item.categoria === selectedCategoria);
    }

    if (selectedRequisito !== "all") {
      temp = temp.filter((item) => item.requisito === selectedRequisito);
    }

    if (selectedEstado !== "all") {
      temp = temp.filter((item) => item.estado === selectedEstado);
    }

    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      temp = temp.filter(
        (item) =>
          item.clave.toLowerCase().includes(search) ||
          item.nombre_materia.toLowerCase().includes(search) ||
          (item.licenciatura || "").toLowerCase().includes(search) ||
          (item.periodo || "").toLowerCase().includes(search) ||
          (item.plan_estudios || "").toLowerCase().includes(search)
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
    selectedArchivado,
    searchTerm,
  ]);

  const categoriasNormalizadas: { [key: string]: string } = {
    basica: "Basica",
    básica: "Basica",
    basico: "Basica",
    básico: "Basica",
    disciplinaria: "Disciplinaria",
    disciplinario: "Disciplinaria",
    disciplinar: "Disciplinaria",
    terminal: "Terminal",
    terminales: "Terminal",
  };

  const requisitosNormalizados: { [key: string]: string } = {
    obligatoria: "obligatoria",
    obligatorio: "obligatoria",
    oblig: "obligatoria",
    optativa: "optativa",
    optativo: "optativa",
    opt: "optativa",
  };

  const estadosNormalizados: { [key: string]: string } = {
    activa: "Activa",
    activo: "Activa",
    active: "Activa",
    act: "Activa",
    a: "Activa",
    "1": "Activa",
    inactiva: "Inactiva",
    inactivo: "Inactiva",
    inactive: "Inactiva",
    inact: "Inactiva",
    i: "Inactiva",
    "0": "Inactiva",
  };

  const normalizarCategoria = (categoria: string): string => {
    const catLower = categoria.trim().toLowerCase();
    return categoriasNormalizadas[catLower] || "Basica";
  };

  const normalizarRequisito = (requisito: string): string => {
    const reqLower = requisito.trim().toLowerCase();
    return requisitosNormalizados[reqLower] || "obligatoria";
  };

  const normalizarEstado = (estado: string): string => {
    const estLower = estado.trim().toLowerCase();
    return estadosNormalizados[estLower] || "Activa";
  };

  async function toggleEstado(clave: string) {
    const materiaActual = data.find((d) => d.clave === clave);
    if (!materiaActual) return;

    if (materiaActual.archivada) {
      toast.error("No puedes cambiar el estado de una materia archivada.");
      return;
    }

    const nuevoEstado =
      materiaActual.estado === "Activa" ? "Inactiva" : "Activa";

    const { error } = await supabase
      .from("materias")
      .update({ estado: nuevoEstado })
      .eq("clave", clave);

    if (error) {
      console.error("Error al actualizar estado:", error.message);
      toast.error("No se pudo actualizar el estado.");
      return;
    }

    setData((prev) =>
      prev.map((item) =>
        item.clave === clave ? { ...item, estado: nuevoEstado } : item
      )
    );

    toast.success(`Estado de materia "${clave}" actualizado a ${nuevoEstado}.`);
  }

  async function toggleArchivado(clave: string) {
    const materiaActual = data.find((d) => d.clave === clave);
    if (!materiaActual) return;

    if (status === "loading") {
      toast.error("Espera un momento mientras se valida tu sesión.");
      return;
    }

    if (!session?.user?.id) {
      toast.error("No se pudo validar tu sesión.");
      return;
    }

    const nuevoArchivado = !materiaActual.archivada;

    const confirmed = await confirm({
      title: nuevoArchivado ? "Archivar materia" : "Desarchivar materia",
      message: nuevoArchivado
        ? `La materia "${clave}" dejará de mostrarse en el catálogo operativo por defecto.`
        : `La materia "${clave}" volverá a estar disponible en el catálogo operativo.`,
      confirmText: nuevoArchivado ? "Sí, archivar" : "Sí, desarchivar",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    const payload = nuevoArchivado
      ? {
          archivada: true,
          archivada_at: new Date().toISOString(),
          archivada_por: session.user.id,
        }
      : {
          archivada: false,
          archivada_at: null,
          archivada_por: null,
        };

    const { error } = await supabase
      .from("materias")
      .update(payload)
      .eq("clave", clave);

    if (error) {
      console.error("Error al archivar materia:", error);
      toast.error("No se pudo actualizar el estado de archivo.");
      return;
    }

    setData((prev) =>
      prev.map((item) =>
        item.clave === clave ? { ...item, archivada: nuevoArchivado } : item
      )
    );

    toast.success(
      nuevoArchivado
        ? `Materia "${clave}" archivada correctamente.`
        : `Materia "${clave}" desarchivada correctamente.`
    );
  }

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
      toast.error("No se pudo eliminar la materia.");
      return;
    }

    setData((prev) => prev.filter((item) => item.clave !== clave));
    toast.success(`Materia "${clave}" eliminada correctamente.`);
  }

  const handleEdit = (materia: Materia) => {
    if (materia.archivada) {
      toast.error("No puedes editar una materia archivada.");
      return;
    }

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

    if (name === "licenciatura_id") {
      const lic = licenciaturas.find((l) => l.id === value);
      setEditMateria((prev) =>
        prev
          ? {
              ...prev,
              licenciatura_id: value,
              licenciatura: lic?.nombre || "",
            }
          : null
      );
      return;
    }

    setEditMateria((prev) => (prev ? { ...prev, [name]: value } : null));
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewMateria((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleSelectChange(name: string, value: string) {
    if (name === "licenciatura_id") {
      const lic = licenciaturas.find((l) => l.id === value);
      setNewMateria((prev) => ({
        ...prev,
        licenciatura_id: value,
        licenciatura: lic?.nombre || "",
      }));
      return;
    }

    setNewMateria((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function traducirErrorBD(error: any): string {
    const errorMessage = error?.message || "";
    const errorCode = error?.code || "";

    if (errorCode === "23505" || errorMessage.includes("duplicate key")) {
      return "Ya existe un registro con esos datos.";
    }
    if (errorCode === "23503") {
      return "Error de integridad referencial. Verifica que los datos sean correctos.";
    }
    if (errorCode === "23502") {
      return "Faltan campos obligatorios. Por favor completa todos los campos requeridos.";
    }

    return `Error al guardar: ${errorMessage}`;
  }

  async function crearLicenciatura(nombre: string): Promise<Licenciatura | null> {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      toast.error("El nombre de la licenciatura es obligatorio.");
      return null;
    }

    const existe = licenciaturas.some(
      (l) => normalizeText(l.nombre) === normalizeText(nombreLimpio)
    );

    if (existe) {
      toast.error("Esa licenciatura ya existe.");
      return null;
    }

    const { data: nuevaLicenciatura, error } = await supabase
      .from("licenciaturas")
      .insert({
        nombre: nombreLimpio,
        activa: true,
      })
      .select("id, nombre, activa")
      .single();

    if (error || !nuevaLicenciatura) {
      console.error("Error al crear licenciatura:", error);
      toast.error(traducirErrorBD(error));
      return null;
    }

    const creada = nuevaLicenciatura as Licenciatura;
    setLicenciaturas((prev) => sortLicenciaturas([...prev, creada]));
    toast.success(`Licenciatura "${creada.nombre}" agregada correctamente.`);
    return creada;
  }

  async function actualizarLicenciatura(
    id: string,
    nuevoNombre: string
  ): Promise<Licenciatura | null> {
    const nombreLimpio = nuevoNombre.trim();

    if (!nombreLimpio) {
      toast.error("El nombre de la licenciatura es obligatorio.");
      return null;
    }

    const actual = licenciaturas.find((l) => l.id === id);
    if (!actual) {
      toast.error("No se encontró la licenciatura.");
      return null;
    }

    const existe = licenciaturas.some(
      (l) =>
        l.id !== id &&
        normalizeText(l.nombre) === normalizeText(nombreLimpio)
    );

    if (existe) {
      toast.error("Ya existe otra licenciatura con ese nombre.");
      return null;
    }

    const { error } = await supabase
      .from("licenciaturas")
      .update({ nombre: nombreLimpio })
      .eq("id", id);

    if (error) {
      console.error("Error al actualizar licenciatura:", error);
      toast.error(traducirErrorBD(error));
      return null;
    }

    const { error: errorMaterias } = await supabase
      .from("materias")
      .update({ licenciatura: nombreLimpio })
      .eq("licenciatura_id", id);

    if (errorMaterias) {
      console.error("Error al sincronizar materias:", errorMaterias);
      toast.error(
        "La licenciatura se actualizó, pero no se pudo sincronizar en materias."
      );
      return null;
    }

    setLicenciaturas((prev) =>
      sortLicenciaturas(
        prev.map((l) => (l.id === id ? { ...l, nombre: nombreLimpio } : l))
      )
    );

    setData((prev) =>
      prev.map((m) =>
        m.licenciatura_id === id ? { ...m, licenciatura: nombreLimpio } : m
      )
    );

    setNewMateria((prev) =>
      prev.licenciatura_id === id
        ? { ...prev, licenciatura: nombreLimpio }
        : prev
    );

    setEditMateria((prev) =>
      prev && prev.licenciatura_id === id
        ? { ...prev, licenciatura: nombreLimpio }
        : prev
    );

    toast.success(`Licenciatura actualizada a "${nombreLimpio}".`);
    return { ...actual, nombre: nombreLimpio };
  }

  async function eliminarLicenciatura(id: string): Promise<boolean> {
    const lic = licenciaturas.find((l) => l.id === id);
    if (!lic) {
      toast.error("No se encontró la licenciatura.");
      return false;
    }

    const { count, error: countError } = await supabase
      .from("materias")
      .select("*", { count: "exact", head: true })
      .eq("licenciatura_id", id);

    if (countError) {
      console.error("Error al validar uso de licenciatura:", countError);
      toast.error("No se pudo validar si la licenciatura está en uso.");
      return false;
    }

    if ((count || 0) > 0) {
      toast.error(
        `No se puede quitar "${lic.nombre}" porque ya está asignada a ${(count || 0)} materia(s).`
      );
      return false;
    }

    const confirmed = await confirm({
      title: "Quitar licenciatura",
      message: `¿Deseas eliminar la licenciatura "${lic.nombre}"?`,
      confirmText: "Sí, quitar",
      cancelText: "Cancelar",
    });

    if (!confirmed) return false;

    const { error } = await supabase
      .from("licenciaturas")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar licenciatura:", error);
      toast.error(traducirErrorBD(error));
      return false;
    }

    setLicenciaturas((prev) => prev.filter((l) => l.id !== id));

    setNewMateria((prev) =>
      prev.licenciatura_id === id
        ? { ...prev, licenciatura_id: "", licenciatura: "" }
        : prev
    );

    setEditMateria((prev) =>
      prev && prev.licenciatura_id === id
        ? { ...prev, licenciatura_id: "", licenciatura: "" }
        : prev
    );

    toast.success(`Licenciatura "${lic.nombre}" eliminada correctamente.`);
    return true;
  }

  async function handleSaveMateria() {
    setErrors([]);
    const tempErrors: string[] = [];

    if (!newMateria.clave.trim()) tempErrors.push("La clave es obligatoria.");
    if (!newMateria.nombre_materia.trim())
      tempErrors.push("El nombre de la materia es obligatorio.");
    if (!newMateria.licenciatura_id.trim())
      tempErrors.push("Seleccione una licenciatura.");
    if (!newMateria.periodo.trim())
      tempErrors.push("El periodo es obligatorio.");
    if (!newMateria.plan_estudios.trim())
      tempErrors.push("El plan de estudios es obligatorio.");

    if (tempErrors.length > 0) {
      setErrors(tempErrors);
      return;
    }

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

    const payload = {
      clave: newMateria.clave.trim(),
      nombre_materia: newMateria.nombre_materia.trim(),
      licenciatura_id: newMateria.licenciatura_id,
      licenciatura: newMateria.licenciatura,
      categoria: newMateria.categoria,
      requisito: newMateria.requisito,
      estado: newMateria.estado,
      periodo: newMateria.periodo.trim(),
      plan_estudios: newMateria.plan_estudios.trim(),
      archivada: false,
    };

    const { error } = await supabase.from("materias").insert([payload]);

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

  async function handleUpdateMateria() {
    if (!editMateria) return;

    const tempErrors: string[] = [];
    if (!editMateria.nombre_materia.trim())
      tempErrors.push("El nombre de la materia es obligatorio.");
    if (!editMateria.licenciatura_id.trim())
      tempErrors.push("Debe seleccionar una licenciatura.");
    if (!editMateria.periodo.trim())
      tempErrors.push("El periodo es obligatorio.");
    if (!editMateria.plan_estudios.trim())
      tempErrors.push("El plan de estudios es obligatorio.");

    if (tempErrors.length > 0) {
      setEditErrors(tempErrors);
      return;
    }

    setSaving(true);

    const payload = {
      nombre_materia: editMateria.nombre_materia.trim(),
      licenciatura_id: editMateria.licenciatura_id,
      licenciatura: editMateria.licenciatura,
      categoria: editMateria.categoria,
      requisito: editMateria.requisito,
      estado: editMateria.estado,
      periodo: editMateria.periodo.trim(),
      plan_estudios: editMateria.plan_estudios.trim(),
    };

    const { error } = await supabase
      .from("materias")
      .update(payload)
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

  async function handleImportFromExcel(file: File) {
    try {
      setErrors([]);
      setSaving(true);

      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const rows = (jsonData as any[]).slice(1);

      if (rows.length === 0) {
        setErrors(["El archivo Excel está vacío o no tiene datos válidos."]);
        setSaving(false);
        return;
      }

      const licMap = new Map(
        licenciaturas.map((lic) => [normalizeText(lic.nombre), lic])
      );

      const faltantes = new Set<string>();

      const bulkMaterias = rows
        .filter((row: any) => row[0] && row[1] && row[2] && row[5] && row[6])
        .map((row: any) => {
          const nombreLic = String(row[2] || "").trim();
          const lic = licMap.get(normalizeText(nombreLic));

          if (!lic) {
            faltantes.add(nombreLic);
            return null;
          }

          return {
            clave: String(row[0] || "").trim(),
            nombre_materia: String(row[1] || "").trim(),
            licenciatura_id: lic.id,
            licenciatura: lic.nombre,
            categoria: normalizarCategoria(String(row[3] || "")) as
              | "Basica"
              | "Disciplinaria"
              | "Terminal",
            requisito: normalizarRequisito(String(row[4] || "")) as
              | "obligatoria"
              | "optativa",
            periodo: String(row[5] || "").trim(),
            plan_estudios: String(row[6] || "").trim(),
            estado: normalizarEstado(String(row[7] || "")) as
              | "Activa"
              | "Inactiva",
            archivada: false,
          };
        })
        .filter(Boolean) as Materia[];

      if (faltantes.size > 0) {
        setErrors([
          `Estas licenciaturas no existen todavía: ${Array.from(faltantes).join(
            ", "
          )}. Agrégalas primero en el modal y luego vuelve a importar.`,
        ]);
        setSaving(false);
        return;
      }

      if (bulkMaterias.length === 0) {
        setErrors([
          "No se encontraron materias válidas en el archivo. Verifica que incluya Clave, Nombre, Licenciatura, Periodo y Plan de Estudios.",
        ]);
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

  const handleShowForm = () => {
    setNewMateria({
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
    setErrors([]);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setErrors([]);
  };

  const stats = useMemo(() => {
    const noArchivadas = data.filter((m) => !m.archivada);
    return {
      total: noArchivadas.length,
      activas: noArchivadas.filter((m) => m.estado === "Activa").length,
      inactivas: noArchivadas.filter((m) => m.estado === "Inactiva").length,
      obligatorias: noArchivadas.filter((m) => m.requisito === "obligatoria")
        .length,
      optativas: noArchivadas.filter((m) => m.requisito === "optativa").length,
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
      <div className="space-y-3">
        <div>
          <p className="text-muted-foreground">
            Administra el catálogo de materias
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => router.push("/admin")}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/herramientas/clonar-periodo")}
              className="cursor-pointer border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            >
              <Copy className="mr-2 h-4 w-4" />
              Clonar periodo
            </Button>

            <Button
              onClick={handleShowForm}
              className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar materia
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total visibles</p>
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

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Archivadas</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.archivadas}
                </p>
              </div>
              <Archive className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por clave, nombre, licenciatura, periodo o plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80"
                />
              </div>

              <Select value={selectedArchivado} onValueChange={setSelectedArchivado}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Archivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-archivadas">No archivadas</SelectItem>
                  <SelectItem value="archivadas">Archivadas</SelectItem>
                  <SelectItem value="todas">Todas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLic} onValueChange={setSelectedLic}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Licenciatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las licenciaturas</SelectItem>
                  {licenciaturas.map((lic) => (
                    <SelectItem key={lic.id} value={lic.id}>
                      {lic.nombre}
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

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleClearFilters}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 cursor-pointer font-medium"
                >
                  <X className="h-5 w-5 mr-2" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              Mostrando {filteredData.length} de {data.length} materias
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <TableHead className="max-w-[120px]">Clave</TableHead>
                    <TableHead className="max-w-[260px]">Nombre</TableHead>
                    <TableHead>Licenciatura</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Requisito</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="min-w-[220px]">Última edición</TableHead>
                    <TableHead className="w-32 min-w-[120px]">Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {currentItems.map((materia) => {
                    const infoEdicion = obtenerInfoEdicion(materia);

                    return (
                      <TableRow key={materia.clave}>
                        <TableCell className="font-medium max-w-[120px]">
                          <span className="block truncate" title={materia.clave}>
                            {materia.clave}
                          </span>
                        </TableCell>

                        <TableCell className="max-w-[260px]">
                          <span
                            className="block truncate"
                            title={materia.nombre_materia}
                          >
                            {materia.nombre_materia}
                          </span>
                        </TableCell>

                        <TableCell>{materia.licenciatura || "-"}</TableCell>

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

                        <TableCell>{materia.periodo || "-"}</TableCell>
                        <TableCell>{materia.plan_estudios || "-"}</TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-2">
                            {infoEdicion ? (
                              <>
                                {infoEdicion.tipo === "ambos" &&
                                infoEdicion.pua &&
                                infoEdicion.encuadre ? (
                                  <>
                                    <div className="flex items-center gap-2 text-xs">
                                      <FileText className="h-3 w-3 text-[#00723F]" />
                                      <div className="flex flex-col items-start">
                                        <span className="font-medium text-[#00723F]">
                                          PUA: {infoEdicion.pua.editor}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {formatearFecha(infoEdicion.pua.fecha)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                      <ClipboardList className="h-3 w-3 text-blue-600" />
                                      <div className="flex flex-col items-start">
                                        <span className="font-medium text-blue-600">
                                          Encuadre: {infoEdicion.encuadre.editor}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {formatearFecha(
                                            infoEdicion.encuadre.fecha
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                ) : infoEdicion.tipo === "pua" &&
                                  infoEdicion.pua ? (
                                  <div className="flex items-center gap-2 text-xs">
                                    <FileText className="h-3 w-3 text-[#00723F]" />
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium text-[#00723F]">
                                        PUA: {infoEdicion.pua.editor}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {formatearFecha(infoEdicion.pua.fecha)}
                                      </span>
                                    </div>
                                  </div>
                                ) : infoEdicion.tipo === "encuadre" &&
                                  infoEdicion.encuadre ? (
                                  <div className="flex items-center gap-2 text-xs">
                                    <ClipboardList className="h-3 w-3 text-blue-600" />
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium text-blue-600">
                                        Encuadre: {infoEdicion.encuadre.editor}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {formatearFecha(
                                          infoEdicion.encuadre.fecha
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Sin ediciones
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="w-32 min-w-[120px]">
                          {materia.archivada ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full flex-shrink-0 bg-amber-500" />
                              <span className="whitespace-nowrap text-amber-700">
                                Archivada
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                                  materia.estado === "Activa"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              <span
                                className={`whitespace-nowrap ${
                                  materia.estado === "Activa"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {materia.estado}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:text-blue-800 cursor-pointer"
                              title={
                                materia.archivada
                                  ? "No disponible en materias archivadas"
                                  : "Editar"
                              }
                              onClick={() => handleEdit(materia)}
                              disabled={materia.archivada}
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
                                materia.archivada
                                  ? "No disponible en materias archivadas"
                                  : materia.estado === "Activa"
                                  ? "Desactivar"
                                  : "Activar"
                              }
                              onClick={() => toggleEstado(materia.clave)}
                              disabled={materia.archivada}
                            >
                              {materia.estado === "Activa" ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={`cursor-pointer ${
                                materia.archivada
                                  ? "text-amber-700 hover:text-amber-800"
                                  : "text-amber-600 hover:text-amber-700"
                              }`}
                              title={
                                materia.archivada ? "Desarchivar" : "Archivar"
                              }
                              onClick={() => toggleArchivado(materia.clave)}
                            >
                              {materia.archivada ? (
                                <ArchiveRestore className="w-4 h-4" />
                              ) : (
                                <Archive className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

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
    </div>
  );
}