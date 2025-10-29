import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import {
  School,
  Person,
  Today,
  TrendingUp,
  Event,
} from '@mui/icons-material';
import { useDataProvider, usePermissions } from 'react-admin';
import { getMonthlyHolidays } from '../services/nager';
import { api } from '../services/api';

// Tarjeta con animaci�n de conteo
const StatCard = ({ title, value, icon, color, trend, duration = 1200 }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;

    const startValue = display;
    const endValue = value;
    const startTime = performance.now();
    let rafId;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const current = Math.round(startValue + (endValue - startValue) * eased);
      setDisplay(current);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return (
    <Card sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}30`,
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color }}>
              {typeof value === 'number' ? display : value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#4caf50' }}>
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const Dashboard = () => {
  const dataProvider = useDataProvider();
  const { permissions } = usePermissions();

  const [stats, setStats] = useState({ alumnos: 0, docentes: 0, cursos: 0, asistenciasHoy: 0 });
  const [loading, setLoading] = useState(true);

  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidaysError, setHolidaysError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let alumnos = 0, docentes = 0, cursos = 0;

        try {
          const conteosRes = await api.get('/estadisticas/conteos');
          const data = conteosRes?.data || {};
          alumnos = Number(data.alumnos || 0);
          docentes = Number(data.docentes || 0);
          cursos = Number(data.cursos || 0);
        } catch (e) {
          console.error('Fallo /estadisticas/conteos, intentando fallback', e);
          // Fallback a dataProvider si el endpoint no existe
          try {
            const [alumnosRes, docentesRes, cursosRes] = await Promise.all([
              dataProvider.getList('alumnos', { pagination: { page: 1, perPage: 1 }, sort: { field: 'id', order: 'ASC' }, filter: {} }),
              dataProvider.getList('docentes', { pagination: { page: 1, perPage: 1 }, sort: { field: 'id', order: 'ASC' }, filter: {} }),
              dataProvider.getList('cursos', { pagination: { page: 1, perPage: 1 }, sort: { field: 'id', order: 'ASC' }, filter: {} }),
            ]);
            alumnos = alumnosRes.total || alumnosRes.data?.length || 0;
            docentes = docentesRes.total || docentesRes.data?.length || 0;
            cursos = cursosRes.total || cursosRes.data?.length || 0;
          } catch (fallbackErr) {
            console.error('Fallo fallback de conteos', fallbackErr);
          }
        }

        // Asistencias queda en 0 (hardcodeado)
        setStats({ alumnos, docentes, cursos, asistenciasHoy: 0 });
      } catch (error) {
        console.error('Error cargando estadisticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dataProvider]);

  useEffect(() => {
    const fetchHolidays = async () => {
      setHolidaysLoading(true);
      setHolidaysError(null);
      try {
        const list = await getMonthlyHolidays('AR', new Date());
        setHolidays(list || []);
      } catch (err) {
        console.error('Error cargando feriados:', err);
        setHolidaysError('No se pudieron cargar los feriados');
      } finally {
        setHolidaysLoading(false);
      }
    };
    fetchHolidays();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#0A2E75', fontWeight: 600 }}>
          Panel General
        </Typography>
        <Typography variant="body1" sx={{ color: '#666' }}>
          Bienvenido a MiEscuela 4.0 - Vista general del sistema
        </Typography>
      </Box>

      {/* Tarjetas de estadisticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Alumnos"
            value={loading ? '...' : stats.alumnos}
            icon={<School sx={{ fontSize: 32, color: '#2196F3' }} />}
            color="#2196F3"
            trend="+5% este mes"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Docentes"
            value={loading ? '...' : stats.docentes}
            icon={<Person sx={{ fontSize: 32, color: '#4CAF50' }} />}
            color="#4CAF50"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cursos Activos"
            value={loading ? '...' : stats.cursos}
            icon={<School sx={{ fontSize: 32, color: '#FF9800' }} />}
            color="#FF9800"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Asistencias Hoy"
            value={loading ? '...' : stats.asistenciasHoy}
            icon={<Today sx={{ fontSize: 32, color: '#9C27B0' }} />}
            color="#9C27B0"
            trend="Registradas hoy"
          />
        </Grid>

        {/* Tarjeta de Feriados del mes (AR) */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#0A2E75', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Event sx={{ fontSize: 22, color: '#0A2E75' }} /> Feriados del mes
            </Typography>
            {holidaysLoading && (
              <Typography variant="body2" color="textSecondary">Cargando feriados...</Typography>
            )}
            {!holidaysLoading && holidaysError && (
              <Typography variant="body2" color="error">{holidaysError}</Typography>
            )}
            {!holidaysLoading && !holidaysError && holidays.length === 0 && (
              <Typography variant="body2" color="textSecondary">Sin feriados este mes.</Typography>
            )}
            {!holidaysLoading && !holidaysError && holidays.length > 0 && (
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {holidays.map((h) => {
                  const d = new Date(h.date);
                  const fecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long' });
                  return (
                    <Box key={h.date + h.localName} component="li" sx={{ mb: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{h.localName || h.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{fecha}</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Contenido adicional segun permisos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#0A2E75' }}>
              Actividad Reciente
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Aqui se mostrara la actividad reciente del sistema...
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#0A2E75' }}>
              Accesos Rapidos
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Enlaces rapidos basados en tu rol: {permissions}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};