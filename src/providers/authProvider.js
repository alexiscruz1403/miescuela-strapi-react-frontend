import { login as loginService, logout as logoutService } from '../services/auth';

export const authProvider = {
  login: async ({ username, password }) => {
    try {
      const response = await loginService(username, password);
      
      if (response.csrf_token) {
        sessionStorage.setItem('csrf_token', response.csrf_token);
      }
      if (response.access_token) {
        sessionStorage.setItem('access_token', response.access_token);
      }
      if (response.refresh_token) {
        sessionStorage.setItem('refresh_token', response.refresh_token);
      }
      
      sessionStorage.setItem('user', JSON.stringify(response.usuario));
      sessionStorage.setItem('permissions', response.usuario.rol);
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  logout: async () => {
    try {
      await logoutService();
      sessionStorage.clear();
      return Promise.resolve();
    } catch (error) {
      sessionStorage.clear();
      return Promise.resolve();
    }
  },

  checkError: ({ status }) => {
    if (status === 401 || status === 403) {
      sessionStorage.clear();
      return Promise.reject();
    }
    return Promise.resolve();
  },

  checkAuth: () => {
    const token = sessionStorage.getItem('access_token');
    return token ? Promise.resolve() : Promise.reject();
  },

  getPermissions: () => {
    const role = sessionStorage.getItem('permissions');
    return role ? Promise.resolve(role) : Promise.reject();
  },

  getIdentity: () => {
    try {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) return Promise.reject();
      
      const user = JSON.parse(userStr);
      
      return Promise.resolve({
        id: user.id_usuario,
        fullName: user.nombre_completo,
        avatar: user.foto,
        role: user.rol,
        email: user.email,
      });
    } catch (error) {
      return Promise.reject();
    }
  },
};