import {
    List, 
    Datagrid, 
    TextField, 
    EmailField,
    EditButton, 
    ShowButton, 
    DeleteButton,
    ArrayField,
    SingleFieldList, 
    usePermissions, 
    TopToolbar, 
    CreateButton, 
    ExportButton, 
    FilterButton,
    Create, 
    Edit,
    SimpleForm, 
    TextInput,
    DateInput, 
    required,
    email,
    PasswordInput, 
    ReferenceInput,
    SelectInput,
    Show, 
    SimpleShowLayout,
    minLength,
    FunctionField,
    useRecordContext
} from 'react-admin';
import { 
    Typography,
    Box,
    Grid,
    Chip
} from '@mui/material';

// Filtros personalizados
const usuariosFilters = [
    <TextInput label="Buscar usuario" source="nombre_completo" alwaysOn />,
    <ReferenceInput 
        label="Rol" 
        source="id_rol" 
        reference="roles"
    >
        <SelectInput optionText="nombre_rol" label="Rol"/>
    </ReferenceInput>,
];

// Función para obtener el color del rol
const getRoleColor = (record) => {
    const roleColors = {
        1: '#F44336',
        2: '#9C27B0',
        3: '#4CAF50',
        4: '#FF9800',
        5: '#FDD835',
        6: '#2196F3',
        7: '#795548',
    };

    return roleColors[record?.id_rol] || '#607D8B';
};

// Formulario personalizado para Editar con valores por defecto
const CustomSimpleForm = ({ children }) => {
    const record = useRecordContext();
    if (!record) return null;

    const defaultValues = record
    ? { ...record, id_rol: record.roles[0]?.id_rol }
    : {};

    return (
        <SimpleForm defaultValues={defaultValues} sanitizeEmptyValues id='form-edit-usuario' disableInvalidFormNotification>
            {children}
        </SimpleForm>
    );
};

// Toolbar personalizado según permisos
const UsuariosListActions = () => {
    //const { permissions } = usePermissions();
    const permissions = "admin"; // Forzar permisos de admin para pruebas
    return (
        <TopToolbar>
        <FilterButton />
        {permissions === 'admin' && (
            <>
            <CreateButton />
            <ExportButton />
            </>
        )}
        </TopToolbar>
    );
};

export const UsuariosList = () => {
    //const { permissions } = usePermissions();
    const permissions = "admin"; // Forzar permisos de admin para pruebas
    return (
        <List
            filters={usuariosFilters} 
            actions={<UsuariosListActions />} 
            perPage={5} 
            sort={{ field: 'id_usuario', order: 'ASC' }}
        >
            <Datagrid rowClick="show">
                <TextField source="id_usuario" label="ID Usuario" />
                <TextField source="nombre_completo" label="Nombre Completo" />
                <TextField source="numero_documento" label="Documento" />
                <EmailField source="email" label="Email" />
                <TextField source="telefono" label="Teléfono" />
                <TextField source="direccion" label="Dirección" />
                <TextField source="fecha_nacimiento" label="Fecha Nac." />
                <TextField source="genero" label="Género" />
                
                {/* Roles del usuario */}
                <ArrayField label="Roles" source="roles">
                    <SingleFieldList>
                        <FunctionField 
                            render={
                                record => (
                                    <Chip 
                                        label={record?.nombre_rol} 
                                        style={{ 
                                            backgroundColor: getRoleColor(record), 
                                            color: '#fff' 
                                        }}
                                    />
                                )
                            }
                        />
                    </SingleFieldList>
                </ArrayField>

                {permissions === 'admin' && <EditButton />}
                {permissions === 'admin' && <DeleteButton />}
                <ShowButton />
            </Datagrid>
        </List>
    );
};

export const UsuariosCreate = () => (
    <Create redirect="list">
        <SimpleForm id='form-create-usuario' disableInvalidFormNotification sanitizeEmptyValues>
            <Typography variant="h6" gutterBottom>Identidad</Typography>
            <Grid container rowSpacing={0.5} columnSpacing={3}>
                <Grid item size={12}>
                    <TextInput
                        source="nombre_completo"
                        label="Nombre Completo"
                        validate={[required("El nombre completo es requerido")]}
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 3}}>
                    <TextInput
                        source="numero_documento"
                        label="Documento"
                        validate={[required("El número de documento es requerido")]}
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 3}}>
                    <TextInput
                        source="legajo"
                        label="Legajo"
                        validate={[required("El legajo es requerido")]}
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 3}}>
                    <TextInput
                        source="genero"
                        label="Género"
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 3}}>
                    <DateInput
                        source="fecha_nacimiento"
                        label="Fecha de Nacimiento"
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 6}}>
                    <TextInput
                        source="telefono"
                        label="Teléfono"
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 6}}>
                    <TextInput
                        source="direccion"
                        label="Dirección"
                        fullWidth
                    />
                </Grid>
            </Grid>

            <Box mt={3}>
                <Typography variant="h6" gutterBottom>Acceso</Typography>
                <Grid container rowSpacing={0.5} columnSpacing={3}>
                    <Grid item size={{xs: 12, md: 6}}>
                        <TextInput
                            source="email"
                            label="Email"
                            validate={[required("El email es requerido"), email("El email no es válido")]}
                            fullWidth
                        />
                    </Grid>
                    <Grid item size={{xs: 12, md: 6}}>
                        <PasswordInput
                            source="contrasenia"
                            label="Contraseña"
                            validate={[required("La contraseña es requerida"), minLength(8, "Debe tener al menos 8 caracteres")]}
                            fullWidth
                        />
                    </Grid>
                    <Grid item size={6}>
                        <ReferenceInput
                            source="id_rol"
                            reference="roles"
                        >
                            <SelectInput
                                optionText="nombre_rol"
                                label="Rol"
                                validate={[required("El rol es requerido")]}
                                fullWidth
                            />
                        </ReferenceInput>
                    </Grid>
                </Grid>
            </Box>
        </SimpleForm>
    </Create>
);

