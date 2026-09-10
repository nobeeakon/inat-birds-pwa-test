import { LOCAL_STORAGE_KEY } from "@/constants";
import { fetchData } from "@/fetchData";
import { storage } from "@/storage/storage";

/**
 * Which country a set of coordinates falls in, as an iNaturalist place id.
 *
 * Sent on as `preferred_place_id`, which is what makes the API answer with regional
 * common names, whether a species is endemic or introduced there, and the status a
 * national authority gives it (Mexico's NOM-059, say) rather than only IUCN's. None of
 * that comes back from lat/lng alone, so the place has to be looked up first.
 */
export type Coordinates = {
  lat: number;
  lng: number;
};

/**
 * iNaturalist has no lookup for a single point, only for a box, so the coordinates are
 * grown into a small one around themselves. A twentieth of a degree is roughly 5km:
 * enough to land inside the country, too little to reach across an ocean.
 */
const BOUNDING_BOX_DEGREES = 0.05;

/** admin_level of a country, as opposed to a state (10) or a county (20). */
const COUNTRY_ADMIN_LEVEL = 0;

/**
 * Coordinates rounded to about a kilometre before they become a cache key, so two pins
 * in the same city do not each cost a lookup.
 */
const CACHE_KEY_DECIMALS = 2;

type NearbyPlacesResponse = {
  results?: {
    /** iNaturalist's own places. The sibling `community` list is user drawn, and has no countries in it. */
    standard?: {
      id: number;
      admin_level: number | null;
    }[];
  };
};

/**
 * The country place id per location, or null once the coordinates are known to have no
 * country to find, as happens out at sea. Both answers are worth keeping: without the
 * null, somewhere mid-ocean would be looked up again on every load.
 */
type ResolvedPlaces = Record<string, number | null>;

const getCacheKey = ({ lat, lng }: Coordinates): string =>
  `${lat.toFixed(CACHE_KEY_DECIMALS)},${lng.toFixed(CACHE_KEY_DECIMALS)}`;

const readResolvedPlaces = (): ResolvedPlaces =>
  storage.get<ResolvedPlaces>(LOCAL_STORAGE_KEY.resolvedPlaces) ?? {};

/**
 * The place id already known for these coordinates, without asking for one. Null both
 * when nothing has been resolved yet and when the answer was that there is no country:
 * either way there is no place to send, and the request goes out unqualified.
 *
 * Synchronous because the URL builders are, which is why resolveCountryPlaceId has to
 * have been awaited earlier in the fetch for this to return anything.
 */
export const getCachedCountryPlaceId = (
  coordinates: Coordinates
): number | null => readResolvedPlaces()[getCacheKey(coordinates)] ?? null;

/**
 * Resolves the country these coordinates fall in and remembers it, so that the URL
 * builders can read it synchronously afterwards. Costs one request per location, ever.
 *
 * Never throws: a location whose country cannot be worked out is still worth showing,
 * just with the global answers the API gives when no place is preferred.
 */
export const resolveCountryPlaceId = async (
  coordinates: Coordinates
): Promise<number | null> => {
  const resolvedPlaces = readResolvedPlaces();
  const cacheKey = getCacheKey(coordinates);

  if (cacheKey in resolvedPlaces) {
    return resolvedPlaces[cacheKey];
  }

  const { lat, lng } = coordinates;
  const nearbyPlacesUrl =
    `https://api.inaturalist.org/v1/places/nearby` +
    `?nelat=${lat + BOUNDING_BOX_DEGREES}&nelng=${lng + BOUNDING_BOX_DEGREES}` +
    `&swlat=${lat - BOUNDING_BOX_DEGREES}&swlng=${lng - BOUNDING_BOX_DEGREES}`;

  try {
    const response = await fetchData<NearbyPlacesResponse>(nearbyPlacesUrl);
    const country = (response.results?.standard ?? []).find(
      (place) => place.admin_level === COUNTRY_ADMIN_LEVEL
    );
    const countryPlaceId = country?.id ?? null;

    storage.set<ResolvedPlaces>(LOCAL_STORAGE_KEY.resolvedPlaces, {
      ...resolvedPlaces,
      [cacheKey]: countryPlaceId,
    });

    return countryPlaceId;
  } catch (error) {
    // Deliberately not cached: a lookup that failed is worth retrying later, unlike
    // coordinates that genuinely have no country
    console.error(`Could not resolve a place for ${cacheKey}:`, error);
    return null;
  }
};
