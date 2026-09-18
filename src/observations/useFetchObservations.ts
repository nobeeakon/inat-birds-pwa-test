import { useState, useEffect, useCallback } from "react";
import { fetchData, getFetchErrorKind, type FetchErrorKind } from "@/fetchData";
import { useIsOffline } from "@/onlineStatus";
import { resolveCountryPlaceId } from "@/placeLookup";
import { getObservationsUrlForTaxon, pickRandom } from "@/utils";
import {
  buildCards,
  readDeckEntries,
  writeDeck,
  type DeckCacheKey,
} from "@/observations/deck";
import {
  planRound,
  ROUND_SIZE,
  type SpeciesCandidate,
} from "@/observations/roundSelection";
import { readSpeciesReviews } from "@/observations/speciesReviews";
import type { ObservationType } from "@/observations/types";
import type { DeckEntry } from "@/storage/db";
import type { SpeciesData } from "@/species/useFetchSpecies";
import type { Taxa } from "@/taxa";
import { getFamilyName } from "@/taxonomy";
import { getSpeciesPoolLimit, getSpeciesPoolCategoryId } from "@/speciesPool";
import type { SpeciesPool } from "@/speciesPool";

type ResponseType = {
  results: ObservationType[];
};

/**
 * Sightings asked for per species, in one request.
 *
 * Only a few become cards; the rest are here for their photos, and for the cards the
 * next round makes of the same species out of the same entry. Fifteen is about what a
 * species' reveal deck can use — more would be photos nobody pages to.
 */
const OBSERVATIONS_PER_SPECIES = 15;

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

/**
 * The species a round may draw from, out of the list already fetched for the location.
 *
 * No request of its own: the species page's list is what a pool is a slice of. It
 * arrives most observed first, so a preset pool is its first N entries.
 */
const getRoundCandidates = ({
  species,
  speciesPool,
  categoryTaxonIds,
}: {
  species: SpeciesData[];
  speciesPool: SpeciesPool;
  categoryTaxonIds: string | null;
}): SpeciesCandidate[] => {
  const getFamilyOf = (taxonId: number) =>
    getFamilyName(
      species.find((item) => item.taxon.id === taxonId)?.taxon.ancestors
    );

  // A category pool is a set of taxon ids the user tagged, which can include species
  // the location's list does not have; those simply come without a family name
  if (categoryTaxonIds !== null) {
    return categoryTaxonIds
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((taxonId) => !Number.isNaN(taxonId))
      .map((taxonId) => ({ taxonId, family: getFamilyOf(taxonId) }));
  }

  const poolLimit = getSpeciesPoolLimit(speciesPool);
  const pool = poolLimit ? species.slice(0, poolLimit) : species;

  return pool.map((item) => ({
    taxonId: item.taxon.id,
    family: getFamilyName(item.taxon.ancestors),
  }));
};

/**
 * A page of local sightings of one species, ready to be kept in the deck.
 *
 * One request per species: a single request for all of them at once comes back
 * distributed by how often each is observed, which leaves the uncommon ones — the very
 * ones worth learning — with nothing.
 */
const fetchDeckEntry = async ({
  candidate,
  lat,
  lng,
  radius,
  taxa,
  abortSignal,
}: {
  candidate: SpeciesCandidate;
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  abortSignal: AbortSignal;
}): Promise<DeckEntry> => {
  const { results } = await fetchData<ResponseType>(
    getObservationsUrlForTaxon({
      lat,
      lng,
      radius: radius + OBSERVATION_RADIUS_MARGIN,
      taxa,
      taxonId: candidate.taxonId,
      perPage: OBSERVATIONS_PER_SPECIES,
    }),
    abortSignal
  );

  return {
    taxonId: candidate.taxonId,
    family: candidate.family,
    observations: results,
    fetchedAt: Date.now(),
  };
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

      const deckCacheKey: DeckCacheKey = { locationId, taxa, lat, lng, radius };
      const deckEntries = await readDeckEntries(deckCacheKey);
      if (isStaleRequest) return;

      // A round's worth of what the deck already holds, to fill the page while the real
      // round is put together. A category pool gets none: the deck holds the species of
      // the location, and showing those to someone who asked for a category would be
      // showing them the wrong birds rather than early ones.
      const cachedObservations =
        poolCategoryId === null && deckEntries.length > 0
          ? pickRandom(deckEntries, ROUND_SIZE).flatMap(buildCards)
          : null;

      // Offline the deck is all there is. Not left loading: there is nothing in flight,
      // and nothing will be until the connection comes back, which re-runs this effect.
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

        const reviews = await readSpeciesReviews();
        if (isStaleRequest) return;

        const { reinforced, reused, toFetch, keptEntries } = planRound({
          candidates: getRoundCandidates({
            species,
            speciesPool,
            categoryTaxonIds,
          }),
          deckEntries,
          reviews,
        });

        const fetchedEntries: DeckEntry[] = [];

        for (const candidate of toFetch) {
          fetchedEntries.push(
            await fetchDeckEntry({
              candidate,
              lat,
              lng,
              radius,
              taxa,
              abortSignal: abortController.signal,
            })
          );

          // Stored as each species lands rather than once the round is assembled. A
          // cold round is fifteen requests and the rate limit gives it a second each,
          // so it is a quarter of a minute long: a user who reloads or walks away part
          // way through it would otherwise throw away every species it had already
          // paid for, and the next round would start from nothing and pay again.
          if (poolCategoryId === null) {
            await writeDeck(deckCacheKey, [...keptEntries, ...fetchedEntries]);
          }
        }

        // Every species of the round becomes cards here rather than when it was
        // fetched, so a species the deck has shown before comes back with a different
        // set of them
        const allObservations = [
          ...reinforced,
          ...reused,
          ...fetchedEntries,
        ].flatMap(buildCards);

        const shuffled = pickRandom(allObservations, allObservations.length);

        // Again at the end, for the rounds that fetched nothing at all: the sweep still
        // has to be persisted, and the deck still has to be marked as used so the prune
        // keeps it. A category round only reads the deck — its species are the ones the
        // user tagged rather than the location's, so they are not what a later round of
        // this location should be filled with.
        if (poolCategoryId === null) {
          await writeDeck(deckCacheKey, [...keptEntries, ...fetchedEntries]);
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
