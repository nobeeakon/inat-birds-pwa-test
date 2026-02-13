import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";

import LatestObservationsPage from "@/latest-observations/LatestObservationsPage";
import LocationsPage from "./locations-page/EditLocationsPage";
import { useStorageState } from "@/storage/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";
import LocationsContextProvider, {
  useLocationsContext,
} from "@/LocationsContext";
import SpeciesInfoContextProvider from "@/SpeciesInfoContext";
import InstallButton from "@/components/InstallButton";

import "./App.css";

const App = () => {
  const { t } = useTranslation();
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
    <Box sx={{ px: 2 }}>
      {!currentLocationId || !currentLocation ? (
        <div>{t("pleaseSelectLocation")}</div>
      ) : (
        <>
          <div className={page === "observations" ? "" : "hidden"}>
            <LatestObservationsPage
              currentLocationId={currentLocationId}
              onShowSpecies={() => setPage("species")}
              onShowLocations={() => setPage("locations")}
              lat={currentLocation.lat}
              lng={currentLocation.lng}
              radius={currentLocation.radius}
              updateLocation={(newLocation) =>
                setCurrentLocationId(newLocation)
              }
            />
          </div>
          <div className={page === "species" ? "" : "hidden"}>
            {/* <SpeciesPage
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
            /> */}
          </div>
        </>
      )}
    </Box>
  );
};

const AppWrapper = () => {
  return (
    <div>
      <LocationsContextProvider>
        <SpeciesInfoContextProvider>
          <App />
          <InstallButton />
        </SpeciesInfoContextProvider>
      </LocationsContextProvider>
    </div>
  );
};

export default AppWrapper;
