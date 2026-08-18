import { storage } from "@/storage/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { getSavedLocationIds } from "@/locations";
import type { ObservationType } from "@/observations/useFetchObservations";
import type { Taxa } from "@/taxa";

/**
 * A handful of observations kept from a previous session so the page has something
 * to show while the real ones are fetched.
 *
 * This is only a startup filler: it is thrown away as soon as the fetch finishes and
 * refilled with a random sample of the fresh observations. Cached entries are kept
 * for every location the user has saved, since any of them can be the one they open.
 */

const CACHED_OBSERVATIONS_PER_ENTRY = 10;

type ObservationsCacheKey = {
  locationId: string;
  taxa: Taxa;
};

type CachedObservations = ObservationsCacheKey & {
  observations: ObservationType[];
};

type ObservationsCache = Record<string, CachedObservations>;

// Entries are per location and taxa: showing birds to someone who asked for plants
// would be worse than showing nothing. The species pool is deliberately left out,
// it only narrows which species are drawn from the same location.
const getCacheKey = ({ locationId, taxa }: ObservationsCacheKey) =>
  `${locationId}-${taxa}`;

const readCache = (): ObservationsCache =>
  storage.get<ObservationsCache>(LOCAL_STORAGE_KEY.cachedObservations) ?? {};

// A deleted location leaves entries that nothing can ever read again
const withoutDeletedLocations = (
  cache: ObservationsCache
): ObservationsCache => {
  const savedLocationIds = getSavedLocationIds();

  return Object.fromEntries(
    Object.entries(cache).filter(([, entry]) =>
      savedLocationIds.has(entry.locationId)
    )
  );
};

const pickRandomObservations = (
  observations: ObservationType[],
  size: number
): ObservationType[] =>
  observations
    .map((observation) => ({ observation, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, size)
    .map(({ observation }) => observation);

export const readCachedObservations = (
  cacheKey: ObservationsCacheKey
): ObservationType[] | null => {
  const cache = readCache();
  const cleanedCache = withoutDeletedLocations(cache);

  if (Object.keys(cleanedCache).length !== Object.keys(cache).length) {
    storage.set(LOCAL_STORAGE_KEY.cachedObservations, cleanedCache);
  }

  return cleanedCache[getCacheKey(cacheKey)]?.observations ?? null;
};

export const writeCachedObservations = (
  cacheKey: ObservationsCacheKey,
  observations: ObservationType[]
): void => {
  // An empty result is not worth caching, and would drop a usable entry
  if (observations.length === 0) {
    return;
  }

  const cache = withoutDeletedLocations(readCache());

  storage.set<ObservationsCache>(LOCAL_STORAGE_KEY.cachedObservations, {
    ...cache,
    [getCacheKey(cacheKey)]: {
      ...cacheKey,
      observations: pickRandomObservations(
        observations,
        CACHED_OBSERVATIONS_PER_ENTRY
      ),
    },
  });
};
