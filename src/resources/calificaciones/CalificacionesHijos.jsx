import { useState, useEffect } from "react"
import { useDataProvider } from "react-admin"
import { 
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails, 
    Divider,
    Chip
} from "@mui/material"
import { ExpandMore } from "@mui/icons-material"
import { LoaderOverlay } from "../../components/LoaderOverlay"
import { CustomTable } from "../../components/CustomTable"
import { SummaryCard } from "../../components/SummaryCard"

export const CalificacionesHijos = () => {
    const dataProvider = useDataProvider();
    const [hijos, setHijos] = useState([]);
    const [loading, setLoading] = useState(true);

    const TABLE_HEADERS = [
        {label: "Alumno"},
        {label: "Curso"},
        {label: "Materia"},
        {label: "Tipo"},
        {label: "Calificación"},
        {label: "Fecha"},
        {label: "Docente"},
        {label: "Observaciones"}
    ];

    const TABLE_KEYS = [
        {key: "alumno"},
        {key: "curso"},
        {key: "materia"},
        {key: "tipo"},
        {key: "calificacion"},
        {key: "fecha"},
        {key: "docente"},
        {key: "observaciones"}
    ]

    useEffect(() => {
        const fetchData = async () => {
        try {
            const { data } = await dataProvider.getHijosPorTutor();

            const hijosConCalificaciones = await Promise.all(
                data.map(async (hijo) => {
                    try {
                        const { data: calificacionesData } = await dataProvider.getCalificacionesPorAlumno(hijo.id_alumno);

                        const calificaciones = calificacionesData.map(c => ({
                            ...c,
                            alumno: `${c.alumno.usuario.apellido} ${c.alumno.usuario.nombre}`,
                            curso: `${c.materiaCurso.curso.anio_escolar}° ${c.materiaCurso.curso.division}`,
                            materia: c.materiaCurso.materia.nombre,
                            tipo: c.tipoCalificacion.descripcion,
                            calificacion: parseFloat(c.nota),
                            fecha: new Date(c.fecha).toLocaleDateString(),
                            docente: `${c.materiaCurso.docentes[0].usuario.apellido} ${c.materiaCurso.docentes[0].usuario.nombre}`,
                            observaciones: c.observaciones || 'Ninguna',
                            ciclo_lectivo: c.materiaCurso.curso.cicloLectivo.anio,
                        }));

                        const anios = [...new Set(calificaciones.map(c => c.ciclo_lectivo))];

                        return {
                            alumno: hijo,
                            calificaciones,
                            anios
                        };
                    } catch (error) {
                        console.error("Error fetching calificaciones for hijo:", error);
                        return { alumno: hijo, calificaciones: [], anios: [] };
                    }
                })
            );

            setHijos(hijosConCalificaciones);
        } catch (error) {
            console.error("Error fetching hijos:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
    }, [dataProvider]);

    const getMejorCalificacion = (calificaciones, anio) => {
        const notas = calificaciones
            .filter(c => c.ciclo_lectivo == anio)
            .map(c => parseFloat(c.nota));
        return notas.length ? Math.max(...notas) : 0;
    };
    const getMateriaMejorCalificacion = (calificaciones, anio) => {
        return `Materia: ${
            calificaciones.map(c => c.ciclo_lectivo == anio && parseFloat(c.nota) === Math.max(...calificaciones.filter(c => c.ciclo_lectivo == anio).map(c => parseFloat(c.nota))) ? c.materia : null).filter(Boolean).join(', ')
        }`
    }

    const getPeorCalificacion = (calificaciones, anio) => {
        const notas = calificaciones
            .filter(c => c.ciclo_lectivo == anio)
            .map(c => parseFloat(c.nota));
        return notas.length ? Math.min(...notas) : 0;
    };

    const getMateriaPeorCalificacion = (calificaciones, anio) => {
        return `Materia: ${
            calificaciones.map(c => c.ciclo_lectivo == anio && parseFloat(c.nota) === Math.min(...calificaciones.filter(c => c.ciclo_lectivo == anio).map(c => parseFloat(c.nota))) ? c.materia : null).filter(Boolean).join(', ')
        }`
    }

    const getPromedio = (calificaciones, anio) => {
        return (calificaciones.filter(c => c.ciclo_lectivo == anio).reduce((acc, curr) => acc + parseFloat(curr.nota), 0) / calificaciones.filter(c => c.ciclo_lectivo == anio).length).toFixed(2);
    }

    return (
        <Box sx={{paddingBottom: 2}}>
            <LoaderOverlay open={loading} />
            {!loading && 
            <>
            <Typography variant="h4" sx={{ mb: 3, mt: 2 }}>
                Calificaciones de mis hijos
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }} >
                {hijos.map(hijo => (
                    <Accordion sx={{backgroundColor: "#E8EEF7"}} key={hijo.alumno.id_alumno}>
                        <AccordionSummary sx={{backgroundColor: "#F5F7FA"}} expandIcon={<ExpandMore />}>
                            <Box>
                                <Typography variant="h6">
                                    {`${hijo.alumno.usuario.apellido} ${hijo.alumno.usuario.nombre}`}
                                </Typography>
                                <Typography variant="subtitle1">
                                    Curso: {hijo.alumno.curso.anio_escolar}° {hijo.alumno.curso.division}
                                </Typography>
                                <Typography variant="subtitle2">
                                    {hijo.alumno.AlumnoTutor.parentesco}
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            {hijo.anios.map(anio => (
                                <Box key={anio}>
                                    <Divider key={anio} sx={{ mb: 2, mt:2 }}>
                                        <Chip label={anio} sx={{backgroundColor: "#061B46", color: "#fff"}}/>
                                    </Divider>
                                    <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 2 }}>
                                        <SummaryCard 
                                            title="Mejor calificación"
                                            mainContent={getMejorCalificacion(hijo.calificaciones, anio)}
                                            secondaryContent={getMateriaMejorCalificacion(hijo.calificaciones, anio)}
                                            type="success"
                                        />
                                        <SummaryCard 
                                            title="Peor calificación"
                                            mainContent={getPeorCalificacion(hijo.calificaciones, anio)}
                                            secondaryContent={getMateriaPeorCalificacion(hijo.calificaciones, anio)}
                                            type="error"
                                        />
                                        <SummaryCard 
                                            title="Promedio"
                                            mainContent={getPromedio(hijo.calificaciones, anio)}
                                            type="info"
                                        />
                                    </Box>
                                    <CustomTable 
                                        headers={TABLE_HEADERS}
                                        keys={TABLE_KEYS}
                                        dataArray={hijo.calificaciones.filter(c => c.ciclo_lectivo == anio)}
                                        editable={false}
                                    />
                                </Box>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
            </>}
        </Box>
    )
}