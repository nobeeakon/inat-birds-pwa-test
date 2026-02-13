import { BrowserRouter } from "react-router-dom";
import theme from "./theme";
import SpeciesInfoContextProvider from "./SpeciesInfoContext";
import CategoriesContextProvider from "./CategoriesContext";
import LocationsContextProvider from "./LocationsContext";
import { ThemeProvider } from "@mui/material/styles";

import InstallButton from "@/components/InstallButton";
import Router from "./Router";

import "./App.css";

const BASE_URL = import.meta.env.BASE_URL;

const AppWrapper = () => {
  return (
    <ThemeProvider theme={theme}>
      <LocationsContextProvider>
        <CategoriesContextProvider>
          <SpeciesInfoContextProvider>
            <BrowserRouter basename={BASE_URL}>
              <Router />
              <InstallButton />
            </BrowserRouter>
          </SpeciesInfoContextProvider>
        </CategoriesContextProvider>
      </LocationsContextProvider>
    </ThemeProvider>
  );
};

export default AppWrapper;
