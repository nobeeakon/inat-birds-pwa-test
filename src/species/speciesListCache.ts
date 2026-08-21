import { speciesListsStore } from "@/storage/db";
import { getSavedLocationIds } from "@/locations";
import type { SpeciesData } from "@/species/useFetchSpecies";
import type { Taxa } from "@/taxa";

/**
 * The species list of a previous session, kept so the species page has something to
 * show while the current one is fetched.
 *
 * Like the observations cache this is only a filler: it is replaced as soon as the
 * fetch finishes. It lives in IndexedDB because a location can have hundreds of
 * species, which is far more than localStorage is meant to hold.
 */

type SpeciesListCacheKey = {
  locationId: string;
  taxa: Taxa;
};

// A list belongs to a location and a taxa: they are what the request is made of
const getCacheKey = ({ locationId, taxa }: SpeciesListCacheKey) =>
  `${locationId}-${taxa}`;

// A deleted location leaves entries that nothing can ever read again
const removeListsOfDeletedLocations = async (): Promise<void> => {
  const savedLocationIds = getSavedLocationIds();
  const cachedLists = await speciesListsStore.getAll();

  await Promise.all(
    cachedLists
      .filter((cachedList) => !savedLocationIds.has(cachedList.locationId))
      .map((cachedList) => speciesListsStore.delete(cachedList.id))
  );
};

export type CachedSpeciesListResult = {
  species: SpeciesData[];
  // Null for entries cached before the total was stored
  totalResults: number | null;
};

export const readCachedSpeciesList = async (
  cacheKey: SpeciesListCacheKey
): Promise<CachedSpeciesListResult | null> => {
  try {
    await removeListsOfDeletedLocations();
    const cachedList = await speciesListsStore.get(getCacheKey(cacheKey));

    if (!cachedList) {
      return null;
    }

    return {
      species: cachedList.species,
      totalResults: cachedList.totalResults ?? null,
    };
  } catch (error) {
    // Without a cached list the page just falls back to its loading state
    console.warn("Failed to read the cached species list:", error);
    return null;
  }
};

export const writeCachedSpeciesList = async (
  cacheKey: SpeciesListCacheKey,
  species: SpeciesData[],
  totalResults: number
): Promise<void> => {
  // An empty result is not worth caching, and would drop a usable entry
  if (species.length === 0) {
    return;
  }

  try {
    await speciesListsStore.set({
      id: getCacheKey(cacheKey),
      ...cacheKey,
      species,
      totalResults,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn("Failed to cache the species list:", error);
  }
};
