"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

type Props = {
  encuadreId: string;
};

export default function PrintEncuadreButton({ encuadreId }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    if (!encuadreId) return;
    setLoading(true);

    try {
      const { data: encuadre } = await supabase
        .from("encuadres")
        .select("id, programa_id, usuario_id, grupo, periodo, descripcion_evaluacion, derecho_ordinario, derecho_extraordinario, descripcion_producto, bibliografia_basica, normas_conducta")
        .eq("id", encuadreId)
        .single();

      if (!encuadre) { setLoading(false); return; }

      const { data: criterios } = await supabase
        .from("criterios_evaluacion")
        .select("criterio, valor, descripcion")
        .eq("encuadre_id", encuadreId)
        .order("id", { ascending: true });

      const { data: programa } = await supabase
        .from("programas")
        .select("id, materia_id, competencia")
        .eq("id", encuadre.programa_id)
        .single();

      const { data: materia } = await supabase
        .from("materias")
        .select("clave, nombre_materia")
        .eq("id", programa?.materia_id)
        .single();

      const { data: docente } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("id", encuadre.usuario_id)
        .single();

      const { data: unidades } = await supabase
        .from("unidades")
        .select("numero, nombre, contenido, semana_inicio, semana_fin")
        .eq("programa_id", programa?.id)
        .order("numero", { ascending: true });

      const { data: alumnosEncuadre } = await supabase
        .from("encuadre_alumnos")
        .select("alumno_id, usuarios!encuadre_alumnos_alumno_id_fkey (nombre, correo)")
        .eq("encuadre_id", encuadreId)
        .neq("estado", "revocada");

      const { data: firmas } = await supabase
        .from("encuadre_firmas")
        .select("alumno_id, firmado_at")
        .eq("encuadre_id", encuadreId);

      const firmasMap = new Map((firmas || []).map((f: any) => [f.alumno_id, f.firmado_at]));

      const alumnos = (alumnosEncuadre || []).map((ae: any) => ({
        nombre: ae.usuarios?.nombre || ae.usuarios?.correo || "",
        firmado: firmasMap.has(ae.alumno_id),
        fecha: firmasMap.get(ae.alumno_id) || null,
      }));

      // ── Verificar campos incompletos ──────────────────────────
const camposVacios: string[] = [];

if (!programa?.competencia?.trim()) camposVacios.push("Competencia del curso");
if (!unidades || unidades.length === 0) camposVacios.push("Plan de clases (sin unidades)");
if (!criterios || criterios.length === 0) camposVacios.push("Criterios de evaluación");
if (!encuadre.derecho_ordinario?.trim()) camposVacios.push("Derecho examen ordinario");
if (!encuadre.derecho_extraordinario?.trim()) camposVacios.push("Derecho examen extraordinario");
if (!encuadre.normas_conducta?.trim()) camposVacios.push("Normas de conducta");

if (camposVacios.length > 0) {
  const lista = camposVacios.map(c => `• ${c}`).join("\n");
  const continuar = window.confirm(
    `Los siguientes campos están vacíos o incompletos:\n\n${lista}\n\n¿Deseas imprimir de todas formas?`
  );
  if (!continuar) {
    setLoading(false);
    return;
  }
}
// ─────────────────────────────────────────────────────────

      // ── Helpers ──────────────────────────────────────────────
      const semestre = encuadre.periodo || "";

      const esc = (s: string) =>
        (s || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br/>");

      const formatSemana = (i?: number | null, f?: number | null) => {
        if (!i && !f) return "-";
        if (i === f) return `Semana ${i}`;
        return `Semanas ${i} &ndash; ${f}`;
      };

      const totalPct = (criterios || []).reduce((s: number, c: any) => s + (c.valor || 0), 0);

      // ── Filas plan de clases ──────────────────────────────────
      const planRows = (unidades || []).map((u: any) => `
        <tr>
          <td class="td" style="width:20%">Unidad ${u.numero}</td>
          <td class="td" style="width:60%;white-space:pre-wrap">${esc(u.nombre || "")}${u.contenido ? ` &mdash; ${esc(u.contenido)}` : ""}</td>
          <td class="td" style="width:20%">${formatSemana(u.semana_inicio, u.semana_fin)}</td>
        </tr>`).join("") ||
        `<tr><td class="td" colspan="3" style="text-align:center">Sin unidades registradas</td></tr>`;

      // ── Filas criterios ───────────────────────────────────────
      const criteriosRows = (criterios || []).map((c: any) => `
        <tr>
          <td class="td">${esc(c.criterio)}</td>
          <td class="td" style="text-align:center">${c.valor}%</td>
          <td class="td">${esc(c.descripcion || "")}</td>
        </tr>`).join("") ||
        `<tr><td class="td" colspan="3" style="text-align:center">Sin criterios registrados</td></tr>`;

      // ── Páginas de firmas ─────────────────────────────────────
      const SLOTS = 25;
      const totalSlots = Math.max(alumnos.length, SLOTS);
      const numPaginas = Math.ceil(totalSlots / SLOTS);

      const paginasFirmas = Array.from({ length: numPaginas }, (_, pi) => {
        const filas = Array.from({ length: SLOTS }, (__, j) => {
          const num = pi * SLOTS + j + 1;
          const alumno = alumnos[pi * SLOTS + j];
          const nombre = alumno ? esc(alumno.nombre) : "";
          const firma = alumno?.firmado
            ? `Firmado digitalmente${alumno.fecha ? " &mdash; " + new Date(alumno.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : ""}`
            : "";
          return `
            <tr>
              <td class="td" style="width:8%;text-align:center">${num}</td>
              <td class="td" style="width:46%">${nombre}</td>
              <td class="td" style="width:46%">${firma}</td>
            </tr>`;
        }).join("");

        return `
          <div class="page">
            ${header(semestre)}
            <table class="tbl" style="margin-bottom:10px">
              <tr>
                <td class="td-gray" style="width:50%"><b>UNIDAD DE APRENDIZAJE</b></td>
                <td class="td-gray" style="width:20%"><b>CLAVE</b></td>
                <td class="td-gray" style="width:30%"><b>GRUPO:</b></td>
              </tr>
              <tr>
                <td class="td">${esc(materia?.nombre_materia || "")}</td>
                <td class="td">${esc(materia?.clave || "")}</td>
                <td class="td">${esc(encuadre.grupo || "")}</td>
              </tr>
              <tr>
                <td class="td-gray" colspan="3"><b>NOMBRE DEL DOCENTE</b></td>
              </tr>
              <tr>
                <td class="td" colspan="2">${esc(docente?.nombre || "")}</td>
                <td class="td"><b>Fecha:</b> ____________________</td>
              </tr>
            </table>
            <p class="parrafo">Se me ha informado sobre los temas que se impartirán en el curso, el plan de clases, los criterios de evaluación y las normas dentro del salón de clases.</p>
            <table class="tbl">
              <thead>
                <tr>
                  <th class="th" style="width:8%;text-align:center">No.</th>
                  <th class="th" style="width:46%">Nombre del estudiante</th>
                  <th class="th" style="width:46%">Firma / Confirmación digital</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </div>`;
      }).join("");

      function header(sem: string) {
        return `
          <div class="header">
            <p class="h-inst">UNIVERSIDAD AUTÓNOMA DE BAJA CALIFORNIA</p>
            <p class="h-fac">FACULTAD DE CIENCIAS QUÍMICAS E INGENIERIA</p>
            <p class="h-sem">ENCUADRE DEL SEMESTRE ${esc(sem)}</p>
          </div>`;
      }

      // ── HTML completo ─────────────────────────────────────────
      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Encuadre</title>
  <style>
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
    }
    .page {
      width: 100%;
      padding: 15mm 16mm 12mm 16mm;
      page-break-after: always;
    }
    .page:last-child { page-break-after: avoid; }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .h-inst {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .h-fac {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      text-transform: uppercase;
    }
    .h-sem {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      font-weight: bold;
      margin-top: 2px;
    }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      font-family: Arial, sans-serif;
      font-size: 10pt;
      margin-bottom: 10px;
    }
    .td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: top;
    }
    .td-gray {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: top;
      background-color: #d9d9d9;
    }
    .th {
      border: 1px solid #000;
      padding: 4px 6px;
      text-align: left;
      font-weight: bold;
      background-color: #d9d9d9;
    }
    .td-total {
      border: 1px solid #000;
      padding: 4px 6px;
      font-weight: bold;
      background-color: #d9d9d9;
    }
    .sec {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 3px 0;
      margin: 14px 0 6px 0;
    }
    .sub {
      font-family: "Times New Roman", Times, serif;
      font-size: 10pt;
      font-style: italic;
      margin-bottom: 4px;
    }
    .parrafo {
      font-family: "Times New Roman", Times, serif;
      font-size: 10pt;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    .txt {
      border: 1px solid #000;
      padding: 6px 8px;
      min-height: 36px;
      font-family: "Times New Roman", Times, serif;
      font-size: 10pt;
      line-height: 1.5;
      white-space: pre-wrap;
      margin-bottom: 8px;
    }
    .lbl {
      font-family: "Times New Roman", Times, serif;
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }
    .col-lbl {
      font-family: "Times New Roman", Times, serif;
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 3px;
    }
    @media print {
      @page { size: Letter; margin: 0; }
      body { margin: 0; }
    }
  </style>
</head>
<body>

<!-- PÁGINA 1 -->
<div class="page">
  ${header(semestre)}
  <table class="tbl">
    <tr>
      <td class="td-gray" style="width:42%"><b>UNIDAD DE APRENDIZAJE (ASIGNATURA)</b></td>
      <td class="td-gray" style="width:18%"><b>CLAVE</b></td>
      <td class="td-gray" style="width:22%"><b>GRUPO</b></td>
      <td class="td-gray" style="width:18%"><b>SECCIÓN</b></td>
    </tr>
    <tr>
      <td class="td">${esc(materia?.nombre_materia || "")}</td>
      <td class="td">${esc(materia?.clave || "")}</td>
      <td class="td">${esc(encuadre.grupo || "")}</td>
      <td class="td">&nbsp;</td>
    </tr>
    <tr>
      <td class="td-gray" colspan="4"><b>NOMBRE DEL DOCENTE</b></td>
    </tr>
    <tr>
      <td class="td" colspan="4">${esc(docente?.nombre || "")}</td>
    </tr>
  </table>

  <div class="sec">Plan de Clases</div>
  <p class="lbl">COMPETENCIA DEL CURSO:</p>
  <div class="txt">${esc(programa?.competencia || "Sin competencia registrada.")}</div>

  <table class="tbl">
    <thead>
      <tr>
        <th class="th" style="width:20%">UNIDAD DEL PUA</th>
        <th class="th" style="width:60%">TEMA</th>
        <th class="th" style="width:20%">SEMANA</th>
      </tr>
    </thead>
    <tbody>${planRows}</tbody>
  </table>
</div>

<!-- PÁGINA 2 -->
<div class="page">
  ${header(semestre)}
  <div class="sec">Evaluación de Curso</div>
  <p class="sub">Descripción detallada de cómo se evaluará el curso. Asignar valor a cada actividad.</p>
  ${encuadre.descripcion_evaluacion ? `<div class="txt">${esc(encuadre.descripcion_evaluacion)}</div>` : ""}
  <table class="tbl" style="margin-bottom:14px">
    <thead>
      <tr>
        <th class="th" style="width:38%">CRITERIO</th>
        <th class="th" style="width:14%;text-align:center">VALOR</th>
        <th class="th" style="width:48%">DESCRIPCIÓN</th>
      </tr>
    </thead>
    <tbody>
      ${criteriosRows}
      <tr>
        <td class="td-total">Total</td>
        <td class="td-total" style="text-align:center">${totalPct}%</td>
        <td class="td-total"></td>
      </tr>
    </tbody>
  </table>

  <div class="sec">Derecho Examen Ordinario y Extraordinario</div>
  <p class="sub">Detallar claramente los criterios para exentar el examen ordinario.</p>
  <div class="two-col">
    <div>
      <p class="col-lbl">Ordinario</p>
      <div class="txt">${esc(encuadre.derecho_ordinario || "")}</div>
    </div>
    <div>
      <p class="col-lbl">Extraordinario</p>
      <div class="txt">${esc(encuadre.derecho_extraordinario || "")}</div>
    </div>
  </div>

  <div class="sec">Descripción de Producto o Evidencia de Desempeño</div>
  <p class="sub">En caso de existir rúbrica del trabajo final, incluirla en este apartado.</p>
  <div class="txt">${esc(encuadre.descripcion_producto || "")}</div>

  <div class="sec">Bibliografía, Referencias y Recurso de la Red</div>
  <div class="txt">${esc(encuadre.bibliografia_basica || "")}</div>

  <div class="sec">Normas de Conducta dentro del Salón de Clases</div>
  <p class="sub">Describir las reglas de conducta, retardos, uso de celular, alimentos, etc.</p>
  <div class="txt">${esc(encuadre.normas_conducta || "")}</div>
</div>

<!-- PÁGINAS DE FIRMAS -->
${paginasFirmas}

</body>
</html>`;

      // ── Imprimir via iframe oculto (sin abrir ventana nueva) ──
      const iframeId = "print-frame-encuadre";

      // Eliminar iframe previo si existe
      const prevIframe = document.getElementById(iframeId);
      if (prevIframe) prevIframe.remove();

      const iframe = document.createElement("iframe");
      iframe.id = iframeId;
      iframe.style.position = "fixed";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) { setLoading(false); return; }

      doc.open();
      doc.write(html);
      doc.close();

      // Esperar a que cargue el contenido antes de imprimir
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Limpiar iframe después de imprimir
          setTimeout(() => iframe.remove(), 1000);
        }, 300);
      };

    } catch (err) {
      console.error("Error al generar impresión:", err);
    }

    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={loading || !encuadreId}
      className="cursor-pointer"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      {loading ? "Generando..." : "Imprimir encuadre"}
    </Button>
  );
}