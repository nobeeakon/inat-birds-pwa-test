import { createContext, useContext, type ReactNode } from "react";

import type { LocationInformation } from "@/types";
import { useStorageState } from "@/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";

import "./App.css";

const LocationsContext = createContext<{
  locationsInfo: LocationInformation[];
  setLocationsInfo: (newLocations: LocationInformation[]) => void;
}>({
  locationsInfo: [],
  setLocationsInfo: () => {
    throw new Error("setLocationsInfo not implemented");
  },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useLocationsContext = () => {
  const context = useContext(LocationsContext);
  if (!context) {
    throw new Error(
      "useLocationsContext must be used within a LocationsContext.Provider"
    );
  }
  return context;
};

const LocationsContextProvider = ({ children }: { children: ReactNode }) => {
  const [locationsInfo, setLocationsInfo] = useStorageState<
    LocationInformation[]
  >(LOCAL_STORAGE_KEY.locationsInfo, []);

  const value = {
    locationsInfo,
    setLocationsInfo,
  };

  return (
    <LocationsContext.Provider value={value}>
      {children}
    </LocationsContext.Provider>
  );
};

export default LocationsContextProvider;
