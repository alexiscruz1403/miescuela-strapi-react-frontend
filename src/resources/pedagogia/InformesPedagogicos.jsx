import { useState, useEffect } from "react";
import { 
    useDataProvider,
    useNotify,
} from "react-admin";
import {
    Grid,
    Autocomplete,
    TextField,
    CircularProgress,
    Button,
    Box,
    Typography, 
    Backdrop,
    TextareaAutosize
} from "@mui/material";
import { 
    Search,
    PictureAsPdf,
    Add,
    SearchOff
} from "@mui/icons-material";
import { InformePedagogicoTimeline } from "../../components/InformePedagogicoTimeline";
import { LoaderOverlay } from "../../components/LoaderOverlay";
import useUser from "../../contexts/UserContext/useUser";
import { generarReportePDF } from "./generarReportePDF";

export const InformesPedagogicos = () => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const { user } = useUser();

    const [informes, setInformes] = useState([]);
    const [filters, setFilters] = useState({
        cursos: [],
        alumnos: [],
        materias: []
    });
    const [selectedValues, setSelectedValues] = useState({
        curso: "",
        alumno: "",
        materia: ""
    });
    const [disabledActions, setDisabledActions] = useState({
        export: true,
        search: true,
    });

    const [addModalInputs, setAddModalInputs] = useState({
        materias: [],
        asesores: [],
    });

    const [loading, setLoading] = useState(false);
    const [emptyRecords, setEmptyRecords] = useState(false);
    const [openAddModal, setOpenAddModal] = useState(false);

    useEffect(() => {
            dataProvider
            .getCursosPorRol()
            .then(({ data }) =>{
                    setFilters((prevFilters) => ({
                        ...prevFilters,
                        cursos: data.map((c) => ({
                            id_curso: c.id_curso,
                            name: `${c.anio_escolar}° ${c.division}`,
                        })),
                    }));
            })
            .catch(() => setFilters((prevFilters) => ({ ...prevFilters, cursos: [] })))
            .finally(() => setLoading(false));
    }, [dataProvider]);

    useEffect(() => {
            if(!selectedValues.curso){
                setSelectedValues((prev) => ({ ...prev, alumno: "", materia: "" }));
                setDisabledActions((prev) => ({ ...prev, search: true }));
                return;
            }
    
            dataProvider
                .getMateriasCurso(selectedValues.curso.id_curso)
                .then(({ data }) => setFilters((prevFilters) => ({
                    ...prevFilters,
                    materias: data,
                })))
                .catch(() => setFilters((prevFilters) => ({ ...prevFilters, materias: [] })))
                .finally(() => setLoading(false));
    
            dataProvider
                .getAlumnosPorCurso(selectedValues.curso.id_curso)
                .then(({ data }) => setFilters((prevFilters) => ({
                    ...prevFilters,
                    alumnos: data,
                })))
                .catch(() => setFilters((prevFilters) => ({ ...prevFilters, alumnos: [] })))
                .finally(() => setLoading(false));
    }, [dataProvider, selectedValues.curso]);

    useEffect(() => {
        if(!selectedValues.alumno) setDisabledActions((prev) => ({ ...prev, search: true }));
        else setDisabledActions((prev) => ({ ...prev, search: false }));
    }, [selectedValues.alumno]);

    useEffect(() => {
        if(selectedValues.materia) setAddModalInputs((prev) => ({ ...prev, materias: [] }));
        else setAddModalInputs((prev) => ({ ...prev, materias: filters.materias }));
    }, [selectedValues.materia, filters.materias]);

    const handleSearch = async () => {
        setLoading(true);
        setDisabledActions((prev) => ({ ...prev, search: true }));

        try{
            const { data } = await dataProvider.getList('informes-pedagogicos', 
            { 
                filter: {
                    id_curso: selectedValues.curso.id_curso,
                    id_alumno: selectedValues.alumno ? selectedValues.alumno.id_alumno : "",
                    id_materia: selectedValues.materia ? selectedValues.materia.id_materia : "",
                }, 
                pagination: { page: 1, perPage: 100 }, 
                sort: { field: 'id_informe', order: 'ASC' } 
            });

            setInformes(data.map((informe) => ({
                id_informe: informe.id_informe,
                fecha: new Date(informe.fecha).toLocaleDateString(),
                contenido: informe.contenido,
                asesorPedagogico: `${informe.asesorPedagogico.usuario.apellido} ${informe.asesorPedagogico.usuario.nombre}`,
                materia: informe.materiaCurso.materia.nombre,
                curso: `${informe.materiaCurso.curso.anio_escolar}° ${informe.materiaCurso.curso.division}`,
                alumno: `${informe.alumno.usuario.apellido} ${informe.alumno.usuario.nombre}`,
                docente: `${informe.docente.usuario.apellido} ${informe.docente.usuario.nombre}`,
            })));

            if(data.length !== 0){
                setDisabledActions((prev) => ({ ...prev, export: false }));
                setEmptyRecords(false);
            }

            if(data.length === 0) setEmptyRecords(true);

            if(user.rol !== 'asesor_pedagogico'){
                const { data: asesores } = await dataProvider.getAsesoresPedagogicos();
                setAddModalInputs((prev) => ({
                    ...prev,
                    asesores: asesores,
                }));
            }
        }catch(error){
            setInformes([]);
            console.error("Error fetching informes pedagógicos:", error);
        }finally{
            setLoading(false);
            setDisabledActions((prev) => ({ ...prev, search: false }));
        }
    };

    const handleSave = async (alumno, curso, materia, asesor, contenido) => {
        try{
            setLoading(true);
            const body = {
                id_alumno: alumno.id_alumno,
                id_curso: curso.id_curso,
                id_materia: materia.id_materia,
                id_asesor: asesor ? asesor.id_asesor : null,
                contenido: contenido,
            }
            await dataProvider.crearInformePedagogico(body);
            notify("Informe pedagógico creado exitosamente", { type: "success" });
        }catch(error){
            notify(`Error creando informe pedagógico: ${error.message}`, { type: "error" });
            console.error("Error creating informe pedagógico:", error);
        }finally{
            setLoading(false);
            setOpenAddModal(false);
            handleSearch();
        }
    }

    const handleExportPDF = async () => {
        await generarReportePDF({
            curso: selectedValues.curso,
            alumno: selectedValues.alumno,
            materia: selectedValues.materia,
            informes: informes,
        });
    };

    return(
        <Box>
            <Grid container spacing={2} alignItems="center">
                {/* Selección de curso */}
                <Grid>
                    <Autocomplete
                        options={filters.cursos}
                        getOptionLabel={(option) => option.name || ""}
                        style={{ width: 300 }}
                        value={filters.cursos.find(c => c.id_curso === selectedValues.curso.id_curso) || null}
                        onChange={(event, newValue) => {
                            setSelectedValues({ ...selectedValues, curso: newValue ? newValue : "" });
                        }}
                        renderInput={(params) => <TextField {...params} label="Seleccionar curso" variant="outlined" />}
                    />
                </Grid>

                {/* Selección de alumno */}
                {selectedValues.curso &&
                    <>
                    <Grid>
                        <Autocomplete
                            options={filters.alumnos}
                            getOptionLabel={(option) => `${option.usuario.apellido} ${option.usuario.nombre} `}
                            style={{ width: 300 }}
                            value={filters.alumnos.find(a => a.id_alumno === selectedValues.alumno.id_alumno) || null}
                            onChange={(event, newValue) => {
                                setSelectedValues({ ...selectedValues, alumno: newValue ? newValue : "" });
                            }}
                            renderInput={(params) => <TextField {...params} label="Seleccionar alumno" variant="outlined" />}
                        />
                    </Grid>

                    <Grid>
                        <Autocomplete
                            options={filters.materias}
                            getOptionLabel={(option) => option.nombre || ""}
                            style={{ width: 300 }}
                            value={filters.materias.find(m => m.id_materia === selectedValues.materia.id_materia) || null}
                            onChange={(event, newValue) => {
                                setSelectedValues({ ...selectedValues, materia: newValue ? newValue : "" });
                            }}
                            renderInput={(params) => <TextField {...params} label="Seleccionar materia(opcional)" variant="outlined" />}
                        />
                    </Grid>
                    </>
                }

                {/* Botón para buscar */}
                <Grid>
                    <Button 
                        variant="outlined"
                        color="secondary"
                        startIcon={loading ? <CircularProgress size={18} /> : <Search />}
                        onClick={handleSearch}
                        disabled={disabledActions.search || loading}
                        sx={{height: 40}} 
                    >
                        Buscar
                    </Button>
                </Grid>

                {/* Botón para exportar PDF */}
                <Grid>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<PictureAsPdf />}
                        onClick={handleExportPDF}
                        disabled={disabledActions.export || loading}
                        sx={{ height: 40 }}
                    >
                        Generar PDF
                    </Button>
                </Grid>
            </Grid>
            {emptyRecords && 
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
                    <SearchOff sx={{ fontSize: 60, mb: 1, color: "#9E9E9E" }} />
                    <Typography variant="h6" fontWeight="500">
                        No hay registros de informes pedagógicos para los filtros seleccionados.
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Intente con otros filtros o agregue un nuevo informe pedagógico.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Add />}
                            onClick={() => setOpenAddModal(true)}
                        >
                            Agregar informe
                        </Button>
                        <InformePedagogicoTimeline informes={informes} />
                        {openAddModal && 
                            <AddModal 
                                alumno={selectedValues.alumno} 
                                curso={selectedValues.curso} 
                                materia={selectedValues.materia}
                                inputs={addModalInputs}
                                onSave={handleSave} 
                                onCancel={() => setOpenAddModal(false)}
                            />
                        }
                    </Box>
                </Box>
            }
            {!emptyRecords && informes.length > 0 &&
                <Box sx={{ mt: 1, paddingY: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={() => setOpenAddModal(true)}
                    >
                        Agregar informe
                    </Button>
                    <InformePedagogicoTimeline informes={informes} />
                    {openAddModal && 
                        <AddModal 
                            alumno={selectedValues.alumno} 
                            curso={selectedValues.curso} 
                            materia={selectedValues.materia}
                            inputs={addModalInputs}
                            onSave={handleSave} 
                            onCancel={() => setOpenAddModal(false)}
                        />
                    }
                </Box>
            }
            <LoaderOverlay open={loading} />
        </Box>
    )
}

