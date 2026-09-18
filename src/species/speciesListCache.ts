import { speciesListsStore } from "@/storage/db";
import { FALLBACK_LANGUAGE, getStoredLanguage } from "@/language";
import type { SpeciesData } from "@/species/useFetchSpecies";
import type { Taxa } from "@/taxa";

/**
 * The species list of a previous session, kept both to fill the species page while the
 * current one is fetched and, when it is still current, to be the current one.
 *
 * Fetching a list costs several paginated requests against a rate limit shared with
 * every other request the app makes, so an entry that is known to still hold is served
 * instead of being fetched again. What "still hold" means is decided by the caller
 * (see @/species/useFetchSpecies) out of what is read back here: which request the
 * entry answered, how old it is, and when its species total was last confirmed.
 *
 * It lives in IndexedDB because a location can have hundreds of species, which is far
 * more than localStorage is meant to hold.
 */

export type SpeciesListCacheKey = {
  locationId: string;
  taxa: Taxa;
  lat: number;
  lng: number;
  radius: number;
};

// A list belongs to a location and a taxa. The coordinates and radius are deliberately
// left out: an edited location should overwrite its own entry rather than leave one
// behind that nothing will read again.
const getCacheKey = ({ locationId, taxa }: SpeciesListCacheKey) =>
  `${locationId}-${taxa}`;

const getCurrentLanguage = () => getStoredLanguage() ?? FALLBACK_LANGUAGE;

/**
 * How stale the stored `lastUsedAt` is allowed to get before a read refreshes it.
 *
 * Without it every read would rewrite the whole entry — hundreds of species — and the
 * effect this sits behind runs again on a retry, on a connection coming back and on a
 * location being edited. The prune only compares entries against each other, so an
 * hour's worth of drift cannot change which of them it keeps.
 */
const TOUCH_THRESHOLD_MS = 60 * 60 * 1000;

export type CachedSpeciesListResult = {
  species: SpeciesData[];
  // Null for entries cached before the total was stored
  totalResults: number | null;
  /**
   * Whether the entry answers this exact request. False for one fetched before the
   * location was moved or resized, or in another language, which makes it wrong to
   * serve however recent it is.
   */
  matchesRequest: boolean;
  /** Since the species were fetched. */
  ageMs: number;
  /**
   * Since the species total was last known to match, which is the fetch itself until a
   * later check confirms it.
   */
  unverifiedForMs: number;
};

export const readCachedSpeciesList = async (
  cacheKey: SpeciesListCacheKey
): Promise<CachedSpeciesListResult | null> => {
  try {
    const cachedList = await speciesListsStore.get(getCacheKey(cacheKey));

    if (!cachedList) {
      return null;
    }

    const now = Date.now();

    // Reading a list is what marks it as still wanted, which is what keeps it out of
    // the prune's reach (see @/storage/pruneCaches)
    if (now - (cachedList.lastUsedAt ?? 0) > TOUCH_THRESHOLD_MS) {
      await speciesListsStore.set({ ...cachedList, lastUsedAt: now });
    }

    return {
      species: cachedList.species,
      totalResults: cachedList.totalResults ?? null,
      matchesRequest:
        cachedList.lat === cacheKey.lat &&
        cachedList.lng === cacheKey.lng &&
        cachedList.radius === cacheKey.radius &&
        cachedList.language === getCurrentLanguage(),
      ageMs: now - cachedList.timestamp,
      unverifiedForMs: now - (cachedList.verifiedAt ?? cachedList.timestamp),
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
      language: getCurrentLanguage(),
      species,
      totalResults,
      timestamp: Date.now(),
      lastUsedAt: Date.now(),
    });
  } catch (error) {
    console.warn("Failed to cache the species list:", error);
  }
};

/**
 * Records that the location still has the same number of species as the cached list
 * does, which buys the list another freshness window without it being fetched again.
 * The fetch timestamp is left alone: it is what puts an eventual ceiling on how long a
 * list can go on being confirmed rather than replaced.
 */
export const markCachedSpeciesListVerified = async (
  cacheKey: SpeciesListCacheKey
): Promise<void> => {
  try {
    const cachedList = await speciesListsStore.get(getCacheKey(cacheKey));

    if (!cachedList) {
      return;
    }

    await speciesListsStore.set({ ...cachedList, verifiedAt: Date.now() });
  } catch (error) {
    // The list is still served; it is only checked again sooner than it had to be
    console.warn("Failed to mark the cached species list as verified:", error);
  }
};
