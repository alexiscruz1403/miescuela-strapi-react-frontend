import { Box, CircularProgress, Typography } from "@mui/material";

export const Loader = ({ text = "Cargando..." }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
    >
      <CircularProgress />
      <Typography variant="body2" mt={2}>
        {text}
      </Typography>
    </Box>
  );
};

