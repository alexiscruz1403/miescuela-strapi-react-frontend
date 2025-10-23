// src/resources/asistencias/AsistenciasHoy.jsx
import { useEffect, useState, useMemo } from "react";
import { useDataProvider } from "react-admin";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import Skeleton from "@mui/material/Skeleton";

import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

// ======================
// Función auxiliar: últimos 5 días hábiles
// ======================
const generarDiasHabilesAnteriores = () => {
  const hoy = dayjs();
  const dias = [];
  let i = 0;
  while (dias.length < 5) {
    const fecha = hoy.subtract(i, "day");
    const day = fecha.day();
    if (day >= 1 && day <= 5) dias.unshift(fecha);
    i++;
  }
  return dias;
};

// ======================
// Paleta de colores (idéntica a RegistrarAsistencia)
// ======================
const PALETTE = {
  presente: { bg: "#E6F4EA", color: "#1E8E3E", border: "#A8D5B5" },
  ausente: { bg: "#FDECEA", color: "#D93025", border: "#F5A6A6" },
  tarde: { bg: "#FEF7E0", color: "#F9AB00", border: "#F9D48B" },
  justificado: { bg: "#E8F0FE", color: "#1967D2", border: "#A0C3FF" },
  neutro: { bg: "#F1F3F4", color: "#5F6368", border: "#DADCE0" },
};