export const UsuariosEdit = () => (
    <Edit>
        <CustomSimpleForm>
            <Typography variant="h6" gutterBottom>Identidad</Typography>
            <Grid container rowSpacing={0.5} columnSpacing={3}>
                <Grid item size={12}>
                    <TextInput
                        source="nombre_completo"
                        label="Nombre Completo"
                        validate={[required("El nombre completo es requerido")]}
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 3}}>
                    <TextInput
                        source="numero_documento"
                        label="Documento"
                        validate={[required("El número de documento es requerido")]}
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 3}}>
                    <TextInput
                        source="legajo"
                        label="Legajo"
                        validate={[required("El legajo es requerido")]}
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 3}}>
                    <TextInput
                        source="genero"
                        label="Género"
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 3}}>
                    <DateInput
                        source="fecha_nacimiento"
                        label="Fecha de Nacimiento"
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 6}}>
                    <TextInput
                        source="telefono"
                        label="Teléfono"
                        fullWidth
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 6}}>
                    <TextInput
                        source="direccion"
                        label="Dirección"
                        fullWidth
                    />
                </Grid>
            </Grid>

            <Box mt={3}>
                <Typography variant="h6" gutterBottom>Acceso</Typography>
                <Grid container rowSpacing={0.5} columnSpacing={3}>
                    <Grid item size={12}>
                        <TextInput
                            source="email"
                            label="Email"
                            validate={[required("El email es requerido"), email("El email no es válido")]}
                            fullWidth
                        />
                    </Grid>
                    <Grid item size={6}>
                        <ReferenceInput
                            source="id_rol"
                            reference="roles"
                        >
                            <SelectInput
                                optionText="nombre_rol"
                                label="Rol"
                                validate={[required("El rol es requerido")]}
                                fullWidth
                            />
                        </ReferenceInput>
                    </Grid>
                </Grid>
            </Box>
        </CustomSimpleForm>
    </Edit>
);

export const UsuariosShow = () => (
    <Show>
        <SimpleShowLayout>
            <Typography variant="h6" gutterBottom>Información Personal</Typography>
            <Grid container rowSpacing={2} columnSpacing={3}>
                <Grid item size={{xs: 12, md: 4}}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>ID de Usuario</Typography>
                    <TextField 
                        source="id_usuario" 
                        label="ID Usuario" 
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 4}}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>Nombre Completo</Typography>
                    <TextField 
                        source="nombre_completo" 
                        label="Nombre Completo" 
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 4}}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>Número de documento</Typography>
                    <TextField 
                        source="numero_documento" 
                        label="Documento" 
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 4}}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>Legajo</Typography>
                    <TextField 
                        source="legajo" 
                        label="Legajo"  
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 4}}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>Fecha de nacimiento</Typography>
                    <TextField 
                        source="fecha_nacimiento" 
                        label="Fecha de nacimiento"  
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 4}}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>Género</Typography>
                    <TextField 
                        source="genero" 
                        label="Género"  
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 4}}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>Teléfono</Typography>
                    <TextField 
                        source="telefono" 
                        label="Teléfono"  
                    />
                </Grid>
                <Grid item size={{xs: 12, md: 4}}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>Dirección</Typography>
                    <TextField 
                        source="direccion" 
                        label="Dirección"  
                    />
                </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Acceso</Typography>
            <Grid container spacing={2}>
                <Grid item size={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>Email</Typography>
                    <TextField 
                        source="email" 
                        label="Email"  
                    />
                </Grid>
                <Grid item size={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{fontWeight: 'bold'}}>Rol</Typography>
                    <ArrayField label="Roles" source="roles">
                        <SingleFieldList>
                            <FunctionField 
                                render={
                                    record => (
                                        <Chip 
                                            label={record?.nombre_rol} 
                                            style={{ 
                                                backgroundColor: getRoleColor(record), 
                                                color: '#fff' 
                                            }}
                                        />
                                    )
                                }
                            />
                        </SingleFieldList>
                    </ArrayField>
                </Grid>
            </Grid>
        </SimpleShowLayout>
    </Show>
);
