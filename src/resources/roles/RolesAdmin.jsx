import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { AsignarRoles } from './AsignarRoles';
import { ModificarRoles } from './ModificarRoles';

export const RolesAdmin = ({ initialTab = 0 }) => {
  const [tab, setTab] = useState(initialTab);

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Asignar roles" />
        <Tab label="Modificar roles" />
      </Tabs>

      <Box hidden={tab !== 0}>
        {tab === 0 && <AsignarRoles />}
      </Box>

      <Box hidden={tab !== 1}>
        {tab === 1 && <ModificarRoles />}
      </Box>
    </Box>
  );
};

