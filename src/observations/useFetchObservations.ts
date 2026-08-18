import { useState, useEffect } from "react";
import { fetchData } from "@/fetchData";
import { getUrl, getObservationsUrlForTaxon, sleep, notNullish } from "@/utils";
import {
  readCachedObservations,
  writeCachedObservations,
} from "@/observations/observationsCache";
import type { SpeciesData } from "@/species/useFetchSpecies";
import type { Taxa } from "@/taxa";
import { getFamilyName } from "@/taxonomy";
import { getSpeciesPoolLimit, getSpeciesPoolCategoryId } from "@/speciesPool";
import type { SpeciesPool } from "@/speciesPool";

export type ObservationType = {
  uuid: string;
  /**
   * Scientific family name, e.g. "Icteridae".
   *
   * Not part of the API response: the observations endpoint only returns ancestor
   * ids, so this is copied from the species_counts result that this observation was
   * fetched for. Absent on observations cached before the field existed.
   */
  family?: string | null;
  comments_count: number;
  created_at: string;
  created_at_details: {
    date: string;
    day: number;
    hour: number;
    month: number;
    week: number;
    year: number;
  };
  created_time_zone: string;
  faves_count: number;
  geoprivacy?: null | boolean;
  id: number;
  identifications: {
    id: number;
    current: boolean;
  }[];
  identifications_count: number;
  location: `${number},${number}`;
  mappable: boolean;
  obscured: boolean;
  observed_on: string;
  observed_on_details: {
    date: string;
    day: number;
    hour: number;
    month: number;
    week: number;
    year: number;
  };
  observed_time_zone: string;
  photos: {
    id: number;
    url: string;
  }[];
  place_guess: string;
  quality_grade: string;
  sounds: [];
  taxon: {
    id: number;
    conservation_status?: {
      status?: string;
    };
    establishment_means?: {
      establishment_means: string;
    };
    iconic_taxon_id: number;
    name: string;
    preferred_common_name: string;
    rank: string;
    rank_level: number;
  };
  time_observed_at: string;
  user: {
    id: number;
    icon_url: string;
    login: string;
  };
};

type ResponseType = {
  total_results: number;
  page: number;
  per_page: number;
  results: ObservationType[];
};

const MIN_SLEEP_MS = 1000;
const PAGE_SIZE = 10;
const SPECIES_NUMBER = 15;
const MAX_HEURISTIC_PAGE = 20; // Heuristic max pages for random selection

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

/** A species to fetch observations for, and what is already known about it. */
type SpeciesToFetch = {
  taxonId: number;
  family?: string | null;
};

/**
 * A random draw from the species tagged with a category.
 *
 * No request is needed: the tagged taxon ids are enough to fetch observations, which
 * also means the family name is unknown here and the card leaves it out.
 */
const selectTaggedSpecies = (categoryTaxonIds: string): SpeciesToFetch[] => {
  const taggedTaxonIds = categoryTaxonIds
    .split(",")
    .filter(Boolean)
    .map(Number)
    .filter((taxonId) => !Number.isNaN(taxonId));

  return selectRandomNumbers(
    Math.min(SPECIES_NUMBER, taggedTaxonIds.length),
    taggedTaxonIds.length
  )
    .map((idx) => taggedTaxonIds[idx])
    .filter(notNullish)
    .map((taxonId) => ({ taxonId }));
};

