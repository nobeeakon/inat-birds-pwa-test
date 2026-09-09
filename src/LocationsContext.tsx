import { createContext, useContext, type ReactNode } from "react";

import type { LocationInformation } from "@/types";
import { useStorageState } from "@/storage/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";

import "./App.css";

const LocationsContext = createContext<{
  locationsInfo: LocationInformation[];
  setLocationsInfo: (newLocations: LocationInformation[]) => void;
  currentLocationId: string | null;
  setCurrentLocationId: (locationId: string | null) => void;
}>({
  locationsInfo: [],
  setLocationsInfo: () => {
    throw new Error("setLocationsInfo not implemented");
  },
  currentLocationId: null,
  setCurrentLocationId: () => {
    throw new Error("setCurrentLocationId not implemented");
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

  // Which location is being looked at lives next to the list itself so that the pages
  // reading it and the locations page setting it share one value. Read it through
  // useCurrentLocation rather than here: the stored id can name a deleted location.
  const [currentLocationId, setCurrentLocationId] = useStorageState<
    string | null
  >(LOCAL_STORAGE_KEY.currentLocationId, null);

  const value = {
    locationsInfo,
    setLocationsInfo,
    currentLocationId,
    setCurrentLocationId,
  };

  return (
    <LocationsContext.Provider value={value}>
      {children}
    </LocationsContext.Provider>
  );
};

export default LocationsContextProvider;
