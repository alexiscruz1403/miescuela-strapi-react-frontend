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
import { useState } from "react";
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

  const handleLogin = async (data) => {
    setLoading(true);

    const { email, contrasenia } = data;
    setServerError(null);

    try {
      const res = await login(email, contrasenia);
      setUser(res.data.user);
      sessionStorage.setItem("csrf_token", res.data.csrf_token);
      sessionStorage.setItem("access_token", res.data.access_token);
      sessionStorage.setItem("refresh_token", res.data.refresh_token);
      navigate("/");
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
        width: "100%",
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