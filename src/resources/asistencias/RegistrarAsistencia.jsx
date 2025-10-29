// src/resources/asistencias/RegistrarAsistencia.jsx
import { useEffect, useState, useMemo } from "react";
import { useDataProvider, useNotify } from "react-admin";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs from "dayjs";
import "dayjs/locale/es";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import Skeleton from "@mui/material/Skeleton";



// ====================
// Funciones auxiliares
// ====================

// Generar los últimos 5 días hábiles (de lunes a viernes) hasta hoy
dayjs.locale("es");

const generarDiasHabilesAnteriores = () => {
  const hoy = dayjs();
  const dias = [];
  let i = 0;

  while (dias.length < 5) {
    const fecha = hoy.subtract(i, "day");
    const day = fecha.day();
    if (day >= 1 && day <= 5) dias.unshift(fecha); // lunes a viernes
    i++;
  }

  return dias;
};

export const RegistrarAsistencia = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const [curso, setCurso] = useState("");
  const [cursos, setCursos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fecha actual y días hábiles
  const [fecha, setFecha] = useState(dayjs());
  const [diasHabilitados, setDiasHabilitados] = useState(
    generarDiasHabilesAnteriores()
  );

  const esHoy = fecha.isSame(dayjs(), "day");

  // ====================
  // Cargar cursos
  // ====================
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

  // ====================
  // Cargar estados
  // ====================
  useEffect(() => {
    dataProvider
      .getList("asistencia-estados", {
        pagination: { page: 1, perPage: 50 },
        sort: { field: "id_estado", order: "ASC" },
        filter: {},
      })
      .then(({ data }) => setEstados(data))
      .catch(() => setEstados([]));
  }, [dataProvider]);

  // ====================
  // Cargar alumnos al cambiar curso o fecha
  // Si no tienen estado cargado para la fecha seleccionada,
  // asignar por defecto "Presente" (si existe en estados)
  // ====================
  useEffect(() => {
    if (curso && fecha) {
      setLoading(true);
      const fechaStr = fecha.format("YYYY-MM-DD");
      dataProvider
        .getAlumnosCurso(curso, fechaStr)
        .then(({ data }) => {
          const presente = estados.find(
            (e) => (e.descripcion || "").toLowerCase() === "presente"
          );
          const defaultPresenteId = presente ? Number(presente.id_estado) : "";

          setAlumnos(
            data.map((a) => ({
              ...a,
              // Si viene estado desde la API, conservarlo.
              // Si no viene, usar "Presente" por defecto (si está disponible).
              id_estado:
                a.id_estado !== undefined && a.id_estado !== null && a.id_estado !== ""
                  ? Number(a.id_estado)
                  : defaultPresenteId,
            }))
          );
          setLoading(false);
        })
        .catch(() => {
          setAlumnos([]);
          setLoading(false);
        });
    }
  }, [curso, fecha, dataProvider, estados]);

  // ====================
  // Ordenar alumnos por apellido (alfabético)
  // ====================
  const alumnosOrdenados = useMemo(() => {
    return [...alumnos].sort((a, b) => {
      const apA = (a?.alumno_apellido || "").toLocaleLowerCase();
      const apB = (b?.alumno_apellido || "").toLocaleLowerCase();
      const cmp = apA.localeCompare(apB, "es", { sensitivity: "base" });
      if (cmp !== 0) return cmp;
      const nA = `${a?.alumno_nombre_prop || ""} ${a?.alumno_apellido || ""}`.toLocaleLowerCase();
      const nB = `${b?.alumno_nombre_prop || ""} ${b?.alumno_apellido || ""}`.toLocaleLowerCase();
      return nA.localeCompare(nB, "es", { sensitivity: "base" });
    });
  }, [alumnos]);

  const nombreApellidoUI = (a = {}) => {
    const apellido = a?.alumno_apellido || "";
    const nombre = a?.alumno_nombre_prop || "";
    return `${apellido.trim()} ${nombre.trim()}`.trim();
  };

  // ====================
  // Cambiar estado alumno
  // ====================
  const handleEstadoChange = (id_alumno, value) => {
    setAlumnos((prev) =>
      prev.map((a) =>
        a.id_alumno === id_alumno ? { ...a, id_estado: value } : a
      )
    );
  };

  // ====================
  // Guardar asistencia
  // ====================
  const handleSubmit = async () => {
    const fechaStr = fecha.format("YYYY-MM-DD");
    const items = alumnos.map((a) => ({
      id_alumno: a.id_alumno,
      id_estado: a.id_estado || null,
    }));

    try {
      await dataProvider.registrarAsistenciaCurso(curso, fechaStr, items);
      notify("Asistencia registrada con éxito", { type: "success" });
      // permanecer en la vista actual (sin redirección)
    } catch (e) {
      notify("Error al registrar la asistencia", { type: "error" });
    }
  };

  // ====================
  // Paleta de colores suaves para botones
  // ====================
  const PALETTE = {
    presente: { bg: "#E6F4EA", color: "#1E8E3E", border: "#A8D5B5" },
    ausente: { bg: "#FDECEA", color: "#D93025", border: "#F5A6A6" },
    tarde: { bg: "#FEF7E0", color: "#F9AB00", border: "#F9D48B" },
    justificado: { bg: "#E8F0FE", color: "#1967D2", border: "#A0C3FF" },
    neutro: { bg: "#F1F3F4", color: "#5F6368", border: "#DADCE0" },
  };

  const estadoKeyById = estados.reduce((acc, e) => {
    acc[Number(e.id_estado)] = e.descripcion.toLowerCase();
    return acc;
  }, {});

  const buttonSx = (id) => {
    const key = estadoKeyById[Number(id)] || "neutro";
    const p = PALETTE[key] || PALETTE.neutro;
    return {
      textTransform: "none",
      borderColor: p.border,
      mx: 0.5,
      "&.Mui-selected": {
        backgroundColor: p.bg,
        color: p.color,
        borderColor: p.border,
      },
      "&:not(.Mui-selected)": { backgroundColor: "transparent" },
    };
  };

  // ====================
  // Render
  // ====================
  return (
    <Box p={3}>
      {/* === Encabezado dinámico === */}
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
          {esHoy
            ? `Registrando asistencia del día ${fecha.format("DD/MM/YYYY")}`
            : `Registrando asistencia diferida (${fecha.format("DD/MM/YYYY")})`}
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
          ⚠️ Estás registrando una fecha <strong>diferida</strong> (anterior a la
          actual). Los cambios se guardarán con esa fecha.
        </Typography>
      )}

      {/* === Barra de fechas hábiles === */}
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
              {d.format("ddd DD/MM")}
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

      {/* === Lista de alumnos === */}
      {/* {loading && <CircularProgress />} */}
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
                  <strong>Estado</strong>
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
      {!loading && curso && alumnos.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            mt: 5,
            p: 4,
            borderRadius: 2,
            backgroundColor: "#F8F9FA",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
            color: "#5f6368",
          }}
        >
          <SearchOffIcon sx={{ fontSize: 60, mb: 1, color: "#B0BEC5" }} />
          <Typography variant="h6" fontWeight="500" color="#424242">
            No hay alumnos registrados en este curso.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "#9E9E9E" }}>
            Verifica que el curso tenga alumnos asignados o selecciona otro curso.
          </Typography>
        </Box>
      )}

      {!loading && alumnos.length > 0 && (
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
                  <strong>Estado de Asistencia</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alumnosOrdenados.map((a, index) => (
                <TableRow key={a.id_alumno}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{nombreApellidoUI(a)}</TableCell>
                  <TableCell align="center">
                    <ToggleButtonGroup
                      value={a.id_estado || ""}
                      exclusive
                      onChange={(e, newValue) => {
                        if (newValue !== null)
                          handleEstadoChange(a.id_alumno, newValue);
                      }}
                      size="small"
                    >
                      {estados.map((estado) => (
                        <ToggleButton
                          key={estado.id_estado}
                          value={Number(estado.id_estado)}
                          sx={buttonSx(estado.id_estado)}
                        >
                          {estado.descripcion}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {alumnos.length > 0 && (
        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ px: 4, py: 1.2 }}
          >
            Guardar asistencia
          </Button>
        </Box>
      )}
    </Box>
  );
};
