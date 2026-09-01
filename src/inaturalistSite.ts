import {
  FALLBACK_LANGUAGE,
  getStoredLanguage,
  type Language,
} from "@/language";

/**
 * iNaturalist runs country networks on their own subdomains, each answering with its
 * own locale and regional common names. The language choice therefore picks the
 * network the app talks to, not just the language of our own strings.
 */
type INaturalistSite = {
  /** Origin for links out to iNaturalist, and the referrer sent with API requests. */
  siteUrl: string;
  /** `locale` query parameter: the language the API returns common names in. */
  locale: string;
  /**
   * `preferred_place_id` query parameter: the place whose regional common names win.
   * Omitted on the global site, which has no regional preference.
   */
  preferredPlaceId?: number;
};

const MEXICO_PLACE_ID = 6793;

const INATURALIST_SITES: Record<Language, INaturalistSite> = {
  en: {
    siteUrl: "https://www.inaturalist.org",
    locale: "en",
  },
  es: {
    siteUrl: "https://mexico.inaturalist.org",
    locale: "es-MX",
    preferredPlaceId: MEXICO_PLACE_ID,
  },
};

/**
 * Read at call time rather than cached, so a language change picked up by
 * LanguageContext applies to the next request without a reload.
 */
export const getInaturalistSite = (): INaturalistSite =>
  INATURALIST_SITES[getStoredLanguage() ?? FALLBACK_LANGUAGE];

/**
 * The locale half of every API URL, e.g. `locale=en` or
 * `locale=es-MX&preferred_place_id=6793`. Because it is part of the URL, the two
 * languages get separate service worker cache entries for free.
 */
export const getLocaleQueryParams = (): string => {
  const { locale, preferredPlaceId } = getInaturalistSite();

  const localeParams = new URLSearchParams({ locale });
  if (preferredPlaceId !== undefined) {
    localeParams.set("preferred_place_id", String(preferredPlaceId));
  }

  return localeParams.toString();
};
