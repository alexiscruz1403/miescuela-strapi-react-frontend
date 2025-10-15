import axios from "axios";

const API_URL = "http://localhost:6543/api";

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
})

// Helper para CSRF
/*
Autenticacion mediante cookies y CSRF -> PRODUCCION
const getCsrfToken = () => {
    return document.cookie
        .split("; ")
        .find(row => row.startsWith("csrf_token="))
        ?.split("=")[1];
}
*/

// Agregar CSRF a cada request
api.interceptors.request.use((config) => {
    /*
    Autenticacion mediante cookies y CSRF -> PRODUCCION
    const csrfToken = getCsrfToken();
    if(csrfToken){
        config.headers["X-CSRF-Token"] = csrfToken;
    }
    */
    const csrfToken = sessionStorage.getItem("csrf_token");
    const accessToken = sessionStorage.getItem("access_token");
    const refreshToken = sessionStorage.getItem("refresh_token");

    if(csrfToken){
        config.headers["X-CSRF-Token"] = csrfToken;
    }
    if(accessToken){
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    if(refreshToken){
        config.headers["X-Refresh-Token"] = refreshToken;
    }
    return config;
});

// Interceptor de respuesta para manejar refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;

            try{
                await api.post("/auth/refresh");
                return api(originalRequest);
            }catch(err){
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);