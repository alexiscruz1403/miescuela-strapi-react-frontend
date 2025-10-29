import { jsPDF } from "jspdf";
import logoOficial from "../../assets/img/logo_oficial.png";

export async function generarReportePDF({ curso = null, alumno = null, materia = null, informes = [] }) {
    try{
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margenIzq = 15;
        const margenDer = 15;
        const margenSup = 15;
        const margenInf = 15;
        const anchoUtil = 210 - margenIzq - margenDer;
        const altoPagina = 297;

        let y = 20; // posición vertical actual

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

        // ——— Encabezados ———
        doc.setFontSize(16);
        doc.text("MiEscuela 4.0", 40, y);
        y += 7;
        doc.setFontSize(12);
        doc.text("Reporte de Calificaciones", 40, y);
        y += 13;

        doc.setFontSize(12);
        doc.text(`Alumno: ${alumno.usuario.apellido} ${alumno.usuario.nombre}`, margenIzq, y);
        y += 5;
        doc.text(`Curso: ${curso.name}`, margenIzq, y);
        y += 5;
        if (materia) {
        doc.text(`Materia: ${materia.nombre}`, margenIzq, y);
        y += 5;
        }

        y += 5; // espacio antes de los informes

        // ——— Lista de informes ———
        for (const [index, informe] of informes.entries()) {
            // Verificar salto de página
            if (y > altoPagina - margenInf - 40) {
                doc.addPage();
                y = margenSup;
            }
            console.log(informe);
            doc.setFontSize(14);
            doc.setFont(undefined, "bold");
            const title = materia ? `Fecha: ${informe.fecha}` : `Fecha: ${informe.fecha} - ${informe.materia}`;
            doc.text(title, margenIzq, y);
            y += 7;

            doc.setFontSize(12);
            doc.setFont(undefined, "normal");

            // Ajustar texto largo al ancho disponible
            const splitContenido = doc.splitTextToSize(informe.contenido, anchoUtil);
            doc.text(splitContenido, margenIzq, y);

            // Calcular espacio usado
            const fontSize = doc.internal.getFontSize();
            const lineHeight = fontSize * 0.35; // aproximado
            const altoContenido = splitContenido.length * lineHeight;

            y += altoContenido + 5;

            // Asesor pedagógico
            doc.setFontSize(10);
            doc.text(`Asesor pedagógico: ${informe.asesorPedagogico}`, margenIzq, y);
            y += 10; // espacio entre informes
        }


        // ——— Guardar PDF ———
        const fileNameParts = ["Reporte_Informes_Pedagogicos"];
        fileNameParts.push(`Alumno_${alumno.usuario.apellido}_${alumno.usuario.nombre}`);
        fileNameParts.push(`Curso_${curso.name}`);
        if(materia) fileNameParts.push(`Materia_${materia.nombre.replace(/\s+/g, "_")}`);
        const fileName = fileNameParts.join("_") + ".pdf";
        doc.save(fileName);
    }catch(error){
        console.error("Error generando reporte PDF de informes pedagógicos:", error);
    }
}

// Genera un PDF a partir de un texto de informe (ej: generado por IA)
export async function generarReportePDFIA({ curso = null, alumno = null, materia = null, texto = '' }) {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Márgenes y medidas básicas
    const margenIzq = 15;
    const margenDer = 15;
    const margenSup = 15;
    const margenInf = 15;
    const anchoUtil = 210 - margenIzq - margenDer;
    const altoPagina = 297;

    let y = 20;

    // Fuente base
    doc.setFont("helvetica", "normal");

    // Logo institucional
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

    // Encabezados
    doc.setFontSize(16);
    doc.text("MiEscuela 4.0", 40, y);
    y += 7;

    doc.setFontSize(12);
    doc.text("Informe Pedagógico (IA)", 40, y);
    y += 13;

    doc.setFontSize(12);
    if (alumno?.usuario) {
      doc.text(`Alumno: ${alumno.usuario.apellido} ${alumno.usuario.nombre}`, margenIzq, y);
      y += 5;
    }
    if (curso?.name) {
      doc.text(`Curso: ${curso.name}`, margenIzq, y);
      y += 5;
    }
    if (materia?.nombre) {
      doc.text(`Materia: ${materia.nombre}`, margenIzq, y);
      y += 5;
    }

    y += 5;

    // Contenido principal del informe
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");

    // Separar texto por párrafos dobles y limpiar espacios vacíos
    const parrafos = (texto || "")
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    for (const p of parrafos) {
      const lines = doc.splitTextToSize(p, anchoUtil);

      // Cálculo de altura (mismo que antes)
      const fontSize = doc.internal.getFontSize();
      const lineHeight = fontSize * 0.35; // mantener ancho original
      const altoContenido = lines.length * lineHeight;

      // Control de salto de página
      if (y + altoContenido > altoPagina - margenInf) {
        doc.addPage();
        y = margenSup;
      }

      // Escribir texto del párrafo
      doc.text(lines, margenIzq, y);

      // 🔹 Espaciado ajustado: evita solapamiento pero mantiene formato original
      y += altoContenido + 8;
    }

    // Guardar PDF
    const fileNameParts = ["Informe_Pedagogico_IA"];
    if (alumno?.usuario)
      fileNameParts.push(`Alumno_${alumno.usuario.apellido}_${alumno.usuario.nombre}`);
    if (curso?.name) fileNameParts.push(`Curso_${curso.name}`);
    if (materia?.nombre)
      fileNameParts.push(`Materia_${materia.nombre.replace(/\s+/g, "_")}`);
    const fileName = fileNameParts.join("_") + ".pdf";

    doc.save(fileName);
  } catch (error) {
    console.error("Error generando reporte PDF IA:", error);
  }
}
