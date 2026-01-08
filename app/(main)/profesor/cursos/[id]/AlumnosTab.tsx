"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  RefreshCw,
  UserX,
  UserCheck,
  Copy,
  Check,
  Users,
  AlertCircle,
  Key,
  X,
} from "lucide-react";
import { useEncuadreAlumnos, AlumnoEncuadre } from "@/hooks/useEncuadreAlumnos";
import { useConfirm } from "@/components/global-confirm-modal";
import { useToast } from "@/components/ui/toast";
import {
  generarClaveSegura,
  validarCorreoInstitucional,
} from "@/lib/password-generator";

type AlumnosTabProps = {
  encuadreId: string;
  materiaNombre: string;
  grupo: string;
  periodo: string;
};

type CredencialesGeneradas = {
  correo: string;
  clave: string;
  tipo: "nuevo" | "regenerada";
};

type TipoFormulario = "agregar" | "crear" | null;

export default function AlumnosTab({
  encuadreId,
  materiaNombre,
  grupo,
  periodo,
}: AlumnosTabProps) {
  const confirm = useConfirm();
  const toast = useToast();

  const {
    obtenerAlumnos,
    agregarAlumno,
    registrarAlumno,
    regenerarClave,
    revocarAcceso,
    reactivarAcceso,
    loading,
  } = useEncuadreAlumnos(encuadreId);

  const [alumnos, setAlumnos] = useState<AlumnoEncuadre[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(true);

  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [claveGenerada, setClaveGenerada] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");

  const [copiado, setCopiado] = useState(false);
  const [tipoFormulario, setTipoFormulario] = useState<TipoFormulario>(null);

  // Estado para mostrar credenciales generadas
  const [credencialesGeneradas, setCredencialesGeneradas] =
    useState<CredencialesGeneradas | null>(null);
  const [copiadoCorreo, setCopiadoCorreo] = useState(false);
  const [copiadoClave, setCopiadoClave] = useState(false);

  useEffect(() => {
    cargarAlumnos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadreId]);

  const cargarAlumnos = async () => {
    setLoadingAlumnos(true);
    const data = await obtenerAlumnos();
    setAlumnos(data);
    setLoadingAlumnos(false);
  };

  const handleCorreoChange = (value: string) => {
    setNuevoCorreo(value);
    setErrorCorreo("");

    if (value.trim()) {
      const validacion = validarCorreoInstitucional(value);
      if (!validacion.valido) {
        setErrorCorreo(validacion.error || "");
      }
    }
  };

  const handleGenerarClave = () => {
    const clave = generarClaveSegura(12);
    setClaveGenerada(clave);
  };

  const handleCopiarClave = async () => {
    if (!claveGenerada) return;

    try {
      await navigator.clipboard.writeText(claveGenerada);
      setCopiado(true);
      toast.success("La clave se copió al portapapeles.");

      setTimeout(() => setCopiado(false), 3000);
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err);
      toast.error("No se pudo copiar la clave al portapapeles.");
    }
  };

  // Funciones para copiar credenciales generadas
  const handleCopiarCredencialCorreo = async () => {
    if (!credencialesGeneradas?.correo) return;

    try {
      await navigator.clipboard.writeText(credencialesGeneradas.correo);
      setCopiadoCorreo(true);
      setTimeout(() => setCopiadoCorreo(false), 3000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const handleCopiarCredencialClave = async () => {
    if (!credencialesGeneradas?.clave) return;

    try {
      await navigator.clipboard.writeText(credencialesGeneradas.clave);
      setCopiadoClave(true);
      setTimeout(() => setCopiadoClave(false), 3000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const handleCopiarTodo = async () => {
    if (!credencialesGeneradas) return;

    const texto = `Correo: ${credencialesGeneradas.correo}\nContraseña: ${credencialesGeneradas.clave}`;

    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoCorreo(true);
      setCopiadoClave(true);
      toast.success("Credenciales copiadas al portapapeles.");
      setTimeout(() => {
        setCopiadoCorreo(false);
        setCopiadoClave(false);
      }, 3000);
    } catch (err) {
      console.error("Error al copiar:", err);
      toast.error("No se pudo copiar al portapapeles.");
    }
  };

  const handleAgregar = async () => {
    if (!nuevoCorreo.trim()) {
      setErrorCorreo("Ingresa un correo electrónico");
      return;
    }

    const validacion = validarCorreoInstitucional(nuevoCorreo);
    if (!validacion.valido) {
      setErrorCorreo(validacion.error || "Correo inválido");
      return;
    }

    const shouldAdd = await confirm({
      title: "Agregar alumno existente",
      message: `¿Deseas agregar al alumno con el correo ${nuevoCorreo} al curso? El usuario debe existir previamente en el sistema.`,
      confirmText: "Agregar",
      cancelText: "Cancelar",
    });

    if (!shouldAdd) return;

    const result = await agregarAlumno(nuevoCorreo);

    if (result.success) {
      toast.success("Alumno agregado al curso exitosamente.");
      setNuevoCorreo("");
      setClaveGenerada("");
      setErrorCorreo("");
      setTipoFormulario(null);
      await cargarAlumnos();
    } else {
      toast.error(result.error || "Ocurrió un error al agregar al alumno");
    }
  };

  const handleRegistrar = async () => {
    if (!nuevoCorreo.trim()) {
      setErrorCorreo("Ingresa un correo electrónico");
      return;
    }

    const validacion = validarCorreoInstitucional(nuevoCorreo);
    if (!validacion.valido) {
      setErrorCorreo(validacion.error || "Correo inválido");
      return;
    }

    if (!claveGenerada) {
      await confirm({
        title: "Sin clave generada",
        message: "Primero debes generar una clave segura para el nuevo alumno.",
        confirmText: "Entendido",
        cancelText: "Cerrar",
      });
      return;
    }

    const shouldRegister = await confirm({
      title: "Registrar nuevo alumno",
      message: `¿Deseas registrar al nuevo alumno con el correo ${nuevoCorreo}? Se creará un nuevo usuario con la clave generada.`,
      confirmText: "Registrar",
      cancelText: "Cancelar",
    });

    if (!shouldRegister) return;

    const result = await registrarAlumno(
      nuevoCorreo,
      claveGenerada,
      materiaNombre,
      grupo,
      periodo
    );

    if (result.success) {
      // Mostrar las credenciales generadas
      setCredencialesGeneradas({
        correo: nuevoCorreo,
        clave: claveGenerada,
        tipo: "nuevo",
      });

      toast.success("Alumno creado exitosamente.");
      setNuevoCorreo("");
      setClaveGenerada("");
      setErrorCorreo("");
      setTipoFormulario(null);
      await cargarAlumnos();
    } else {
      toast.error(result.error || "Ocurrió un error al crear al alumno");
    }
  };

  const handleRegenerarClave = async (alumno: AlumnoEncuadre) => {
    const shouldRegenerate = await confirm({
      title: "¿Regenerar clave?",
      message: `¿Deseas generar una nueva clave para ${alumno.correo}? La clave anterior dejará de funcionar.`,
      confirmText: "Sí, regenerar",
      cancelText: "Cancelar",
    });

    if (!shouldRegenerate) return;

    const result = await regenerarClave(
      alumno.alumno_id,
      alumno.correo,
      materiaNombre,
      grupo,
      periodo
    );

    if (result.success && result.clave) {
      // Mostrar las credenciales generadas
      setCredencialesGeneradas({
        correo: alumno.correo,
        clave: result.clave,
        tipo: "regenerada",
      });

      toast.success("Nueva clave generada exitosamente.");
      await cargarAlumnos();
    } else {
      toast.error(result.error || "No se pudo regenerar la clave");
    }
  };

  const handleRevocar = async (alumno: AlumnoEncuadre) => {
    const shouldRevoke = await confirm({
      title: "Revocar acceso",
      message: `¿Estás seguro de revocar el acceso de ${alumno.correo}? El alumno no podrá ingresar al sistema.`,
      confirmText: "Revocar",
      cancelText: "Cancelar",
    });

    if (!shouldRevoke) return;

    const result = await revocarAcceso(alumno.alumno_id);

    if (result.success) {
      toast.success(`Acceso revocado para ${alumno.correo}`);
      await cargarAlumnos();
    } else {
      toast.error(result.error || "No se pudo revocar el acceso");
    }
  };

  const handleReactivar = async (alumno: AlumnoEncuadre) => {
    const result = await reactivarAcceso(alumno.alumno_id);

    if (result.success) {
      toast.success(`Acceso reactivado para ${alumno.correo}`);
      await cargarAlumnos();
    } else {
      toast.error(result.error || "No se pudo reactivar el acceso");
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "-";
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Alumnos
            </CardTitle>
            <CardDescription>
              Registra y administra el acceso de los alumnos a este curso
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold">{alumnos.length}</span>
            <span>alumnos registrados</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sección de credenciales generadas */}
        {credencialesGeneradas && (
          <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <Key className="h-5 w-5" />
                {credencialesGeneradas.tipo === "nuevo"
                  ? "Credenciales del nuevo alumno"
                  : "Nueva clave generada"}
              </h4>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCredencialesGeneradas(null)}
                className="h-8 w-8 cursor-pointer text-green-700 hover:text-green-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3">
              {/* Correo */}
              <div className="space-y-1">
                <Label className="text-green-700 text-xs">Correo</Label>
                <div className="flex gap-2">
                  <Input
                    value={credencialesGeneradas.correo}
                    readOnly
                    className="font-mono bg-white border-green-300"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopiarCredencialCorreo}
                    className="cursor-pointer border-green-300 hover:bg-green-100"
                  >
                    {copiadoCorreo ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Clave */}
              <div className="space-y-1">
                <Label className="text-green-700 text-xs">Contraseña</Label>
                <div className="flex gap-2">
                  <Input
                    value={credencialesGeneradas.clave}
                    readOnly
                    className="font-mono bg-white border-green-300 text-lg tracking-wider"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopiarCredencialClave}
                    className="cursor-pointer border-green-300 hover:bg-green-100"
                  >
                    {copiadoClave ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Botón copiar todo */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopiarTodo}
                className="cursor-pointer border-green-500 text-green-700 hover:bg-green-100"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar todo
              </Button>
            </div>

            <p className="text-xs text-green-700">
              ⚠️ Guarda estas credenciales antes de cerrar. Deberás enviarlas al
              alumno para que pueda acceder al sistema.
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTipoFormulario("agregar");
              setNuevoCorreo("");
              setClaveGenerada("");
              setErrorCorreo("");
            }}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar alumno
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setTipoFormulario("crear");
              setNuevoCorreo("");
              setClaveGenerada("");
              setErrorCorreo("");
            }}
            className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear alumno
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={cargarAlumnos}
            disabled={loadingAlumnos}
            className="cursor-pointer"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loadingAlumnos ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {/* Formulario para agregar alumno existente */}
        {tipoFormulario === "agregar" && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="font-medium">Agregar alumno existente</h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Correo institucional</Label>
                <Input
                  type="email"
                  placeholder="alumno@uabc.edu.mx"
                  value={nuevoCorreo}
                  onChange={(e) => handleCorreoChange(e.target.value)}
                  className={errorCorreo ? "border-red-500" : ""}
                />
                {errorCorreo && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errorCorreo}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  El alumno debe existir previamente en el sistema (creado por
                  admin).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTipoFormulario(null);
                  setNuevoCorreo("");
                  setClaveGenerada("");
                  setErrorCorreo("");
                }}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAgregar}
                disabled={loading || !nuevoCorreo || !!errorCorreo}
                className="cursor-pointer"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar alumno
              </Button>
            </div>
          </div>
        )}

        {/* Formulario para crear nuevo alumno */}
        {tipoFormulario === "crear" && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="font-medium">Crear nuevo alumno</h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Correo institucional</Label>
                <Input
                  type="email"
                  placeholder="alumno@uabc.edu.mx"
                  value={nuevoCorreo}
                  onChange={(e) => handleCorreoChange(e.target.value)}
                  className={errorCorreo ? "border-red-500" : ""}
                />
                {errorCorreo && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errorCorreo}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Clave generada</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={claveGenerada}
                    readOnly
                    placeholder="Genera una clave para el nuevo usuario..."
                    className="font-mono bg-white"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleGenerarClave}
                    title="Generar nueva clave"
                    className="cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>

                  {claveGenerada && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopiarClave}
                      title="Copiar clave"
                      className="cursor-pointer"
                    >
                      {copiado ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Debes generar una clave para crear el nuevo usuario en el
                  sistema.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTipoFormulario(null);
                  setNuevoCorreo("");
                  setClaveGenerada("");
                  setErrorCorreo("");
                }}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleRegistrar}
                disabled={loading || !nuevoCorreo || !claveGenerada || !!errorCorreo}
                className="bg-[#00723F] hover:bg-[#005e30] text-white cursor-pointer"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear alumno
              </Button>
            </div>
          </div>
        )}

        {/* Tabla de alumnos */}
        {loadingAlumnos ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#00723F]" />
          </div>
        ) : alumnos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay alumnos registrados en este curso</p>
            <p className="text-sm">
              Haz clic en &quot;Agregar alumno&quot; para registrar uno nuevo
            </p>
          </div>
        ) : (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Correo</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {alumnos.map((alumno) => (
                  <TableRow key={alumno.id}>
                    <TableCell className="font-medium">{alumno.correo}</TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatearFecha(alumno.invitado_at)}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatearFecha(alumno.ultimo_acceso)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerarClave(alumno)}
                          disabled={loading}
                          title="Generar nueva clave"
                          className="cursor-pointer"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>

                        {alumno.estado !== "revocada" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevocar(alumno)}
                            disabled={loading}
                            title="Revocar acceso"
                            className="cursor-pointer text-red-600 hover:text-red-700"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivar(alumno)}
                            disabled={loading}
                            title="Reactivar acceso"
                            className="cursor-pointer text-green-600 hover:text-green-700"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
