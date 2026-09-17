"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Loader2,
  X,
  Plus,
  Trash2,
  Edit,
  Check,
} from "lucide-react";

type Licenciatura = {
  id: string;
  nombre: string;
  activa: boolean;
};

type Materia = {
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
  archivada?: boolean;
};

interface ModalEditarMateriaProps {
  isOpen: boolean;
  materia: Materia;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onSave: () => void;
  errors: string[];
  saving?: boolean;
  licenciaturas: Licenciatura[];
  onCreateLicenciatura: (nombre: string) => Promise<Licenciatura | null>;
  onUpdateLicenciatura: (
    id: string,
    nombre: string
  ) => Promise<Licenciatura | null>;
  onDeleteLicenciatura: (id: string) => Promise<boolean>;
}

export function ModalEditarMateria({
  isOpen,
  materia,
  onClose,
  onInputChange,
  onSelectChange,
  onSave,
  errors,
  saving = false,
  licenciaturas,
  onCreateLicenciatura,
  onUpdateLicenciatura,
  onDeleteLicenciatura,
}: ModalEditarMateriaProps) {
  const [nuevaLicenciatura, setNuevaLicenciatura] = useState("");
  const [editingLicenciaturaId, setEditingLicenciaturaId] = useState("");
  const [editingLicenciaturaNombre, setEditingLicenciaturaNombre] = useState("");
  const [managingLic, setManagingLic] = useState(false);
  const [showLicenciaturasManager, setShowLicenciaturasManager] =
    useState(false);

  if (!isOpen) return null;

  async function handleCreateLicenciatura() {
    if (!nuevaLicenciatura.trim()) return;

    setManagingLic(true);
    const creada = await onCreateLicenciatura(nuevaLicenciatura);
    setManagingLic(false);

    if (creada) {
      setNuevaLicenciatura("");
      onSelectChange("licenciatura_id", creada.id);
    }
  }

  function startEditLicenciatura(lic: Licenciatura) {
    setEditingLicenciaturaId(lic.id);
    setEditingLicenciaturaNombre(lic.nombre);
  }

  function cancelEditLicenciatura() {
    setEditingLicenciaturaId("");
    setEditingLicenciaturaNombre("");
  }

  async function handleUpdateLicenciatura() {
    if (!editingLicenciaturaId || !editingLicenciaturaNombre.trim()) return;

    setManagingLic(true);
    const actualizada = await onUpdateLicenciatura(
      editingLicenciaturaId,
      editingLicenciaturaNombre
    );
    setManagingLic(false);

    if (actualizada) {
      if (materia.licenciatura_id === actualizada.id) {
        onSelectChange("licenciatura_id", actualizada.id);
      }
      cancelEditLicenciatura();
    }
  }

  async function handleDeleteLicenciatura(id: string) {
    setManagingLic(true);
    await onDeleteLicenciatura(id);
    setManagingLic(false);
  }

  const estadoTexto = materia.archivada
    ? "Archivada"
    : materia.estado === "Activa"
    ? "Activa"
    : "Inactiva";

  const estadoClase = materia.archivada
    ? "text-amber-700 bg-amber-50 border-amber-200"
    : materia.estado === "Activa"
    ? "text-green-700 bg-green-50 border-green-200"
    : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 cursor-pointer"
            onClick={onClose}
            disabled={saving || managingLic}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardTitle>Editar materia / periodo</CardTitle>
          <CardDescription>
            Modifica los datos de la materia {materia.clave} en el periodo{" "}
            {materia.periodo || "seleccionado"}.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {errors.length > 0 && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-clave">Clave</Label>
              <Input
                id="edit-clave"
                name="clave"
                value={materia.clave}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-nombre">Nombre de la materia *</Label>
              <Input
                id="edit-nombre"
                name="nombre_materia"
                value={materia.nombre_materia}
                onChange={onInputChange}
                disabled={saving}
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <Label>Licenciatura *</Label>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={materia.licenciatura_id || undefined}
                    onValueChange={(value) =>
                      onSelectChange("licenciatura_id", value)
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar licenciatura" />
                    </SelectTrigger>
                    <SelectContent>
                      {licenciaturas.map((lic) => (
                        <SelectItem key={lic.id} value={lic.id}>
                          {lic.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setShowLicenciaturasManager(!showLicenciaturasManager)
                  }
                  disabled={saving || managingLic}
                  className="cursor-pointer"
                >
                  {showLicenciaturasManager ? "Ocultar" : "Gestionar"}
                </Button>
              </div>
            </div>

            {showLicenciaturasManager && (
              <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Gestionar licenciaturas</p>
                  <p className="text-xs text-muted-foreground">
                    Aquí puedes agregar, editar o quitar licenciaturas sin salir
                    del modal.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva licenciatura"
                    value={nuevaLicenciatura}
                    onChange={(e) => setNuevaLicenciatura(e.target.value)}
                    disabled={saving || managingLic}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateLicenciatura}
                    disabled={saving || managingLic || !nuevaLicenciatura.trim()}
                    className="cursor-pointer"
                  >
                    {managingLic ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar
                      </>
                    )}
                  </Button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2">
                  {licenciaturas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay licenciaturas registradas.
                    </p>
                  ) : (
                    licenciaturas.map((lic) =>
                      editingLicenciaturaId === lic.id ? (
                        <div
                          key={lic.id}
                          className="flex items-center gap-2 rounded-md border p-2"
                        >
                          <Input
                            value={editingLicenciaturaNombre}
                            onChange={(e) =>
                              setEditingLicenciaturaNombre(e.target.value)
                            }
                            disabled={saving || managingLic}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={handleUpdateLicenciatura}
                            disabled={
                              saving ||
                              managingLic ||
                              !editingLicenciaturaNombre.trim()
                            }
                            className="cursor-pointer text-green-600"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditLicenciatura}
                            disabled={saving || managingLic}
                            className="cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          key={lic.id}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <span className="text-sm">{lic.nombre}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditLicenciatura(lic)}
                              disabled={saving || managingLic}
                              className="cursor-pointer text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteLicenciatura(lic.id)}
                              disabled={saving || managingLic}
                              className="cursor-pointer text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="edit-periodo">Periodo *</Label>
              <Input
                id="edit-periodo"
                name="periodo"
                value={materia.periodo}
                onChange={onInputChange}
                disabled={saving}
                maxLength={20}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-plan-estudios">Plan de estudios *</Label>
              <Input
                id="edit-plan-estudios"
                name="plan_estudios"
                value={materia.plan_estudios}
                onChange={onInputChange}
                disabled={saving}
                maxLength={30}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select
                  value={materia.categoria}
                  onValueChange={(value) => onSelectChange("categoria", value)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basica">Básica</SelectItem>
                    <SelectItem value="Disciplinaria">Disciplinaria</SelectItem>
                    <SelectItem value="Terminal">Terminal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Requisito</Label>
                <Select
                  value={materia.requisito}
                  onValueChange={(value) => onSelectChange("requisito", value)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obligatoria">Obligatoria</SelectItem>
                    <SelectItem value="optativa">Optativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Estado actual del periodo</Label>
              <div
                className={`rounded-md border px-3 py-2 text-sm font-medium ${estadoClase}`}
              >
                {estadoTexto}
              </div>
              <p className="text-xs text-muted-foreground">
                El estado activo/inactivo y el archivado se cambian desde los
                botones de la tabla, no desde este formulario.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving || managingLic}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              disabled={saving || managingLic}
              className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}