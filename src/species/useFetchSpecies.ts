import { useState, useEffect, useCallback } from "react";
import type { ConservationStatus } from "@/conservation";
import { fetchData, getFetchErrorKind, type FetchErrorKind } from "@/fetchData";
import { useIsOffline } from "@/onlineStatus";
import { resolveCountryPlaceId } from "@/placeLookup";
import { sleep, getUrl, getSpeciesTotalUrl } from "@/utils";
import {
  readCachedSpeciesList,
  writeCachedSpeciesList,
  markCachedSpeciesListVerified,
  type CachedSpeciesListResult,
  type SpeciesListCacheKey,
} from "@/species/speciesListCache";
import type { Taxa } from "@/taxa";

type Photo = {
  id: number;
  square_url: string;
  attribution?: string;
  license_code?: string | null;
  medium_url?: string;
  url?: string;
};

type Taxon = {
  id: number;
  default_photo: Photo;
  iconic_taxon_name: string;
  is_active: boolean;
  name: string;
  preferred_common_name?: string;
  rank: string;
  rank_level: number;
};

export type SpeciesData = {
  count: number;
  taxon: {
    id: number;
    ancestor_ids: number[];
    ancestors: Taxon[];
    ancestry: string;
    default_photo: Photo;
    iconic_taxon_name: string;
    is_active: boolean;
    name: string;
    preferred_common_name?: string;
    rank: string;
    rank_level: number;
    establishment_means?: {
      establishment_means: string;
    };
    conservation_status?: ConservationStatus;
  };
};

type ResponseType = {
  total_results: number;
  page: number;
  per_page: number;
  results: SpeciesData[];
};

// Locations with more species than this only get their most observed ones: the
// species page tells the user when its list was cut short
export const MAX_SPECIES_TO_FETCH = 1500;

// The largest page iNaturalist serves. Fewer, bigger requests keep the whole list
// well under the rate limit and cut the wait: each page also costs a second of sleep.
const SPECIES_PER_PAGE = 500;

type FetchSpeciesResult = {
  species: SpeciesData[];
  totalResults: number;
};

const fetchSpecies = async ({
  lat,
  lng,
  radius,
  taxa,
  abortSignal,
}: {
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  abortSignal: AbortSignal;
}): Promise<FetchSpeciesResult> => {
  const species: SpeciesData[] = [];
  let totalResults = 0;

  // Before the first URL is built, so every page asks for the country's common names,
  // endemicity and conservation listings rather than the global ones
  await resolveCountryPlaceId({ lat, lng });

  const numberOfPages = Math.ceil(MAX_SPECIES_TO_FETCH / SPECIES_PER_PAGE);

  for (let page = 1; page <= numberOfPages; page++) {
    await sleep(1000);
    const pageUrl = getUrl({
      type: "species",
      lat,
      lng,
      radius,
      taxa,
      page,
      perPage: SPECIES_PER_PAGE,
    });
    const data = await fetchData<ResponseType>(pageUrl, abortSignal);

    totalResults = data.total_results;

    if (data.results.length === 0) {
      break;
    }

    species.push(...data.results);

    // The location has no further pages to ask for
    if (species.length >= totalResults) {
      break;
    }
  }

  return {
    species: species.slice(0, MAX_SPECIES_TO_FETCH),
    totalResults,
  };
};

