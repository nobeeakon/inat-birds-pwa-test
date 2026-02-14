import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import ObservationsPage from "@/observations/ObservationsPage";
import SpeciesPage from "@/species/SpeciesPage";
import LocationsPage from "./locations-page/EditLocationsPage";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import type { LocationInformation } from "@/types";

import "./App.css";

const ObservationsAndSpecies = ({
  currentLocation,
  setCurrentLocationId,
}: {
  currentLocation: LocationInformation;
  setCurrentLocationId: (id: string) => void;
}) => {
  const location = useLocation();
  const isObservations = location.pathname === "/observations";

  return (
    <>
      <div className={isObservations ? "" : "hidden"}>
        <ObservationsPage
          currentLocationId={currentLocation.id}
          lat={currentLocation.lat}
          lng={currentLocation.lng}
          radius={currentLocation.radius}
          updateLocation={(newLocation) => setCurrentLocationId(newLocation)}
        />
      </div>
      <div className={isObservations ? "hidden" : ""}>
        <SpeciesPage
          currentLocationId={currentLocation.id}
          lat={currentLocation.lat}
          lng={currentLocation.lng}
          radius={currentLocation.radius}
          updateLocation={(newLocation) => setCurrentLocationId(newLocation)}
        />
      </div>
    </>
  );
};

const Router = () => {
  const { currentLocation, setCurrentLocationId } = useCurrentLocation();

  // Redirect to locations if no location is set
  if (!currentLocation) {
    return (
      <Routes>
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="*" element={<Navigate to="/locations" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/locations" element={<LocationsPage />} />
      <Route
        path="/observations"
        element={
          <ObservationsAndSpecies
            currentLocation={currentLocation}
            setCurrentLocationId={setCurrentLocationId}
          />
        }
      />
      <Route
        path="/species"
        element={
          <ObservationsAndSpecies
            currentLocation={currentLocation}
            setCurrentLocationId={setCurrentLocationId}
          />
        }
      />
      <Route path="/" element={<Navigate to="/observations" replace />} />
    </Routes>
  );
};

export default Router;
