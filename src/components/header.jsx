import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import { UserMenu } from "./UserMenu"; // Corregido el import

export const Header = ({ moduloActivo }) => {
  // Mapeo de nombres de módulos para mostrar en el centro
  const moduleNames = {
    'general': 'Panel General',
    'alumnos': 'Gestión de Alumnos',
    'docentes': 'Gestión de Docentes',
    'asistencias': 'Gestión de Asistencias',
    'notificaciones': 'Notificaciones',
    'mensajes': 'Mensajería',
    'informes': 'Informes y Reportes'
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: "#ffffff",
        color: "#333",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        borderBottom: "1px solid #e0e0e0",
        width: "100%",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: 3 }}>
        {/* Logo y título del lado izquierdo */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 600,
              color: "#0A2E75", // Usar el color de tu tema
            }}
          >
            MiEscuela 4.0
          </Typography>
        </Box>

        {/* Área central - título del módulo actual */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Typography variant="body1" sx={{ color: "#666", fontWeight: 500 }}>
            {moduleNames[moduloActivo] || 'Panel General'}
          </Typography>
        </Box>

        {/* Controles del lado derecho - UserMenu con fecha */}
        <UserMenu />
      </Toolbar>
    </AppBar>
  );
};