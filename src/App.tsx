import { BrowserRouter } from "react-router-dom";
import theme from "./theme";
import LanguageContextProvider from "./LanguageContext";
import SpeciesInfoContextProvider from "./SpeciesInfoContext";
import CategoriesContextProvider from "./CategoriesContext";
import LocationsContextProvider from "./LocationsContext";
import { ThemeProvider } from "@mui/material/styles";

import InstallButton from "@/components/InstallButton";
import UpdatePrompt from "@/components/UpdatePrompt";
import Router from "./Router";

import "./App.css";

const BASE_URL = import.meta.env.BASE_URL;

const AppWrapper = () => {
  return (
    <ThemeProvider theme={theme}>
      <LanguageContextProvider>
        <LocationsContextProvider>
          <CategoriesContextProvider>
            <SpeciesInfoContextProvider>
              <BrowserRouter basename={BASE_URL}>
                <Router />
                <InstallButton />
                <UpdatePrompt />
              </BrowserRouter>
            </SpeciesInfoContextProvider>
          </CategoriesContextProvider>
        </LocationsContextProvider>
      </LanguageContextProvider>
    </ThemeProvider>
  );
};

export default AppWrapper;
