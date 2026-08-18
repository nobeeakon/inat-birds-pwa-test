import { useEffect } from "react";

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

export const useCurrentSpeciesPool = (): UseCurrentSpeciesPoolReturn => {
  const [storedSpeciesPool, setCurrentSpeciesPool] =
    usePersistedOption<SpeciesPool>({
      searchParamName: "pool",
      storageKey: LOCAL_STORAGE_KEY.currentSpeciesPool,
      defaultValue: DEFAULT_SPECIES_POOL,
      isValidValue: isSpeciesPool,
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
  const shouldFallBack =
    poolCategoryId !== null && !isCategoryUsable(poolCategoryId);

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
