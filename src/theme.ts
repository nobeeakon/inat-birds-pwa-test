import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#646cff",
      contrastText: "#fff",
    },
    // MUI derives shades from these with lighten()/darken(), which only parse
    // numeric formats: CSS colour names such as "lightgreen" throw at runtime
    success: {
      main: "#4caf50",
      light: "#90ee90", // lightgreen
    },
    info: {
      main: "#2196f3",
      light: "#add8e6", // lightblue
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          padding: "0.6em 1.2em",
          fontSize: "0.8em",
        },
      },
    },
  },
});

export default theme;
