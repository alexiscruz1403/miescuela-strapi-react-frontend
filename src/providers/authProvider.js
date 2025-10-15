import { login as loginService, logout as logoutService } from '../services/auth';

export const authProvider = {
  login: async ({ username, email, identifier, password }) => {
    try {
      const id = identifier || email || username;
      const response = await loginService(id, password);

      if (response?.jwt) {
        sessionStorage.setItem('access_token', response.jwt);
      }
      if (response?.user) {
        sessionStorage.setItem('user', JSON.stringify(response.user));
      }
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

  checkAuth: () =>
    sessionStorage.getItem('access_token') ? Promise.resolve() : Promise.reject(),

  getPermissions: () => {
    const perms = sessionStorage.getItem('permissions');
    return Promise.resolve(perms || '');
  },
};
