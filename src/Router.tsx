import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import ObservationsPage from "@/observations/ObservationsPage";
import SpeciesPage from "@/species/SpeciesPage";
import LocationsPage from "./locations-page/EditLocationsPage";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useCurrentTaxa } from "@/hooks/useCurrentTaxa";
import { useCurrentSpeciesPool } from "@/hooks/useCurrentSpeciesPool";
import type { LocationInformation } from "@/types";
import type { Taxa } from "@/taxa";
import type { SpeciesPool } from "@/speciesPool";

import "./App.css";

const ObservationsAndSpecies = ({
  currentLocation,
  currentTaxa,
  currentSpeciesPool,
  setCurrentLocationId,
  setCurrentTaxa,
  setCurrentSpeciesPool,
}: {
  currentLocation: LocationInformation;
  currentTaxa: Taxa;
  currentSpeciesPool: SpeciesPool;
  setCurrentLocationId: (id: string) => void;
  setCurrentTaxa: (taxa: Taxa) => void;
  setCurrentSpeciesPool: (speciesPool: SpeciesPool) => void;
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
          currentTaxa={currentTaxa}
          currentSpeciesPool={currentSpeciesPool}
          updateLocation={(newLocation) => setCurrentLocationId(newLocation)}
          updateTaxa={(newTaxa) => setCurrentTaxa(newTaxa)}
          updateSpeciesPool={(newPool) => setCurrentSpeciesPool(newPool)}
        />
      </div>
      <div className={isObservations ? "hidden" : ""}>
        <SpeciesPage
          currentLocationId={currentLocation.id}
          lat={currentLocation.lat}
          lng={currentLocation.lng}
          radius={currentLocation.radius}
          currentTaxa={currentTaxa}
          updateLocation={(newLocation) => setCurrentLocationId(newLocation)}
          updateTaxa={(newTaxa) => setCurrentTaxa(newTaxa)}
        />
      </div>
    </>
  );
};

const Router = () => {
  const { currentLocation, setCurrentLocationId } = useCurrentLocation();
  const { currentTaxa, setCurrentTaxa } = useCurrentTaxa();
  const { currentSpeciesPool, setCurrentSpeciesPool } = useCurrentSpeciesPool();

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
            currentTaxa={currentTaxa}
            currentSpeciesPool={currentSpeciesPool}
            setCurrentLocationId={setCurrentLocationId}
            setCurrentTaxa={setCurrentTaxa}
            setCurrentSpeciesPool={setCurrentSpeciesPool}
          />
        }
      />
      <Route
        path="/species"
        element={
          <ObservationsAndSpecies
            currentLocation={currentLocation}
            currentTaxa={currentTaxa}
            currentSpeciesPool={currentSpeciesPool}
            setCurrentLocationId={setCurrentLocationId}
            setCurrentTaxa={setCurrentTaxa}
            setCurrentSpeciesPool={setCurrentSpeciesPool}
          />
        }
      />
      <Route path="/" element={<Navigate to="/observations" replace />} />
    </Routes>
  );
};

export default Router;
