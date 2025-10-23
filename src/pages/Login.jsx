import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import { LoaderOverlay } from "../components/LoaderOverlay";
import backgroundImage from "../assets/img/fondo_login.png";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { login } from "../services/auth";
import useUser from "../contexts/UserContext/useUser";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();

  const [serverError, setServerError] = useState(null);

  const [loading, setLoading] = useState(false);

  const { setUser } = useUser();

  // Si ya existe token, redirigir según rol
  useEffect(() => {
    try {
      const token = sessionStorage.getItem("access_token");
      const storedUser = sessionStorage.getItem("user");
      let role = sessionStorage.getItem("permissions");
      if (!role && storedUser) {
        try { role = JSON.parse(storedUser)?.rol; } catch {}
      }
      if (token) {
        navigate(role ? "/" : "/no-access");
      }
    } catch {}
  }, [navigate]);

  const handleLogin = async (data) => {
    setLoading(true);

    const { email, contrasenia } = data;
    setServerError(null);

    try {
      const res = await login(email, contrasenia);
      // res ya es response.data desde services/auth
      const rawUser = (res && (res.user || res.usuario)) || (res?.data && (res.data.user || res.data.usuario)) || null;
      if (rawUser) {
        const mapToInternalRole = (name) => {
          if (!name) return undefined;
          const s = String(name).toLowerCase();
          if (s.includes('admin')) return 'admin';
          if (s.includes('director')) return 'director';
          if (s.includes('docen')) return 'docente';
          if (s.includes('auxil')) return 'auxiliar';
          if (s.includes('asesor')) return 'asesor_pedagogico';
          if (s.includes('jefe') && s.includes('aux')) return 'jefe_auxiliares';
          if (s.includes('tutor')) return 'tutor';
          if (s.includes('alum') || s.includes('estud') || s.includes('student')) return 'alumno';
          return s;
        };
        // Preferir el rol desde roles[] del backend si existe
        const rolesArr = Array.isArray(rawUser.roles) ? rawUser.roles : [];
        const inferredRoleRaw = (rolesArr[0]?.nombre_rol) || rawUser.nombre_rol || rawUser.rol;
        const inferredRole = mapToInternalRole(inferredRoleRaw);
        const user = inferredRole ? { ...rawUser, rol: inferredRole } : rawUser;
        setUser(user);
        try { sessionStorage.setItem("user", JSON.stringify(user)); } catch {}
        if (user.rol) {
          // Sobrescribir cualquier permiso anterior con el rol interno
          sessionStorage.setItem("permissions", user.rol);
        }
      }
      const payload = res?.data || res || {};
      if (payload.csrf_token) sessionStorage.setItem("csrf_token", payload.csrf_token);
      if (payload.access_token) sessionStorage.setItem("access_token", payload.access_token);
      if (payload.refresh_token) sessionStorage.setItem("refresh_token", payload.refresh_token);
      const roleAfter = sessionStorage.getItem("permissions");
      navigate(roleAfter ? "/" : "/no-access");
    } catch (error) {
      setServerError(error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        overflowX: 'hidden',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          handleSubmit(handleLogin)();
        }
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: "100%",
          backdropFilter: "blur(6px)",
          backgroundColor: "rgba(255,255,255,0.9)",
          borderRadius: 3,
          boxShadow: 6,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            fontWeight={600}
            align="center"
            color="primary"
          >
            Iniciar sesión
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mb={3}
            align="center"
          >
            Ingresa con tu usuario y contraseña
          </Typography>

          <TextField
            fullWidth
            label="Correo electrónico"
            variant="outlined"
            margin="normal"
            {...register("email", {
              required: "El correo es obligatorio",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Formato de correo inválido",
              },
            })}
          />
          <Typography variant="body2" align="left" color="error">
            {errors.email?.message}
          </Typography>

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            variant="outlined"
            margin="normal"
            {...register("contrasenia", {
              required: "La contraseña es obligatoria",
              minLength: {
                value: 8,
                message: "Debe tener al menos 8 caracteres",
              },
            })}
          />
          <Typography variant="body2" align="left" color="error">
            {errors.contrasenia?.message}
          </Typography>

          {serverError && (
            <Typography variant="body2" align="center" color="error" mt={2}>
              {serverError}
            </Typography>
          )}
          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
            onClick={handleSubmit(handleLogin)}
          >
            Ingresar
          </Button>

          <Typography
            variant="body2"
            textAlign="center"
            mt={2}
            color="text.secondary"
          >
            ¿Olvidaste tu contraseña?
          </Typography>
        </CardContent>
      </Card>

      <LoaderOverlay open={loading} />
    </Box>
  );
};