export const AsistenciasRecientes = () => {
  const dataProvider = useDataProvider();
  const [curso, setCurso] = useState("");
  const [cursos, setCursos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(dayjs());
  const [diasHabilitados] = useState(generarDiasHabilesAnteriores());
  const esHoy = fecha.isSame(dayjs(), "day");

  // ======================
  // Cargar cursos
  // ======================
  useEffect(() => {
    dataProvider
      .getList("cursos", {
        pagination: { page: 1, perPage: 100 },
        sort: { field: "anio_escolar", order: "ASC" },
        filter: {},
      })
      .then(({ data }) =>
        setCursos(
          data.map((c) => ({
            id: c.id_curso,
            name: `${c.anio_escolar}° ${c.division}`,
          }))
        )
      )
      .catch(() => setCursos([]));
  }, [dataProvider]);

  // ======================
  // Cargar asistencias del curso y fecha
  // ======================
  useEffect(() => {
    if (curso && fecha) {
      setLoading(true);
      const fechaStr = fecha.format("YYYY-MM-DD");
      dataProvider
        .getAsistenciaCursoFecha(curso, fechaStr)
        .then(({ data }) => {
          setAsistencias(data);
          setLoading(false);
        })
        .catch(() => {
          setAsistencias([]);
          setLoading(false);
        });
    }
  }, [curso, fecha, dataProvider]);

  // ======================
  // Ordenar por apellido (alfabético)
  // ======================
  const asistenciasOrdenadas = useMemo(() => {
    return [...asistencias].sort((a, b) => {
      const apA = (a?.alumno_apellido || "").toLocaleLowerCase();
      const apB = (b?.alumno_apellido || "").toLocaleLowerCase();
      const cmp = apA.localeCompare(apB, "es", { sensitivity: "base" });
      if (cmp !== 0) return cmp;
      const nA = `${a?.alumno_nombre_prop || ""} ${a?.alumno_apellido || ""}`.toLocaleLowerCase();
      const nB = `${b?.alumno_nombre_prop || ""} ${b?.alumno_apellido || ""}`.toLocaleLowerCase();
      return nA.localeCompare(nB, "es", { sensitivity: "base" });
    });
  }, [asistencias]);

  // Helper de visualización usando solo campos separados
  const nombreApellidoUI = (a = {}) => {
    const apellido = a?.alumno_apellido || "";
    const nombre = a?.alumno_nombre_prop || "";
    return `${apellido.trim()} ${nombre.trim()}`.trim();
  };

  // ======================
  // Resumen por estado
  // ======================
  const resumen = useMemo(() => {
    const conteo = { presente: 0, ausente: 0, tarde: 0, justificado: 0, otros: 0 };
    asistencias.forEach((a) => {
      const estado = a.estado_nombre?.toLowerCase();
      if (conteo.hasOwnProperty(estado)) conteo[estado]++;
      else conteo.otros++;
    });
    return conteo;
  }, [asistencias]);

  // ======================
  // Exportar a PDF (con resumen)
  // ======================
  const exportarPDF = async () => {
    if (!asistencias.length) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    // Título y encabezado
    doc.setFontSize(16);
    doc.text("Informe de Asistencia", 14, 15);

    doc.setFontSize(11);
    doc.text(
      `Curso: ${cursos.find((c) => c.id === Number(curso))?.name || ""
      }`,
      14,
      25
    );
    doc.text(`Fecha: ${fecha.format("DD/MM/YYYY")}`, 14, 32);

    // 🧮 Resumen de estados
    const resumenY = 42;
    let x = 14;

    const estadosResumen = Object.entries(resumen).filter(
      ([, cantidad]) => cantidad > 0
    );

    estadosResumen.forEach(([estado, cantidad]) => {
      const p = PALETTE[estado] || PALETTE.neutro;
      doc.setFillColor(p.bg);
      doc.setTextColor(p.color);
      doc.roundedRect(x, resumenY, 35, 12, 2, 2, "F");
      doc.text(
        `${estado.charAt(0).toUpperCase() + estado.slice(1)}: ${cantidad}`,
        x + 3,
        resumenY + 8
      );
      x += 40;
    });

    // 📋 Listado de alumnos
    let y = resumenY + 20;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    asistenciasOrdenadas.forEach((a, i) => {
      doc.text(`${i + 1}. ${nombreApellidoUI(a)} - ${a.estado_nombre}`, 14, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`Asistencia_${fecha.format("YYYYMMDD")}.pdf`);
  };
  // ======================
  // Exportar a Excel (CSV)
  // ======================
  const exportarExcel = () => {
    if (!asistencias.length) return;
    const header = ["#", "Alumno", "Estado"];
    const rows = asistenciasOrdenadas.map((a, i) => [
      i + 1,
      nombreApellidoUI(a),
      a.estado_nombre,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute(
      "download",
      `Asistencia_${fecha.format("YYYYMMDD")}.csv`
    );
    link.setAttribute("href", encodedUri);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ======================
  // Render
  // ======================
  return (
    <Box p={3}>
      {/* === Encabezado === */}
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          background: esHoy
            ? "linear-gradient(90deg, #E3F2FD 0%, #BBDEFB 100%)"
            : "linear-gradient(90deg, #FFF8E1 0%, #FFE082 100%)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          transition: "background 0.3s ease",
        }}
      >
        <CalendarMonthIcon
          sx={{ color: esHoy ? "#1976d2" : "#F9A825", fontSize: 32 }}
        />
        <Typography
          variant="h5"
          fontWeight="600"
          color={esHoy ? "primary" : "#8B8000"}
        >
          Asistencia de la fecha: {fecha.format("DD/MM/YYYY")}
        </Typography>
      </Box>

      {!esHoy && (
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            p: 1.2,
            borderRadius: 1,
            backgroundColor: "#FFF3CD",
            color: "#856404",
            border: "1px solid #FFEEBA",
          }}
        >
          ⚠️ Estás consultando una fecha <strong>anterior</strong>.
          Solo se muestran registros existentes, no se pueden modificar.
        </Typography>
      )}

      {/* === Barra de fechas === */}
      <Box display="flex" gap={1.2} mb={3} justifyContent="center">
        {diasHabilitados.map((d) => {
          const isSelected = fecha.isSame(d, "day");
          const isToday = dayjs().isSame(d, "day");

          return (
            <Button
              key={d.format("YYYY-MM-DD")}
              variant={isSelected ? "contained" : "outlined"}
              color={isToday ? "primary" : "secondary"}
              onClick={() => setFecha(d)}
              disabled={d.isAfter(dayjs(), "day")}
              sx={{
                textTransform: "none",
                fontWeight: isToday ? 600 : 500,
                minWidth: 95,
              }}
            >
              {d.format("ddd DD/MM").replace(/^./, (s) => s.toUpperCase())}
            </Button>
          );
        })}
      </Box>

      {/* === Selector de curso === */}
      <select
        value={curso}
        onChange={(e) => setCurso(e.target.value)}
        style={{
          marginBottom: "20px",
          padding: "8px",
          minWidth: "220px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      >
        <option value="">Seleccionar curso</option>
        {cursos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* === Resumen de asistencias === */}
      {asistencias.length > 0 && (
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mb: 3, flexWrap: "wrap" }}
        >
          {Object.entries(resumen).map(([estado, cantidad]) => {
            if (cantidad === 0) return null;
            const p = PALETTE[estado] || PALETTE.neutro;
            const label =
              estado.charAt(0).toUpperCase() + estado.slice(1);
            return (
              <Card
                key={estado}
                sx={{
                  minWidth: 130,
                  borderTop: `4px solid ${p.color}`,
                  backgroundColor: p.bg,
                  color: p.color,
                  textAlign: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              >
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {cantidad}
                  </Typography>
                  <Typography variant="body2">{label}</Typography>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* === Botones de exportación === */}
      {asistencias.length > 0 && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 2, justifyContent: "flex-end" }}
        >
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportarExcel}
          >
            Exportar Excel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={exportarPDF}
          >
            Exportar PDF
          </Button>
        </Stack>
      )}

      {/* === Tabla de asistencias === */}
      {loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>#</strong>
                </TableCell>
                <TableCell>
                  <strong>Alumno</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Estado de asistencia</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton animation="wave" variant="text" width={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton animation="wave" variant="text" width="80%" />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rectangular"
                      width={100}
                      height={28}
                      sx={{ borderRadius: 1, mx: "auto" }}
                      animation="wave"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!loading && curso && asistencias.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            mt: 5,
            color: "#5f6368",
            textAlign: "center",
          }}
        >
          <SearchOffIcon sx={{ fontSize: 60, mb: 1, color: "#9E9E9E" }} />
          <Typography variant="h6" fontWeight="500">
            No hay registros de asistencia para esta fecha.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "#9E9E9E" }}>
            Verifica que el curso tenga alumnos o que se haya registrado asistencia.
          </Typography>
        </Box>
      )}

      {!loading && asistencias.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>#</strong></TableCell>
                <TableCell><strong>Alumno</strong></TableCell>
                <TableCell align="center"><strong>Estado de asistencia</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {asistenciasOrdenadas.map((a, index) => {
                const estado = a.estado_nombre?.toLowerCase() || "neutro";
                const p = PALETTE[estado] || PALETTE.neutro;
                return (
                  <TableRow key={a.id_asistencia || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{nombreApellidoUI(a)}</TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        verticalAlign: "middle",
                        height: 56, // altura estándar de fila MUI
                        p: 0, // elimina padding extra de la celda
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%", // ocupa todo el alto de la celda
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            justifyContent: "center",
                            alignItems: "center",
                            px: 2,
                            py: 0.6,
                            borderRadius: "9999px", // efecto "pill" más redondo
                            backgroundColor: p.bg,
                            color: p.color,
                            border: `1px solid ${p.border}`,
                            fontWeight: 600,
                            textAlign: "center",
                            minWidth: 90,
                            lineHeight: 1.2,
                          }}
                        >
                          {a.estado_nombre}
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
