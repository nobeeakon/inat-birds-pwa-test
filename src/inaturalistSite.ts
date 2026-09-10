import {
  FALLBACK_LANGUAGE,
  getStoredLanguage,
  type Language,
} from "@/language";
import { getCachedCountryPlaceId, type Coordinates } from "@/placeLookup";

/**
 * The locale half of every API URL, e.g. `locale=en` or
 * `locale=es&preferred_place_id=6793`. Because it is part of the URL, each language and
 * place combination gets its own service worker cache entries for free.
 *
 * The two halves are independent: the language decides the words common names come back
 * in, the coordinates decide which country's names, endemicity and conservation
 * listings win. Requests with nothing to do with a location, such as a taxon's photos,
 * leave the coordinates out and get the language alone.
 */
export const getLocaleQueryParams = (coordinates?: Coordinates): string => {
  const locale: Language = getStoredLanguage() ?? FALLBACK_LANGUAGE;
  const localeParams = new URLSearchParams({ locale });

  const preferredPlaceId = coordinates
    ? getCachedCountryPlaceId(coordinates)
    : null;
  if (preferredPlaceId !== null) {
    localeParams.set("preferred_place_id", String(preferredPlaceId));
  }

  return localeParams.toString();
};
