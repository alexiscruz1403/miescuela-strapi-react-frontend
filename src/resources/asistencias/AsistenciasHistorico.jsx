// src/resources/asistencias/AsistenciasHistorico.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Stack,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Card,
    CardContent,
    CircularProgress,
} from "@mui/material";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend,
    ReferenceLine,
} from "recharts";
import { dataProvider } from "../../providers/dataProvider";
import { generarReportePDF } from "./generarReportePDF";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchOffIcon from "@mui/icons-material/SearchOff";

// === helpers ===
const toISO = (d) => new Date(d).toISOString().slice(0, 10);
const hoyAR = () => toISO(new Date());

// Mapeo de estado (string) a valor numérico para graficar
const estadoToValue = (estado) => {
    const e = (estado || "").toUpperCase();
    if (e.includes("PRES")) return 3; // Presente
    if (e.includes("TAR")) return 2; // Tarde
    if (e.includes("JUST")) return 1; // Ausente Justificada
    if (e.includes("AUS")) return 0; // Ausente No Justificada
    return null;
};

// Mapeo inverso para mostrar etiquetas legibles en eje Y / tooltip
const valueToEstadoLabel = (v) => {
    if (v === 3) return "Presente";
    if (v === 2) return "Tarde";
    if (v === 1) return "Aus. Just.";
    if (v === 0) return "Aus. No Just.";
    return "";
};

// === Cálculo de métricas generales ===
const calcMetrics = (items) => {
    const registrosValidos = items.filter(
        (i) => i.id_estado !== null && i.estado_nombre
    );
    const fechasConAsistencia = [...new Set(registrosValidos.map((i) => i.fecha))];
    const totalClases = fechasConAsistencia.length;
    const total = registrosValidos.length || 0;
    const count = { P: 0, A: 0, AJ: 0, T: 0 };

    registrosValidos.forEach((i) => {
        const e = (i.estado_nombre || "").toUpperCase();
        if (e.includes("PRES")) count.P++;
        else if (e.includes("TAR")) count.T++;
        else if (e.includes("JUST")) count.AJ++;
        else if (e.includes("AUS")) count.A++;
    });

    const pct = (n) => (total ? Math.round((n * 10000) / total) / 100 : 0);

    return {
        totalRegistros: total,
        totalClases,
        pctAsistencia: pct(count.P),
        pctTardanzas: pct(count.T),
        pctAusJust: pct(count.AJ),
        pctAusNoJust: pct(count.A),
    };
};

// === Agrupación para gráficos ===
const groupForCharts = (items) => {
    const buckets = {};
    items.forEach((i) => {
        const f = i.fecha;
        const e = (i.estado_nombre || "").toUpperCase();
        if (!buckets[f]) buckets[f] = { key: f, faltas: 0, tardanzas: 0, presentes: 0 };
        if (e.includes("AUS")) buckets[f].faltas++;
        else if (e.includes("TAR")) buckets[f].tardanzas++;
        else if (e.includes("PRES")) buckets[f].presentes++;
    });
    return Object.values(buckets);
};

// === Métricas por alumno ===
const calcMetricsPorAlumno = (items) => {
    const registrosValidos = items.filter(
        (i) => i.id_estado !== null && i.estado_nombre
    );
    const alumnos = {};

    registrosValidos.forEach((i) => {
        const id = i.alumno_id || i.id_alumno;
        if (!id) return;
        const estado = (i.estado_nombre || "").toUpperCase();

        if (!alumnos[id]) {
            alumnos[id] = {
                id_alumno: id,
                alumno: i.alumno_nombre || `Alumno ${id}`,
                P: 0,
                T: 0,
                AJ: 0,
                A: 0,
                total: 0,
            };
        }

        alumnos[id].total++;
        if (estado.includes("PRES")) alumnos[id].P++;
        else if (estado.includes("TAR")) alumnos[id].T++;
        else if (estado.includes("JUST")) alumnos[id].AJ++;
        else if (estado.includes("AUS")) alumnos[id].A++;
    });
    
    const resultado = Object.values(alumnos).map((a) => {
        const pct = (n) => (a.total ? Math.round((n * 10000) / a.total) / 100 : 0);
        return {
            alumno: a.alumno,
            pctAsistencia: pct(a.P),
            pctTardanzas: pct(a.T),
            pctAusJust: pct(a.AJ),
            pctAusNoJust: pct(a.A),
            total: a.total,
            promAlu: a.promedioAlumno,
            promCur: a.promedioCurso, 
        };
    });
    return resultado.sort((a, b) => b.pctAsistencia - a.pctAsistencia);
};

