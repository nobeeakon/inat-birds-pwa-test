import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { storage } from "@/storage/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";
import type { LocationInformation } from "@/types";
import { useLocationsContext } from "@/LocationsContext";

type UseCurrentLocationReturn = {
  currentLocationId: string | null;
  setCurrentLocationId: (id: string) => void;
  currentLocation: LocationInformation | undefined;
};

/**
 * Hook to manage current location ID with URL param and localStorage sync.
 * Validates that the location ID exists in the locations array.
 */
export const useCurrentLocation = (): UseCurrentLocationReturn => {
  const { locationsInfo: locations } = useLocationsContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlLocationId = searchParams.get("location");

  // Derive the current location ID from URL param, localStorage, or locations array
  const currentLocationId = useMemo(() => {
    if (locations.length === 0) {
      return null;
    }

    const locationExists = (id: string | null) =>
      !!id && locations.some((loc) => loc.id === id);

    // Priority: valid URL param > valid localStorage > first location
    if (locationExists(urlLocationId)) {
      return urlLocationId;
    }

    const storedId = storage.get<string>(LOCAL_STORAGE_KEY.currentLocationId);
    if (locationExists(storedId)) {
      return storedId;
    }

    return locations[0].id;
  }, [locations, urlLocationId]);

  // Sync URL param when current location changes
  useEffect(() => {
    if (currentLocationId && urlLocationId !== currentLocationId) {
      setSearchParams({ location: currentLocationId }, { replace: true });
    }
  }, [currentLocationId, urlLocationId, setSearchParams]);

  // Sync localStorage when current location changes
  useEffect(() => {
    if (currentLocationId) {
      storage.set(LOCAL_STORAGE_KEY.currentLocationId, currentLocationId);
    } else {
      storage.remove(LOCAL_STORAGE_KEY.currentLocationId);
    }
  }, [currentLocationId]);

  const setCurrentLocationId = (id: string) => {
    storage.set(LOCAL_STORAGE_KEY.currentLocationId, id);
    setSearchParams({ location: id });
  };

  const currentLocation = locations.find((loc) => loc.id === currentLocationId);

  return {
    currentLocationId,
    setCurrentLocationId,
    currentLocation,
  };
};
