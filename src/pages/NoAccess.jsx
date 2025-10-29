import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const NoAccess = () => {
  const navigate = useNavigate();

  // Si no hay sesión, volver al login
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleVolverLogin = () => {
    navigate("/login", { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
        backgroundColor: "#f5f7fb",
      }}
    >
      <Card
        sx={{
          maxWidth: 520,
          width: "100%",
          borderRadius: 3,
          boxShadow: 6,
          backgroundColor: "rgba(255,255,255,0.95)",
        }}
      >
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <BlockIcon color="error" sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h5" gutterBottom fontWeight={600} color="primary">
            Acceso restringido
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={2}>
            Tu usuario no tiene un rol asignado aún.
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Por favor, contacta al administrador de la escuela para que te asigne el rol correspondiente y habilite tu acceso.
          </Typography>

          <Button variant="contained" color="primary" onClick={handleVolverLogin}>
            Volver al login
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NoAccess;

