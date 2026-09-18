import { getLocaleQueryParams } from "@/inaturalistSite";
import type { Taxa } from "@/taxa";

export const notNullish = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const getRandomIndex = (length: number) =>
  Math.floor(Math.random() * length);

/**
 * Common names come back however the contributor typed them, so one list mixes
 * "Garambullo" with "garambullo". Only the first letter is touched: the rest carries
 * names such as "pico de oro" or "halcón de Harris" that would be wrong in title case.
 */
export const capitalizeFirstLetter = (
  value: string | null | undefined
): string | null | undefined =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

/**
 * Turns the square photo URL the API returns into the one the service worker keeps
 * offline (see the photo caching rule in vite.config.ts). Every place that shows a
 * species photo goes through here so they all hit the same cache entry.
 */
export const getCachedPhotoUrl = (
  squareUrl: string | undefined
): string | undefined =>
  squareUrl ? `${squareUrl.replace("square", "medium")}?cache=true` : undefined;

const API_URL = "https://api.inaturalist.org/v2";

/**
 * What a species list is made of. iNaturalist only sends the fields asked for, and it
 * asks that requests fetch no more than they use
 * (https://www.inaturalist.org/pages/api+recommended+practices), which matters here
 * more than anywhere else in the app: this is up to 500 species a page, each with its
 * ancestry, so every field named costs five hundred copies of itself.
 *
 * `ancestors` is only ever read by getFamilyName, hence the two fields it needs and no
 * others. `count` and `uuid` are not listed because the API sends them regardless.
 */
const SPECIES_FIELDS = `fields=(taxon:(id:!t,name:!t,preferred_common_name:!t,rank:!t,ancestors:(name:!t,rank:!t),default_photo:(square_url:!t,attribution:!t,license_code:!t),conservation_status:(status:!t,authority:!t),establishment_means:(establishment_means:!t)))`;

/**
 * What an observation card shows: the photos, the species it is of, and the badges
 * under the answer. The date, the place, the observer and the counts the API can also
 * send are left out because nothing on the card displays them.
 */
const OBSERVATION_FIELDS = `fields=(id:!t,taxon:(id:!t,name:!t,preferred_common_name:!t,conservation_status:(status:!t,authority:!t),establishment_means:(establishment_means:!t)),photos:(id:!t,url:!t,attribution:!t,license_code:!t))`;

export const getSpeciesUrl = ({
  lat,
  lng,
  radius,
  taxa,
  perPage,
  page,
}: {
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  perPage: number;
  page: number;
}) =>
  `${API_URL}/observations/species_counts?verifiable=true&spam=false` +
  `&lat=${lat}&lng=${lng}&radius=${radius}&iconic_taxa[]=${taxa}` +
  `&${getLocaleQueryParams({ lat, lng })}` +
  `&page=${page}&per_page=${perPage}&include_ancestors=true&${SPECIES_FIELDS}`;

/**
 * How many species a location has and nothing else: one result, only its id, and no
 * locale, since a count does not depend on the language the names come back in. Asked
 * for before a cached species list is thrown away, to find out whether it is worth
 * spending the several paginated requests a fresh one costs.
 */
export const getSpeciesTotalUrl = ({
  lat,
  lng,
  radius,
  taxa,
}: {
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
}) =>
  `${API_URL}/observations/species_counts?verifiable=true&spam=false` +
  `&lat=${lat}&lng=${lng}&radius=${radius}&iconic_taxa[]=${taxa}` +
  `&page=1&per_page=1&fields=(taxon:(id:!t))`;

/**
 * A random sample of local sightings of one species, which is both the cards for it
 * and the photos shown once the answer is revealed.
 *
 * `order_by=random` rather than a guessed page number: a random page of a species with
 * few sightings is usually an empty one, which used to cost a second request to find
 * out. `quality_grade` and `photos` filter server side, so every record that comes
 * back is usable and none of the response is spent on ones that are not.
 *
 * The same URL is answered from the browser cache for five minutes (the API sends
 * `max-age=300`), so re-opening the app twice in a row costs nothing and shows the
 * same birds. Deliberate: a repeat draw is a fair price for the requests it saves.
 */
export const getObservationsUrlForTaxon = ({
  lat,
  lng,
  radius,
  taxa,
  taxonId,
  perPage,
}: {
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  taxonId: number;
  perPage: number;
}) =>
  `${API_URL}/observations?verifiable=true&spam=false` +
  `&quality_grade=research&photos=true` +
  `&lat=${lat}&lng=${lng}&radius=${radius}&taxon_id=${taxonId}` +
  `&iconic_taxa[]=${taxa}&${getLocaleQueryParams({ lat, lng })}` +
  `&order_by=random&per_page=${perPage}&no_total_hits=true&${OBSERVATION_FIELDS}`;

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
