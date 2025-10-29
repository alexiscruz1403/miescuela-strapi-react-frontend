import { createTheme } from "@mui/material/styles";
import { defaultTheme } from 'react-admin';

// Combinar tu tema con el tema por defecto de react-admin
export const theme = createTheme({
  ...defaultTheme,
  palette: {
    primary: {
      main: "#0A2E75", // azul principal
      light: "#1252D3",
      dark: "#061B46",
    },
    secondary: {
      main: "#1976d2",
    },
    background: {
      default: "#ffffff", // fondo blanco
      paper: "#ffffff",   // componentes como Card, Drawer
    },
    text: {
      primary: "#061B46",
      secondary: "#2A2E38",
    },
    error: {
      main: "#d32f2f",
    },
    warning: {
      main: "#ed6c02",
    },
    info: {
      main: "#0288d1",
    },
    success: {
      main: "#2e7d32",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 500 },
    h4: { fontWeight: 600, color: "#0A2E75" },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#333',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(10,46,117,0.08)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(10,46,117,0.16)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f5f5',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          '&.RaConfirm-root .RaConfirm-confirmPrimary': {
            backgroundColor: '#D32F2F !important',
            color: '#fff !important',
            '&:hover': {
              backgroundColor: '#B71C1C !important'
            },
          },
        },
      },
    },
  },
});