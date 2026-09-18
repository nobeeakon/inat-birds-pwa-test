import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import ObservationsPage from "@/observations/ObservationsPage";
import HomePage from "@/home/HomePage";
import INaturalistDataContextProvider from "@/INaturalistDataContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useCurrentTaxa } from "@/hooks/useCurrentTaxa";
import { useCurrentSpeciesPool } from "@/hooks/useCurrentSpeciesPool";
import { pruneCaches } from "@/storage/pruneCaches";

// The observations page is the landing route, so it stays in the main bundle. The
// rest are split out; the locations page in particular pulls in Leaflet.
const SpeciesPage = lazy(() => import("@/species/SpeciesPage"));
const LocationsPage = lazy(() => import("./locations-page/EditLocationsPage"));
const AboutPage = lazy(() => import("@/about/AboutPage"));

const PageFallback = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      p: 8,
    }}
  >
    <CircularProgress />
  </Box>
);

const Router = () => {
  const { currentLocation, setCurrentLocationId } = useCurrentLocation();
  const { currentTaxa, setCurrentTaxa } = useCurrentTaxa();
  const { currentSpeciesPool, setCurrentSpeciesPool } = useCurrentSpeciesPool(
    currentLocation?.id ?? null
  );

  // Once a start, and off what the app opened on so that the entries behind this very
  // render are the ones kept. Deliberately not re-run as the user moves between
  // locations: the caches are only trimmed, and trimming them mid-session would throw
  // away what a switch back is about to ask for.
  const openedOnCacheId = currentLocation
    ? `${currentLocation.id}-${currentTaxa}`
    : null;
  useEffect(() => {
    pruneCaches(openedOnCacheId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Without a location there is nothing to observe, so the landing route is the welcome
  // screen instead of the observations page
  if (!currentLocation) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/about" element={<AboutPage />} />
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
      </Suspense>
    </INaturalistDataContextProvider>
  );
};

export default Router;
