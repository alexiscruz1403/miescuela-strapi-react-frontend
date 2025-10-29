import { Button } from "@mui/material";

export const PrimaryButton = ({
  children,
  startIcon,
  onClick,
  sx = {},
  ...props
}) => (
  <Button
    variant="contained"
    startIcon={startIcon}
    onClick={onClick}
    sx={{
      backgroundColor: "#0A2E75",
      textTransform: "none",
      fontWeight: 600,
      boxShadow: "0 2px 8px rgba(10,46,117,0.08)",
      transition: "background 0.2s, box-shadow 0.2s",
      "&:hover": {
        backgroundColor: "#174ea6",
        boxShadow: "0 4px 16px rgba(10,46,117,0.16)",
      },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Button>
);