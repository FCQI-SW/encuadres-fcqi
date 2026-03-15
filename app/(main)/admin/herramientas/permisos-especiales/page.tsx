"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Loader2,
  ShieldCheck,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/global-confirm-modal";

type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol_id: string;
  rol_nombre: string;
};

type EncuadreOption = {
  id: string;
  label: string;
};

type Permiso = {
  id: string;
  encuadre_id: string;
  usuario_id: string;
  rol_objetivo: "profesor" | "alumno";
  acceso_desde: string;
  acceso_hasta: string;
  solo_lectura: boolean;
  puede_editar_encuadre: boolean;
  puede_gestionar_alumnos: boolean;
  puede_firmar: boolean;
  puede_registrar_avances: boolean;
  activo: boolean;
  motivo: string | null;
};

export default function PermisosEspecialesPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [encuadres, setEncuadres] = useState<EncuadreOption[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);

  const [rolObjetivo, setRolObjetivo] = useState<"profesor" | "alumno">("profesor");
  const [encuadreId, setEncuadreId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [accesoDesde, setAccesoDesde] = useState("");
  const [accesoHasta, setAccesoHasta] = useState("");
  const [soloLectura, setSoloLectura] = useState(false);
  const [puedeEditarEncuadre, setPuedeEditarEncuadre] = useState(true);
  const [puedeGestionarAlumnos, setPuedeGestionarAlumnos] = useState(false);
  const [puedeFirmar, setPuedeFirmar] = useState(false);
  const [puedeRegistrarAvances, setPuedeRegistrarAvances] = useState(false);
  const [motivo, setMotivo] = useState("");

  const normalizarRol = (nombre: string) => nombre.trim().toLowerCase();

  const cargarTodo = async () => {
    setLoading(true);

    try {
      const [
        { data: rolesData },
        { data: usuariosData },
        { data: encuadresData },
        { data: programasData },
        { data: materiasData },
        { data: profesoresData },
        { data: permisosData },
      ] = await Promise.all([
        supabase.from("roles").select("id, nombre"),
        supabase.from("usuarios").select("id, nombre, correo, rol_id"),
        supabase.from("encuadres").select("id, programa_id, grupo, periodo, usuario_id"),
        supabase.from("programas").select("id, materia_id"),
        supabase.from("materias").select("id, clave, nombre_materia"),
        supabase.from("usuarios").select("id, nombre"),
        supabase
          .from("permisos_operacion_encuadre")
          .select("*")
          .eq("activo", true)
          .order("created_at", { ascending: false }),
      ]);

      const rolesMap = new Map<string, string>();
      (rolesData || []).forEach((r: any) => rolesMap.set(r.id, r.nombre));

      const usuariosFormateados: Usuario[] = (usuariosData || []).map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        rol_id: u.rol_id,
        rol_nombre: rolesMap.get(u.rol_id) || "",
      }));

      const programaMap = new Map<string, any>();
      (programasData || []).forEach((p: any) => programaMap.set(p.id, p));

      const materiaMap = new Map<string, any>();
      (materiasData || []).forEach((m: any) => materiaMap.set(m.id, m));

      const profesorMap = new Map<string, string>();
      (profesoresData || []).forEach((p: any) => profesorMap.set(p.id, p.nombre));

      const encuadresFormateados: EncuadreOption[] = (encuadresData || []).map((e: any) => {
        const programa = programaMap.get(e.programa_id);
        const materia = programa ? materiaMap.get(programa.materia_id) : null;
        const profesor = profesorMap.get(e.usuario_id) || "Sin profesor";

        return {
          id: e.id,
          label: `${materia?.clave || "N/A"} - ${materia?.nombre_materia || "Sin materia"} | Grupo ${e.grupo} | ${e.periodo} | ${profesor}`,
        };
      });

      setUsuarios(usuariosFormateados);
      setEncuadres(encuadresFormateados);
      setPermisos((permisosData || []) as Permiso[]);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la información.");
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  useEffect(() => {
    if (rolObjetivo === "profesor") {
      setSoloLectura(false);
      setPuedeEditarEncuadre(true);
      setPuedeGestionarAlumnos(false);
      setPuedeFirmar(false);
      setPuedeRegistrarAvances(false);
    } else {
      setSoloLectura(false);
      setPuedeEditarEncuadre(false);
      setPuedeGestionarAlumnos(false);
      setPuedeFirmar(true);
      setPuedeRegistrarAvances(true);
    }
  }, [rolObjetivo]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const rol = normalizarRol(u.rol_nombre);
      if (rolObjetivo === "profesor") return rol.includes("profesor");
      return rol.includes("alumno");
    });
  }, [usuarios, rolObjetivo]);

  const encuadreLabelMap = useMemo(() => {
    return new Map(encuadres.map((e) => [e.id, e.label]));
  }, [encuadres]);

  const usuarioLabelMap = useMemo(() => {
    return new Map(usuarios.map((u) => [u.id, `${u.nombre} (${u.correo})`]));
  }, [usuarios]);

  const limpiarFormulario = () => {
    setEncuadreId("");
    setUsuarioId("");
    setMotivo("");
    setAccesoDesde("");
    setAccesoHasta("");
  };

  const guardarPermiso = async () => {
    if (!session?.user?.id) {
      toast.error("No se pudo validar tu sesión.");
      return;
    }

    if (!encuadreId) {
      toast.error("Selecciona un encuadre.");
      return;
    }

    if (!usuarioId) {
      toast.error("Selecciona un usuario.");
      return;
    }

    if (!accesoDesde || !accesoHasta) {
      toast.error("Debes indicar fecha y hora de inicio y fin.");
      return;
    }

    if (new Date(accesoDesde) >= new Date(accesoHasta)) {
      toast.error("La fecha/hora final debe ser posterior a la inicial.");
      return;
    }

    setSaving(true);

    const payload = {
      encuadre_id: encuadreId,
      usuario_id: usuarioId,
      rol_objetivo: rolObjetivo,
      acceso_desde: new Date(accesoDesde).toISOString(),
      acceso_hasta: new Date(accesoHasta).toISOString(),
      solo_lectura: soloLectura,
      puede_editar_encuadre: soloLectura ? false : puedeEditarEncuadre,
      puede_gestionar_alumnos: soloLectura ? false : puedeGestionarAlumnos,
      puede_firmar: soloLectura ? false : puedeFirmar,
      puede_registrar_avances: soloLectura ? false : puedeRegistrarAvances,
      activo: true,
      motivo: motivo.trim() || null,
      creado_por: session.user.id,
    };

    const { error } = await supabase
      .from("permisos_operacion_encuadre")
      .insert([payload]);

    if (error) {
      console.error(error);
      toast.error("No se pudo guardar el permiso especial.");
      setSaving(false);
      return;
    }

    toast.success("Permiso especial creado correctamente.");
    limpiarFormulario();
    await cargarTodo();
    setSaving(false);
  };

  const desactivarPermiso = async (id: string) => {
    const ok = await confirm({
      title: "Desactivar permiso",
      message: "¿Deseas desactivar este permiso especial?",
      confirmText: "Sí, desactivar",
      cancelText: "Cancelar",
    });

    if (!ok) return;

    const { error } = await supabase
      .from("permisos_operacion_encuadre")
      .update({ activo: false })
      .eq("id", id);

    if (error) {
      console.error(error);
      toast.error("No se pudo desactivar el permiso.");
      return;
    }

    toast.success("Permiso desactivado correctamente.");
    await cargarTodo();
  };

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
          <p className="text-sm text-muted-foreground">
            Otorga permisos especiales por encuadre a profesores y alumnos.
          </p>
        </div>

        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin")}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Regresar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#00723F]" />
            Crear permiso especial
          </CardTitle>
          <CardDescription>
            Usa esta opción cuando la ventana general ya cerró, pero necesitas permitir operar un encuadre puntual.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-2 block">Rol objetivo</Label>
              <Select
                value={rolObjetivo}
                onValueChange={(value) => setRolObjetivo(value as "profesor" | "alumno")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profesor">Profesor</SelectItem>
                  <SelectItem value="alumno">Alumno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Encuadre</Label>
              <Select value={encuadreId} onValueChange={setEncuadreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un encuadre" />
                </SelectTrigger>
                <SelectContent>
                  {encuadres.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="mb-2 block">Usuario</Label>
              <Select value={usuarioId} onValueChange={setUsuarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {usuariosFiltrados.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre} ({u.correo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Acceso desde</Label>
              <Input
                type="datetime-local"
                value={accesoDesde}
                onChange={(e) => setAccesoDesde(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block">Acceso hasta</Label>
              <Input
                type="datetime-local"
                value={accesoHasta}
                onChange={(e) => setAccesoHasta(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="mb-2 block">Motivo</Label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ejemplo: se asignó nueva materia después del cierre de operación"
              />
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <Label className="block">Permisos</Label>

            <div className="flex items-center gap-2">
              <input
                id="soloLectura"
                type="checkbox"
                checked={soloLectura}
                onChange={(e) => setSoloLectura(e.target.checked)}
              />
              <Label htmlFor="soloLectura">Solo lectura</Label>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <input
                  id="puedeEditarEncuadre"
                  type="checkbox"
                  checked={puedeEditarEncuadre}
                  onChange={(e) => setPuedeEditarEncuadre(e.target.checked)}
                  disabled={soloLectura}
                />
                <Label htmlFor="puedeEditarEncuadre">Puede editar encuadre</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="puedeGestionarAlumnos"
                  type="checkbox"
                  checked={puedeGestionarAlumnos}
                  onChange={(e) => setPuedeGestionarAlumnos(e.target.checked)}
                  disabled={soloLectura}
                />
                <Label htmlFor="puedeGestionarAlumnos">Puede gestionar alumnos</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="puedeFirmar"
                  type="checkbox"
                  checked={puedeFirmar}
                  onChange={(e) => setPuedeFirmar(e.target.checked)}
                  disabled={soloLectura}
                />
                <Label htmlFor="puedeFirmar">Puede firmar</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="puedeRegistrarAvances"
                  type="checkbox"
                  checked={puedeRegistrarAvances}
                  onChange={(e) => setPuedeRegistrarAvances(e.target.checked)}
                  disabled={soloLectura}
                />
                <Label htmlFor="puedeRegistrarAvances">Puede registrar avances</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={guardarPermiso}
              disabled={saving}
              className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {saving ? "Guardando..." : "Crear permiso"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permisos activos</CardTitle>
          <CardDescription>
            Lista de excepciones actualmente activas.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {permisos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay permisos especiales activos.
            </p>
          ) : (
            permisos.map((permiso) => (
              <div
                key={permiso.id}
                className="rounded-lg border p-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Encuadre:</strong>{" "}
                    {encuadreLabelMap.get(permiso.encuadre_id) || permiso.encuadre_id}
                  </p>
                  <p>
                    <strong>Usuario:</strong>{" "}
                    {usuarioLabelMap.get(permiso.usuario_id) || permiso.usuario_id}
                  </p>
                  <p>
                    <strong>Rol:</strong> {permiso.rol_objetivo}
                  </p>
                  <p>
                    <strong>Desde:</strong>{" "}
                    {new Date(permiso.acceso_desde).toLocaleString("es-MX")}
                  </p>
                  <p>
                    <strong>Hasta:</strong>{" "}
                    {new Date(permiso.acceso_hasta).toLocaleString("es-MX")}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {permiso.solo_lectura && (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        Solo lectura
                      </span>
                    )}
                    {permiso.puede_editar_encuadre && (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                        Editar encuadre
                      </span>
                    )}
                    {permiso.puede_gestionar_alumnos && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        Gestionar alumnos
                      </span>
                    )}
                    {permiso.puede_firmar && (
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                        Firmar
                      </span>
                    )}
                    {permiso.puede_registrar_avances && (
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                        Registrar avances
                      </span>
                    )}
                  </div>
                  {permiso.motivo && (
                    <p className="text-muted-foreground pt-1">
                      <strong>Motivo:</strong> {permiso.motivo}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => desactivarPermiso(permiso.id)}
                  className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Desactivar
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}