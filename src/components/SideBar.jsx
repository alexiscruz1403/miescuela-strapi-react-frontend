import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
} from '@mui/material';
import {
  Home,
  School,
  Person,
  Notifications,
  Mail,
  Assessment,
  Today,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useResourceDefinitions } from 'react-admin';
import { useState, useEffect } from 'react';
import LogoMiEscuela from "../assets/img/logo_oficial.png";

export const Sidebar = ({ moduloActivo, onModuleChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const resourceDefs = useResourceDefinitions();

  // Abrir/cerrar submenú asistencias
  const [openAsistencias, setOpenAsistencias] = useState(false);

  // Abrir asistencias automáticamente si estoy en esa ruta
  useEffect(() => {
    if (location.pathname.startsWith('/asistencias')) {
      setOpenAsistencias(true);
    }
  }, [location.pathname]);

  // Recursos declarados en <Resource>, excepto asistencias
  const resourceItems = Object.values(resourceDefs)
    .filter(def => def.hasList && def.name !== 'asistencias')
    .map(def => {
      const Icon = def.icon || Home;
      return {
        id: def.name,
        text: def.options?.label || def.name,
        icon: <Icon />,
        to: `/${def.name}`,
      };
    });

  const handleItemClick = (item) => {
    onModuleChange?.(item.id);
    navigate(item.to);
  };

  // helper para aplicar estilos activos
  const isActive = (to) => location.pathname === to;

  // estilo base de los botones
  const getButtonStyle = (active) => ({
    backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderRight: active ? '3px solid #1976d2' : '3px solid transparent',
  });

  const getTextStyle = (active) => ({
    '& .MuiListItemText-primary': {
      fontSize: '0.9rem',
      fontWeight: active ? 600 : 400, // 👈 negrita si activo
    },
  });

  return (
    <Box sx={{
      width: 240,
      backgroundColor: '#061B46',
      color: 'white',
      height: 'calc(100vh - 64px)',
      overflow: 'auto',
      flexShrink: 0
    }}>
      {/* Header */}
      <Box sx={{
        p: 3,
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{
          width: 60,
          height: 60,
          backgroundColor: '#1252D3',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px auto'
        }}>
          <img
            src={LogoMiEscuela}
            alt="Logo oficial"
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
          />
        </Box>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          MiEscuela 4.0
        </Typography>
      </Box>

      {/* Menu */}
      <List sx={{ pt: 2, px: 1 }}>
        {/* Panel General */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/')}
            onClick={() => handleItemClick({ id: 'general', to: '/' })}
            sx={getButtonStyle(isActive('/'))}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Panel General" sx={getTextStyle(isActive('/'))} />
          </ListItemButton>
        </ListItem>

        {/* Recursos estándar */}
        {resourceItems.map((item) => (
          <ListItem disablePadding key={item.id}>
            <ListItemButton
              selected={isActive(item.to)}
              onClick={() => handleItemClick(item)}
              sx={getButtonStyle(isActive(item.to))}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={getTextStyle(isActive(item.to))} />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Bloque Asistencias */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setOpenAsistencias(!openAsistencias)}>
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <Today />
            </ListItemIcon>
            <ListItemText primary="Asistencias" />
            {openAsistencias ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openAsistencias} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Submenú: Listado */}
            <ListItemButton
              sx={{ pl: 6, ...getButtonStyle(isActive('/asistencias')) }}
              selected={isActive('/asistencias')}
              onClick={() => handleItemClick({ id: 'asistencias-listado', to: '/asistencias' })}
            >
              <ListItemText primary="Listado" sx={getTextStyle(isActive('/asistencias'))} />
            </ListItemButton>

            {/* Submenú: Hoy */}
            <ListItemButton
              sx={{ pl: 6, ...getButtonStyle(isActive('/asistencias/hoy')) }}
              selected={isActive('/asistencias/hoy')}
              onClick={() => handleItemClick({ id: 'asistencias-hoy', to: '/asistencias/hoy' })}
            >
              <ListItemText primary="Ver asistencia del día" sx={getTextStyle(isActive('/asistencias/hoy'))} />
            </ListItemButton>

            {/* Submenú: Registrar/Editar */}
            <ListItemButton
              sx={{ pl: 6, ...getButtonStyle(isActive('/asistencias/registrar')) }}
              selected={isActive('/asistencias/registrar')}
              onClick={() => handleItemClick({ id: 'asistencias-registrar', to: '/asistencias/registrar' })}
            >
              <ListItemText
                primary="Tomar asistenca"
                sx={getTextStyle(isActive('/asistencias/registrar'))}
              />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Otros custom */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/notificaciones')}
            onClick={() => handleItemClick({ id: 'notificaciones', to: '/notificaciones' })}
            sx={getButtonStyle(isActive('/notificaciones'))}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <Notifications />
            </ListItemIcon>
            <ListItemText primary="Notificaciones" sx={getTextStyle(isActive('/notificaciones'))} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/mensajes')}
            onClick={() => handleItemClick({ id: 'mensajes', to: '/mensajes' })}
            sx={getButtonStyle(isActive('/mensajes'))}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <Mail />
            </ListItemIcon>
            <ListItemText primary="Mensajes" sx={getTextStyle(isActive('/mensajes'))} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/informes')}
            onClick={() => handleItemClick({ id: 'informes', to: '/informes' })}
            sx={getButtonStyle(isActive('/informes'))}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <Assessment />
            </ListItemIcon>
            <ListItemText primary="Informes" sx={getTextStyle(isActive('/informes'))} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};
