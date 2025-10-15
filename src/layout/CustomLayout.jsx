import { useState, useEffect } from 'react';
import { Box, Fade } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../components/SideBar';
import { Header } from '../components/Header';

export const CustomLayout = ({ children }) => {
  const location = useLocation();
  
  const getCurrentModule = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return 'general';
    const segments = path.split('/').filter(Boolean);
    return segments[0] || 'general';
  };

  const [moduloActivo, setModuloActivo] = useState(getCurrentModule());

  useEffect(() => {
    setModuloActivo(getCurrentModule());
  }, [location]);

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      height: '100vh',
      backgroundColor: '#ffffff',
      overflow: 'hidden'
    }}>
      <Header moduloActivo={moduloActivo} />

      <Box sx={{ display: 'flex', height: '100vh', pt: 8, maxWidth: '100%' }}>
        <Sidebar moduloActivo={moduloActivo} onModuleChange={setModuloActivo} />

        <Box sx={{
          flexGrow: 1,
          backgroundColor: '#ffffff',
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          p: 3,
          maxWidth: '100%'
        }}>
          <Fade in={true} timeout={300}>
            <Box sx={{ height: '100%' }}>
              {children}
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};