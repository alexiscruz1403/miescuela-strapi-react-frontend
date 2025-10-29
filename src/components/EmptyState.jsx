import { Box, Typography } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

export const EmptyState = ({
  title = 'Sin resultados',
  subtitle = 'No se encontraron registros con los filtros actuales.',
}) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 6,
      color: 'text.secondary',
    }}>
      <SearchOffIcon sx={{ fontSize: 48, mb: 1, color: 'text.disabled' }} />
      <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, textAlign: 'center' }}>
        {subtitle}
      </Typography>
    </Box>
  );
};

export default EmptyState;

