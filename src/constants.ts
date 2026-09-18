/**
 * Where links out to iNaturalist point, and the referrer sent with API requests.
 *
 * iNaturalist's country networks (mexico.inaturalist.org and the rest) are web front
 * ends over one shared API, so the domain only decides where a user lands, never what
 * the data says. Which country the data is about is the `preferred_place_id` query
 * parameter instead, resolved from the location's coordinates in placeLookup.ts.
 */
export const INATURALIST_SITE_URL = "https://www.inaturalist.org";

export const ANKI_SITE_URL = "https://apps.ankiweb.net/";

/**
 * How the app identifies itself to iNaturalist, which asks that requests carry
 * something it can tell apart from everyone else's
 * (https://www.inaturalist.org/pages/api+recommended+practices).
 *
 * Sent two ways because neither is enough on its own: as a `User-Agent` header, which
 * is what iNaturalist documents but which browsers refuse to let a page set (it is a
 * forbidden header name, so this one never leaves the tab — it is here for the sake of
 * any build of this code that runs outside a browser), and as a query parameter, which
 * is what actually arrives. Unknown parameters are ignored by the API.
 */
export const API_CLIENT_NAME = "inat-memorama";

export const API_CLIENT_QUERY_PARAM = `app_name=${API_CLIENT_NAME}`;

export const LOCAL_STORAGE_KEY = {
  language: "language",
  resolvedPlaces: "resolved_places",
  currentLocationId: "current_location_id",
  currentTaxa: "current_taxa",
  currentSpeciesPool: "current_species_pool",
  currentSpeciesPoolLocationId: "current_species_pool_location_id",
  locationsInfo: "locations_info",
  cachedObservations: "cached_observations",
  STORED_URLS_KEY: "stored-urls",
  LAST_URL_KEY: "last-url",
  EXCLUDED_TAXA_STORAGE_KEY: "excluded-taxa",
  IDENTIFIED_OBSERVATIONS_UUIDS_KEY: "identified-observations",
  observations: {
    PREVIOUS_OBSERVATIONS_KEY: "previous-observations",
    revealedObservationsCount: "observations-revealed-count",
  },
  species: {
    speciesCategories: "species-species-categories",
    lastUrl: "species-last-url",
    STORED_URLS_KEY: "species-stored-urls",
  },
};