/** The species total alone, one cheap request instead of the pager's several. */
const fetchSpeciesTotal = async ({
  lat,
  lng,
  radius,
  taxa,
  abortSignal,
}: {
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  abortSignal: AbortSignal;
}): Promise<number> => {
  const data = await fetchData<Pick<ResponseType, "total_results">>(
    getSpeciesTotalUrl({ lat, lng, radius, taxa }),
    abortSignal
  );

  return data.total_results;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How long a cached list is served without asking the API anything at all.
 *
 * A location's species list moves over seasons, not days: what changes from one week
 * to the next is which of them were photographed, not which of them are there. Two
 * weeks of that against several paginated requests, made every time the app opens, is
 * a trade worth making — and the requests saved are the same ones the observations
 * fetch and the photo prefetch are competing for.
 */
const FRESH_FOR_MS = 14 * DAY_MS;

/**
 * Past this a list is fetched again even when the species total still matches. An
 * unchanged count over months is as easily one species arriving and another going
 * quiet as it is nothing at all having happened.
 */
const REFETCH_AFTER_MS = 90 * DAY_MS;

/** What a cached list is worth, which is what decides how much is requested. */
type CachedListVerdict =
  /** Served as the current list; nothing is requested. */
  | "serve"
  /** Served if the species total still matches; one request. */
  | "verify"
  /** Only fills the page while the whole list is fetched again. */
  | "refetch";

const judgeCachedList = (
  cachedList: CachedSpeciesListResult | null,
  isForcedRefresh: boolean
): CachedListVerdict => {
  // A user asking for a refresh is asking past every reason to skip one
  if (!cachedList || isForcedRefresh) {
    return "refetch";
  }

  // Cached for a location that has since been moved or resized, or in another language
  if (!cachedList.matchesRequest) {
    return "refetch";
  }

  // Without the total there is nothing to compare a fresh count against, and no way to
  // tell a complete entry from one cut short
  if (cachedList.totalResults === null) {
    return "refetch";
  }

  // An entry stored by a run that ended early, or by a build with a lower page limit,
  // is missing species the location has
  const expectedSpeciesCount = Math.min(
    cachedList.totalResults,
    MAX_SPECIES_TO_FETCH
  );
  if (cachedList.species.length < expectedSpeciesCount) {
    return "refetch";
  }

  if (cachedList.ageMs >= REFETCH_AFTER_MS) {
    return "refetch";
  }

  return cachedList.unverifiedForMs < FRESH_FOR_MS ? "serve" : "verify";
};

// TODO do as infinite pager
export const useFetchSpecies = ({
  locationId,
  lat,
  lng,
  radius,
  taxa,
  enabled = true,
}: {
  locationId: string;
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  enabled?: boolean;
}) => {
  const [queries, setQueries] = useState<{
    loading: boolean;
    data: null | SpeciesData[];
    // How many species the location has, which can exceed the fetched ones. Null
    // until a fetch lands, or when it came from a cache entry that predates it.
    totalResults: number | null;
    error: FetchErrorKind | null;
    isCachedData: boolean;
  }>({
    // Reading the cached list is itself a wait, short but asynchronous. Starting at
    // false would let a page render "nothing here" before the list it has arrives.
    loading: true,
    data: null,
    totalResults: null,
    error: null,
    isCachedData: false,
  });

  // What the request is made of, and so what a cached entry has to have answered
  const requestKey = `${locationId}-${taxa}-${lat}-${lng}-${radius}`;

  // Bumped to run the effect again after a failure, without any of the inputs having
  // to change. The request it was asked for is kept with it so that the refresh applies
  // to that one and not to whichever location the user moves on to.
  const [refreshRequest, setRefreshRequest] = useState({
    requestKey: "",
    token: 0,
  });
  const retry = useCallback(
    () =>
      setRefreshRequest((previous) => ({
        requestKey,
        token: previous.token + 1,
      })),
    [requestKey]
  );

  // Asked for by the user, which skips the freshness checks: the cached list is exactly
  // what they are asking to be rid of
  const isForcedRefresh = refreshRequest.requestKey === requestKey;

  // An input like the others, so the fetch is skipped while there is no connection and
  // starts by itself once there is one again
  const isOffline = useIsOffline();

  useEffect(() => {
    // The fetch is slow enough that the user can change location while it runs; its
    // results must not land on top of whatever is being shown by then
    let isStaleRequest = false;
    // Abandoned runs are also cut short rather than left to finish quietly: their
    // remaining pages would otherwise compete with the ones the user is waiting on,
    // against the same rate limit
    const abortController = new AbortController();

    const cacheKey: SpeciesListCacheKey = {
      locationId,
      taxa,
      lat,
      lng,
      radius,
    };

    const fetchPagesData = async () => {
      if (!lat || !lng || !radius) {
        setQueries({
          loading: false,
          data: null,
          totalResults: null,
          error: null,
          isCachedData: false,
        });
        return;
      }

      // The list from a previous session fills the page while the fetch runs, is shown
      // even before it starts — callers defer the fetch to stay under the iNaturalist
      // rate limit, which makes the wait longer still — and, when it is recent enough,
      // saves the fetch from being made at all
      const cachedSpecies = await readCachedSpeciesList(cacheKey);
      if (isStaleRequest) return;

      // Offline the cached list is the whole species page, and it is a usable one:
      // the photos of a list that was browsed before are in the service worker cache.
      // The effect runs again when the connection comes back.
      if (isOffline) {
        setQueries({
          loading: false,
          data: cachedSpecies?.species ?? null,
          totalResults: cachedSpecies?.totalResults ?? null,
          error: null,
          isCachedData: !!cachedSpecies,
        });
        return;
      }

      const verdict = judgeCachedList(cachedSpecies, isForcedRefresh);

      // Decided before the `enabled` gate below, so a list that needs nothing fetched
      // is ready the moment the app opens rather than behind the observations request
      if (verdict === "serve" && cachedSpecies) {
        setQueries({
          loading: false,
          data: cachedSpecies.species,
          totalResults: cachedSpecies.totalResults,
          error: null,
          isCachedData: true,
        });
        return;
      }

      setQueries({
        loading: true,
        data: cachedSpecies?.species ?? null,
        totalResults: cachedSpecies?.totalResults ?? null,
        error: null,
        isCachedData: !!cachedSpecies,
      });

      if (!enabled) {
        return;
      }

      // One request to find out whether the several the pager costs would bring back
      // the list already held. A location whose species total has not moved has not
      // gained or lost any, which is the part of the list the species page is about:
      // the per species observation counts do keep creeping up, and are left to go
      // stale on purpose.
      if (verdict === "verify" && cachedSpecies) {
        try {
          const currentTotal = await fetchSpeciesTotal({
            lat,
            lng,
            radius,
            taxa,
            abortSignal: abortController.signal,
          });

          if (currentTotal === cachedSpecies.totalResults) {
            await markCachedSpeciesListVerified(cacheKey);

            if (isStaleRequest) return;

            setQueries({
              loading: false,
              data: cachedSpecies.species,
              totalResults: cachedSpecies.totalResults,
              error: null,
              isCachedData: true,
            });
            return;
          }
        } catch (error) {
          if (isStaleRequest) return;

          // The list in hand is complete and recent enough to have been worth keeping,
          // so it is served rather than replaced by an error screen. Falling through to
          // the pager instead would only spend more requests on the same refusal, the
          // usual reason for one being a rate limit that has run out.
          console.warn("Could not check the species total:", error);
          setQueries({
            loading: false,
            data: cachedSpecies.species,
            totalResults: cachedSpecies.totalResults,
            error: null,
            isCachedData: true,
          });
          return;
        }

        if (isStaleRequest) return;
      }

      try {
        const { species, totalResults } = await fetchSpecies({
          lat,
          lng,
          radius,
          taxa,
          abortSignal: abortController.signal,
        });

        // Refill the cache so the next start has a list to show right away. An
        // abandoned run never gets here, having been aborted part way through its
        // pages.
        await writeCachedSpeciesList(cacheKey, species, totalResults);

        if (isStaleRequest) return;

        setQueries({
          loading: false,
          data: species,
          totalResults,
          error: null,
          isCachedData: false,
        });

        // The refresh the user asked for has happened. Left set, it would make the next
        // run of this effect — going offline and back, say — fetch the whole list over
        // again on the strength of a button pressed long before.
        setRefreshRequest((previous) => ({ ...previous, requestKey: "" }));
      } catch (error) {
        if (isStaleRequest) return;

        setQueries({
          loading: false,
          data: null,
          totalResults: null,
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
  }, [
    locationId,
    lat,
    lng,
    radius,
    taxa,
    enabled,
    isOffline,
    isForcedRefresh,
    refreshRequest.token,
  ]);

  return { ...queries, retry };
};
