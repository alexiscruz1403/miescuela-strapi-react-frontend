// src/resources/asistencias/EliminarAsistencias.jsx
import { useState, useEffect } from "react";
import { useDataProvider, useNotify } from "react-admin";
import {
  Box, Typography, FormControl, Select, MenuItem, InputLabel,
  Button, TextField
} from "@mui/material";

export const EliminarAsistencias = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const [curso, setCurso] = useState("");
  const [cursos, setCursos] = useState([]);
  const [fecha, setFecha] = useState("");

  // cargar cursos
  useEffect(() => {
    dataProvider.getList("cursos", {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "anio_escolar", order: "ASC" },
      filter: {},
    }).then(({ data }) => {
      setCursos(data.map(c => ({ id: c.id_curso, name: `${c.anio_escolar}° ${c.division}` })));
    }).catch(() => setCursos([]));
  }, [dataProvider]);

  const handleDelete = async () => {
    if (!curso || !fecha) {
      notify("Debes seleccionar curso y fecha", { type: "warning" });
      return;
    }

    if (!window.confirm(`¿Eliminar asistencias del curso ${curso} en ${fecha}?`)) return;

    try {
      await dataProvider.deleteAsistenciasCurso(curso, fecha);
      notify("Asistencias eliminadas con éxito", { type: "success" });
    } catch {
      notify("Error eliminando asistencias", { type: "error" });
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Eliminar asistencias de un curso
      </Typography>

      <FormControl sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel>Curso</InputLabel>
        <Select value={curso} onChange={(e) => setCurso(e.target.value)}>
          {cursos.map(c => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        type="date"
        label="Fecha"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        sx={{ mb: 2, display: "block" }}
        InputLabelProps={{ shrink: true }}
      />

      <Button variant="contained" color="error" onClick={handleDelete}>
        Eliminar asistencias
      </Button>
    </Box>
  );
};