// === COMPONENTE PRINCIPAL ===
export const AsistenciasHistorico = () => {
    const [cursos, setCursos] = useState([]);
    const [cursoId, setCursoId] = useState("");
    const [alumnos, setAlumnos] = useState([]);
    const [alumnoId, setAlumnoId] = useState("");
    const [alumnoNombre, setAlumnoNombre] = useState("");
    const [desde, setDesde] = useState(toISO(new Date(Date.now() - 30 * 86400000)));
    const [hasta, setHasta] = useState(hoyAR());
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busquedaEjecutada, setBusquedaEjecutada] = useState(false);
    const [sinAlumnos, setSinAlumnos] = useState(false);
    const [promedios, setPromedios] = useState({});

    const metrics = useMemo(() => calcMetrics(rows), [rows]);
    const grouped = useMemo(() => groupForCharts(rows), [rows]);
    const ranking = useMemo(() => calcMetricsPorAlumno(rows), [rows]);
    const isAlumnoSeleccionado = Boolean(alumnoId);

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
    }, []);

    // === Cargar alumnos del curso ===
    useEffect(() => {
        if (!cursoId) {
            setAlumnos([]);
            setSinAlumnos(false);
            return;
        }

        setLoading(true);
        const fechaRef = hasta || hoyAR();

        dataProvider
            .getAlumnosCurso(cursoId, fechaRef)
            .then(({ data }) => {
                setAlumnos(data);
                setSinAlumnos(data.length === 0); // ✅ marcar si no hay alumnos
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error cargando alumnos del curso:", err);
                setAlumnos([]);
                setSinAlumnos(true); // también mostrar mensaje en error
                setLoading(false);
            });
    }, [cursoId, hasta]);

    // === Buscar asistencias ===
    const buscar = async () => {
        if (!cursoId) return;
        if (alumnos.length === 0) {
            setSinAlumnos(true);
            setBusquedaEjecutada(false);
            return;
        }

        setLoading(true);
        try {
            const tipo = alumnoId ? "alumno" : "curso";
            const { data } = await dataProvider.asistenciasHistorico(
                tipo,
                alumnoId || cursoId,
                desde,
                hasta
            );

            if(tipo === "alumno"){
                const { data } = await dataProvider.getPromedioAsistenciaCurso(cursoId, desde, hasta);
                console.log("Promedios del curso:", data);
                setPromedios(data);
            }

            setRows(data);
            setBusquedaEjecutada(true);
            setSinAlumnos(false);
        } catch (err) {
            console.error(err);
            setBusquedaEjecutada(false);
        } finally {
            setLoading(false);
        }
    };

    const exportarPDF = async () => {
        await generarReportePDF({
            tipo: alumnoId ? "alumno" : "curso",
            cursos,
            cursoId,
            alumno: alumnoNombre,
            desde,
            hasta,
            metrics,
            rows,
        });
    };


    // ======================
    // Render
    // ======================
    return (
        <Box p={3}>
            <Typography variant="h5" fontWeight={600} mb={2}>
                Asistencias históricas
            </Typography>

            {/* === Filtros === */}
            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center" mb={3}>
                <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel>Curso</InputLabel>
                    <Select
                        value={cursoId}
                        label="Curso"
                        onChange={(e) => {
                            setCursoId(e.target.value);
                            setAlumnoId("");
                            setAlumnoNombre("");
                            setBusquedaEjecutada(false);
                            setRows([]);
                        }}
                    >
                        <MenuItem value="">Seleccionar curso</MenuItem>
                        {cursos.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                                {c.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 220 }}>
                    <InputLabel>Alumno (opcional)</InputLabel>
                    <Select
                        value={alumnoId}
                        label="Alumno (opcional)"
                        onChange={(e) => {
                            const id = e.target.value;
                            setAlumnoId(id);
                            const a = alumnos.find((x) => String(x.id_alumno) === id);
                            setAlumnoNombre(`${a?.alumno_apellido || ''} ${a?.alumno_nombre_prop || ''}`.trim());
                            setBusquedaEjecutada(false);
                            setRows([]);
                        }}
                        disabled={!alumnos.length}
                    >
                        <MenuItem value="">— Todos —</MenuItem>
                        {[...alumnos]
                            .sort((a, b) => {
                                const apA = (a?.alumno_apellido || '').toLocaleLowerCase();
                                const apB = (b?.alumno_apellido || '').toLocaleLowerCase();
                                const cmp = apA.localeCompare(apB, 'es', { sensitivity: 'base' });
                                if (cmp !== 0) return cmp;
                                const nA = `${a?.alumno_nombre_prop || ''} ${a?.alumno_apellido || ''}`.toLocaleLowerCase();
                                const nB = `${b?.alumno_nombre_prop || ''} ${b?.alumno_apellido || ''}`.toLocaleLowerCase();
                                return nA.localeCompare(nB, 'es', { sensitivity: 'base' });
                            })
                            .map((a) => (
                                <MenuItem key={a.id_alumno} value={a.id_alumno}>
                                    {(a?.alumno_apellido || '') + ' ' + (a?.alumno_nombre_prop || '')}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>

                <TextField
                    type="date"
                    label="Desde"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    type="date"
                    label="Hasta"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={18} /> : <SearchIcon />}
                    onClick={buscar}
                    disabled={!cursoId || loading}
                    sx={{ height: 40 }}
                >
                    {loading ? "Buscando..." : "Buscar"}
                </Button>

                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={exportarPDF}
                    disabled={!rows.length}
                    sx={{ height: 40 }}
                >
                    Generar PDF
                </Button>
            </Stack>

            {/* === Sin Resultados === */}
            {sinAlumnos && !loading && (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        mt: 6,
                        color: "#5f6368",
                        textAlign: "center",
                    }}
                >
                    <SearchOffIcon sx={{ fontSize: 60, mb: 1, color: "#9E9E9E" }} />
                    <Typography variant="h6" fontWeight="500">
                        No hay alumnos registrados en este curso.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "#9E9E9E" }}>
                        Verifica que el curso tenga alumnos asignados o selecciona otro curso.
                    </Typography>
                </Box>
            )}


            {/* === Resultados === */}
            {busquedaEjecutada && rows.length > 0 && (
                <>
                    {/* === Modo alumno: botón volver === */}
                    {isAlumnoSeleccionado && (
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => {
                                setAlumnoId("");
                                setAlumnoNombre("");
                                setBusquedaEjecutada(false);
                                setRows([]);
                            }}
                            sx={{ mb: 2 }}
                        >
                            Volver al análisis del curso
                        </Button>
                    )}

                    {/* === Cards === */}
                    <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
                        <MetricCard title="% Asistencia" value={`${metrics.pctAsistencia}%`} bg="#E6F4EA" color="#1E8E3E" />
                        <MetricCard title="% Tardanzas" value={`${metrics.pctTardanzas}%`} bg="#FEF7E0" color="#F9AB00" />
                        <MetricCard title="% Aus. Just." value={`${metrics.pctAusJust}%`} bg="#E8F0FE" color="#1967D2" />
                        <MetricCard title="% Aus. No Just." value={`${metrics.pctAusNoJust}%`} bg="#FDECEA" color="#D93025" />
                    </Stack>

                    <Stack direction="row" justifyContent="center" mb={3}>
                        <Card sx={{ width: "100%", backgroundColor: "#F1F3F4", textAlign: "center", borderTop: "4px solid #9EA3A8" }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700}>
                                    {metrics.totalClases}
                                </Typography>
                                <Typography variant="body2">Clases registradas</Typography>
                            </CardContent>
                        </Card>
                    </Stack>

                    {/* === GRÁFICOS === */}
                    {!isAlumnoSeleccionado ? (
                        <>
                            {/* --- MODO CURSO --- */}
                            <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3} mb={4}>
                                <ChartBox title="Días con más faltas">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={grouped}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="key" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="faltas" fill="#D93025" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartBox>

                                <ChartBox title="Días con más tardanzas">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={grouped}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="key" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="tardanzas" fill="#F9AB00" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartBox>
                            </Box>

                            <ChartBox title="Distribución general de asistencias">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: "Presente", value: metrics.pctAsistencia },
                                                { name: "Tarde", value: metrics.pctTardanzas },
                                                { name: "Aus. Just.", value: metrics.pctAusJust },
                                                { name: "Aus. No Just.", value: metrics.pctAusNoJust },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                            dataKey="value"
                                        >
                                            <Cell fill="#1E8E3E" />
                                            <Cell fill="#F9AB00" />
                                            <Cell fill="#1967D2" />
                                            <Cell fill="#D93025" />
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartBox>
                        </>
                    ) : (
                        <>
                            {/* --- MODO ALUMNO --- */}
                            <ChartBox title={`Evolución de ${alumnoNombre}`}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart
                                        data={rows
                                            .filter((r) => String(r.alumno_id) === String(alumnoId))
                                            .map((r) => ({
                                                fecha: r.fecha,
                                                estadoValor: estadoToValue(r.estado_nombre),
                                            }))}
                                    >
                                        <XAxis dataKey="fecha" />
                                        <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tickFormatter={valueToEstadoLabel} />
                                        <Tooltip formatter={(v) => valueToEstadoLabel(v)} labelFormatter={(l) => `Fecha: ${l}`} />
                                        <Line type="monotone" dataKey="estadoValor" stroke="#2b3e4c" dot />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartBox>

                            <ChartBox title="Distribución de asistencias del alumno">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: "Presente", value: metrics.pctAsistencia },
                                                { name: "Tarde", value: metrics.pctTardanzas },
                                                { name: "Aus. Just.", value: metrics.pctAusJust },
                                                { name: "Aus. No Just.", value: metrics.pctAusNoJust },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                            dataKey="value"
                                        >
                                            <Cell fill="#1E8E3E" />
                                            <Cell fill="#F9AB00" />
                                            <Cell fill="#1967D2" />
                                            <Cell fill="#D93025" />
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartBox>

                            <ChartBox title="Comparación con promedio del curso">
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={promedios.map(p => ({
                                        id: p.id_alumno,
                                        alumno: p.nombre_completo,
                                        promedio: p.promedio
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="alumno" hide />
                                        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`}/>
                                        <Tooltip formatter={(value) => `${value}%`}/>
                                        <Legend />
                                        <ReferenceLine y={metrics.pctAsistencia} stroke="#9EA3A8" strokeDasharray="3 3" label={{ value: "Promedio del curso", position: "left", fill: "#6b7280" }} />
                                        <Line type="monotone" dataKey="promedio" stroke="#1E88E5" name="% asistencia alumno" 
                                            dot={({ payload }) => (
                                                <circle
                                                cx={payload.cx}
                                                cy={payload.cy}
                                                r={payload.id === alumnoId ? 6 : 3} // más grande si es el alumno seleccionado
                                                fill={payload.id === alumnoId ? "#E53935" : "#1E88E5"} // rojo si es el alumno seleccionado
                                                />
                                            )}
                                            activeDot={{ r: 7 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartBox>
                        </>
                    )}

                    {/* === Ranking === */}
                    {!isAlumnoSeleccionado && ranking.length > 0 && (
                        <Box mt={3}>
                            <Typography variant="h6" fontWeight={600} mb={1}>
                                Ranking de alumnos por % de asistencia
                            </Typography>
                            <Box
                                component="table"
                                sx={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    background: "#fff",
                                    "& th, & td": {
                                        border: "1px solid #e0e0e0",
                                        p: 1,
                                        fontSize: 13,
                                        textAlign: "center",
                                    },
                                    "& th": { backgroundColor: "#f5f7fa", fontWeight: 700 },
                                    "& td:nth-of-type(2), & th:nth-of-type(2)": { textAlign: "left" },
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Alumno</th>
                                        <th>% Asistencia</th>
                                        <th>% Tardanzas</th>
                                        <th>% Aus. Just.</th>
                                        <th>% Aus. No Just.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.map((r, i) => (
                                        <tr key={r.alumno}>
                                            <td>{i + 1}</td>
                                            <td>{r.alumno}</td>
                                            <td>{r.pctAsistencia}%</td>
                                            <td>{r.pctTardanzas}%</td>
                                            <td>{r.pctAusJust}%</td>
                                            <td>{r.pctAusNoJust}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

// === Subcomponentes ===
const MetricCard = ({ title, value, bg, color }) => (
    <Card
        sx={{
            minWidth: 150,
            flex: 1,
            borderTop: `4px solid ${color}`,
            backgroundColor: bg,
            color,
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
    >
        <CardContent sx={{ py: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>
                {value}
            </Typography>
            <Typography variant="body2">{title}</Typography>
        </CardContent>
    </Card>
);


const ChartBox = ({ title, children }) => (
    <Box
        sx={{
            background: "#fff",
            borderRadius: 2,
            p: 2,
            border: "1px solid #e0e0e0",
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}
    >
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
            {title}
        </Typography>
        {children}
    </Box>
);
