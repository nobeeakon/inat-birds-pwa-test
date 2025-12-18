import { useEffect, useState } from "react";

import LatestObservationsPage from "@/latest-observations/LatestObservationsPage";
import SpeciesPage from "@/species/SpeciesPage";
import LocationsPage from "./locations-page/EditLocationsPage";
import { useStorageState } from "@/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { getUrl } from "@/utils";
import LocationsContextProvider, {
  useLocationsContext,
} from "@/LocationsContext";

import "./App.css";

const App = () => {
  const [page, setPage] = useState<"observations" | "species" | "locations">(
    "observations"
  );
  const [currentLocationId, setCurrentLocationId] = useStorageState<
    string | null
  >(LOCAL_STORAGE_KEY.currentLocationId, "");
  const locations = useLocationsContext().locationsInfo;

  const currentLocation = locations.find(
    (locationItem) => locationItem.id === currentLocationId
  );

  // Ensure currentLocationId is valid
  useEffect(() => {
    if (locations.length === 0) {
      setCurrentLocationId("");
      return;
    }

    if (!currentLocationId || !currentLocation) {
      setCurrentLocationId(locations[0].id);
    }
  }, [currentLocationId, locations, setCurrentLocationId, currentLocation]);

  if (page === "locations" || locations.length === 0) {
    return <LocationsPage onShowObservationsPage={() => setPage("species")} />;
  }

  return (
    <div>
      {!currentLocationId || !currentLocation ? (
        <div>Please select a location in Species Page</div>
      ) : (
        <>
          <div className={page === "observations" ? "" : "hidden"}>
            <LatestObservationsPage
              currentLocationId={currentLocationId}
              onShowSpecies={() => setPage("species")}
              onShowLocations={() => setPage("locations")}
              url={getUrl({
                type: "observations",
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                radius: currentLocation.radius,
              })}
              updateLocation={(newLocation) =>
                setCurrentLocationId(newLocation)
              }
            />
          </div>
          <div className={page === "species" ? "" : "hidden"}>
            <SpeciesPage
              onShowLatestObservations={() => setPage("observations")}
              onShowLocations={() => setPage("locations")}
              currentLocationId={currentLocationId}
              url={getUrl({
                type: "species",
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                radius: currentLocation.radius,
              })}
              updateLocation={(newLocation) =>
                setCurrentLocationId(newLocation)
              }
            />
          </div>
        </>
      )}
    </div>
  );
};

const AppWrapper = () => {
  return (
    <div>
      <LocationsContextProvider>
        <App />
      </LocationsContextProvider>
    </div>
  );
};

export default AppWrapper;
