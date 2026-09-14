import { useCallback, useEffect } from "react";

import { LOCAL_STORAGE_KEY } from "@/constants";
import {
  DEFAULT_SPECIES_POOL,
  FALLBACK_SPECIES_POOL,
  getSpeciesPoolCategoryId,
  isSpeciesPool,
} from "@/speciesPool";
import type { SpeciesPool } from "@/speciesPool";
import { usePersistedOption } from "@/hooks/usePersistedOption";
import { useCategoriesContext } from "@/CategoriesContext";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";

type UseCurrentSpeciesPoolReturn = {
  currentSpeciesPool: SpeciesPool;
  setCurrentSpeciesPool: (speciesPool: SpeciesPool) => void;
};

/** No location has been picked yet, or the stored pool predates this being kept. */
const NO_POOL_LOCATION = "";

const isLocationId = (value: unknown): value is string =>
  typeof value === "string";

/**
 * The pool the observations are drawn from, kept in localStorage.
 *
 * The presets apply everywhere, but a category pool belongs to the location it was
 * picked at: its species were tagged while browsing that location, and most of them
 * are not at the next one. So a category is kept across a reload of the same
 * location and dropped as soon as the user moves to another.
 */
export const useCurrentSpeciesPool = (
  currentLocationId: string | null
): UseCurrentSpeciesPoolReturn => {
  const [storedSpeciesPool, setStoredSpeciesPool] =
    usePersistedOption<SpeciesPool>({
      storageKey: LOCAL_STORAGE_KEY.currentSpeciesPool,
      defaultValue: DEFAULT_SPECIES_POOL,
      isValidValue: isSpeciesPool,
    });

  // Which location the stored pool was chosen at. Any string is a valid id, so this
  // is only read back to compare it against the current one.
  const [poolLocationId, setPoolLocationId] = usePersistedOption<string>({
    storageKey: LOCAL_STORAGE_KEY.currentSpeciesPoolLocationId,
    defaultValue: NO_POOL_LOCATION,
    isValidValue: isLocationId,
  });

  const categoriesContext = useCategoriesContext();
  const speciesInfoContext = useSpeciesInfoContext();

  /**
   * Whether the category still has species to draw observations from.
   *
   * Deleting a category, or untagging its last species, leaves a stored pool that
   * would fetch nothing. Neither is known until both stores have loaded, so until
   * then the pool is kept as it is rather than falling back and fetching twice.
   */
  const isCategoryUsable = (categoryId: string): boolean => {
    if (
      categoriesContext.state.status !== "success" ||
      speciesInfoContext.state.status !== "success"
    ) {
      return true;
    }

    if (!categoriesContext.state.data.has(categoryId)) {
      return false;
    }

    return Array.from(speciesInfoContext.state.data.values()).some(
      (speciesInfo) => speciesInfo.categoryIds?.includes(categoryId)
    );
  };

  const poolCategoryId = getSpeciesPoolCategoryId(storedSpeciesPool);

  // A category picked elsewhere. Not applied while there is no location: nothing is
  // being fetched then, and the id to compare against arrives with the locations.
  const isPoolFromAnotherLocation =
    currentLocationId !== null && poolLocationId !== currentLocationId;

  const shouldFallBack =
    poolCategoryId !== null &&
    (isPoolFromAnotherLocation || !isCategoryUsable(poolCategoryId));

  const setCurrentSpeciesPool = useCallback(
    (speciesPool: SpeciesPool) => {
      setStoredSpeciesPool(speciesPool);
      setPoolLocationId(currentLocationId ?? NO_POOL_LOCATION);
    },
    [setStoredSpeciesPool, setPoolLocationId, currentLocationId]
  );

  // Write the fallback back so the selector and the next session agree with what
  // is being fetched
  useEffect(() => {
    if (shouldFallBack) {
      setCurrentSpeciesPool(FALLBACK_SPECIES_POOL);
    }
  }, [shouldFallBack, setCurrentSpeciesPool]);

  return {
    // Returned right away rather than waiting for the effect, so no fetch is
    // started for a pool that is about to be replaced
    currentSpeciesPool: shouldFallBack
      ? FALLBACK_SPECIES_POOL
      : storedSpeciesPool,
    setCurrentSpeciesPool,
  };
};
