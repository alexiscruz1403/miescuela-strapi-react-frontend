// src/resources/asistencias/generarReportePDF.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoOficial from "../../assets/img/logo_oficial.png";

/**
 * Genera el reporte PDF de asistencias (curso o alumno)
 * @param {"curso"|"alumno"} params.tipo
 * @param {Array<{id:number|string,name:string}>} params.cursos
 * @param {number|string} params.cursoId
 * @param {string} params.alumno
 * @param {string} params.desde  // YYYY-MM-DD
 * @param {string} params.hasta  // YYYY-MM-DD
 * @param {{pctAsistencia:number,pctTardanzas:number,pctAusJust:number,pctAusNoJust:number,totalClases:number}} params.metrics
 * @param {Array<Object>} params.rows
 * @param {(rows:Array)=>{fechas:string[],filas:Array<{alumno:string,byDate:Record<string,string>}>}} [params.buildMatrix]
 */
export async function generarReportePDF({
  tipo,
  cursos = [],
  cursoId,
  alumno = "",
  desde,
  hasta,
  metrics,
  rows = [],
  buildMatrix, // opcional
}) {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // ——— Encabezado institucional (logo) ———
    try {
      const resp = await fetch(logoOficial);
      const blob = await resp.blob();
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, "PNG", 14, 10, 22, 22, undefined, "FAST");
    } catch (e) {
      console.warn("No se pudo cargar el logo institucional:", e);
    }

    // ——— Identificación del curso (segura) ———
    const curso =
      Array.isArray(cursos) &&
      cursos.find((c) => String(c.id) === String(cursoId));
    const cursoNombre = curso?.name || `Curso ID ${cursoId ?? "—"}`;

    // ——— Encabezados ———
    doc.setFontSize(16);
    doc.text("MiEscuela 4.0", 40, 20);
    doc.setFontSize(12);
    doc.text("Reporte de Asistencias", 40, 27);

    doc.setFontSize(10);
    doc.text(`Período: ${formatearFecha(desde)} al ${formatearFecha(hasta)}`, 14, 40);
    doc.text(`Curso: ${cursoNombre}`, 14, 45);
    if (tipo === "alumno") {
      doc.text(`Alumno: ${alumno || "—"}`, 14, 50);
    }

    // ——— Métricas (cards resumidas) ———
    const yCards = tipo === "alumno" ? 58 : 54;
    const resumen = [
      ["% Asistencia", safePct(metrics?.pctAsistencia)],
      ["% Tardanzas", safePct(metrics?.pctTardanzas)],
      ["% Aus. Just.", safePct(metrics?.pctAusJust)],
      ["% Aus. No Just.", safePct(metrics?.pctAusNoJust)],
      ["Clases registradas", String(metrics?.totalClases ?? "—")],
    ];

    autoTable(doc, {
      startY: yCards,
      head: [["Indicador", "Valor"]],
      body: resumen,
      styles: { fontSize: 10, halign: "center" },
      headStyles: { fillColor: [43, 62, 76], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 0: { cellWidth: 70 } },
    });

    let y = doc.lastAutoTable.finalY + 6;

    // ——— Planilla analítica ———
    if (tipo === "curso") {
      // Si hay buildMatrix, usamos la planilla alumno×fecha×estado
      if (typeof buildMatrix === "function") {
        const matrix = buildMatrix(rows);
        const fechas = (matrix?.fechas ?? []).sort((a, b) => a.localeCompare(b));
        const filas = Array.isArray(matrix?.filas) ? matrix.filas : [];

        const head = ["Alumno", ...fechas.map((f) => formatearFecha(f))];
        const body = filas.map((f) => [
          f.alumno || "—",
          ...fechas.map((d) => (f.byDate?.[d] ? abreviarEstado(f.byDate[d]) : "—")),
        ]);

        autoTable(doc, {
          startY: y,
          head: [head],
          body,
          styles: { fontSize: 8, cellPadding: 1, halign: "center" },
          headStyles: { fillColor: [227, 242, 253], textColor: 0 },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 45, halign: "left" } },
          didDrawPage: (data) => {
            // header/footers ya están más abajo, acá no hace falta repetir
          },
        });

        y = doc.lastAutoTable.finalY + 6;
      } else {
        // Fallback simple si no hay buildMatrix: tabla lineal fecha/alumno/estado
        autoTable(doc, {
          startY: y,
          head: [["Fecha", "Alumno", "Estado"]],
          body: rows
            .slice()
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .map((r) => [
              formatearFecha(r.fecha),
              r.alumno_nombre || "—",
              r.estado_nombre || "—",
            ]),
          styles: { fontSize: 9, halign: "center" },
          headStyles: { fillColor: [227, 242, 253], textColor: 0 },
          columnStyles: { 1: { halign: "left" } },
        });

        y = doc.lastAutoTable.finalY + 6;
      }

      doc.setFontSize(9);
      doc.text(
        "Notas: Los porcentajes consideran únicamente los días con asistencia registrada. Los días sin registro quedan excluidos.",
        14,
        y
      );
      y += 5;
      doc.text(
        "Estados abreviados en planilla: Pres.=Presente, Tarde=Tarde, Just.=Aus. Justificado, Aus.=Aus. No Justificado.",
        14,
        y
      );
    }

    if (tipo === "alumno") {
      // Tabla simple: evolución por fecha del alumno
      const registros = rows
        .map((r) => ({ fecha: r.fecha, estado: r.estado_nombre || "—" }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

      autoTable(doc, {
        startY: y,
        head: [["Fecha", "Estado"]],
        body: registros.map((r) => [formatearFecha(r.fecha), r.estado]),
        styles: { fontSize: 9, halign: "center" },
        headStyles: { fillColor: [227, 242, 253], textColor: 0 },
      });

      y = doc.lastAutoTable.finalY + 6;

      doc.setFontSize(9);
      doc.text(
        "Notas: La evolución refleja únicamente días con registro de asistencia.",
        14,
        y
      );
      y += 5;
      doc.text(
        "Estados: Presente, Tarde, Ausente, Ausente justificado.",
        14,
        y
      );
    }

    // ——— Pie de página con numeración ———
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generado por MiEscuela 4.0 — ${formatearFecha(new Date().toISOString())}`,
        14,
        287
      );
      doc.text(`Página ${i} de ${pageCount}`, 180, 287, { align: "right" });
    }

    const archivo =
      tipo === "alumno"
        ? `Asistencia_${(alumno || "Alumno").replace(/\s+/g, "_")}_${desde}_${hasta}.pdf`
        : `Asistencia_Curso_${cursoNombre.replace(/\s+/g, "_")}_${desde}_${hasta}.pdf`;

    doc.save(archivo);
  } catch (err) {
    console.error("Error generando reporte PDF:", err);
  }
}

// ——— Helpers ———
function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";
  const d = new Date(fechaISO);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function safePct(n) {
  const v = Number(n);
  if (!isFinite(v)) return "0%";
  return `${Math.round(v * 100) / 100}%`;
}

function abreviarEstado(s = "") {
  const t = s.toLowerCase();
  if (t.includes("pres")) return "Pres.";
  if (t.includes("tarde")) return "Tarde";
  if (t.includes("just")) return "Just.";
  if (t.includes("aus")) return "Aus.";
  return s || "—";
}
