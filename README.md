📘 MiEscuela 4.0 – Frontend

🚀 Tecnologías principales

React 18 + Vite → base del proyecto (rápido, moderno y con React Compiler activado).

JavaScript (ES2023) → lenguaje elegido para el frontend.

📦 Dependencias instaladas

## Core

react y react-dom → librerías principales de React.

vite → bundler y servidor de desarrollo.

## Routing

react-router-dom → para la navegación entre páginas (versión 7).

## HTTP

axios → cliente HTTP para conectar con el backend (más simple y escalable que fetch).

## Gráficos

recharts → librería de gráficos basada en componentes de React (ideal para dashboards académicos).

📂 Estructura inicial de carpetas
src/
├── assets/          # imágenes, íconos
├── components/      # componentes reutilizables (Navbar, Botón, etc.)
├── pages/           # vistas principales (Login, Dashboard, etc.)
├── services/        # conexión al backend vía Axios
├── App.jsx          # rutas principales
└── main.jsx         # punto de entrada

✍️ Nomenclatura para declarar componentes

Se adopta la forma moderna con arrow functions:

// ✅ Recomendado
export const Login = () => {
  return (
    <div>Login</div>
  );
};


## 🔧 Guía de instalación y ejecución
1. Clonar el repositorio
git clone:

→ con HTTPS:  https://github.com/psantueno/TF-MiEscuela-Frontend

→ con SSH: git@github.com:psantueno/TF-MiEscuela-Frontend.git

2. Instalar dependencias
npm install

3. Ejecutar en modo desarrollo
npm run dev

Abrí el navegador en: 👉 http://localhost:5173