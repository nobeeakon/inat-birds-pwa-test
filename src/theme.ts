import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#646cff",
      contrastText: "#fff",
    },
    success: {
      main: "#4caf50",
      light: "lightgreen",
    },
    info: {
      main: "#2196f3",
      light: "lightblue",
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
