import { api } from "./api";

export const login = async (identifier, password) => {
  const { data } = await api.post("/auth/local", { identifier, password });
  // Guardar JWT y user básico
  sessionStorage.setItem("access_token", data.jwt);
  sessionStorage.setItem("user", JSON.stringify(data.user));

  try {
    const me = await api.get("/usuarios/me");
    sessionStorage.setItem("permissions", me.data?.role?.name || "");
    // Fusionar info de /me en user
    sessionStorage.setItem("user", JSON.stringify({ ...(data.user || {}), role: me.data?.role }));
  } catch (e) {
    // ignorar si /me falla
  }
  return data;
};

export const logout = async () => {
  sessionStorage.clear();
  return true;
};

export const getMe = async () => {
  const { data } = await api.get("/usuarios/me");
  return data;
};
