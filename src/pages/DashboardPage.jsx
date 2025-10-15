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
} from '@mui/icons-material';
import { useDataProvider, usePermissions } from 'react-admin';

// Componente de tarjeta estadística
const StatCard = ({ title, value, icon, color, trend }) => (
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
            {value}
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

export const DashboardPage = () => {
  const dataProvider = useDataProvider();
  const { permissions } = usePermissions();
  const [stats, setStats] = useState({
    alumnos: 0,
    docentes: 0,
    cursos: 0,
    asistenciasHoy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener estadísticas básicas
        const [alumnosRes, docentesRes, cursosRes, asistenciasRes] = await Promise.all([
          dataProvider.getList('alumnos', { 
            pagination: { page: 1, perPage: 1 },
            sort: { field: 'id', order: 'ASC' },
            filter: {}
          }),
          dataProvider.getList('docentes', { 
            pagination: { page: 1, perPage: 1 },
            sort: { field: 'id', order: 'ASC' },
            filter: {}
          }),
          dataProvider.getList('cursos', { 
            pagination: { page: 1, perPage: 1 },
            sort: { field: 'id', order: 'ASC' },
            filter: {}
          }),
          dataProvider.getList('asistencias', { 
            pagination: { page: 1, perPage: 100 },
            sort: { field: 'fecha', order: 'DESC' },
            filter: { fecha: new Date().toISOString().split('T')[0] }
          }),
        ]);

        setStats({
          alumnos: alumnosRes.total || 0,
          docentes: docentesRes.total || 0,
          cursos: cursosRes.total || 0,
          asistenciasHoy: asistenciasRes.data.length || 0,
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dataProvider]);

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

      {/* Tarjetas de estadísticas */}
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
      </Grid>

      {/* Contenido adicional según permisos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#0A2E75' }}>
              Actividad Reciente
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Aquí se mostrará la actividad reciente del sistema...
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#0A2E75' }}>
              Accesos Rápidos
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Enlaces rápidos basados en tu rol: {permissions}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};