import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import "leaflet/dist/leaflet.css";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import theme from "./theme";
import SpeciesInfoContextProvider from "./SpeciesInfoContext";
import CategoriesContextProvider from "./CategoriesContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CategoriesContextProvider>
        <SpeciesInfoContextProvider>
          <App />
        </SpeciesInfoContextProvider>
      </CategoriesContextProvider>
    </ThemeProvider>
  </StrictMode>
);
