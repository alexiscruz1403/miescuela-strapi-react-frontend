// src/resources/asistencias/RegistrarAsistencia.jsx
import { useEffect, useState } from "react";
import {
  useDataProvider,
  useNotify,
  useRedirect,
} from "react-admin";
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

export const RegistrarAsistencia = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  const [curso, setCurso] = useState("");
  const [cursos, setCursos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);

  // cargar cursos
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

  // cargar estados
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

  // cargar alumnos cuando selecciono curso
  useEffect(() => {
    if (curso) {
      setLoading(true);
      const fecha = new Date().toISOString().split("T")[0]; // hoy
      dataProvider
  .getAlumnosCurso(curso, fecha)
  .then(({ data }) => {
    setAlumnos(
      data.map((a) => ({
        ...a,
        id_estado: a.id_estado ? Number(a.id_estado) : "",
      }))
    );
    setLoading(false);
  })
  .catch(() => {
    setAlumnos([]);
    setLoading(false);
  });
    }
  }, [curso, dataProvider]);

  const handleEstadoChange = (id_alumno, value) => {
    setAlumnos((prev) =>
      prev.map((a) =>
        a.id_alumno === id_alumno ? { ...a, id_estado: value } : a
      )
    );
  };

  const handleSubmit = async () => {
    const fecha = new Date().toISOString().split("T")[0];
    const items = alumnos.map((a) => ({
      id_alumno: a.id_alumno,
      id_estado: a.id_estado || null,
    }));

    try {
      await dataProvider.registrarAsistenciaCurso(curso, fecha, items);
      notify("Asistencia registrada con éxito", { type: "success" });
      redirect("/asistencias");
    } catch (e) {
      notify("Error al registrar la asistencia", { type: "error" });
    }
  };

  // Paleta de colores suaves
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

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Registrar / Editar Asistencia
      </Typography>

      {/* Selección de curso */}
      <select
        value={curso}
        onChange={(e) => setCurso(e.target.value)}
        style={{ marginBottom: "20px", padding: "8px", minWidth: "200px" }}
      >
        <option value="">Seleccionar curso</option>
        {cursos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Lista de alumnos */}
      {loading && <CircularProgress />}
      {!loading && curso && alumnos.length === 0 && (
        <Typography>No hay alumnos en este curso</Typography>
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
              {alumnos.map((a, index) => (
                <TableRow key={a.id_alumno}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{a.alumno_nombre}</TableCell>
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
        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Guardar asistencia
          </Button>
        </Box>
      )}
    </Box>
  );
};
