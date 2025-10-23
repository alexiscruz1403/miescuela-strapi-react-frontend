import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  EditButton,
  ShowButton,
  DeleteWithConfirmButton,
  TopToolbar,
  CreateButton,
  ExportButton,
  FilterButton,
  Create,
  Edit,
  SimpleForm,
  NumberInput,
  DateInput,
  SelectInput,
  required,
  Show,
  SimpleShowLayout,
  useNotify,
  useRecordContext,
  Toolbar,
  SaveButton,
  ListButton
} from 'react-admin';
import { Box, Typography, Grid, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const EstadoChoices = [
  { id: 'Abierto', name: 'Abierto' },
  { id: 'Planeado', name: 'Planeado' },
  { id: 'Cerrado', name: 'Cerrado' },
];

// Filtros de lista
const ciclosFilters = [
  <NumberInput key="f_anio" label="Año" source="anio" alwaysOn />,
  <SelectInput key="f_estado" label="Estado" source="estado" choices={EstadoChoices} />,
];

// Validaciones
const isValidDate = (d) => {
  const t = new Date(d).getTime();
  return !Number.isNaN(t);
};

const validateCiclo = (values) => {
  const errors = {};
  const anio = Number(values.anio);
  if (values.anio === undefined || values.anio === null || values.anio === '') {
    errors.anio = 'El año es requerido';
  } else if (!Number.isInteger(anio)) {
    errors.anio = 'El año debe ser un número entero';
  } else if (anio < 2000 || anio > 2100) {
    errors.anio = 'El año debe estar entre 2000 y 2100';
  }

  if (!values.fecha_inicio) {
    errors.fecha_inicio = 'La fecha de inicio es requerida';
  } else if (!isValidDate(values.fecha_inicio)) {
    errors.fecha_inicio = 'Fecha de inicio inválida';
  }

  if (!values.fecha_fin) {
    errors.fecha_fin = 'La fecha de fin es requerida';
  } else if (!isValidDate(values.fecha_fin)) {
    errors.fecha_fin = 'Fecha de fin inválida';
  }

  if (isValidDate(values.fecha_inicio) && isValidDate(values.fecha_fin)) {
    if (new Date(values.fecha_fin) < new Date(values.fecha_inicio)) {
      errors.fecha_fin = 'La fecha de fin no puede ser anterior a la de inicio';
    }
  }

  if (values.estado && !EstadoChoices.some((c) => c.id === values.estado)) {
    errors.estado = 'Estado inválido';
  }

  return errors;
};

// Acciones de lista con estilo consistente
const CiclosListActions = () => {
  const navigate = useNavigate();
  return (
    <TopToolbar>
      <Button onClick={() => navigate('/ciclos-lectivos')} startIcon={<ArrowBack />} size="small" sx={{ mr: 1 }}>
        Volver
      </Button>
      <FilterButton label="Filtrar por" />
      <CreateButton label="Crear" />
      <ExportButton label="Exportar" />
    </TopToolbar>
  );
};

const DeleteCicloButton = () => {
  const notify = useNotify();
  const record = useRecordContext();
  if (!record) return null;

  return (
    <DeleteWithConfirmButton
      label="Borrar"
      title="Eliminar"
      confirmTitle="Confirmar eliminación"
      confirmContent={
        <Box sx={{ mt: 1 }}>
          <Typography>
            Vas a eliminar el ciclo lectivo <strong>{record?.anio}</strong>.
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </Box>
      }
      size="small"
      sx={{ minWidth: 0, p: 0.25, ml: 1 }}
      mutationOptions={{
        onSuccess: () => notify('Ciclo lectivo eliminado correctamente', { type: 'success' }),
        onError: (error) => notify(error?.message || 'Error al eliminar ciclo lectivo', { type: 'warning' }),
      }}
    />
  );
};

export const CiclosLectivosList = () => (
  <List title="Ciclos lectivos" actions={<CiclosListActions />} filters={ciclosFilters} perPage={25}>
    <Datagrid rowClick="show">
      <TextField source="id_ciclo" label="ID" />
      <TextField source="anio" label="Año" />
      <DateField source="fecha_inicio" label="Fecha inicio" showTime={false} />
      <DateField source="fecha_fin" label="Fecha fin" showTime={false} />
      <TextField source="estado" label="Estado" />
      <EditButton label="Editar" />
      <ShowButton label="Ver" />
      <DeleteCicloButton />
    </Datagrid>
  </List>
);

const FormFields = () => (
  <>
    <Grid container rowSpacing={1} columnSpacing={3}>
      <Grid size={{ xs: 12, md: 3 }}>
        <NumberInput source="anio" label="Año" validate={[required()]} fullWidth />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <DateInput source="fecha_inicio" label="Fecha inicio" validate={[required()]} fullWidth />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <DateInput source="fecha_fin" label="Fecha fin" validate={[required()]} fullWidth />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <SelectInput source="estado" label="Estado" choices={EstadoChoices} />
      </Grid>
    </Grid>
  </>
);

export const CiclosLectivosCreate = () => {
  const notify = useNotify();
  return (
    <Create
      title="Crear ciclo lectivo"
      actions={<CiclosCreateActions />}
      transform={(data) => ({ ...data, anio: Number(data.anio) })}
      mutationOptions={{
        onSuccess: () => notify('Ciclo lectivo creado correctamente', { type: 'success' }),
        onError: (e) => {
          let msg = e?.message || e?.body?.message || 'Error al crear ciclo lectivo';
          if (e?.status === 409 || /unique|duplicad/i.test(String(msg))) {
            msg = 'Ya existe un ciclo para ese año';
          }
          notify(msg, { type: 'warning' });
        },
      }}
    >
      <SimpleForm sanitizeEmptyValues validate={validateCiclo} toolbar={<Toolbar><SaveButton label="Guardar" /></Toolbar>}>
        <FormFields />
      </SimpleForm>
    </Create>
  );
};

export const CiclosLectivosEdit = () => {
  const notify = useNotify();
  return (
    <Edit
      title="Editar ciclo lectivo"
      transform={(data) => ({ ...data, anio: Number(data.anio) })}
      actions={<CiclosEditActions />}
      mutationOptions={{
        onSuccess: () => notify('Ciclo lectivo actualizado correctamente', { type: 'success' }),
        onError: (e) => {
          let msg = e?.message || e?.body?.message || 'Error al actualizar ciclo lectivo';
          if (e?.status === 409 || /unique|duplicad/i.test(String(msg))) {
            msg = 'Ya existe un ciclo para ese año';
          }
          notify(msg, { type: 'warning' });
        },
      }}
    >
      <SimpleForm sanitizeEmptyValues validate={validateCiclo} toolbar={<Toolbar><SaveButton label="Guardar" /></Toolbar>}>
        <FormFields />
      </SimpleForm>
    </Edit>
  );
};

// Acciones superiores del Edit (volver)
const CiclosEditActions = () => (
  <TopToolbar>
    <ListButton label="Volver al listado" icon={<ArrowBack />} />
    <ShowButton label="Ver" />
    <DeleteCicloButton />
  </TopToolbar>
);

const CiclosCreateActions = () => (
  <TopToolbar>
    <ListButton label="Volver al listado" icon={<ArrowBack />} />
  </TopToolbar>
);

const CiclosShowActions = () => (
  <TopToolbar>
    <ListButton label="Volver al listado" icon={<ArrowBack />} />
    <EditButton label="Editar" />
  </TopToolbar>
);

export const CiclosLectivosShow = () => (
  <Show title="Ver ciclo lectivo" actions={<CiclosShowActions />}>
    <SimpleShowLayout>
      <TextField source="id_ciclo" label="ID" />
      <TextField source="anio" label="Año" />
      <DateField source="fecha_inicio" label="Fecha inicio" />
      <DateField source="fecha_fin" label="Fecha fin" />
      <TextField source="estado" label="Estado" />
    </SimpleShowLayout>
  </Show>
);
