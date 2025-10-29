// src/resources/asistencias/EliminarAsistencias.jsx
import { useState, useEffect } from "react";
import {
  useDataProvider,
  useNotify,
  Confirm,
} from "react-admin";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  TextField,
  CircularProgress,
  Paper,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

export const EliminarAsistencias = ({ usuarioActual }) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const [curso, setCurso] = useState("");
  const [cursos, setCursos] = useState([]);
  const [fecha, setFecha] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cantidadRegistros, setCantidadRegistros] = useState(0);

  // === Cargar cursos ===
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

  // === Buscar registros antes de confirmar ===
  const verificarAsistencias = async () => {
    if (!curso || !fecha) {
      notify("Debes seleccionar curso y fecha", { type: "warning" });
      return;
    }
    setLoading(true);

    try {
      const { data } = await dataProvider.getAsistenciaCursoFecha(curso, fecha);
      if (!data || data.length === 0) {
        notify(
          `No se encontró asistencia registrada para el curso seleccionado el ${dayjs(
            fecha
          ).format("DD/MM/YYYY")}.`,
          { type: "info" }
        );
        setLoading(false);
        return;
      }

      setCantidadRegistros(data.length);
      setConfirmOpen(true);
    } catch (error) {
      notify("Error consultando asistencias", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // === Confirmar eliminación ===
  const eliminarAsistencias = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await dataProvider.deleteAsistenciasCurso(curso, fecha);
      notify("Asistencias eliminadas con éxito", { type: "success" });
    } catch (error) {
      notify("Error eliminando asistencias", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const cursoNombre = cursos.find((c) => c.id === Number(curso))?.name || "";

  return (
    <Box p={3}>
      {/* === Encabezado === */}
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          background: "linear-gradient(90deg, #FFCDD2 0%, #EF5350 100%)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <DeleteForeverIcon sx={{ color: "#B71C1C", fontSize: 32 }} />
        <Typography variant="h5" fontWeight="600" color="#B71C1C">
          Eliminar asistencias
        </Typography>
      </Box>

      {/* === Controles en línea === */}
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        sx={{
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        {/* Curso */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Curso</InputLabel>
          <Select
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            label="Curso"
          >
            {cursos.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Fecha */}
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarMonthIcon sx={{ color: "#B71C1C" }} />
          <TextField
            type="date"
            label="Fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: dayjs().format("YYYY-MM-DD"), // 🔒 no permite días futuros
            }}
          />

        </Box>

        {/* Botón eliminar */}
        <Button
          variant="contained"
          color="error"
          onClick={verificarAsistencias}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : null
          }
          sx={{
            textTransform: "none",
            px: 3,
            py: 1,
            transition: "all 0.2s ease",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#B71C1C" },
          }}
        >
          {loading ? "Procesando..." : "Eliminar"}
        </Button>
      </Box>

      {/* === Estado vacío === */}
      {!loading && !curso && (
        <Paper
          elevation={0}
          sx={{
            mt: 5,
            p: 4,
            textAlign: "center",
            color: "#5f6368",
          }}
        >
          <SearchOffIcon sx={{ fontSize: 60, mb: 1, color: "#9E9E9E" }} />
          <Typography variant="h6" fontWeight="500">
            Selecciona un curso y una fecha para continuar.
          </Typography>
        </Paper>
      )}

      {/* === Confirmación === */}
      <Confirm
        isOpen={confirmOpen}
        title={
          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
            <WarningAmberRoundedIcon sx={{ color: "#D32F2F", fontSize: 48 }} />
            <Typography variant="h6" fontWeight="bold">
              Confirmar eliminación
            </Typography>
          </Box>
        }
        content={
          <Box sx={{ mt: 1 }}>
            <Typography>
              Se eliminarán <strong>{cantidadRegistros}</strong> registros de
              asistencia del curso <strong>{cursoNombre}</strong> correspondientes al{" "}
              <strong>{dayjs(fecha).format("DD/MM/YYYY")}</strong>.
            </Typography>
            <Typography sx={{ mt: 1 }}>
              Esta acción quedará registrada a nombre de{" "}
              <strong>{usuarioActual?.nombre_completo || "usuario actual"}</strong>.
            </Typography>
          </Box>
        }
        confirm="Eliminar"
        cancel="Cancelar"
        onConfirm={eliminarAsistencias}
        onClose={() => setConfirmOpen(false)}
        sx={{
          "& .RaConfirm-confirmButton": {
            backgroundColor: "#D32F2F",
            color: "#fff",
            "&:hover": { backgroundColor: "#B71C1C" },
          },
        }}
      />
    </Box>
  );
};
