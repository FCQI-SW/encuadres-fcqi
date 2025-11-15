"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

type Tema = {
  id: string;
  texto: string;
  nivel: number; // 1, 2, o 3
  hijos?: Tema[];
};

type ContenidoEditorProps = {
  numeroUnidad: number;
  value?: string; // Texto estructurado guardado
  onChange?: (contenido: string) => void;
};

export function ContenidoEditor({ numeroUnidad, value, onChange }: ContenidoEditorProps) {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargado, setCargado] = useState(false);
  const editadoManualmenteRef = useRef(false);

  // Cargar contenido cuando llega desde la BD
  useEffect(() => {
    // Solo cargar si:
    // 1. No se ha cargado antes
    // 2. Hay un value
    // 3. No se ha editado manualmente
    if (!cargado && value && value.trim() && !editadoManualmenteRef.current) {
      const temasParseados = parseContenidoATexto(value);
      setTemas(temasParseados);
      setCargado(true);
    }
  }, [value, cargado]);

  // Notificar cambios
  useEffect(() => {
    if (onChange && (temas.length > 0 || editadoManualmenteRef.current)) {
      const textoEstructurado = convertirTemasATexto(temas, numeroUnidad);
      onChange(textoEstructurado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temas, numeroUnidad]);

  const agregarTemaPrincipal = () => {
    editadoManualmenteRef.current = true;
    const nuevoId = `tema-${Date.now()}-${Math.random()}`;
    setTemas([...temas, { id: nuevoId, texto: "", nivel: 1, hijos: [] }]);
  };

  const agregarSubtema = (temaId: string) => {
    editadoManualmenteRef.current = true;
    setTemas(
      temas.map((tema) => {
        if (tema.id === temaId) {
          const nuevoId = `subtema-${Date.now()}-${Math.random()}`;
          return {
            ...tema,
            hijos: [...(tema.hijos || []), { id: nuevoId, texto: "", nivel: 2, hijos: [] }],
          };
        }
        return tema;
      })
    );
  };

  const agregarInciso = (temaId: string, subtemaId: string) => {
    editadoManualmenteRef.current = true;
    setTemas(
      temas.map((tema) => {
        if (tema.id === temaId) {
          return {
            ...tema,
            hijos: tema.hijos?.map((subtema) => {
              if (subtema.id === subtemaId) {
                const nuevoId = `inciso-${Date.now()}-${Math.random()}`;
                return {
                  ...subtema,
                  hijos: [...(subtema.hijos || []), { id: nuevoId, texto: "", nivel: 3 }],
                };
              }
              return subtema;
            }),
          };
        }
        return tema;
      })
    );
  };

  const eliminarTema = (temaId: string) => {
    editadoManualmenteRef.current = true;
    setTemas(temas.filter((t) => t.id !== temaId));
  };

  const eliminarSubtema = (temaId: string, subtemaId: string) => {
    editadoManualmenteRef.current = true;
    setTemas(
      temas.map((tema) => {
        if (tema.id === temaId) {
          return {
            ...tema,
            hijos: tema.hijos?.filter((s) => s.id !== subtemaId),
          };
        }
        return tema;
      })
    );
  };

  const eliminarInciso = (temaId: string, subtemaId: string, incisoId: string) => {
    editadoManualmenteRef.current = true;
    setTemas(
      temas.map((tema) => {
        if (tema.id === temaId) {
          return {
            ...tema,
            hijos: tema.hijos?.map((subtema) => {
              if (subtema.id === subtemaId) {
                return {
                  ...subtema,
                  hijos: subtema.hijos?.filter((inc) => inc.id !== incisoId),
                };
              }
              return subtema;
            }),
          };
        }
        return tema;
      })
    );
  };

  const actualizarTextoTema = (temaId: string, texto: string) => {
    editadoManualmenteRef.current = true;
    setTemas(
      temas.map((tema) => (tema.id === temaId ? { ...tema, texto } : tema))
    );
  };

  const actualizarTextoSubtema = (temaId: string, subtemaId: string, texto: string) => {
    editadoManualmenteRef.current = true;
    setTemas(
      temas.map((tema) => {
        if (tema.id === temaId) {
          return {
            ...tema,
            hijos: tema.hijos?.map((subtema) =>
              subtema.id === subtemaId ? { ...subtema, texto } : subtema
            ),
          };
        }
        return tema;
      })
    );
  };

  const actualizarTextoInciso = (
    temaId: string,
    subtemaId: string,
    incisoId: string,
    texto: string
  ) => {
    editadoManualmenteRef.current = true;
    setTemas(
      temas.map((tema) => {
        if (tema.id === temaId) {
          return {
            ...tema,
            hijos: tema.hijos?.map((subtema) => {
              if (subtema.id === subtemaId) {
                return {
                  ...subtema,
                  hijos: subtema.hijos?.map((inciso) =>
                    inciso.id === incisoId ? { ...inciso, texto } : inciso
                  ),
                };
              }
              return subtema;
            }),
          };
        }
        return tema;
      })
    );
  };

  return (
    <div className="space-y-2">
      {temas.map((tema, temaIdx) => (
        <div key={tema.id} className="space-y-2">
          {/* Tema principal */}
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-muted-foreground min-w-[60px] pt-2">
              {numeroUnidad}.{temaIdx + 1}
            </span>
            <Input
              value={tema.texto}
              onChange={(e) => actualizarTextoTema(tema.id, e.target.value)}
              placeholder="Nombre del tema"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => agregarSubtema(tema.id)}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1" />
              Subtema
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => eliminarTema(tema.id)}
              className="cursor-pointer"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>

          {/* Subtemas */}
          {tema.hijos?.map((subtema, subtemaIdx) => (
            <div key={subtema.id} className="ml-8 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px] pt-2">
                  {numeroUnidad}.{temaIdx + 1}.{subtemaIdx + 1}
                </span>
                <Input
                  value={subtema.texto}
                  onChange={(e) =>
                    actualizarTextoSubtema(tema.id, subtema.id, e.target.value)
                  }
                  placeholder="Nombre del subtema"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => agregarInciso(tema.id, subtema.id)}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Inciso
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => eliminarSubtema(tema.id, subtema.id)}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              {/* Incisos */}
              {subtema.hijos?.map((inciso, incisoIdx) => (
                <div key={inciso.id} className="ml-8">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-[100px] pt-2">
                      {numeroUnidad}.{temaIdx + 1}.{subtemaIdx + 1}.{incisoIdx + 1}
                    </span>
                    <Input
                      value={inciso.texto}
                      onChange={(e) =>
                        actualizarTextoInciso(
                          tema.id,
                          subtema.id,
                          inciso.id,
                          e.target.value
                        )
                      }
                      placeholder="Nombre del inciso"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        eliminarInciso(tema.id, subtema.id, inciso.id)
                      }
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      <Button
        variant="outline"
        onClick={agregarTemaPrincipal}
        className="cursor-pointer w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar tema
      </Button>
    </div>
  );
}

// Función para convertir temas a texto estructurado
function convertirTemasATexto(temas: Tema[], numeroUnidad: number): string {
  let texto = "";

  temas.forEach((tema, temaIdx) => {
    if (tema.texto.trim()) {
      texto += `${numeroUnidad}.${temaIdx + 1} ${tema.texto}\n`;

      tema.hijos?.forEach((subtema, subtemaIdx) => {
        if (subtema.texto.trim()) {
          texto += `    ${numeroUnidad}.${temaIdx + 1}.${subtemaIdx + 1} ${subtema.texto}\n`;

          subtema.hijos?.forEach((inciso, incisoIdx) => {
            if (inciso.texto.trim()) {
              texto += `        ${numeroUnidad}.${temaIdx + 1}.${subtemaIdx + 1}.${incisoIdx + 1} ${inciso.texto}\n`;
            }
          });
        }
      });
    }
  });

  return texto;
}

// Función para parsear texto estructurado a temas
function parseContenidoATexto(contenido: string): Tema[] {
  const lineas = contenido.split("\n").filter((l) => l.trim());
  const temas: Tema[] = [];
  let temaActual: Tema | null = null;
  let subtemaActual: Tema | null = null;

  lineas.forEach((linea) => {
    // Extraer numeración y texto
    const match = linea.trim().match(/^(\d+\.)+\s*(.+)$/);
    if (!match) return;

    const texto = match[2];
    const numeros = match[1].split(".").filter((n) => n).length;

    if (numeros === 2) {
      // Tema principal (1.1)
      temaActual = { id: `tema-${Date.now()}-${Math.random()}`, texto, nivel: 1, hijos: [] };
      temas.push(temaActual);
      subtemaActual = null;
    } else if (numeros === 3 && temaActual) {
      // Subtema (1.1.1)
      subtemaActual = { id: `subtema-${Date.now()}-${Math.random()}`, texto, nivel: 2, hijos: [] };
      temaActual.hijos = [...(temaActual.hijos || []), subtemaActual];
    } else if (numeros === 4 && subtemaActual) {
      // Inciso (1.1.1.1)
      const inciso = { id: `inciso-${Date.now()}-${Math.random()}`, texto, nivel: 3 };
      subtemaActual.hijos = [...(subtemaActual.hijos || []), inciso];
    }
  });

  return temas;
}