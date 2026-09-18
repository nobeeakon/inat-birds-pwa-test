import { useState, useEffect, useCallback } from "react";
import { fetchData, getFetchErrorKind, type FetchErrorKind } from "@/fetchData";
import type { ConservationStatus } from "@/conservation";
import { useIsOffline } from "@/onlineStatus";
import { resolveCountryPlaceId } from "@/placeLookup";
import { getObservationsUrlForTaxon, notNullish } from "@/utils";
import {
  readCachedObservations,
  writeCachedObservations,
} from "@/observations/observationsCache";
import type { SpeciesData } from "@/species/useFetchSpecies";
import type { Taxa } from "@/taxa";
import { getFamilyName } from "@/taxonomy";
import { getSpeciesPoolLimit, getSpeciesPoolCategoryId } from "@/speciesPool";
import type { SpeciesPool } from "@/speciesPool";

export type ObservationPhoto = {
  id: number;
  url: string;
  /** Ready to display, e.g. "(c) someone, some rights reserved (CC BY-NC)". */
  attribution?: string;
  /** Null on the photos whose owner reserved every right. */
  license_code?: string | null;
};

/**
 * A photo of another sighting, carrying which one it came from: the credit under it
 * links to the sighting it belongs to, not to the card it is being shown on.
 */
export type SpeciesPhoto = ObservationPhoto & { observationId: number };

export type ObservationType = {
  uuid: string;
  id: number;
  /**
   * Scientific family name, e.g. "Icteridae".
   *
   * Not part of the API response: the observations endpoint only returns ancestor
   * ids, so this is copied from the species list entry this observation was fetched
   * for. Absent on observations cached before the field existed.
   */
  family?: string | null;
  /**
   * Other local sightings of the same species, shown once the answer is revealed.
   *
   * Not part of the API response either. Each species is fetched a page of sightings
   * at a time and only a few of them become cards, so the photos of the rest are
   * already paid for and are of birds from around the user's location — which is what
   * the curated photos on the taxon record are not, being the same worldwide.
   */
  speciesPhotos?: SpeciesPhoto[];
  photos: ObservationPhoto[];
  taxon: {
    id: number;
    name: string;
    preferred_common_name: string;
    conservation_status?: ConservationStatus;
    establishment_means?: {
      establishment_means: string;
    };
  };
};

type ResponseType = {
  results: ObservationType[];
};

/** Species drawn per round. */
const SPECIES_NUMBER = 15;

/**
 * Sightings asked for per species, in one request.
 *
 * Only the first few become cards; the rest are here for their photos. Fifteen is
 * about what a species' reveal deck can use — more would be photos nobody pages to.
 */
const OBSERVATIONS_PER_SPECIES = 15;

/** Cards made per species, out of the sightings fetched for it. */
const CARDS_PER_SPECIES = 5;

/** Photos kept per species for the reveal, beyond the card's own. */
const MAX_SPECIES_PHOTOS = 12;

/**
 * Added to the location's radius when fetching sightings of a species.
 *
 * Being in the species list only means a species has been observed in range, not that
 * it has been photographed in range by someone whose identification others confirmed —
 * which is what a card needs. Without the margin the species with few local sightings,
 * the ones most worth learning, come back with a card or two and a thin reveal deck.
 *
 * The photos this widens to are of birds from further away than the user's own patch,
 * which is the price of having any at all for those species.
 */
const OBSERVATION_RADIUS_MARGIN = 250;

const selectRandomNumbers = (size: number, max: number = 100) => {
  const numbers = new Set(Array(max).keys());

  const selectedNumbers = [];

  for (let i = 0; i < size; i++) {
    const arrayNumbers = Array.from(numbers);
    const randomIndex = Math.floor(Math.random() * arrayNumbers.length);
    selectedNumbers.push(arrayNumbers[randomIndex]);
    numbers.delete(arrayNumbers[randomIndex]);
  }

  return selectedNumbers;
};

/** A species to fetch sightings for, and what is already known about it. */
type SpeciesToFetch = {
  taxonId: number;
  family?: string | null;
};

