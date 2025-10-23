import { useEffect, useState } from "react";
import {
    useDataProvider
} from "react-admin";
import {
    Box, 
    Typography,
    Grid,
    Divider,
    Chip,
    Autocomplete,
    TextField,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Snackbar,
    Alert,
    CircularProgress,
} from "@mui/material";
import { 
    Search,
    ExpandMore,
    PictureAsPdf,
    Info,
    Edit,
    SearchOff
} from "@mui/icons-material";
import { SummaryCard } from "../../components/SummaryCard";
import { CustomTable } from "../../components/CustomTable";
import { LoaderOverlay } from "../../components/LoaderOverlay";
import { generarReportePDF } from "./generarReportePDF";
import useUser from "../../contexts/UserContext/useUser";

export const Calificaciones = () => {
    const dataProvider = useDataProvider();

    const [cursos, setCursos] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [selectableMaterias, setSelectableMaterias] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [tiposCalificaciones, setTiposCalificaciones] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [selectedCurso, setSelectedCurso] = useState("");
    const [selectedMateria, setSelectedMateria] = useState("");
    const [selectedAlumno, setSelectedAlumno] = useState("");
    const [calificaciones, setCalificaciones] = useState([]);
    const [anios, setAnios] = useState([]);
    const [title, setTitle] = useState("");
    const [displayWithAccordion, setDisplayWithAccordion] = useState(true);
    const [showEmptyAlumnosMessage, setShowEmptyAlumnosMessage] = useState(false);
    const [showEmptyMateriasMessage, setShowEmptyMateriasMessage] = useState(false);
    const [showEmptyCalificacionesMessage, setShowEmptyCalificacionesMessage] = useState(false);
    const [disabledSearchButton, setDisabledSearchButton] = useState(true);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(true);

    const CURRENT_YEAR = new Date().getFullYear().toString();

    const { user } = useUser();
    const EDIT_PERMISSION = user.rol === "docente" || user.rol === "admin";

    const TABLE_HEADERS = [
        { label: "Alumno", editable: false },
        { label: "Materia", editable: false },
        { label: "Calificación", editable: true },
        { label: "Tipo", editable: true },
        { label: "Fecha", editable: false },
        { label: "Ciclo Lectivo", editable: false },
        { label: "Curso", editable: false },
        { label: "Docente", editable: false },
        { label: "Observaciones", editable: true },
    ];
    const TABLE_KEYS = [
        { key: "alumno", editable: false, creatable: true, default: "", type: "select", options: [] },
        { key: "materia", editable: false }, 
        { key: "nota", editable: true, creatable: true, type: "number", required: true, default: 1 }, 
        { key: "tipo", editable: true, creatable: true, required: true, type: "select", options: [], default: "" }, 
        { key: "fecha", editable: false, default: new Date(Date.now()).toLocaleDateString() }, 
        { key: "ciclo_lectivo", editable: false },
        { key: "curso", editable: false},
        { key: "docente", editable: false, default: "" }, 
        { key: "observaciones", editable: true, creatable: true, type: "text", default: "Ninguna" },
    ];

    useEffect(() => {
        dataProvider
            .getCursosPorRol()
            .then(({ data }) =>{
                    setCursos(
                        data.map((c) => ({
                            id_curso: c.id_curso,
                            name: `${c.anio_escolar}° ${c.division}`,
                        })));
            })
            .catch(() => setCursos([]))
            .finally(() => setLoading(false));
    }, [dataProvider]);

    useEffect(() => {
        if(!selectedCurso){
            setDisabledSearchButton(true);
            return;
        }

        dataProvider
            .getMateriasCurso(selectedCurso.id_curso)
            .then(({ data }) => setMaterias(data))
            .catch(() => setMaterias([]))
            .finally(() => setLoading(false));

        dataProvider
            .getAlumnosPorCurso(selectedCurso.id_curso)
            .then(({ data }) => setAlumnos(data))
            .catch(() => setAlumnos([]))
            .finally(() => setLoading(false));
    }, [dataProvider, selectedCurso]);

    useEffect(() => {
        if(!selectedCurso) return;

        setShowEmptyAlumnosMessage(false);
        setShowEmptyMateriasMessage(false);

        if(alumnos.length === 0 && calificaciones.length !== 0){
            setShowEmptyAlumnosMessage(true);
            setDisabledSearchButton(true);
            return;
        }

        if(materias.length === 0 && calificaciones.length !== 0){
            setShowEmptyMateriasMessage(true);
            setDisabledSearchButton(true);
            return;
        }

        setDisabledSearchButton(false);
    }, [alumnos, materias]);

    useEffect(() => {
        const uniqueAnios = [...new Set(calificaciones.map(c => c.ciclo_lectivo))];
        setAnios(uniqueAnios);

        let title = selectedCurso.name;
        if(selectedAlumno) title += ` - ${selectedAlumno.usuario.apellido} ${selectedAlumno.usuario.nombre}`;
        if(selectedMateria) title += ` - ${selectedMateria.nombre}`;
        setTitle(title);

        if(EDIT_PERMISSION){
            dataProvider
            .getTiposCalificaciones()
            .then(({ data }) => {
                setTiposCalificaciones(data);
            }).catch(() => {
                TABLE_KEYS.find(k => k.key === "tipo").options = [];
            });
        }
    }, [calificaciones]);

    const handleSearch = async () => {
        setLoading(true);
        setSelectableMaterias(materias);

        dataProvider
            .getList("calificaciones", {
                pagination: { page: 1, perPage: 100 },
                sort: {},
                filter: { id_curso: selectedCurso.id_curso ?? "", id_materia: selectedMateria.id_materia ?? "", id_alumno: selectedAlumno.id ?? "" },
            })
            .then(({ data }) => {
                const mappedData = data.map((c) => {
                    return {
                        ciclo_lectivo: c.materiaCurso.curso.cicloLectivo.anio,
                        id_materia: c.materiaCurso.id_materia,
                        alumno: `${c.alumno.usuario.apellido} ${c.alumno.usuario.nombre}`,
                        materia: c.materiaCurso.materia.nombre,
                        nota: c.nota,
                        tipo: c.tipoCalificacion.descripcion,
                        fecha: new Date(c.fecha).toLocaleDateString(),
                        curso: `${c.materiaCurso.curso.anio_escolar}° ${c.materiaCurso.curso.division}`,
                        docente: `${c.docente.usuario.apellido} ${c.docente.usuario.nombre}`,
                        observaciones: c.observaciones || "Ninguna",
                        id: c.id_calificacion,
                        publicado: c.publicado,
                    }
                });
                setCalificaciones(mappedData);

                if(mappedData.length === 0) setShowEmptyCalificacionesMessage(true);
                else setShowEmptyCalificacionesMessage(false);
            })
            .catch(() => {
                setCalificaciones([]);
                setShowEmptyCalificacionesMessage(true);
            })
            .finally(() => setLoading(false));

        dataProvider.getDocentesPorCurso(selectedCurso.id_curso)
            .then(({ data }) => {
                setDocentes(data.map(d => ({
                    id: d.id_docente,
                    usuario: d.usuario,
                    materias: d.materiasCurso.map(mc => mc.materia)
                })));
            })
            .catch(() => {
                setDocentes([]);
            });

        if(selectedMateria) setDisplayWithAccordion(false);
        else setDisplayWithAccordion(true);
    }

    const getPorcentajeAprobadas = (anio, materia = null, curso = null) => {
        return (calificaciones.filter(c => c.ciclo_lectivo === anio && c.nota >= 6 && (materia ? c.id_materia === materia.id_materia : true) && (curso ? c.id_curso === curso.id_curso : true)).length / calificaciones.filter(c => c.ciclo_lectivo === anio && (materia ? c.id_materia === materia.id_materia : true) && (curso ? c.id_curso === curso.id_curso : true)).length * 100).toFixed(2);
    }

    const getTotalAprobadas = (anio, materia = null, curso = null) => {
        return `Total: ${calificaciones.filter(c => c.ciclo_lectivo === anio && c.nota >= 6 && (materia ? c.id_materia === materia.id_materia : true) && (curso ? c.id_curso === curso.id_curso : true)).length}`;
    }

    const getPorcentajeReprobadas = (anio, materia = null, curso = null) => {
        return (calificaciones.filter(c => c.ciclo_lectivo === anio && c.nota < 6 && (materia ? c.id_materia === materia.id_materia : true) && (curso ? c.id_curso === curso.id_curso : true)).length / calificaciones.filter(c => c.ciclo_lectivo === anio && (materia ? c.id_materia === materia.id_materia : true) && (curso ? c.id_curso === curso.id_curso : true)).length * 100).toFixed(2);
    }

    const getTotalReprobadas = (anio, materia = null, curso = null) => {
        return `Total: ${calificaciones.filter(c => c.ciclo_lectivo === anio && c.nota < 6 && (materia ? c.id_materia === materia.id_materia : true) && (curso ? c.id_curso === curso.id_curso : true)).length}`;
    }

    const getPromedioGeneral = (anio, materia = null, curso = null) => {
        return (calificaciones.filter(c => c.ciclo_lectivo === anio && (materia ? c.id_materia === materia.id_materia : true) && (curso ? c.id_curso === curso.id_curso : true)).reduce((acc, curr) => acc + parseFloat(curr.nota), 0) / calificaciones.filter(c => c.ciclo_lectivo === anio && (materia ? c.id_materia === materia.id_materia : true) && (curso ? c.id_curso === curso.id_curso : true)).length).toFixed(2)
    }

    const exportarPDF = async () => {
        await generarReportePDF({ type: "curso", curso: selectedCurso, materia: selectedMateria, calificaciones: calificaciones, anios: anios });
    }

    const formatKeys = (anio, idMateria, published) => {
        const formatted = TABLE_KEYS.map(key => {
            const newKey = { ...key };
            if(key.key == "alumno" && !selectedAlumno) {
                newKey.options = alumnos.map(a => ({ id: a.id_alumno, label: `${a.usuario.apellido} ${a.usuario.nombre}` }))
                newKey.type = "select";
            };
            if(key.key == "alumno" && selectedAlumno) {
                newKey.default = `${selectedAlumno.usuario.apellido} ${selectedAlumno.usuario.nombre}`;
                newKey.type = "text";
            }
            if(key.key == "materia") newKey.default = materias.find(m => m.id_materia === (idMateria || selectedMateria?.id_materia))?.nombre || "";
            if(key.key == "ciclo_lectivo") newKey.default = anio;
            if(key.key == "docente" && user.rol == "docente") newKey.default = `${user.apellido} ${user.nombre}`;
            if(key.key == "docente" && user.rol == "admin"){
                newKey.type = "select";
                newKey.editable = true;
                newKey.required = true;
                const materiaDocente = materias.find(m => m.id_materia === (idMateria || selectedMateria?.id_materia));
                const docentesMateria = docentes.filter(d => d.materias.some(mat => mat.id_materia === materiaDocente.id_materia));
                newKey.options = docentesMateria.map(d => ({ id: d.id, label: `${d.usuario.apellido} ${d.usuario.nombre}` }));
            }
            if(key.key == "curso") newKey.default = selectedCurso.name;
            if(key.key == "tipo") newKey.options = tiposCalificaciones.map(t => ({ id: t.id_tipo_calificacion, label: t.descripcion }));
            return newKey;
        });
        if(published){
            return [...formatted, { key: "editable" }];
        }
        return formatted;
    }

    const handleSave = async (updatedRows, addedRows) => {
        setLoading(true);

        console.log("Updated Rows:", updatedRows);
        console.log("Added Rows:", addedRows);

        const mappedUpdatedRows = updatedRows.map(r => {
            let docenteId = typeof r.docente === "string" ?
                null:
                r.docente;

            return {
                id_calificacion: r.id,
                id_tipo_calificacion: r.tipo,
                id_docente: docenteId,
                nota: r.nota,
                observaciones: r.observaciones,
            };
        });

        const mappedAddedRows = addedRows.map(r => {
            let alumnoId = typeof r.alumno === "string" ?
                alumnos.find(a => `${a.usuario.apellido} ${a.usuario.nombre}` === r.alumno)?.id_alumno
                : r.alumno;

            let docenteId = typeof r.docente === "string" ?
                null:
                r.docente;
            return{
                id_alumno: alumnoId,
                id_materia: materias.find(m => m.nombre === r.materia)?.id_materia || null,
                id_curso: cursos.find(c => c.name === r.curso)?.id_curso || null,
                id_tipo_calificacion: r.tipo,
                id_docente: docenteId,
                nota: r.nota,
                observaciones: r.observaciones
            }
        });

        console.log("Mapped Updated Rows:", mappedUpdatedRows);
        console.log("Mapped Added Rows:", mappedAddedRows);

        try{

                if(mappedUpdatedRows.length > 0) await dataProvider.updateManyCalificaciones(mappedUpdatedRows);
                if(mappedAddedRows.length > 0) await dataProvider.createManyCalificaciones(mappedAddedRows);

            setSuccess(true);
            setMessage("Cambios guardados correctamente");
            setOpen(true);

            const filter = { id_curso: selectedCurso.id_curso };
            if(selectedMateria) filter.id_materia = selectedMateria.id_materia;
            if(selectedAlumno) filter.id_alumno = selectedAlumno.id_alumno;

            const { data } = await dataProvider.getList("calificaciones", {
                pagination: { page: 1, perPage: 100 },
                sort: {},
                filter: filter,
            });
            const mappedData = data.map((c) => {
                return {
                    ciclo_lectivo: c.materiaCurso.curso.cicloLectivo.anio,
                    id_materia: c.materiaCurso.id_materia,
                    alumno: `${c.alumno.usuario.apellido} ${c.alumno.usuario.nombre}`,
                    materia: c.materiaCurso.materia.nombre,
                    nota: c.nota,
                    tipo: c.tipoCalificacion.descripcion,
                    fecha: new Date(c.fecha).toLocaleDateString(),
                    curso: `${c.materiaCurso.curso.anio_escolar}° ${c.materiaCurso.curso.division}`,
                    docente: `${c.docente.usuario.apellido} ${c.docente.usuario.nombre}`,
                    observaciones: c.observaciones || "Ninguna",
                    id: c.id_calificacion,
                    publicado: c.publicado,
                }
            });
            setCalificaciones(mappedData);
            if(mappedData.length === 0) setShowEmptyCalificacionesMessage(true);
            else setShowEmptyCalificacionesMessage(false);
        }catch(error){
            console.error("Error en la operación de calificaciones:", error);
            handleError("Error en la operación de calificaciones");
        }finally{
            setLoading(false);
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    const handleError = (errorMessage) => {
        setSuccess(false);
        setMessage(errorMessage);
        setOpen(true);
    }

    return (
        <Box sx={{paddingBottom: 2}}>
            <LoaderOverlay open={loading} />
            <Grid container spacing={2} alignItems="center">
                {/* Selección de curso */}
                <Grid item>
                    <Autocomplete
                        options={cursos}
                        getOptionLabel={(option) => option.name || ""}
                        style={{ width: 300 }}
                        value={cursos.find(c => c.id_curso === selectedCurso.id_curso) || null}
                        onChange={(event, newValue) => {
                            setSelectedCurso(newValue ? newValue : "");
                        }}
                        renderInput={(params) => <TextField {...params} label="Seleccionar curso" variant="outlined" />}
                    />
                </Grid>

                {/* Selección de alumno */}
                {selectedCurso &&
                    <Grid item>
                        <Autocomplete
                            options={alumnos}
                            getOptionLabel={(option) => `${option.usuario.apellido} ${option.usuario.nombre} `}
                            style={{ width: 300 }}
                            value={alumnos.find(a => a.id_alumno === selectedAlumno.id_alumno) || null}
                            onChange={(event, newValue) => {
                                setSelectedAlumno(newValue ? newValue : "");
                            }}
                            renderInput={(params) => <TextField {...params} label="Seleccionar alumno(opcional)" variant="outlined" />}
                        />
                    </Grid>
                }

                {/* Selección de materia */}
                {selectedCurso && 
                    <Grid item>
                        <Autocomplete
                            options={materias}
                            getOptionLabel={(option) => option.nombre || ""}
                            style={{ width: 300 }}
                            value={materias.find(m => m.id_materia === selectedMateria.id_materia) || null}
                            onChange={(event, newValue) => {
                                setSelectedMateria(newValue ? newValue : "");
                            }}
                            renderInput={(params) => <TextField {...params} label="Seleccionar materia(opcional)" variant="outlined" />}
                        />
                    </Grid>
                }

                {/* Botón para buscar */}
                <Grid item>
                    <Button 
                        variant="outlined"
                        color="secondary"
                        startIcon={loading ? <CircularProgress size={18} /> : <Search />}
                        onClick={handleSearch}
                        disabled={disabledSearchButton}
                        sx={{height: 40}} 
                    >
                        Buscar
                    </Button>
                </Grid>

                {/* Botón para exportar PDF */}
                <Grid item>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<PictureAsPdf />}
                        onClick={exportarPDF}
                        disabled={!calificaciones.length}
                        sx={{ height: 40 }}
                    >
                        Generar PDF
                    </Button>
                </Grid>
            </Grid>

            {/* === No hay alumnos en el curso === */}
            {showEmptyAlumnosMessage && (
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
                    <SearchOff sx={{ fontSize: 60, mb: 1, color: "#9E9E9E" }} />
                    <Typography variant="h6" fontWeight="500">
                        No hay alumnos registrados en este curso.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "#9E9E9E" }}>
                        Verifica que el curso tenga alumnos asignados o selecciona otro curso.
                    </Typography>
                </Box>
            )}

            {/* === No hay materias en el curso === */}
            {showEmptyMateriasMessage && (
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
                    <SearchOff sx={{ fontSize: 60, mb: 1, color: "#9E9E9E" }} />
                    <Typography variant="h6" fontWeight="500">
                        No hay materias asignadas en este curso.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "#9E9E9E" }}>
                        Verifica que el curso tenga materias asignadas o selecciona otro curso.
                    </Typography>
                </Box>
            )}
            
            {/* Mostrar calificaciones */}
            <Typography variant="h4" mt={2}>
                {title}
            </Typography>
            <Box>
                {showEmptyCalificacionesMessage && !loading &&
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
                        <SearchOff sx={{ fontSize: 60, mb: 1, color: "#9E9E9E" }} />
                        <Typography variant="h6" fontWeight="500">
                            No hay calificaciones cargadas en este curso.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, color: "#9E9E9E" }}>
                            Verifica que el curso tenga calificaciones cargadas o selecciona otro curso.
                        </Typography>
                    </Box>
                }
                {!loading && calificaciones.length > 0 && anios.map(anio => (
                    <Box key={anio} mb={4} mt={2}>
                        <Divider>
                            <Chip label={anio} sx={{backgroundColor: "#061B46", color: "#fff"}}/>
                        </Divider>
                        {!displayWithAccordion && (
                            <Box sx={{backgroundColor: "#F2F6FB", p: 2, borderRadius: 1, mt: 2}}>
                                <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 2 }}>
                                    <SummaryCard
                                        title="% Notas >= 6"
                                        mainContent={getPorcentajeAprobadas(anio)}
                                        secondaryContent={getTotalAprobadas(anio)}
                                        type="success"
                                    />
                                    <SummaryCard
                                        title="% Notas < 6"
                                        mainContent={getPorcentajeReprobadas(anio)}
                                        secondaryContent={getTotalReprobadas(anio)}
                                        type="error"
                                    />
                                    <SummaryCard
                                        title="Promedio general"
                                        mainContent={getPromedioGeneral(anio)}
                                        type="info"
                                    />
                                </Box>
                                <CustomTable 
                                    headers={TABLE_HEADERS} 
                                    dataArray={calificaciones.filter(c => c.ciclo_lectivo === anio)} 
                                    keys={formatKeys(anio, selectedMateria.id_materia, EDIT_PERMISSION && anio === CURRENT_YEAR)}
                                    onSave={handleSave}
                                    onError={handleError}
                                    editable={EDIT_PERMISSION && anio === CURRENT_YEAR}
                                />
                            </Box>
                        )}
                        {displayWithAccordion && (
                            <Box>
                                {selectableMaterias.map(m => (
                                    <Accordion key={m.id} sx={{ mt: 2 }}>
                                        <AccordionSummary sx={{backgroundColor: "#E8EEF7"}} expandIcon={<ExpandMore />}>
                                            <Typography variant="h6">{m.nombre}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{backgroundColor: "#F2F6FB"}}>
                                            {calificaciones.filter(c => c.ciclo_lectivo === anio && c.id_materia === m.id_materia).length === 0 ? (
                                                <Typography variant="body2" sx={{ fontStyle: "italic", color: "#616161", mb: 2, mt: 2, textAlign: "center" }}>
                                                    No hay calificaciones cargadas para esta materia en el ciclo lectivo {anio}.
                                                </Typography>
                                            ) : (
                                            <>
                                                <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 2 }}>
                                                    <SummaryCard 
                                                        title="% Notas >= 6" 
                                                        mainContent={(getPorcentajeAprobadas(anio, m))}
                                                        secondaryContent={getTotalAprobadas(anio, m)} 
                                                        type="success" 
                                                    />
                                                    <SummaryCard
                                                        title="% Notas < 6"
                                                        mainContent={(getPorcentajeReprobadas(anio, m))}
                                                        secondaryContent={getTotalReprobadas(anio, m)}
                                                        type="error"
                                                    />
                                                    <SummaryCard
                                                        title="Promedio general"
                                                        mainContent={(getPromedioGeneral(anio, m))}
                                                        type="info"
                                                    />
                                                </Box>
                                            </>
                                            )}
                                            <CustomTable 
                                                headers={TABLE_HEADERS}
                                                dataArray={calificaciones
                                                    .filter(c => c.ciclo_lectivo === anio && c.id_materia === m.id_materia)
                                                }
                                                keys={formatKeys(anio, m.id_materia, EDIT_PERMISSION && anio === CURRENT_YEAR)}
                                                onSave={handleSave}
                                                onError={handleError}
                                                editable={EDIT_PERMISSION && anio === CURRENT_YEAR}
                                            />
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>

            <Snackbar
                open={open}
                autoHideDuration={3000} // se oculta después de 3 segundos
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }} // abajo centrado
            >
                <Alert
                    onClose={handleClose}
                    severity={success ? "success" : "error"}
                    sx={{ width: "100%" }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </Box>
    );
}