const AddModal = ({ alumno, curso, materia = null, onSave, onCancel, inputs }) => {
    const message = materia ?
        `Agregar nuevo informe pedagógico para ${alumno.usuario.apellido} ${alumno.usuario.nombre} en ${materia.nombre} - ${curso.name}` :
        `Agregar nuevo informe pedagógico para ${alumno.usuario.apellido} ${alumno.usuario.nombre} en ${curso.name}`;

    const [inputValues, setInputValues] = useState({
        materia: materia || "",
        asesor: "",
        contenido: "",
    });

    const [errors, setErrors] = useState({
        materia: "",
        asesor: "",
        contenido: "",
    });

    const handleSave = () => {
        if(!inputValues.contenido.trim()) setErrors((prev) => ({ ...prev, contenido: "El contenido del informe no puede estar vacío." }));

        if(!inputValues.asesor) setErrors((prev) => ({ ...prev, asesor: "Debe seleccionar un asesor pedagógico." }));

        if(!inputValues.materia && inputs.materias.length > 0) setErrors((prev) => ({ ...prev, materia: "Debe seleccionar una materia." }));

        if(Object.values(errors).some((error) => error !== "")) return;

        onSave(alumno, curso, inputValues.materia, inputValues.asesor, inputValues.contenido);
    }

    return (
        <Backdrop open={true}>
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, minWidth: 300 }}>
                <Typography variant="h6" gutterBottom>
                    {message}
                </Typography>
                <Box>
                    <Grid container spacing={2} sx={{ display: inputs.asesores && inputs.materias ? 'flex' : 'none', mt: 2, mb: 2 }}>
                        {inputs.materias.length > 0 && (
                            <Grid size={6}>
                                <Autocomplete
                                    options={inputs.materias}
                                    getOptionLabel={(option) => option.nombre || ""}
                                    style={{ width: 300 }}
                                    value={inputs.materias.find(m => m.id_materia === inputValues.materia.id_materia) || null}
                                    onChange={(event, newValue) => {
                                        setInputValues({ ...inputValues, materia: newValue ? newValue : "" });
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Seleccionar materia" variant="outlined" />}
                                />
                                {errors.materia && <Typography color="error" variant="body2">{errors.materia}</Typography>}
                            </Grid>
                        )}
                        {inputs.asesores.length > 0 && (
                            <Grid size={6} sx={{ display: inputs.asesores ? 'block' : 'none' }}>
                                <Autocomplete
                                    options={inputs.asesores}
                                    getOptionLabel={(option) => `${option.usuario.apellido} ${option.usuario.nombre}`}
                                    style={{ width: 300 }}
                                    value={inputs.asesores.find(a => a.id_asesor === inputValues.asesor.id_asesor) || null}
                                    onChange={(event, newValue) => {
                                        setInputValues({ ...inputValues, asesor: newValue ? newValue : "" });
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Seleccionar asesor" variant="outlined" />}
                                />
                                {errors.asesor && <Typography color="error" variant="body2">{errors.asesor}</Typography>}
                            </Grid>
                        )}
                    </Grid>
                    <TextareaAutosize
                        minRows={5}
                        maxRows={10}
                        placeholder="Escriba el contenido del informe pedagógico aquí..."
                        style={{ width: '100%', padding: 8, fontSize: 16 }}
                        value={inputValues.contenido}
                        onChange={(e) => setInputValues({ ...inputValues, contenido: e.target.value })}
                    />
                    {errors.contenido && <Typography color="error" variant="body2">{errors.contenido}</Typography>}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleSave}>
                        Guardar
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={onCancel}>
                        Cancelar
                    </Button>
                </Box>
            </Box>
        </Backdrop>
    )
}