/** A random draw from the species list of the location, capped by the pool. */
const selectSpeciesFromPool = async ({
  lat,
  lng,
  radius,
  taxa,
  speciesPool,
}: {
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  speciesPool: SpeciesPool;
}): Promise<SpeciesToFetch[]> => {
  // Get total results to calculate max pages
  const initialUrl = getUrl({
    type: "species",
    lat,
    lng,
    radius,
    taxa,
    perPage: 1,
    page: 1,
  });
  const initialData = await fetchData<{
    total_results: number;
    results: SpeciesData[];
  }>(initialUrl);

  const totalPages = Math.ceil(initialData.total_results / PAGE_SIZE);

  // species_counts is ordered by observation count descending, so capping the
  // page range to the first N pages restricts the draw to the most common species.
  const poolLimit = getSpeciesPoolLimit(speciesPool);
  const pagesInPool = poolLimit
    ? Math.min(totalPages, Math.ceil(poolLimit / PAGE_SIZE))
    : totalPages;

  const numberOfPagesToFetch = Math.min(
    Math.ceil(SPECIES_NUMBER / PAGE_SIZE),
    pagesInPool
  );
  // iNaturalist pages are 1-indexed (page=0 returns page 1), so shift the
  // zero-based draw up by one to reach every page exactly once.
  const speciesPages = selectRandomNumbers(
    numberOfPagesToFetch,
    pagesInPool
  ).map((pageIndex) => pageIndex + 1);

  const speciesData: { results: SpeciesData[] }[] = [];
  for (const page of speciesPages) {
    await sleep(MIN_SLEEP_MS);
    const speciesUrl = getUrl({
      type: "species",
      lat,
      lng,
      radius,
      taxa,
      perPage: PAGE_SIZE,
      page,
    });
    const data = await fetchData<{ results: SpeciesData[] }>(speciesUrl);
    speciesData.push(data);
  }

  const allSpecies = speciesData.flatMap((d) => d.results).filter(notNullish);

  return selectRandomNumbers(SPECIES_NUMBER, allSpecies.length)
    .map((idx) => allSpecies[idx])
    .filter(notNullish)
    .map((speciesItem) => ({
      taxonId: speciesItem.taxon.id,
      family: getFamilyName(speciesItem.taxon.ancestors),
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
}) => {
  const [queries, setQueries] = useState<{
    loading: boolean;
    data: null | ObservationType[];
    error: boolean | null;
    isCachedData: boolean;
  }>({ loading: false, data: null, error: null, isCachedData: false });

  const poolCategoryId = getSpeciesPoolCategoryId(speciesPool);

  useEffect(() => {
    // A fetch takes long enough that the user can change location while it runs; its
    // results must not land on top of whatever is being shown by then
    let isStaleRequest = false;

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
      // for the ~30s the real ones take to arrive. A category pool skips the cache:
      // its entry holds the species of the location, not the ones of the category.
      const cachedObservations =
        poolCategoryId === null
          ? readCachedObservations({ locationId, taxa })
          : null;

      setQueries({
        loading: true,
        data: cachedObservations,
        error: null,
        isCachedData: !!cachedObservations,
      });

      try {
        // Stage 1: Pick the species to fetch observations for
        const speciesToFetch =
          categoryTaxonIds !== null
            ? selectTaggedSpecies(categoryTaxonIds)
            : await selectSpeciesFromPool({
                lat,
                lng,
                radius,
                taxa,
                speciesPool,
              });

        // Stage 2: Fetch observations per species
        const allObservations: ObservationType[] = [];
        const observationRadius = radius + 250; // Increased radius to get more observations per species

        for (const speciesItem of speciesToFetch) {
          await sleep(MIN_SLEEP_MS); // Prevent rate limiting

          // Heuristic: Pick random page from 0 to MAX_HEURISTIC_PAGE
          const randomPage = Math.floor(Math.random() * MAX_HEURISTIC_PAGE);

          const obsUrl = getObservationsUrlForTaxon({
            lat,
            lng,
            radius: observationRadius,
            taxa,
            taxonId: speciesItem.taxonId,
            perPage: 30,
            page: randomPage,
          });

          let obsData = await fetchData<ResponseType>(obsUrl);

          // Fallback: if page is empty (rare species), try page 0
          if (obsData.results.length === 0) {
            await sleep(MIN_SLEEP_MS);
            const fallbackUrl = getObservationsUrlForTaxon({
              lat,
              lng,
              radius: observationRadius,
              taxa,
              taxonId: speciesItem.taxonId,
              perPage: 30,
              page: 0,
            });
            obsData = await fetchData<ResponseType>(fallbackUrl);
          }

          const observations = obsData.results.filter(
            (obs) => obs.quality_grade === "research" && obs.photos.length > 0
          );

          // Select 5 random observations
          const selectedObs = selectRandomNumbers(
            Math.min(5, observations.length),
            observations.length
          )
            .map((idx) => observations[idx])
            .filter(notNullish);

          allObservations.push(
            ...selectedObs.map((observation) => ({
              ...observation,
              family: speciesItem.family,
            }))
          );
        }

        // Stage 3: Randomize final observations
        const shuffled = allObservations
          .map((obs) => ({ obs, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ obs }) => obs);

        // Refill the cache so the next start has something to show right away. Worth
        // doing even for a stale request: the data is still valid for its own key.
        // Only the pools that draw from the location belong in that entry.
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        if (isStaleRequest) return;

        setQueries({
          loading: false,
          data: null,
          error: true,
          isCachedData: false,
        });
      }
    };

    fetchPagesData();

    return () => {
      isStaleRequest = true;
    };
  }, [
    locationId,
    lat,
    lng,
    radius,
    taxa,
    speciesPool,
    poolCategoryId,
    categoryTaxonIds,
  ]);

  return queries;
};
