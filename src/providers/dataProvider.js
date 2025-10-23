import { fetchUtils } from 'react-admin';
import { stringify } from 'query-string';
import { api } from "../services/api"
import { get } from 'react-hook-form';

const API_URL = 'http://localhost:6543/api';

const httpClient = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }

  const csrfToken = sessionStorage.getItem('csrf_token');
  const accessToken = sessionStorage.getItem('access_token');
  const refreshToken = sessionStorage.getItem('refresh_token');

  if (csrfToken) {
    options.headers.set('X-CSRF-Token', csrfToken);
  }
  if (accessToken) {
    options.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (refreshToken) {
    options.headers.set('X-Refresh-Token', refreshToken);
  }

  options.credentials = 'include';

  return fetchUtils.fetchJson(url, options);
};


export const dataProvider = {
  getList: (resource, params) => {
    const { page, perPage } = params.pagination;

    const { filter } = params;

    // Soporte especial para el recurso virtual 'usuarios-sin-rol'
    if (resource === 'usuarios-sin-rol') {
      const { field, order } = params.sort || {};
      const queryUSR = new URLSearchParams({
        page,
        perPage,
        ...(field ? { sort: field } : {}),
        ...(order ? { order } : {}),
        nombre_completo: filter.nombre_completo || '',
        apellido: filter.apellido || '',
        nombre: filter.nombre || '',
        numero_documento: filter.numero_documento || '',
        dni: filter.numero_documento || '',
      }).toString();
      const urlUSR = `${API_URL}/usuarios/sin-rol?${queryUSR}`;
      return httpClient(urlUSR).then(({ json }) => ({
        data: (json.data || json).map(item => ({
          ...item,
          id: item.id_usuario || item.id,
        })),
        total: json.total,
      }));
    }

    // Recurso virtual para 'usuarios-con-rol'
    if (resource === 'usuarios-con-rol') {
      const { field, order } = params.sort;
      const queryUCR = new URLSearchParams({
        page,
        perPage,
        sort: field,
        order: order,
        apellido: filter.apellido || '',
        nombre: filter.nombre || '',
        numero_documento: filter.numero_documento || '',
        id_rol: filter.id_rol || '',
      }).toString();
      const urlUCR = `${API_URL}/usuarios/con-rol?${queryUCR}`;
      return httpClient(urlUCR).then(({ json }) => ({
        data: (json.data || json).map(item => ({
          ...item,
          id: item.id_usuario || item.id,
        })),
        total: json.total,
      }));
    }

    // Resto de recursos estándar
    const query = new URLSearchParams({
      page,
      perPage,
      ...filter,
    }).toString();

    const url = `${API_URL}/${resource}?${query}`;

    return httpClient(url).then(({ json }) => ({
      data: json.data ?
        json.data.map(item => ({
          ...item,
          id: item.id_ciclo || item.id_asistencia || item.id_alumno || item.id_docente || item.id_curso || item.id_rol || item.id_usuario || item.id
        })) :
        json.map(item => ({
          ...item,
          id: item.id_ciclo || item.id_asistencia || item.id_alumno || item.id_docente || item.id_curso || item.id_rol || item.id_usuario || item.id
        })),
      total: json.total,
    }));
  },

  getOne: (resource, params) =>
    httpClient(`${API_URL}/${resource}/${params.id}`).then(({ json }) => ({
      data: {
        ...json,
        id: json.id_ciclo || json.id_asistencia || json.id_alumno || json.id_docente || json.id_curso || json.id_rol || json.id_usuario || json.id
      },
    })),

  getMany: (resource, params) => {
    const query = { filter: JSON.stringify({ id: params.ids }) };
    const url = `${API_URL}/${resource}?${stringify(query)}`;
    return httpClient(url).then(({ json }) => ({
      data: json.map(item => ({
        ...item,
        id: item.id_ciclo || item.id_asistencia || item.id_alumno || item.id_docente || item.id_curso || item.id_rol || item.id_usuario || item.id
      }))
    }));
  },

  getManyReference: (resource, params) => {
    const url = `${API_URL}/${resource}`;
    return httpClient(url).then(({ json }) => ({
      data: json,
      total: json.length,
    }));
  },

  create: (resource, params) =>
    httpClient(`${API_URL}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({
      data: { ...params.data, id: json.id || json.id_ciclo || json.id_asistencia || json.id_usuario || json.insertId },
    })),

  update: (resource, params) =>
    httpClient(`${API_URL}/${resource}/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({
      data: {
        ...json,
        id: json.id_ciclo || json.id_asistencia || json.id_alumno || json.id_docente || json.id_curso || json.id_rol || json.id_usuario || json.id
      }
    })),

  updateMany: (resource, params) =>
    Promise.all(
      params.ids.map(id =>
        httpClient(`${API_URL}/${resource}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(params.data),
        })
      )
    ).then(responses => ({ data: responses.map(({ json }) => json.id) })),

  delete: (resource, params) =>
    httpClient(`${API_URL}/${resource}/${params.id}`, {
      method: 'DELETE',
    }).then(({ json }) => ({ data: json })),

  deleteMany: (resource, params) =>
    Promise.all(
      params.ids.map(id =>
        httpClient(`${API_URL}/${resource}/${id}`, {
          method: 'DELETE',
        })
      )
    ).then(responses => ({ data: responses.map(({ json }) => json.id) })),



  getAlumnosCurso: (cursoId, fecha = hoyAR()) =>
    httpClient(`${API_URL}/alumnos/curso/${cursoId}?fecha=${fecha}`)
      .then(({ json }) => ({
        data: json.map(a => ({
          ...a,
          id: a.id_alumno, // react-admin requiere "id"
        })),
      })),

  // registrar/editar asistencia
  registrarAsistenciaCurso: (cursoId, fecha, items) =>
    httpClient(`${API_URL}/asistencias/curso`, {
      method: 'POST',
      body: JSON.stringify({ id_curso: cursoId, fecha, items }),
    }).then(({ json }) => ({ data: json })),

  // obtener asistencias de un curso en una fecha dada
  getAsistenciaCursoFecha: (cursoId, fecha = hoyAR()) =>
    httpClient(`${API_URL}/asistencias/curso/${cursoId}/recientes?fecha=${fecha}`)
      .then(({ json }) => ({
        data: json.map(a => ({
          ...a,
          id: a.id_asistencia || `${a.alumno_id}-${a.fecha}`,
        })),
      })),


  // Asistencias históricas (curso o alumno) usando axios API
  asistenciasHistorico: async (tipo, id, desde, hasta) => {
    try {
      const url =
        tipo === "curso"
          ? `/asistencias/curso/${id}?desde=${desde}&hasta=${hasta}`
          : `/asistencias/alumno/${id}?desde=${desde}&hasta=${hasta}`;

      const { data } = await api.get(url);
      return { data };
    } catch (err) {
      console.error("❌ Error obteniendo asistencias históricas:", err);
      throw err.response?.data || err;
    }
  },


  // eliminar asistencias de un curso en una fecha dada

  deleteAsistenciasCurso: (cursoId, fecha) =>
    httpClient(`${API_URL}/asistencias/curso/${cursoId}?fecha=${fecha}`, {
      method: "DELETE",
    }).then(({ json }) => ({
      data: json,
    })),

  getPromedioAsistenciaCurso: (cursoId, desde, hasta) =>
    httpClient(`${API_URL}/asistencias/curso/${cursoId}/promedio?desde=${desde}&hasta=${hasta}`)
      .then(({ json }) => ({
        data: json,
      })),

  // Usuarios sin rol asignado (endpoint custom del backend)
  getUsuariosSinRol: () =>
    httpClient(`${API_URL}/usuarios/sin-rol`).then(({ json }) => ({
      data: (json.data || json).map(u => ({
        ...u,
        id: u.id_usuario || u.id,
      })),
    })),

  // Asignar rol a usuario (endpoint específico recomendado)
  asignarRolUsuario: (idUsuario, idRol) =>
    httpClient(`${API_URL}/usuarios/${idUsuario}/rol`, {
      method: 'PUT',
      body: JSON.stringify({ id_rol: Number(idRol) }),
    }).then(({ json }) => ({ data: json })),

  // Quitar rol a usuario (DELETE dedicado)
  desasignarRolUsuario: (idUsuario) =>
    httpClient(`${API_URL}/usuarios/${idUsuario}/rol`, {
      method: 'DELETE',
    }).then(() => ({ data: { id: idUsuario } })),

  // obtener cursos segun rol
  getCursosPorRol: () =>
    httpClient(`${API_URL}/cursos/restricted`)
      .then(({ json }) => ({
        data: json.map(c => ({
          ...c,
          id: c.id_curso,
        })),
      })),

  // obtener materias por curso
  getMateriasCurso: (cursoId) =>
    httpClient(`${API_URL}/cursos/${cursoId}/materias`)
      .then(({ json }) => ({
        data: json.map(m => ({
          ...m,
          id: m.id_materia,
        })),
      })),

  // obtener alumnos por curso
  getAlumnosPorCurso: (cursoId) =>
    httpClient(`${API_URL}/cursos/${cursoId}/alumnos`)
      .then(({ json }) => ({
        data: json.map(a => ({
          ...a,
          id: a.id_alumno,
        })),
      })),

  // modificar muchas calificaciones
  updateManyCalificaciones: (updatedRows) =>
    httpClient(`${API_URL}/calificaciones`, {
      method: 'PUT',
      body: JSON.stringify({ calificaciones: updatedRows }),
    }).then(({ json }) => ({
      data: json,
    })),

  // crear muchas calificaciones
  createManyCalificaciones: (newRows) =>
    httpClient(`${API_URL}/calificaciones`, {
      method: 'POST',
      body: JSON.stringify({ calificaciones: newRows }),
    }).then(({ json }) => ({
      data: json,
    })),

  // obtener tipos de calificaciones
  getTiposCalificaciones: () =>
    httpClient(`${API_URL}/calificaciones/tipos`)
      .then(({ json }) => ({
        data: json,
      })),

  // obtener calificaciones por alumno
  getCalificacionesPorAlumno: (alumnoId) =>
    httpClient(`${API_URL}/calificaciones/alumno/${alumnoId}`)
      .then(({ json }) => ({
        data: json,
      })),

  // obtener docentes por curso
  getDocentesPorCurso: (cursoId) =>
    httpClient(`${API_URL}/cursos/${cursoId}/docentes`)
      .then(({ json }) => ({
        data: json.map(d => ({
          ...d,
          id: d.id_docente,
        })),
      })),

  // obtener los hijos de un tutor
  getHijosPorTutor: () =>
    httpClient(`${API_URL}/tutores/hijos`)
      .then(({ json }) => ({
        data: json.map(h => ({
          ...h,
          id: h.id_tutor,
        })),
      })),

  // cargar informe pedagogico
  crearInformePedagogico: (data) =>
    httpClient(`${API_URL}/informes-pedagogicos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(({ json }) => ({
      data: { ...json, id: json.id_informe || json.insertId },
    })),

  getAsesoresPedagogicos: () =>
    httpClient(`${API_URL}/asesores-pedagogicos`)
      .then(({ json }) => ({
        data: json.map(a => ({
          ...a,
          id: a.id_asesor,
        })),
      })),
}
