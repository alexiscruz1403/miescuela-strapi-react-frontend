// Centralized role permissions mapping and helpers

// Actions: list, show, create, edit, delete
const resourcePerms = (overrides = {}) => ({
  list: false,
  show: false,
  create: false,
  edit: false,
  delete: false,
  ...overrides,
});

export const ROLE_PERMISSIONS = {
  admin: {
    resources: {
      asistencias: resourcePerms({ list: true, show: true, create: true, edit: true, delete: true }),
      'ciclos-lectivos': resourcePerms({ list: true, show: true, create: true, edit: true, delete: true }),
      usuarios: resourcePerms({ list: true, show: true, create: true, edit: true, delete: true }),
      alumnos: resourcePerms({ list: true, show: true }),
      docentes: resourcePerms({ list: true, show: true }),
      cursos: resourcePerms({ list: true, show: true }),
      roles: resourcePerms({ list: true, show: true }),
      'asistencia-estados': resourcePerms({ list: true, show: true }),
    },
    routes: new Set([
      '/administracion/roles',
      '/administracion/roles/modificar',
      '/administracion/usuarios',
      '/gestion-academica/ciclos-lectivos',
      '/asistencias/recientes',
      '/asistencias/registrar',
      '/asistencias/historico',
      '/asistencias/eliminar',
      '/notificaciones',
      '/mensajes',
      '/informes',
      '/calificaciones',
      '/informes-pedagogicos',
    ]),
    menu: new Set([
      'usuarios',
      'roles',
      'asistencias-registrar',
      'asistencias-recientes',
      'asistencias-historico',
      'asistencias-eliminar',
      'notificaciones',
      'mensajes',
      'informes',
      'calificaciones',
      'administracion',
      'ciclos-lectivos',
      'informes-pedagogicos',
    ]),
  },

  director: {
    resources: {
      asistencias: resourcePerms({ list: true, show: true }),
      alumnos: resourcePerms({ list: true, show: true }),
      docentes: resourcePerms({ list: true, show: true }),
      cursos: resourcePerms({ list: true, show: true }),
      'asistencia-estados': resourcePerms({ list: true, show: true }),
    },
    routes: new Set([
      '/asistencias/recientes',
      '/asistencias/historico',
      '/calificaciones'
    ]),
    menu: new Set([
      'asistencias-recientes',
      'asistencias-historico',
      'calificaciones',
    ]),
  },

  auxiliar: {
    resources: {
      asistencias: resourcePerms({ list: true, show: true, create: true, edit: true, delete: true }),
      alumnos: resourcePerms({ list: true, show: true }),
      docentes: resourcePerms({ list: true, show: true }),
      cursos: resourcePerms({ list: true, show: true }),
      'asistencia-estados': resourcePerms({ list: true, show: true }),
    },
    routes: new Set([
      '/asistencias/recientes',
      '/asistencias/registrar',
      '/asistencias/historico',
      '/asistencias/eliminar',
    ]),
    menu: new Set([
      'asistencias-recientes',
      'asistencias-registrar',
      'asistencias-historico',
      'asistencias-eliminar',
    ]),
  },

  docente: {
    resources: {
      asistencias: resourcePerms({ list: true, show: true }),
      alumnos: resourcePerms({ list: true, show: true }),
      cursos: resourcePerms({ list: true, show: true }),
      'asistencia-estados': resourcePerms({ list: true, show: true }),
    },
    routes: new Set([
      '/asistencias/recientes',
      '/asistencias/historico',
      '/calificaciones',
    ]),
    menu: new Set([
      'asistencias-recientes',
      'asistencias-historico',
      'calificaciones',
    ]),
  },

  alumno: {
    resources: {
      // No resources in backoffice by default
    },
    routes: new Set([
      '/notificaciones',
      '/mensajes',
      // Optional: add custom route like '/mis-asistencias' if exists
    ]),
    menu: new Set([
      'notificaciones',
      'mensajes',
    ]),
  },

  tutor: {
    resources: {

    },
    routes: new Set([
      '/notificaciones',
      '/mensajes',
      '/calificaciones/hijos',
    ]),
    menu: new Set([
      'notificaciones',
      'mensajes',
      'calificaciones-hijos',
    ]) 
  },

  asesor_pedagogico: {
    resources: {

    },
    routes: new Set([
      '/informes-pedagogicos',
    ]),
    menu: new Set([
      'informes-pedagogicos',
    ])
  }
};

export const getRole = (permissions) => {
  if (!permissions) return undefined;
  return String(permissions).toLowerCase();
};

export const allowResource = (role, name, action = 'list') => {
  const r = ROLE_PERMISSIONS[role]?.resources?.[name];
  if (!r) return false;
  return !!r[action];
};

export const allowRoute = (role, path) => {
  return !!ROLE_PERMISSIONS[role]?.routes?.has(path);
};

export const allowMenu = (role, menuId) => {
  return !!ROLE_PERMISSIONS[role]?.menu?.has(menuId);
};
