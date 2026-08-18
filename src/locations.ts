import { storage } from "@/storage/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";
import type { LocationInformation } from "@/types";

/**
 * Ids of the locations the user currently has saved, read straight from storage.
 *
 * Caches use this to drop entries belonging to deleted locations, which they need to
 * do outside of React and so cannot read from the locations context.
 */
export const getSavedLocationIds = (): Set<string> => {
  const savedLocations =
    storage.get<LocationInformation[]>(LOCAL_STORAGE_KEY.locationsInfo) ?? [];

  return new Set(savedLocations.map((locationItem) => locationItem.id));
};
