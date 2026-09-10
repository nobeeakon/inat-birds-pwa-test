/**
 * Where links out to iNaturalist point, and the referrer sent with API requests.
 *
 * iNaturalist's country networks (mexico.inaturalist.org and the rest) are web front
 * ends over one shared API, so the domain only decides where a user lands, never what
 * the data says. Which country the data is about is the `preferred_place_id` query
 * parameter instead, resolved from the location's coordinates in placeLookup.ts.
 */
export const INATURALIST_SITE_URL = "https://www.inaturalist.org";

export const LOCAL_STORAGE_KEY = {
  language: "language",
  resolvedPlaces: "resolved_places",
  currentLocationId: "current_location_id",
  currentTaxa: "current_taxa",
  currentSpeciesPool: "current_species_pool",
  locationsInfo: "locations_info",
  cachedObservations: "cached_observations",
  STORED_URLS_KEY: "stored-urls",
  LAST_URL_KEY: "last-url",
  EXCLUDED_TAXA_STORAGE_KEY: "excluded-taxa",
  IDENTIFIED_OBSERVATIONS_UUIDS_KEY: "identified-observations",
  observations: {
    PREVIOUS_OBSERVATIONS_KEY: "previous-observations",
  },
  species: {
    speciesCategories: "species-species-categories",
    lastUrl: "species-last-url",
    STORED_URLS_KEY: "species-stored-urls",
  },
};
