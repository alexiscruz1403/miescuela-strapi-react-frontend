import React, { useState } from 'react';
import {
  List,
  Datagrid,
  TextField as RATextField,
  TextInput,
  useRecordContext,
  useNotify,
  useRefresh,
  useDataProvider,
  useGetList,
  TopToolbar,
  FilterButton,
  ExportButton,
} from 'react-admin';
import { Box, Button, MenuItem, Select } from '@mui/material';
import { EmptyState } from '../../components/EmptyState';

const RoleAssignCell = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const userId = record?.id_usuario || record?.id;
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: roles = [] } = useGetList('roles', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'id_rol', order: 'ASC' },
    filter: {},
  });

  const onAssign = async () => {
    if (!value) {
      notify('Selecciona un rol primero', { type: 'warning' });
      return;
    }
    try {
      setSaving(true);
      await dataProvider.asignarRolUsuario(userId, value);
      notify('Rol asignado correctamente', { type: 'success' });
      refresh();
    } catch (err) {
      notify(err?.message || 'Error al asignar rol', { type: 'warning' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <Select
        size="small"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        displayEmpty
        sx={{ width: '42%' }}
      >
        <MenuItem value="" disabled>
          Seleccionar rol…
        </MenuItem>
        {roles.map((r) => (
          <MenuItem key={r.id || r.id_rol} value={Number(r.id_rol || r.id)}>
            {r.nombre_rol || `Rol ${r.id_rol || r.id}`}
          </MenuItem>
        ))}
      </Select>
      <Button variant="contained" size="small" onClick={onAssign} disabled={saving || !value}>
        {saving ? 'Guardando…' : 'Asignar'}
      </Button>
    </Box>
  );
};

export const AsignarRoles = () => {

  const RolesListActions = () => (
    <TopToolbar>␍␊
      <FilterButton label="Agregar filtros" />␍␊
      <ExportButton label="Exportar" />
    </TopToolbar>
  );
  return (
    <List
      resource="usuarios-sin-rol"
      title="Asignar Roles"
      actions={<RolesListActions />}
      filters={[
        <TextInput key="fdni" source="numero_documento" label="Buscar por DNI" alwaysOn />,
        <TextInput key="fapellido" source="apellido" label="Apellido" />,
        <TextInput key="fnombre" source="nombre" label="Nombre" />,
      ]}
      perPage={10}
      sort={{ field: 'apellido', order: 'ASC' }}
      empty={<EmptyState title="Sin resultados" subtitle="No se encontraron usuarios sin rol en el sistema." />}
    >
      <Datagrid bulkActionButtons={false} rowClick={false}>
        <RATextField source="apellido" label="Apellido" />
        <RATextField source="nombre" label="Nombre" />
        <RATextField source="numero_documento" label="DNI N°" />
        <RoleAssignCell label="Asignar rol" />
      </Datagrid>
    </List>
  );
};