const pickRandom = <T>(items: T[], size: number): T[] =>
  selectRandomNumbers(Math.min(size, items.length), items.length)
    .map((index) => items[index])
    .filter(notNullish);

/**
 * The species this round draws from, out of the list already fetched for the location.
 *
 * No request of its own: the species page's list is what a pool is a slice of. It
 * arrives most observed first, so a preset pool is its first N entries.
 */
const selectSpecies = ({
  species,
  speciesPool,
  categoryTaxonIds,
}: {
  species: SpeciesData[];
  speciesPool: SpeciesPool;
  categoryTaxonIds: string | null;
}): SpeciesToFetch[] => {
  const getFamilyOf = (taxonId: number) =>
    getFamilyName(
      species.find((item) => item.taxon.id === taxonId)?.taxon.ancestors
    );

  // A category pool is a set of taxon ids the user tagged, which can include species
  // the location's list does not have; those simply come without a family name
  if (categoryTaxonIds !== null) {
    const taggedTaxonIds = categoryTaxonIds
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((taxonId) => !Number.isNaN(taxonId));

    return pickRandom(taggedTaxonIds, SPECIES_NUMBER).map((taxonId) => ({
      taxonId,
      family: getFamilyOf(taxonId),
    }));
  }

  const poolLimit = getSpeciesPoolLimit(speciesPool);
  const pool = poolLimit ? species.slice(0, poolLimit) : species;

  return pickRandom(pool, SPECIES_NUMBER).map((item) => ({
    taxonId: item.taxon.id,
    family: getFamilyName(item.taxon.ancestors),
  }));
};

/**
 * The cards for one species, and the photos its reveal can show.
 *
 * One request per species: a single request for all of them at once comes back
 * distributed by how often each is observed, which leaves the uncommon ones — the very
 * ones worth learning — with nothing.
 */
const fetchObservationsOfSpecies = async ({
  speciesItem,
  lat,
  lng,
  radius,
  taxa,
  abortSignal,
}: {
  speciesItem: SpeciesToFetch;
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  abortSignal: AbortSignal;
}): Promise<ObservationType[]> => {
  const { results } = await fetchData<ResponseType>(
    getObservationsUrlForTaxon({
      lat,
      lng,
      radius: radius + OBSERVATION_RADIUS_MARGIN,
      taxa,
      taxonId: speciesItem.taxonId,
      perPage: OBSERVATIONS_PER_SPECIES,
    }),
    abortSignal
  );

  // Every sighting fetched contributes its photos, the cards among them included: a
  // card's own photos are filtered out of its deck where it is rendered, and leaving
  // them in here means the other cards of this species can still show them.
  const speciesPhotos: SpeciesPhoto[] = results
    .flatMap((observation) =>
      (observation.photos ?? []).map((photo) => ({
        ...photo,
        observationId: observation.id,
      }))
    )
    .slice(0, MAX_SPECIES_PHOTOS);

  return pickRandom(results, CARDS_PER_SPECIES).map((observation) => ({
    ...observation,
    family: speciesItem.family,
    speciesPhotos,
  }));
};

