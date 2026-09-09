import { useMemo } from "react";
import type { LocationInformation } from "@/types";
import { useLocationsContext } from "@/LocationsContext";

type UseCurrentLocationReturn = {
  currentLocationId: string | null;
  setCurrentLocationId: (id: string) => void;
  currentLocation: LocationInformation | undefined;
};

/**
 * The location the app is currently showing, kept in localStorage by LocationsContext.
 *
 * The stored id is resolved against the saved locations on every read: deleting the
 * location that was selected leaves an id that names nothing, and the first saved
 * location stands in until another one is picked.
 */
export const useCurrentLocation = (): UseCurrentLocationReturn => {
  const {
    locationsInfo: locations,
    currentLocationId: storedLocationId,
    setCurrentLocationId,
  } = useLocationsContext();

  const currentLocationId = useMemo(() => {
    if (locations.length === 0) {
      return null;
    }

    const isLocationSaved = locations.some(
      (loc) => loc.id === storedLocationId
    );

    return isLocationSaved ? storedLocationId : locations[0].id;
  }, [locations, storedLocationId]);

  const currentLocation = locations.find((loc) => loc.id === currentLocationId);

  return {
    currentLocationId,
    setCurrentLocationId,
    currentLocation,
  };
};
