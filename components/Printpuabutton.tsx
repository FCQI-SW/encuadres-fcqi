"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
import { useConfirm } from "@/components/global-confirm-modal";

type Props = { programaId: string };
type AnyRecord = Record<string, any>;

export default function PrintPuaButton({ programaId }: Props) {
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  const handlePrint = async () => {
    if (!programaId) return;
    setLoading(true);

    try {
      const { data: programa, error: programaError } = await supabase
        .from("programas").select("*").eq("id", programaId).single();

      if (programaError || !programa) { setLoading(false); return; }

      const [
        { data: materia },
        { data: unidades },
        { data: practicasTaller },
        { data: practicasLab },
        { data: encuadresBase },
      ] = await Promise.all([
        supabase.from("materias").select("clave, nombre_materia").eq("id", programa.materia_id).single(),
        supabase.from("unidades").select("numero, nombre, competencia, contenido, duracion").eq("programa_id", programaId).order("numero", { ascending: true }),
        supabase.from("practicas_taller").select("unidad, numero, competencia, descripcion, material_apoyo, duracion").eq("programa_id", programaId).order("unidad", { ascending: true }).order("numero", { ascending: true }),
        supabase.from("practicas_laboratorio").select("unidad, numero, competencia, descripcion, material_apoyo, duracion").eq("programa_id", programaId).order("unidad", { ascending: true }).order("numero", { ascending: true }),
        supabase.from("encuadres").select("id").eq("programa_id", programaId).limit(1),
      ]);

      // Obtener criterios del primer encuadre
      let criteriosData: AnyRecord[] = [];
      if (encuadresBase && encuadresBase.length > 0) {
        const encuadreId = encuadresBase[0].id;
        const { data: criterios } = await supabase
          .from("criterios_evaluacion")
          .select("criterio, valor, descripcion")
          .eq("encuadre_id", encuadreId)
          .order("id", { ascending: true });
        criteriosData = criterios || [];
      }

      // ── Advertencia si hay campos incompletos ─────────────────
      const camposVacios: string[] = [];
      if (!String(programa.proposito ?? "").trim()) camposVacios.push("Propósito de la UA");
      if (!String(programa.competencia ?? "").trim()) camposVacios.push("Competencia de la UA");
      if (!String(programa.evidencias ?? "").trim()) camposVacios.push("Evidencias de desempeño");
      if (!unidades || unidades.length === 0) camposVacios.push("Desarrollo por unidades");

      if (camposVacios.length > 0) {
        const continuar = await confirm({
          title: "Documento incompleto",
          message: "Algunos campos no han sido llenados. El documento puede salir incompleto. ¿Deseas imprimir de todas formas?",
          confirmText: "Sí, imprimir",
          cancelText: "Cancelar",
        });
        if (!continuar) { setLoading(false); return; }
      }
      // ─────────────────────────────────────────────────────────

      // ── Helpers ───────────────────────────────────────────────
      const esc = (v: unknown) =>
        String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const nl = (v: unknown) => esc(v).replace(/\r?\n/g, "<br/>");

      const has = (v: unknown) => String(v ?? "").trim().length > 0;

      const fmtHour = (v: unknown) => {
        const s = String(v ?? "").trim();
        if (!s) return "00";
        return /^\d+$/.test(s) ? s.padStart(2, "0") : s;
      };

      const toRoman = (v: unknown) => {
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) return String(v ?? "");
        const r: [number, string][] = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
        let num = Math.floor(n), res = "";
        for (const [a, s] of r) { while (num >= a) { res += s; num -= a; } }
        return res;
      };

      const renderContenido = (v: unknown): string => {
        const text = String(v ?? "").trim();
        if (!text) return "";
        return text.split(/\r?\n/).map((line) => {
          const t = line.trim();
          if (!t) return "<div style='height:4px'></div>";
          const m = t.match(/^(\d+(?:\.\d+)*)[.\s]/);
          const depth = m ? m[1].split(".").length - 1 : 0;
          return `<div style="margin-left:${depth * 20}px;line-height:1.3;margin-bottom:1px">${esc(t)}</div>`;
        }).join("");
      };

      const unidadesData = Array.isArray(unidades) ? unidades : [];
      const tallerData = Array.isArray(practicasTaller) ? practicasTaller : [];
      const labData = Array.isArray(practicasLab) ? practicasLab : [];

      const pageStart = Math.max(1, Number(programa.pagina_inicio_pdf ?? 1) || 1);
      const selloUrl = String(programa.sello_url ?? "").trim();
      const firmaDisenoUrl = String(programa.firma_diseno_url ?? "").trim();
      const firmaVoBoUrl = String(programa.firma_vobo_url ?? "").trim();
      const fechaPua = String(programa.fecha ?? programa.fecha_aprobacion ?? "").trim();
      const equipoDiseno = String(programa.equipo_diseno_pua ?? programa.equipo_diseno ?? "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const subdirectores = String(programa.vobo_subdirectores ?? programa.subdirectores ?? "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      const totalPct = criteriosData.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);

      // ── Encabezado institucional ──────────────────────────────
      const HEADER = `
        <div class="inst-header">
          <div class="inst-uabc">UNIVERSIDAD AUTÓNOMA DE BAJA CALIFORNIA</div>
          <div class="inst-coord">COORDINACIÓN GENERAL DE FORMACIÓN BÁSICA</div>
          <div class="inst-coord">COORDINACIÓN GENERAL DE FORMACIÓN PROFESIONAL Y VINCULACIÓN UNIVERSITARIA</div>
          <div class="inst-pua">PROGRAMA DE UNIDAD DE APRENDIZAJE</div>
        </div>`;

      const box = (title: string, body: string) => `
        <div class="sec-box">
          <div class="sec-box-title">${esc(title)}</div>
          <div class="sec-box-body">${body}</div>
        </div>`;

      // ── PÁGINA 1: Portada ─────────────────────────────────────
      function renderCoverPage() {
        const hasFooter = equipoDiseno.length > 0 || subdirectores.length > 0 || has(fechaPua);
        return `
          ${HEADER}
          <div class="id-box">
            <div class="id-box-title">I. DATOS DE IDENTIFICACIÓN</div>
            <div class="id-box-body">
              ${has(selloUrl) ? `<div class="cover-stamp"><img src="${esc(selloUrl)}" alt="Sello"/></div>` : ""}
              <div class="id-line"><span class="id-lbl">1. Unidad Académica</span><span class="id-val">${nl(programa.unidad_academica)}</span></div>
              <div class="id-line"><span class="id-lbl">2. Programa Educativo:</span><span class="id-val">${nl(programa.programa_educativo)}</span></div>
              <div class="id-line"><span class="id-lbl">3. Plan de Estudios:</span><span class="id-val">${nl(programa.plan_estudios)}</span></div>
              <div class="id-line"><span class="id-lbl">4. Nombre de la Unidad de Aprendizaje:</span><span class="id-val">${nl(materia?.nombre_materia)}</span></div>
              <div class="id-line"><span class="id-lbl">5. Clave:</span><span class="id-val">${nl(materia?.clave)}</span></div>
              <div class="id-line hours-line">
                <span class="id-lbl">6. HC:</span> <span class="hv">${fmtHour(programa.hc)}</span>&nbsp;&nbsp;
                <span class="id-lbl">HL:</span> <span class="hv">${fmtHour(programa.hl)}</span>&nbsp;&nbsp;
                <span class="id-lbl">HT:</span> <span class="hv">${fmtHour(programa.ht)}</span>&nbsp;&nbsp;
                <span class="id-lbl">HPC:</span> <span class="hv">${fmtHour(programa.hpc)}</span>&nbsp;&nbsp;
                <span class="id-lbl">HCL:</span> <span class="hv">${fmtHour(programa.hcl)}</span>&nbsp;&nbsp;
                <span class="id-lbl">HE:</span> <span class="hv">${fmtHour(programa.he)}</span>&nbsp;&nbsp;
                <span class="id-lbl">CR:</span> <span class="hv">${fmtHour(programa.cr)}</span>
              </div>
              <div class="id-line"><span class="id-lbl">7. Etapa de Formación a la que Pertenece:</span><span class="id-val">${nl(programa.etapa_formacion)}</span></div>
              <div class="id-line"><span class="id-lbl">8. Carácter de la Unidad de Aprendizaje:</span><span class="id-val">${nl(programa.caracter_ua)}</span></div>
              <div class="id-line"><span class="id-lbl">9. Requisitos para Cursar la Unidad de Aprendizaje:</span><span class="id-val">${has(programa.requisitos) ? nl(programa.requisitos) : "Ninguno"}</span></div>
            </div>
          </div>
          ${hasFooter ? `
            <div class="cover-sigs">
              <div>
                <div class="sig-head">Equipo de diseño de PUA</div>
                <div class="sig-names">${equipoDiseno.map(n => `<div>${esc(n)}</div>`).join("")}</div>
                ${has(fechaPua) ? `<div style="margin-top:8px"><strong>Fecha:</strong> ${nl(fechaPua)}</div>` : ""}
              </div>
              <div style="text-align:center">
                <div class="sig-head">Firma</div>
                ${has(firmaDisenoUrl) ? `<img class="sig-img" src="${esc(firmaDisenoUrl)}" alt="Firma"/>` : `<div class="sig-line"></div>`}
              </div>
              <div>
                <div class="sig-head">Vo.Bo. de Subdirectores de<br/>Unidades Académicas</div>
                <div class="sig-names">${subdirectores.map(n => `<div>${esc(n)}</div>`).join("")}</div>
              </div>
              <div style="text-align:center">
                <div class="sig-head">Firma</div>
                ${has(firmaVoBoUrl) ? `<img class="sig-img" src="${esc(firmaVoBoUrl)}" alt="Firma"/>` : `<div class="sig-line"></div>`}
              </div>
            </div>` : ""}`;
      }

      // ── PÁGINA 2: Propósito, Competencia, Evidencias ──────────
      function renderSecondPage() {
        return `
          ${HEADER}
          ${box("II. PROPÓSITO DE LA UNIDAD DE APRENDIZAJE", `<p class="body-text">${nl(programa.proposito)}</p>`)}
          ${box("III.  COMPETENCIA DE LA UNIDAD DE APRENDIZAJE", `<p class="body-text">${nl(programa.competencia)}</p>`)}
          ${box("IV.  EVIDENCIA(S) DE DESEMPEÑO", `<p class="body-text">${nl(programa.evidencias)}</p>`)}`;
      }

      // ── PÁGINAS DE UNIDADES ───────────────────────────────────
      function renderUnitsPages(): string[] {
        return unidadesData.map((u: AnyRecord, idx: number) => {
          const unitTitle = `UNIDAD ${toRoman(u.numero)}. ${esc(u.nombre ?? "")}`;
          return `
            ${HEADER}
            ${idx === 0 ? `
              <div class="sec-box" style="margin-bottom:0;border-bottom:none">
                <div class="sec-box-title" style="border-bottom:none">V. DESARROLLO POR UNIDADES</div>
              </div>` : ""}
            <div class="unit-box">
              <div class="unit-box-title">${unitTitle}</div>
              <div class="unit-competencia">
                <p class="field-bold">Competencia:</p>
                <p class="body-text">${nl(u.competencia)}</p>
              </div>
              <div class="unit-contenido">
                <div class="contenido-header">
                  <span class="field-bold">Contenido:</span>
                  <span class="field-bold">Duración: ${has(u.duracion) ? esc(u.duracion) + " horas" : ""}</span>
                </div>
                <div class="contenido-items">${renderContenido(u.contenido)}</div>
              </div>
            </div>`;
        });
      }

      // ── TABLAS DE PRÁCTICAS ───────────────────────────────────
      function renderPracticeTable(secNum: string, title: string, practices: AnyRecord[]): string {
        if (!practices || practices.length === 0) return "";

        const grupos = new Map<string, AnyRecord[]>();
        practices.forEach((p) => {
          const key = String(p?.unidad ?? "");
          if (!grupos.has(key)) grupos.set(key, []);
          grupos.get(key)!.push(p);
        });

        const rows = Array.from(grupos.entries()).map(([unidadNum, items]) => {
          let i = 0;
          const filas: string[] = [];
          while (i < items.length) {
            const p = items[i];
            let span = 1;
            while (i + span < items.length && items[i + span].competencia === p.competencia) span++;

            filas.push(`
              <tr>
                <td class="ptd center">${esc(p.numero ?? "")}</td>
                ${span > 1
                  ? `<td class="ptd" rowspan="${span}" style="vertical-align:top">${nl(p.competencia)}</td>`
                  : `<td class="ptd">${nl(p.competencia)}</td>`}
                <td class="ptd">${nl(p.descripcion)}</td>
                <td class="ptd">${nl(p.material_apoyo)}</td>
                <td class="ptd center">${has(p.duracion) ? esc(p.duracion) + " horas" : ""}</td>
              </tr>`);

            for (let j = 1; j < span; j++) {
              const pp = items[i + j];
              filas.push(`
                <tr>
                  <td class="ptd center">${esc(pp.numero ?? "")}</td>
                  <td class="ptd">${nl(pp.descripcion)}</td>
                  <td class="ptd">${nl(pp.material_apoyo)}</td>
                  <td class="ptd center">${has(pp.duracion) ? esc(pp.duracion) + " horas" : ""}</td>
                </tr>`);
            }
            i += span;
          }

          return `
            <tr class="unit-row">
              <td colspan="5">UNIDAD ${toRoman(unidadNum)}</td>
            </tr>
            ${filas.join("")}`;
        }).join("");

        return `
          ${HEADER}
          <table class="ptable">
            <thead>
              <tr><th class="ptable-title" colspan="5">${secNum} ${title.toUpperCase()}</th></tr>
              <tr>
                <th class="pth center" style="width:8%">No. de<br/>Práctica</th>
                <th class="pth" style="width:26%">Competencia</th>
                <th class="pth" style="width:28%">Descripción</th>
                <th class="pth" style="width:28%">Material de Apoyo</th>
                <th class="pth center" style="width:10%">Duración</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>`;
      }

      // ── MÉTODO DE TRABAJO ─────────────────────────────────────
      function renderMethodPage(): string {
        return `
          ${HEADER}
          ${box("VII. MÉTODO DE TRABAJO", `
            ${has(programa.metodo_encuadre) ? `<p class="field-bold">Encuadre:</p><p class="body-text">${nl(programa.metodo_encuadre)}</p>` : ""}
            ${has(programa.metodo_estrategia_docente) ? `<p class="field-bold">Estrategia de enseñanza (docente)</p><p class="body-text">${nl(programa.metodo_estrategia_docente)}</p>` : ""}
            ${has(programa.metodo_estrategia_alumno) ? `<p class="field-bold">Estrategia de aprendizaje (alumno)</p><p class="body-text">${nl(programa.metodo_estrategia_alumno)}</p>` : ""}
          `)}`;
      }

      // ── CRITERIOS DE EVALUACIÓN ───────────────────────────────
      function renderEvaluationPage(): string {
        const criteriosRows = criteriosData.length > 0
          ? criteriosData.map(c => `
              <tr>
                <td class="ptd">${esc(c.criterio ?? "")}</td>
                <td class="ptd center">${esc(c.valor ?? "")}%</td>
                <td class="ptd">${esc(c.descripcion ?? "")}</td>
              </tr>`).join("") +
            `<tr>
              <td class="ptd" style="font-weight:bold">Total</td>
              <td class="ptd center" style="font-weight:bold">${totalPct}%</td>
              <td class="ptd"></td>
            </tr>`
          : `<tr><td class="ptd" colspan="3" style="text-align:center;color:#888">Sin criterios registrados</td></tr>`;

        return `
          ${HEADER}
          <table class="ptable">
            <thead>
              <tr><th class="ptable-title" colspan="3">VIII. CRITERIOS DE EVALUACIÓN</th></tr>
              <tr>
                <th class="pth" style="width:40%">Criterio</th>
                <th class="pth center" style="width:15%">Valor %</th>
                <th class="pth" style="width:45%">Descripción</th>
              </tr>
            </thead>
            <tbody>${criteriosRows}</tbody>
          </table>`;
      }

      // ── REFERENCIAS Y PERFIL ──────────────────────────────────
      function renderReferencesPage(): string {
        const refBasicas = String(programa.referencias_basicas ?? programa.bibliografia_basica ?? "");
        const refComp = String(programa.referencias_complementarias ?? programa.bibliografia_complementaria ?? "");
        return `
          ${HEADER}
          <table class="ptable" style="margin-bottom:12px">
            <thead>
              <tr><th class="ptable-title" colspan="2">IX. REFERENCIAS</th></tr>
              <tr>
                <th class="pth" style="width:50%">Básicas</th>
                <th class="pth" style="width:50%">Complementarias</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="ptd" style="vertical-align:top;white-space:pre-wrap">${nl(refBasicas)}</td>
                <td class="ptd" style="vertical-align:top;white-space:pre-wrap">${nl(refComp)}</td>
              </tr>
            </tbody>
          </table>
          ${box("X. PERFIL DEL DOCENTE", `<p class="body-text">${nl(programa.perfil_docente)}</p>`)}`;
      }

      // ── Ensamblar páginas ─────────────────────────────────────
      const pages: string[] = [];
      pages.push(renderCoverPage());
      pages.push(renderSecondPage());
      renderUnitsPages().forEach((p) => pages.push(p));
      if (tallerData.length > 0) pages.push(renderPracticeTable("VI.", "ESTRUCTURA DE LAS PRÁCTICAS DE TALLER", tallerData));
      if (labData.length > 0) pages.push(renderPracticeTable("VII.", "ESTRUCTURA DE LAS PRÁCTICAS DE LABORATORIO", labData));
      pages.push(renderMethodPage());
      pages.push(renderEvaluationPage());
      pages.push(renderReferencesPage());

      const allPages = pages.map((content, idx) => `
        <section class="sheet">
          ${content}
          <div class="page-num">${pageStart + idx}</div>
        </section>`).join("");

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>PUA &mdash; ${esc(materia?.clave ?? "")} ${esc(materia?.nombre_materia ?? "")}</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      margin: 0; padding: 0;
    }
    html, body { background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; }

    .sheet {
      position: relative; width: 216mm; min-height: 279mm;
      padding: 8mm 12mm 16mm 12mm; background: #fff;
      page-break-after: always; margin: 0 auto;
    }
    .sheet:last-child { page-break-after: auto; }
    .page-num { position: absolute; right: 12mm; bottom: 7mm; font-size: 11pt; }

    .inst-header { text-align: center; margin-bottom: 5mm; }
    .inst-uabc  { font-size: 21pt; font-weight: 900; text-transform: uppercase; line-height: 1.1; }
    .inst-coord { font-size: 11pt; font-weight: 700; text-transform: uppercase; line-height: 1.2; }
    .inst-pua   { font-size: 12pt; font-weight: 700; text-transform: uppercase; margin-top: 1px; }

    .id-box { border: 1px solid #000; margin-bottom: 6px; }
    .id-box-title { border-bottom: 1px solid #000; text-align: center; font-size: 12pt; font-weight: 700; padding: 5px 8px; text-transform: uppercase; }
    .id-box-body { position: relative; padding: 6px 10px 10px 10px; min-height: 280px; }
    .cover-stamp { position: absolute; right: 14px; top: 30px; width: 165px; }
    .cover-stamp img { max-width: 100%; max-height: 135px; object-fit: contain; }
    .id-line { font-size: 11.5pt; line-height: 1.35; margin-bottom: 7px; padding-right: 180px; }
    .hours-line { padding-right: 0; }
    .id-lbl { font-weight: 700; margin-right: 3px; }
    .hv { display: inline-block; text-decoration: underline; font-weight: 700; min-width: 18px; margin-right: 4px; }

    .cover-sigs { display: grid; grid-template-columns: 1.4fr 0.6fr 1.4fr 0.6fr; gap: 8px; align-items: start; margin-top: 8px; font-size: 10pt; }
    .sig-head { font-weight: 700; margin-bottom: 4px; line-height: 1.2; }
    .sig-names { line-height: 1.3; min-height: 60px; }
    .sig-img { max-width: 100%; max-height: 75px; object-fit: contain; }
    .sig-line { border-bottom: 1px solid #000; height: 50px; width: 100%; margin-top: 8px; }

    .sec-box { border: 1px solid #000; margin-bottom: 10px; }
    .sec-box-title { border-bottom: 1px solid #000; text-align: center; font-size: 11.5pt; font-weight: 700; text-transform: uppercase; padding: 6px 8px; }
    .sec-box-body { padding: 10px 12px 12px 12px; }

    .unit-box { border: 1px solid #000; margin-bottom: 10px; }
    .unit-box-title { border-bottom: 1px solid #000; text-align: center; font-size: 11.5pt; font-weight: 700; text-transform: uppercase; padding: 6px 8px; }
    .unit-competencia { border-bottom: 1px solid #000; padding: 8px 12px 10px 12px; }
    .unit-contenido { padding: 8px 12px 10px 12px; }
    .contenido-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .contenido-items { font-size: 11pt; line-height: 1.3; }

    .body-text { font-size: 11.5pt; line-height: 1.3; text-align: justify; margin-bottom: 4px; }
    .field-bold { font-size: 11pt; font-weight: 700; margin: 0 0 3px 0; display: block; }

    .ptable { width: 100%; border-collapse: collapse; font-size: 10.5pt; line-height: 1.2; margin-bottom: 8px; }
    .ptable-title { background-color: #d9d9d9; border: 1px solid #000; text-align: center; font-size: 11.5pt; font-weight: 700; padding: 6px 8px; text-transform: uppercase; }
    .pth { border: 1px solid #000; padding: 5px 6px; font-weight: 700; text-align: left; vertical-align: top; }
    .ptd { border: 1px solid #000; padding: 5px 6px; vertical-align: top; text-align: left; }
    .center { text-align: center; }
    .unit-row td { border: 1px solid #000; padding: 4px 6px; font-weight: 700; background-color: #fff; }

    @media print {
      @page { size: Letter; margin: 0; }
      html, body { width: 216mm; }
    }
  </style>
</head>
<body>${allPages}</body>
</html>`;

      const iframeId = "print-frame-pua";
      const prev = document.getElementById(iframeId);
      if (prev) prev.remove();

      const iframe = document.createElement("iframe");
      iframe.id = iframeId;
      iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) { setLoading(false); return; }
      doc.open(); doc.write(html); doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => iframe.remove(), 1500);
        }, 400);
      };

    } catch (err) {
      console.error("Error al generar impresión PUA:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}
      disabled={loading || !programaId} className="cursor-pointer">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
      {loading ? "Generando..." : "Imprimir PUA"}
    </Button>
  );
}