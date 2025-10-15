import { useState } from 'react';
import { Box, Fade } from '@mui/material';
import { Asistencias } from './Asistencias';
import { Usuarios } from './Usuarios';
import { Sidebar } from '../components/SideBar';
import { Header } from '../components/Header';

// Importar otros módulos
// import { ModuloAlumnos } from '../modules/ModuloAlumnos';
// import { ModuloDocentes } from '../modules/ModuloDocentes';
// etc...

// Componentes temporales para cada módulo (los reemplazarías por tus módulos reales)
const PanelGeneral = () => (
  <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
    {/* Tu código del Panel General */}
  </Box>
);

const ModuloAlumnos = () => (
  <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
    {/* Tu código de Alumnos */}
  </Box>
);

const ModuloDocentes = () => (
  <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
    {/* Tu código de Docentes */}
  </Box>
);

const ModuloNotificaciones = () => (
  <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
    {/* Tu código de Notificaciones */}
  </Box>
);

const ModuloMensajes = () => (
  <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
    {/* Tu código de Mensajes */}
  </Box>
);

const ModuloInformes = () => (
  <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
    {/* Tu código de Informes */}
  </Box>
);

export const Dashboard = () => {
  const [moduloActivo, setModuloActivo] = useState('general');

  // Mapeo de módulos
  const modulos = {
    general: <PanelGeneral />,
    alumnos: <ModuloAlumnos />,
    docentes: <ModuloDocentes />,
    asistencias: <Asistencias />,
    notificaciones: <ModuloNotificaciones />,
    mensajes: <ModuloMensajes />,
    informes: <ModuloInformes />,
    usuarios: <Usuarios />
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#ffffff',
      overflow: 'hidden'
    }}>
      {/* Header separado */}
      <Header moduloActivo={moduloActivo} />

      {/* Layout principal */}
      <Box sx={{ display: 'flex', height: '100vh', pt: 8 }}>
        {/* Sidebar */}
        <Sidebar moduloActivo={moduloActivo} onModuleChange={setModuloActivo} />

        {/* Main Content */}
        <Box sx={{
          flexGrow: 1,
          backgroundColor: '#ffffff',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden'
        }}>
          <Fade in={true} timeout={300} key={moduloActivo}>
            <Box sx={{ height: '100%' }}>
              {modulos[moduloActivo]}
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};
