import { Routes, Route, Navigate } from "react-router-dom";

import ObservationsPage from "@/observations/ObservationsPage";
import SpeciesPage from "@/species/SpeciesPage";
import LocationsPage from "./locations-page/EditLocationsPage";
import INaturalistDataContextProvider from "@/INaturalistDataContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useCurrentTaxa } from "@/hooks/useCurrentTaxa";
import { useCurrentSpeciesPool } from "@/hooks/useCurrentSpeciesPool";

import "./App.css";

const Router = () => {
  const { currentLocation, setCurrentLocationId } = useCurrentLocation();
  const { currentTaxa, setCurrentTaxa } = useCurrentTaxa();
  const { currentSpeciesPool, setCurrentSpeciesPool } = useCurrentSpeciesPool();

  // Locations page when no location is set yet
  if (!currentLocation) {
    return (
      <Routes>
        <Route path="/" element={<LocationsPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="*" element={<Navigate to="/locations" replace />} />
      </Routes>
    );
  }

  const observationsPage = (
    <ObservationsPage
      currentLocationId={currentLocation.id}
      currentTaxa={currentTaxa}
      currentSpeciesPool={currentSpeciesPool}
      updateLocation={setCurrentLocationId}
      updateTaxa={setCurrentTaxa}
      updateSpeciesPool={setCurrentSpeciesPool}
    />
  );

  return (
    <INaturalistDataContextProvider
      currentLocation={currentLocation}
      currentTaxa={currentTaxa}
      currentSpeciesPool={currentSpeciesPool}
    >
      <Routes>
        <Route path="/locations" element={<LocationsPage />} />
        {/* Rendered rather than redirected to, so the landing path costs no extra
            navigation */}
        <Route path="/" element={observationsPage} />
        <Route path="/observations" element={observationsPage} />
        <Route
          path="/species"
          element={
            <SpeciesPage
              currentLocationId={currentLocation.id}
              currentTaxa={currentTaxa}
              updateLocation={setCurrentLocationId}
              updateTaxa={setCurrentTaxa}
            />
          }
        />
        <Route path="*" element={<Navigate to="/observations" replace />} />
      </Routes>
    </INaturalistDataContextProvider>
  );
};

export default Router;
