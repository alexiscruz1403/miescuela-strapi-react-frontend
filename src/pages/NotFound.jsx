import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
        background: 'linear-gradient(135deg, #0b1b3b 0%, #101b3a 100%)',
      }}
    >
      <Card
        sx={{
          maxWidth: 520,
          width: '100%',
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderRadius: 3,
          boxShadow: 6,
          textAlign: 'center',
        }}
      >
        <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ErrorOutline color="error" sx={{ fontSize: 56 }} />
          </Box>
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            404
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Página no encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            La ruta que intentas acceder no existe o fue movida. Usa los accesos
            para continuar navegando.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Volver
            </Button>
            <Button variant="contained" onClick={() => navigate('/')}>Ir al inicio</Button>
            <Button color="secondary" onClick={() => navigate('/login')}>
              Ir al login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

