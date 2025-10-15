// src/resources/asistencias/AsistenciasHoy.jsx
import { useEffect, useState, useMemo } from "react";
import { useDataProvider } from "react-admin";
import {
  Box, CircularProgress, Typography,
  FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Chip,
  Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material";

function hoyAR() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Salta' });
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

const EstadoChip = ({ estado }) => {
  if (!estado) return <Chip label="-" size="small" />;
  const key = estado.toLowerCase();
  const map = {
    presente: { label: "Presente", bg: "rgba(76, 175, 80, 0.15)", color: "#2e7d32" },
    ausente: { label: "Ausente", bg: "rgba(244, 67, 54, 0.15)", color: "#c62828" },
    tarde: { label: "Tarde", bg: "rgba(255, 193, 7, 0.2)", color: "#ff8f00" },
  };
  const style = map[key] || { label: estado, bg: "rgba(158,158,158,0.15)", color: "#424242" };
  return (
    <Chip
      label={style.label}
      size="small"
      sx={{ backgroundColor: style.bg, color: style.color, fontWeight: 500 }}
    />
  );
};

export const AsistenciasHoy = () => {
  const dataProvider = useDataProvider();
  const fecha = useMemo(() => hoyAR(), []);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [curso, setCurso] = useState("");
  const [cursos, setCursos] = useState([]);

  useEffect(() => {
    dataProvider.getList("cursos", {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "anio_escolar", order: "ASC" },
      filter: {},
    }).then(({ data }) => {
      setCursos(data.map(c => ({ id: c.id_curso, name: `${c.anio_escolar}° ${c.division}` })));
    });
  }, [dataProvider]);

  useEffect(() => {
    if (!curso) return;
    setLoading(true);
    dataProvider.getAsistenciaCursoHoy(curso, fecha)
      .then(({ data }) => { setRecords(data); setLoading(false); })
      .catch(() => { setRecords([]); setLoading(false); });
  }, [curso, fecha, dataProvider]);

  const total = records.length;
  const presentes = records.filter(r => r.estado_nombre?.toLowerCase() === "presente").length;
  const ausentes = records.filter(r => r.estado_nombre?.toLowerCase() === "ausente").length;
  const tarde = records.filter(r => r.estado_nombre?.toLowerCase() === "tarde").length;

  const metricValue = (v) => (curso ? (v > 0 ? v : "-") : "-");

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Asistencias del {fecha}
      </Typography>

      <FormControl sx={{ minWidth: 200, mb: 3 }}>
        <InputLabel>Curso</InputLabel>
        <Select value={curso} onChange={(e) => setCurso(e.target.value)}>
          {cursos.length > 0 ? cursos.map(c => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          )) : <MenuItem disabled>No hay cursos</MenuItem>}
        </Select>
      </FormControl>

      {loading && <CircularProgress />}

      {!loading && curso && (
        <Box mb={3} display="flex" gap={2}>
          <Card sx={{ flex: 1, p: 2, backgroundColor: "rgba(76, 175, 80, 0.15)" }}>
            <CardContent>
              <Typography variant="subtitle1">Presentes</Typography>
              <Typography variant="h5" sx={{ color: "#2e7d32" }}>{metricValue(presentes)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, p: 2, backgroundColor: "rgba(244, 67, 54, 0.15)" }}>
            <CardContent>
              <Typography variant="subtitle1">Ausentes</Typography>
              <Typography variant="h5" sx={{ color: "#c62828" }}>{metricValue(ausentes)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, p: 2, backgroundColor: "rgba(255, 193, 7, 0.2)" }}>
            <CardContent>
              <Typography variant="subtitle1">Tarde</Typography>
              <Typography variant="h5" sx={{ color: "#ff8f00" }}>{metricValue(tarde)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, p: 2, backgroundColor: "rgba(33, 150, 243, 0.1)" }}>
            <CardContent>
              <Typography variant="subtitle1">Total</Typography>
              <Typography variant="h5">{metricValue(total)}</Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {!loading && curso && (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Alumno</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No hay asistencias cargadas
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r, i) => (
                  <TableRow key={r.id_asistencia || i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{r.alumno_nombre}</TableCell>
                    <TableCell><EstadoChip estado={r.estado_nombre} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
};
