import { createContext, useContext, useState, type ReactNode } from "react";
import { useLocation as useRouterLocation } from "react-router-dom";

import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import {
  useFetchObservations,
  type ObservationType,
} from "@/observations/useFetchObservations";
import {
  useFetchSpecies,
  MAX_SPECIES_TO_FETCH,
  type SpeciesData,
} from "@/species/useFetchSpecies";
import { useSpeciesPhotoPrefetch } from "@/species/useSpeciesPhotoPrefetch";
import {
  selectNextIndex,
  type ReviewInfo,
} from "@/observations/spacedRepetition";
import type { ObservationStatus } from "@/observations/types";
import type { LocationInformation } from "@/types";
import type { Taxa } from "@/taxa";
import { getSpeciesPoolCategoryId } from "@/speciesPool";
import type { SpeciesPool } from "@/speciesPool";

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
  error: boolean;
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
  error: boolean;
  isCachedData: boolean; // Showing a previous session's list until the fetch lands
  species: SpeciesData[] | null; // null while the fetch is still deferred or in flight
  totalSpeciesCount: number | null; // Species the location has, fetched or not
  isTruncated: boolean; // The location has more species than the fetch limit
};

type BirdDataContextType = {
  observationsData: ObservationsData;
  speciesData: SpeciesQueryData;
};

const BirdDataContext = createContext<BirdDataContextType | null>(null);

const useBirdDataContext = (): BirdDataContextType => {
  const context = useContext(BirdDataContext);
  if (!context) {
    throw new Error(
      "useBirdDataContext must be used within a BirdDataContextProvider"
    );
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useObservationsData = (): ObservationsData =>
  useBirdDataContext().observationsData;

// eslint-disable-next-line react-refresh/only-export-components
export const useSpeciesData = (): SpeciesQueryData =>
  useBirdDataContext().speciesData;

/**
 * Holds the data both the observations and the species pages render.
 *
 * The provider sits above the routes so navigating between the two pages neither
 * refetches nor loses the browsing position. Fetching lives here instead of in the
 * pages because the two iNaturalist endpoints share a rate limit and need to be
 * sequenced against each other.
 */
const BirdDataContextProvider = ({
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
  const routerLocation = useRouterLocation();
  const { getSpeciesInfo, state: speciesInfoState } = useSpeciesInfoContext();

  const poolCategoryId = getSpeciesPoolCategoryId(currentSpeciesPool);
  const categorySelectionKey = `${currentLocation.id}-${currentTaxa}-${currentSpeciesPool}`;

  const getTaggedTaxonIds = (): string | null => {
    if (poolCategoryId === null) return null;
    if (speciesInfoState.status !== "success") return null;

    return Array.from(speciesInfoState.data.values())
      .filter(
        (info) => info.categoryIds?.includes(poolCategoryId) && !info.exclude
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

  const observationsQuery = useFetchObservations({
    locationId: currentLocation.id,
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    radius: currentLocation.radius,
    taxa: currentTaxa,
    speciesPool: currentSpeciesPool,
    categoryTaxonIds: categorySelection.taxonIds,
  });

  // The species list is fetched while the user is on the observations page so it
  // (and its cache entry) is ready by the time they navigate to the species page.
  // It waits for the observations request to settle to avoid competing for the
  // iNaturalist rate limit, unless the user landed on the species page directly.
  const observationsSettled =
    !observationsQuery.loading &&
    (observationsQuery.data !== null || !!observationsQuery.error);
  const isSpeciesRoute = routerLocation.pathname === "/species";

  const speciesQuery = useFetchSpecies({
    locationId: currentLocation.id,
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    radius: currentLocation.radius,
    taxa: currentTaxa,
    enabled: observationsSettled || isSpeciesRoute,
  });

  // The virtualized list only requests the photos of the rows on screen, so the list
  // is walked here to fill the photo cache for the whole of it
  useSpeciesPhotoPrefetch(speciesQuery.data);

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
      (item) => !getSpeciesInfo(item.taxon.id.toString())?.exclude
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

  const value: BirdDataContextType = {
    observationsData: {
      loading: observationsQuery.loading,
      error: !!observationsQuery.error,
      isCachedData: observationsQuery.isCachedData,
      observations,
      currentIndex,
      currentObservation: observations[currentIndex],
      goToNextObservation,
      markObservationReviewed,
    },
    speciesData: {
      loading: speciesQuery.loading,
      error: !!speciesQuery.error,
      isCachedData: speciesQuery.isCachedData,
      species: speciesQuery.data,
      totalSpeciesCount: speciesQuery.totalResults,
      isTruncated:
        speciesQuery.totalResults !== null &&
        speciesQuery.totalResults > MAX_SPECIES_TO_FETCH,
    },
  };

  return (
    <BirdDataContext.Provider value={value}>
      {children}
    </BirdDataContext.Provider>
  );
};

export default BirdDataContextProvider;
