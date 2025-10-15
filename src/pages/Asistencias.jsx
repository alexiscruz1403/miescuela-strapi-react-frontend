import { useState, useEffect } from "react";
import axios from "axios";
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Tabs,
    Tab,
    Card,
    CardContent,
    Grid,
    Alert,
    Snackbar,
    Tooltip,
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    Download as DownloadIcon,
    Person as PersonIcon,
} from "@mui/icons-material";
import { Loader } from "../components/Loader";
import { PrimaryButton } from "../components/PrimaryButton";

const API_URL = "http://localhost:6543/api/asistencias";
const API_ESTADOS = "http://localhost:6543/api/asistencia-estados";

export const Asistencias = () => {
    // Estados principales
    const [asistencias, setAsistencias] = useState([]);
    const [estadosAsistencia, setEstadosAsistencia] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Diálogos
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState("crear");
    const [selectedAsistencia, setSelectedAsistencia] = useState(null);

    // Filtros
    const [filtros, setFiltros] = useState({
        curso: "",
        alumno: "",
        fecha: "",
        estado: "",
    });

    // Formulario
    const [formData, setFormData] = useState({
        id_alumno: "",
        id_curso: "",
        fecha: new Date().toISOString().split("T")[0],
        id_estado: "",
        observaciones: "",
    });

    // Cargar datos al montar
    useEffect(() => {
        cargarAsistencias();
        cargarEstados();
    }, []);

    const cargarAsistencias = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL);
            setAsistencias(res.data);
        } catch (err) {
            console.error(err);
            setError("Error al cargar asistencias");
        } finally {
            setLoading(false);
        }
    };

    const cargarEstados = async () => {
        try {
            const res = await axios.get(API_ESTADOS);
            setEstadosAsistencia(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const crearAsistencia = async (datos) => {
        try {
            await axios.post(API_URL, datos);
            setSuccess("Asistencia creada exitosamente");
            cargarAsistencias();
        } catch (err) {
            console.error(err);
            setError("Error al crear asistencia");
        }
    };

    const actualizarAsistencia = async (id, datos) => {
        try {
            await axios.put(`${API_URL}/${id}`, datos);
            setSuccess("Asistencia actualizada exitosamente");
            cargarAsistencias();
        } catch (err) {
            console.error(err);
            setError("Error al actualizar asistencia");
        }
    };

    const eliminarAsistencia = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            setSuccess("Asistencia eliminada exitosamente");
            cargarAsistencias();
        } catch (err) {
            console.error(err);
            setError("Error al eliminar asistencia");
        }
    };

    // Form handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = () => {
        if (dialogMode === "crear") {
            crearAsistencia(formData);
        } else if (dialogMode === "editar") {
            actualizarAsistencia(selectedAsistencia.id_asistencia, formData);
        }
        handleCloseDialog();
    };

    const handleOpenDialog = (mode, asistencia = null) => {
        setDialogMode(mode);
        setSelectedAsistencia(asistencia);

        if (mode === "crear") {
            setFormData({
                id_alumno: "",
                id_curso: "",
                fecha: new Date().toISOString().split("T")[0],
                id_estado: "",
                observaciones: "",
            });
        } else if (asistencia) {
            setFormData({
                id_alumno: asistencia.id_alumno,
                id_curso: asistencia.id_curso,
                fecha: asistencia.fecha,
                id_estado: asistencia.id_estado,
                observaciones: asistencia.observaciones || "",
            });
        }

        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedAsistencia(null);
    };

    const handleDelete = (asistencia) => {
        if (
            window.confirm(
                `¿Eliminar la asistencia de ${asistencia.Alumno?.nombre_completo}?`
            )
        ) {
            eliminarAsistencia(asistencia.id_asistencia);
        }
    };

    // Filtrar asistencias
    const asistenciasFiltradas = asistencias.filter((a) => {
        return (
            (!filtros.curso ||
                a.Curso?.nombre?.toLowerCase().includes(filtros.curso.toLowerCase())) &&
            (!filtros.alumno ||
                a.Alumno?.nombre_completo
                    ?.toLowerCase()
                    .includes(filtros.alumno.toLowerCase())) &&
            (!filtros.fecha || a.fecha === filtros.fecha) &&
            (!filtros.estado || a.id_estado?.toString() === filtros.estado)
        );
    });

    // Estadísticas
    const estadisticas = {
        total: asistencias.length,
        presentes: asistencias.filter(
            (a) => a.AsistenciaEstado?.descripcion === "Presente"
        ).length,
        ausentes: asistencias.filter(
            (a) => a.AsistenciaEstado?.descripcion === "Ausente"
        ).length,
        tardanzas: asistencias.filter(
            (a) => a.AsistenciaEstado?.descripcion === "Tardanza"
        ).length,
    };

    return (
        <Box sx={{ p: 4, height: "100%", overflow: "auto" }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: "#0A2E75", fontWeight: 600 }}>
                    Gestión de Asistencias
                </Typography>
                <Typography variant="body1" sx={{ color: "#666", mb: 3 }}>
                    Administra el control de asistencia de estudiantes
                </Typography>
            </Box>



            {/* Tabla de asistencias */}
            <Card>
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6" sx={{ color: "#0A2E75" }}>
                            Registros de Asistencia ({asistenciasFiltradas.length})
                        </Typography>
                        <PrimaryButton
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog("crear")}
                        >
                            Nueva Asistencia
                        </PrimaryButton>
                    </Box>

                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Fecha</strong></TableCell>
                                    <TableCell><strong>Alumno</strong></TableCell>
                                    <TableCell><strong>Curso</strong></TableCell>
                                    <TableCell><strong>Estado</strong></TableCell>
                                    <TableCell><strong>Observaciones</strong></TableCell>
                                    <TableCell><strong>Acciones</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            {/* Loader */}
                                            {loading && <Loader text="Cargando asistencias..." />}

                                        </TableCell>
                                    </TableRow>
                                ) : asistenciasFiltradas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No se encontraron registros
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    asistenciasFiltradas.map((a) => (
                                        <TableRow key={a.id_asistencia} hover>
                                            <TableCell>
                                                {new Date(a.fecha).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{a.Alumno?.nombre_completo}</TableCell>
                                            <TableCell>{a.Curso?.nombre}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={a.AsistenciaEstado?.descripcion}
                                                    size="small"
                                                    color={
                                                        a.AsistenciaEstado?.descripcion === "Presente"
                                                            ? "success"
                                                            : a.AsistenciaEstado?.descripcion === "Ausente"
                                                                ? "error"
                                                                : "warning"
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>{a.observaciones || "-"}</TableCell>
                                            <TableCell>
                                                <Tooltip title="Ver detalles">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog("ver", a)}
                                                    >
                                                        <ViewIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog("editar", a)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(a)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Dialog crear/editar/ver */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogMode === "crear"
                        ? "Nueva Asistencia"
                        : dialogMode === "editar"
                            ? "Editar Asistencia"
                            : "Detalles de Asistencia"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="id_alumno"
                                    label="ID Alumno"
                                    fullWidth
                                    value={formData.id_alumno}
                                    onChange={handleInputChange}
                                    disabled={dialogMode === "ver"}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="id_curso"
                                    label="ID Curso"
                                    fullWidth
                                    value={formData.id_curso}
                                    onChange={handleInputChange}
                                    disabled={dialogMode === "ver"}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    type="date"
                                    name="fecha"
                                    label="Fecha"
                                    fullWidth
                                    value={formData.fecha}
                                    onChange={handleInputChange}
                                    InputLabelProps={{ shrink: true }}
                                    disabled={dialogMode === "ver"}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Estado</InputLabel>
                                    <Select
                                        name="id_estado"
                                        value={formData.id_estado || ""}
                                        onChange={handleInputChange}
                                        disabled={dialogMode === "ver"}
                                    >
                                        {estadosAsistencia.map((estado) => (
                                            <MenuItem key={estado.id_estado} value={estado.id_estado}>
                                                {estado.descripcion}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="observaciones"
                                    label="Observaciones"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={formData.observaciones}
                                    onChange={handleInputChange}
                                    disabled={dialogMode === "ver"}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        {dialogMode === "ver" ? "Cerrar" : "Cancelar"}
                    </Button>
                    {dialogMode !== "ver" && (
                        <Button variant="contained" onClick={handleSubmit} sx={{ backgroundColor: "#0A2E75" }}>
                            {dialogMode === "crear" ? "Crear" : "Actualizar"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Snackbars */}
            <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess("")}>
                <Alert onClose={() => setSuccess("")} severity="success">
                    {success}
                </Alert>
            </Snackbar>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
                <Alert onClose={() => setError("")} severity="error">
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};
