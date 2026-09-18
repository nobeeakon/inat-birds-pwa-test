import { createContext, useContext, useState, type ReactNode } from "react";

import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import type { FetchErrorKind } from "@/fetchData";
import { useFetchObservations } from "@/observations/useFetchObservations";
import {
  useFetchSpecies,
  MAX_SPECIES_TO_FETCH,
  type SpeciesData,
} from "@/species/useFetchSpecies";
import {
  selectNextIndex,
  type ReviewInfo,
} from "@/observations/spacedRepetition";
import { recordSpeciesReview } from "@/observations/speciesReviews";
import type { ObservationStatus, ObservationType } from "@/observations/types";
import type { LocationInformation } from "@/types";
import type { Taxa } from "@/taxa";
import { getSpeciesPoolCategoryId } from "@/speciesPool";
import type { SpeciesPool } from "@/speciesPool";
import { isSpeciesExcluded } from "@/exclusions";

type BrowsingState = {
  key: string; // Identifies the observation set the position belongs to
  indices: number[];
  reviewMap: Map<string, ReviewInfo>;
};

// The cached observations shown at startup are their own set: swapping them for the
// fetched ones has to start the browsing position over
const getBrowsingKey = (
  locationId: string,
  taxa: Taxa,
  speciesPool: SpeciesPool,
  isCachedData: boolean
) => `${locationId}-${taxa}-${speciesPool}-${isCachedData}`;

const createBrowsingState = (key: string): BrowsingState => ({
  key,
  indices: [0],
  reviewMap: new Map(),
});

// The species a category pool draws from, taken once per pool rather than read live:
// tagging a species while browsing would otherwise restart the whole fetch
type CategorySelection = {
  key: string;
  taxonIds: string | null; // Comma separated, null until the species info has loaded
};

type ObservationsData = {
  loading: boolean;
  error: FetchErrorKind | null;
  retry: () => void; // Runs the failed fetch again
  isCachedData: boolean; // Showing last session's observations until the fetch lands
  observations: ObservationType[];
  currentIndex: number;
  currentObservation: ObservationType | undefined;
  goToNextObservation: () => void;
  markObservationReviewed: (
    observationUuid: string,
    status: ObservationStatus
  ) => void;
};

type SpeciesQueryData = {
  loading: boolean;
  error: FetchErrorKind | null;
  retry: () => void; // Runs the failed fetch again
  isCachedData: boolean; // Showing a previous session's list until the fetch lands
  species: SpeciesData[] | null; // null while the fetch is still deferred or in flight
  totalSpeciesCount: number | null; // Species the location has, fetched or not
  isTruncated: boolean; // The location has more species than the fetch limit
};

type INaturalistDataContextType = {
  observationsData: ObservationsData;
  speciesData: SpeciesQueryData;
};

const INaturalistDataContext = createContext<INaturalistDataContextType | null>(
  null
);

