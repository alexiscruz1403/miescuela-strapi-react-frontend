import { fetchUtils } from 'react-admin';
import { API_URL } from '../services/api';

/**
 * DataProvider para Strapi v4
 * Recursos: usuarios, cursos, asistencias, modulos
 */
const httpClient = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  const token = sessionStorage.getItem('access_token') || sessionStorage.getItem('jwt');
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`);
  }
  return fetchUtils.fetchJson(url, options);
};

const buildPagination = (params) => {
  const page = params?.pagination?.page || 1;
  const pageSize = params?.pagination?.perPage || 25;
  return `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
};

const toQuery = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

const unwrap = (json) => json?.data ?? json;

const dataProvider = {
  getList: async (resource, params) => {
    const pag = buildPagination(params);
    let qs = pag;

    if (resource === 'asistencias') {
      const { anio_escolar, division } = params?.filter || {};
      const populate = [
        'populate[alumno][populate][user]=true',
        'populate[alumno][populate][curso]=true',
        'populate[estado]=true',
      ].join('&');
      const filters = toQuery({
        'filters[alumno][curso][anio_escolar][$eq]': anio_escolar,
        'filters[alumno][curso][division][$eq]': division,
      });
      qs = [pag, populate, filters].filter(Boolean).join('&');
    } else if (params?.filter && Object.keys(params.filter).length) {
      const generic = Object.entries(params.filter)
        .map(([k, v]) => `filters[${encodeURIComponent(k)}][$eq]=${encodeURIComponent(v)}`)
        .join('&');
      qs = [pag, generic].filter(Boolean).join('&');
    }

    const url = `${API_URL}/${resource}?${qs}`;
    const { json } = await httpClient(url);
    const rows = Array.isArray(json?.data) ? json.data : [];
    const total = json?.meta?.pagination?.total ?? rows.length;
    const normalized = rows.map((item) => (item?.id ? item : { id: item?.id || item?.documentId, ...item }));
    return { data: normalized, total };
  },

  getOne: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`;
    const { json } = await httpClient(url);
    const rec = json?.data || json;
    return { data: rec };
  },

  create: async (resource, params) => {
    let body = params.data;

    if (resource === 'asistencias') {
      body = {
        id_alumno: params.data.id_alumno,
        curso: params.data.curso,
        estado: params.data.estado,
      };
    }

    if (resource === 'usuarios') {
      body = {
        username: params.data.username,
        email: params.data.email,
        password: params.data.password,
        legajo: params.data.legajo,
        numero_documento: params.data.numero_documento,
        role_name: params.data.role_name,
      };
    }

    const { json } = await httpClient(`${API_URL}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const rec = json?.data || json;
    const id = rec?.id || rec?.documentId;
    return { data: { id, ...rec } };
  },

  update: async (resource, params) => {
    let body = params.data;

    if (resource === 'asistencias') {
      body = { estado: params.data.estado };
    }
    if (resource === 'usuarios') {
      body = {
        username: params.data.username,
        email: params.data.email,
        password: params.data.password,
        legajo: params.data.legajo,
        numero_documento: params.data.numero_documento,
        role_name: params.data.role_name,
      };
    }

    const { json } = await httpClient(`${API_URL}/${resource}/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    const rec = json?.data || json;
    return { data: { id: params.id, ...rec } };
  },

  delete: async (resource, params) => {
    const { json } = await httpClient(`${API_URL}/${resource}/${params.id}`, {
      method: 'DELETE',
    });
    const rec = json?.data || json;
    return { data: { id: params.id, ...rec } };
  },

  getMany: async (resource, params) => {
    const results = await Promise.all(
      params.ids.map((id) => httpClient(`${API_URL}/${resource}/${id}`))
    );
    const data = results.map(({ json }, idx) => {
      const rec = json?.data || json;
      return { id: params.ids[idx], ...rec };
    });
    return { data };
  },

  getManyReference: async (resource, params) => dataProvider.getList(resource, params),

  // Helpers opcionales
  getModulos: async () => {
    const { json } = await httpClient(`${API_URL}/modulos`);
    return json?.data || json;
  },

  getCursos: async () => {
    const { json } = await httpClient(`${API_URL}/cursos?${buildPagination({})}`);
    return json?.data || json;
  },

  getAsistencias: async ({ anio_escolar, division }) => {
    const qs = [
      `filters[alumno][curso][anio_escolar][$eq]=${encodeURIComponent(anio_escolar)}`,
      `filters[alumno][curso][division][$eq]=${encodeURIComponent(division)}`,
      'populate[alumno][populate][user]=true',
      'populate[alumno][populate][curso]=true',
      'populate[estado]=true',
    ].join('&');
    const { json } = await httpClient(`${API_URL}/asistencias?${qs}`);
    return json?.data || [];
  },
};

export default dataProvider;