export const useFetchObservations = ({
  locationId,
  lat,
  lng,
  radius,
  taxa,
  speciesPool,
  categoryTaxonIds,
  species,
  speciesError,
}: {
  locationId: string;
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  speciesPool: SpeciesPool;
  /**
   * Comma separated taxon ids of the species tagged with the pool's category, or
   * null when the pool is not a category or the tagged species are not known yet.
   * A string rather than an array so it can be an effect dependency.
   */
  categoryTaxonIds: string | null;
  /**
   * The location's species list, which the draw picks from. Null while it is still
   * being read or fetched, which is what this hook waits on before asking for
   * anything of its own.
   */
  species: SpeciesData[] | null;
  /** Set when the species list could not be fetched, which leaves nothing to draw from. */
  speciesError: FetchErrorKind | null;
}) => {
  const [queries, setQueries] = useState<{
    loading: boolean;
    data: null | ObservationType[];
    error: FetchErrorKind | null;
    isCachedData: boolean;
  }>({ loading: false, data: null, error: null, isCachedData: false });

  // Bumped to run the effect again after a failure, without any of the inputs having
  // to change
  const [retryToken, setRetryToken] = useState(0);
  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  // An input like the others, so the fetch is skipped while there is no connection and
  // starts by itself once there is one again
  const isOffline = useIsOffline();

  const poolCategoryId = getSpeciesPoolCategoryId(speciesPool);

  // The list keeps growing as its pages land, and a draw made from the first page must
  // not be restarted by the second. So whether there is a list to draw from is the
  // dependency, not the list itself.
  const hasSpecies = (species?.length ?? 0) > 0;

  useEffect(() => {
    // A fetch takes long enough that the user can change location while it runs; its
    // results must not land on top of whatever is being shown by then
    let isStaleRequest = false;
    // Abandoned runs are also cut short rather than left to finish quietly: a dozen
    // requests still to go would otherwise compete with the ones the user is waiting
    // on, against the same rate limit
    const abortController = new AbortController();

    const fetchPagesData = async () => {
      if (!lat || !lng || !radius) {
        setQueries({
          loading: false,
          data: null,
          error: null,
          isCachedData: false,
        });
        return;
      }

      // Which species a category pool draws from is not known until the species
      // info has loaded; keep waiting rather than fetching the wrong ones
      if (poolCategoryId !== null && categoryTaxonIds === null) {
        setQueries({
          loading: true,
          data: null,
          error: null,
          isCachedData: false,
        });
        return;
      }

      // Observations kept from a previous session give the user something to look at
      // while the real ones are fetched. A category pool skips the cache: its entry
      // holds the species of the location, not the ones of the category.
      const cachedObservations =
        poolCategoryId === null
          ? readCachedObservations({ locationId, taxa })
          : null;

      // Offline the cached observations are all there is. Not left loading: there is
      // nothing in flight, and nothing will be until the connection comes back, which
      // re-runs this effect.
      if (isOffline) {
        setQueries({
          loading: false,
          data: cachedObservations,
          error: null,
          isCachedData: !!cachedObservations,
        });
        return;
      }

      // Without a species list there is nothing to draw from, so the error the list
      // failed with is this page's error too — one error screen and one retry for
      // what the user experiences as one failure
      if (speciesError) {
        setQueries({
          loading: false,
          data: null,
          error: speciesError,
          isCachedData: false,
        });
        return;
      }

      setQueries({
        loading: true,
        data: cachedObservations,
        error: null,
        isCachedData: !!cachedObservations,
      });

      // The list is on its way. This effect runs again with its first page, which is
      // all the draw needs.
      if (!species || !hasSpecies) {
        return;
      }

      try {
        // Before the first URL is built, so the sightings come back with the country's
        // common names, endemicity and conservation listings
        await resolveCountryPlaceId({ lat, lng });

        const speciesToFetch = selectSpecies({
          species,
          speciesPool,
          categoryTaxonIds,
        });

        const allObservations: ObservationType[] = [];

        for (const speciesItem of speciesToFetch) {
          allObservations.push(
            ...(await fetchObservationsOfSpecies({
              speciesItem,
              lat,
              lng,
              radius,
              taxa,
              abortSignal: abortController.signal,
            }))
          );
        }

        const shuffled = pickRandom(allObservations, allObservations.length);

        // Refill the cache so the next start has something to show right away. Only
        // the pools that draw from the location belong in that entry. An abandoned
        // run never gets here, having been aborted part way through its species.
        if (poolCategoryId === null) {
          writeCachedObservations({ locationId, taxa }, shuffled);
        }

        if (isStaleRequest) return;

        setQueries({
          loading: false,
          data: shuffled,
          error: null,
          isCachedData: false,
        });
      } catch (error) {
        if (isStaleRequest) return;

        setQueries({
          loading: false,
          data: null,
          error: getFetchErrorKind(error),
          isCachedData: false,
        });
      }
    };

    fetchPagesData();

    return () => {
      isStaleRequest = true;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locationId,
    lat,
    lng,
    radius,
    taxa,
    speciesPool,
    poolCategoryId,
    categoryTaxonIds,
    isOffline,
    retryToken,
    // `species` itself is deliberately not a dependency, see hasSpecies
    hasSpecies,
    speciesError,
  ]);

  return { ...queries, retry };
};