const useINaturalistDataContext = (): INaturalistDataContextType => {
  const context = useContext(INaturalistDataContext);
  if (!context) {
    throw new Error(
      "useINaturalistDataContext must be used within an INaturalistDataContextProvider"
    );
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useObservationsData = (): ObservationsData =>
  useINaturalistDataContext().observationsData;

// eslint-disable-next-line react-refresh/only-export-components
export const useSpeciesData = (): SpeciesQueryData =>
  useINaturalistDataContext().speciesData;

/**
 * Holds the data both the observations and the species pages render.
 *
 * The provider sits above the routes so navigating between the two pages neither
 * refetches nor loses the browsing position. Fetching lives here instead of in the
 * pages because the two iNaturalist endpoints share a rate limit and need to be
 * sequenced against each other.
 */
const INaturalistDataContextProvider = ({
  currentLocation,
  currentTaxa,
  currentSpeciesPool,
  children,
}: {
  currentLocation: LocationInformation;
  currentTaxa: Taxa;
  currentSpeciesPool: SpeciesPool;
  children: ReactNode;
}) => {
  const { getSpeciesInfo, state: speciesInfoState } = useSpeciesInfoContext();

  const poolCategoryId = getSpeciesPoolCategoryId(currentSpeciesPool);
  const categorySelectionKey = `${currentLocation.id}-${currentTaxa}-${currentSpeciesPool}`;

  const getTaggedTaxonIds = (): string | null => {
    if (poolCategoryId === null) return null;
    if (speciesInfoState.status !== "success") return null;

    return Array.from(speciesInfoState.data.values())
      .filter(
        (info) =>
          info.categoryIds?.includes(poolCategoryId) &&
          !isSpeciesExcluded(info, currentLocation.id, currentTaxa)
      )
      .map((info) => info.taxonId)
      .join(",");
  };

  const [categorySelection, setCategorySelection] = useState<CategorySelection>(
    () => ({ key: categorySelectionKey, taxonIds: null })
  );

  const taggedTaxonIds = getTaggedTaxonIds();
  if (categorySelection.key !== categorySelectionKey) {
    setCategorySelection({
      key: categorySelectionKey,
      taxonIds: taggedTaxonIds,
    });
  } else if (categorySelection.taxonIds === null && taggedTaxonIds !== null) {
    // First read once the species info finishes loading
    setCategorySelection({
      key: categorySelectionKey,
      taxonIds: taggedTaxonIds,
    });
  }

  // Which observations have been visited and how they were rated. Kept together so
  // rating an observation and moving to the next one is a single state update.
  const [browsingState, setBrowsingState] = useState<BrowsingState>(() =>
    createBrowsingState(
      getBrowsingKey(currentLocation.id, currentTaxa, currentSpeciesPool, false)
    )
  );

  // The species list comes first, because the observations draw picks the species it
  // fetches sightings of out of it. That order costs nothing: the list is usually
  // served from its cache without a request at all, and when it is not, its first page
  // is all the draw needs and arrives while the rest are still on their way.
  //
  // It also means the list (and its cache entry) is ready by the time the user
  // navigates to the species page, which is what the old deferred fetch was for.
  const speciesQuery = useFetchSpecies({
    locationId: currentLocation.id,
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    radius: currentLocation.radius,
    taxa: currentTaxa,
  });

  const observationsQuery = useFetchObservations({
    locationId: currentLocation.id,
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    radius: currentLocation.radius,
    taxa: currentTaxa,
    speciesPool: currentSpeciesPool,
    categoryTaxonIds: categorySelection.taxonIds,
    species: speciesQuery.data,
    speciesError: speciesQuery.error,
  });

  /**
   * One retry for what the user sees as one failure.
   *
   * The observations page shows the species list's error as its own, so its retry has
   * to reach the species fetch: retrying the draw alone would find the same missing
   * list and fail again without having sent anything.
   */
  const retryObservations = () => {
    speciesQuery.retry();
    observationsQuery.retry();
  };

  // A different location, taxa or species pool means a whole new set of observations,
  // so the browsing position is dropped while rendering rather than in an effect
  const browsingKey = getBrowsingKey(
    currentLocation.id,
    currentTaxa,
    currentSpeciesPool,
    observationsQuery.isCachedData
  );
  if (browsingState.key !== browsingKey) {
    setBrowsingState(createBrowsingState(browsingKey));
  }

  const observations =
    observationsQuery.data?.filter(
      (item) =>
        !isSpeciesExcluded(
          getSpeciesInfo(item.taxon.id.toString()),
          currentLocation.id,
          currentTaxa
        )
    ) ?? [];

  const currentIndex =
    browsingState.indices[browsingState.indices.length - 1] ?? 0;

  const goToNextObservation = () => {
    setBrowsingState((previousState) => {
      const lastIndex =
        previousState.indices[previousState.indices.length - 1] ?? 0;
      const nextIndex = selectNextIndex(
        lastIndex,
        observations,
        previousState.reviewMap
      );
      return {
        ...previousState,
        indices: [...previousState.indices, nextIndex],
      };
    });
  };

  const markObservationReviewed = (
    observationUuid: string,
    status: ObservationStatus
  ) => {
    // The lasting half of the answer, kept per species rather than per observation: it
    // is what the reinforcement picks of later rounds are chosen from, so which photo
    // the user was looking at does not matter, only which bird it was of. Deliberately
    // not awaited — the round moves on at the tap, and a write that fails only costs
    // one slightly worse pick later on.
    const reviewedObservation = observations.find(
      (item) => item.uuid.toString() === observationUuid
    );
    if (reviewedObservation) {
      recordSpeciesReview(reviewedObservation.taxon.id, status);
    }

    setBrowsingState((previousState) => {
      const updatedReviewMap = new Map(previousState.reviewMap);
      const existingReview = updatedReviewMap.get(observationUuid);

      updatedReviewMap.set(observationUuid, {
        status,
        reviewCount: (existingReview?.reviewCount ?? 0) + 1,
      });

      // Pick the next observation with the rating just given already counted in
      const lastIndex =
        previousState.indices[previousState.indices.length - 1] ?? 0;
      const nextIndex = selectNextIndex(
        lastIndex,
        observations,
        updatedReviewMap
      );

      return {
        ...previousState,
        indices: [...previousState.indices, nextIndex],
        reviewMap: updatedReviewMap,
      };
    });
  };

  const value: INaturalistDataContextType = {
    observationsData: {
      loading: observationsQuery.loading,
      error: observationsQuery.error,
      retry: retryObservations,
      isCachedData: observationsQuery.isCachedData,
      observations,
      currentIndex,
      currentObservation: observations[currentIndex],
      goToNextObservation,
      markObservationReviewed,
    },
    speciesData: {
      loading: speciesQuery.loading,
      error: speciesQuery.error,
      retry: speciesQuery.retry,
      isCachedData: speciesQuery.isCachedData,
      species: speciesQuery.data,
      totalSpeciesCount: speciesQuery.totalResults,
      isTruncated:
        speciesQuery.totalResults !== null &&
        speciesQuery.totalResults > MAX_SPECIES_TO_FETCH,
    },
  };

  return (
    <INaturalistDataContext.Provider value={value}>
      {children}
    </INaturalistDataContext.Provider>
  );
};

export default INaturalistDataContextProvider;
