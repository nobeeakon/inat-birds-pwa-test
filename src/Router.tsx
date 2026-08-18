import {
  Routes,
  Route,
  Navigate,
  useLocation as useRouterLocation,
} from "react-router-dom";

import ObservationsPage from "@/observations/ObservationsPage";
import SpeciesPage from "@/species/SpeciesPage";
import LocationsPage from "./locations-page/EditLocationsPage";
import BirdDataContextProvider from "@/BirdDataContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useCurrentTaxa } from "@/hooks/useCurrentTaxa";
import { useCurrentSpeciesPool } from "@/hooks/useCurrentSpeciesPool";

import "./App.css";

const Router = () => {
  const { search } = useRouterLocation();
  const { currentLocation, setCurrentLocationId } = useCurrentLocation();
  const { currentTaxa, setCurrentTaxa } = useCurrentTaxa();
  const { currentSpeciesPool, setCurrentSpeciesPool } = useCurrentSpeciesPool();

  // Locations page when no location is set yet
  if (!currentLocation) {
    return (
      <Routes>
        <Route path="/" element={<LocationsPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route
          path="*"
          element={<Navigate to={`/locations${search}`} replace />}
        />
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
    <BirdDataContextProvider
      currentLocation={currentLocation}
      currentTaxa={currentTaxa}
      currentSpeciesPool={currentSpeciesPool}
    >
      <Routes>
        <Route path="/locations" element={<LocationsPage />} />
        {/* The landing path renders the observations page rather than redirecting
            to it: a redirect only takes effect in an effect, which the hooks above
            undo by writing their params against the pre-redirect path, leaving the
            app on a path that matches nothing and renders blank */}
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
        {/* Params are carried over so the redirect does not drop the current
            location, taxa and pool */}
        <Route
          path="*"
          element={<Navigate to={`/observations${search}`} replace />}
        />
      </Routes>
    </BirdDataContextProvider>
  );
};

export default Router;
