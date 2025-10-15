import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  EditButton,
  ShowButton,
  DeleteButton,
  Create,
  Edit,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextInput,
  DateInput,
  ReferenceInput,
  SelectInput,
  required,
  useRecordContext,
  TopToolbar,
  CreateButton,
  ExportButton,
  FilterButton,
  usePermissions,
} from 'react-admin';
import { Chip, Box } from '@mui/material';

// Componente personalizado para el estado de asistencia
const EstadoField = () => {
  const record = useRecordContext();
  if (!record) return null;

  const getColor = (estado) => {
    switch (estado) {
      case 'Presente':
        return 'success';
      case 'Ausente':
        return 'error';
      case 'Tardanza':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={record.AsistenciaEstado?.descripcion || '-'}
      size="small"
      color={getColor(record.AsistenciaEstado?.descripcion)}
    />
  );
};

// Filtros personalizados
const asistenciaFilters = [
  <TextInput label="Buscar alumno" source="alumno_q" alwaysOn />,
  <DateInput label="Fecha" source="fecha" />,
  <ReferenceInput 
    label="Curso" 
    source="id_curso" 
    reference="cursos"
  >
    <SelectInput optionText="nombre" />
  </ReferenceInput>,
  <ReferenceInput 
    label="Estado" 
    source="id_estado" 
    reference="asistencia-estados"
  >
    <SelectInput optionText="descripcion" />
  </ReferenceInput>,
];

// Acciones personalizadas en el toolbar
const ListActions = () => {
  const { permissions } = usePermissions();
  
  return (
    <TopToolbar>
      <FilterButton />
      {(permissions === 'admin' || permissions === 'director' || permissions === 'docente') && (
        <>
          <CreateButton />
          <ExportButton />
        </>
      )}
    </TopToolbar>
  );
};

// Lista de asistencias
export const AsistenciasList = () => {
  const { permissions } = usePermissions();

  return (
    <List
      filters={asistenciaFilters}
      actions={<ListActions />}
      sort={{ field: 'fecha', order: 'DESC' }}
      perPage={25}
    >
      <Datagrid rowClick="show">
        <DateField source="fecha" label="Fecha" />
        <ReferenceField 
          source="id_alumno" 
          reference="alumnos" 
          label="Alumno"
          link="show"
        >
          <TextField source="nombre_completo" />
        </ReferenceField>
        <ReferenceField 
          source="id_curso" 
          reference="cursos" 
          label="Curso"
        >
          <TextField source="nombre" />
        </ReferenceField>
        <EstadoField label="Estado" />
        <TextField source="observaciones" label="Observaciones" />
        
        {(permissions === 'admin' || permissions === 'director' || permissions === 'docente') && (
          <>
            <EditButton />
            <DeleteButton />
          </>
        )}
        <ShowButton />
      </Datagrid>
    </List>
  );
};

// Crear asistencia
export const AsistenciasCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <Box sx={{ width: '100%', maxWidth: 600 }}>
        <ReferenceInput
          source="id_alumno"
          reference="alumnos"
          label="Alumno"
          validate={[required()]}
        >
          <SelectInput 
            optionText="nombre_completo" 
            fullWidth
          />
        </ReferenceInput>

        <ReferenceInput
          source="id_curso"
          reference="cursos"
          label="Curso"
          validate={[required()]}
        >
          <SelectInput 
            optionText="nombre" 
            fullWidth
          />
        </ReferenceInput>

        <DateInput
          source="fecha"
          label="Fecha"
          defaultValue={new Date().toISOString().split('T')[0]}
          validate={[required()]}
          fullWidth
        />

        <ReferenceInput
          source="id_estado"
          reference="asistencia-estados"
          label="Estado"
          validate={[required()]}
        >
          <SelectInput 
            optionText="descripcion" 
            fullWidth
          />
        </ReferenceInput>

        <TextInput
          source="observaciones"
          label="Observaciones"
          multiline
          rows={3}
          fullWidth
        />
      </Box>
    </SimpleForm>
  </Create>
);

// Editar asistencia
export const AsistenciasEdit = () => (
  <Edit>
    <SimpleForm>
      <Box sx={{ width: '100%', maxWidth: 600 }}>
        <ReferenceInput
          source="id_alumno"
          reference="alumnos"
          label="Alumno"
          validate={[required()]}
        >
          <SelectInput 
            optionText="nombre_completo" 
            fullWidth
          />
        </ReferenceInput>

        <ReferenceInput
          source="id_curso"
          reference="cursos"
          label="Curso"
          validate={[required()]}
        >
          <SelectInput 
            optionText="nombre" 
            fullWidth
          />
        </ReferenceInput>

        <DateInput
          source="fecha"
          label="Fecha"
          validate={[required()]}
          fullWidth
        />

        <ReferenceInput
          source="id_estado"
          reference="asistencia-estados"
          label="Estado"
          validate={[required()]}
        >
          <SelectInput 
            optionText="descripcion" 
            fullWidth
          />
        </ReferenceInput>

        <TextInput
          source="observaciones"
          label="Observaciones"
          multiline
          rows={3}
          fullWidth
        />
      </Box>
    </SimpleForm>
  </Edit>
);

// Ver detalles de asistencia
export const AsistenciasShow = () => (
  <Show>
    <SimpleShowLayout>
      <DateField source="fecha" label="Fecha" />
      
      <ReferenceField 
        source="id_alumno" 
        reference="alumnos" 
        label="Alumno"
        link="show"
      >
        <TextField source="nombre_completo" />
      </ReferenceField>

      <ReferenceField 
        source="id_curso" 
        reference="cursos" 
        label="Curso"
      >
        <TextField source="nombre" />
      </ReferenceField>

      <EstadoField label="Estado" />
      
      <TextField source="observaciones" label="Observaciones" />
    </SimpleShowLayout>
  </Show>
);