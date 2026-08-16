import { LOCAL_STORAGE_KEY } from "@/constants";
import { DEFAULT_SPECIES_POOL, isSpeciesPool } from "@/speciesPool";
import type { SpeciesPool } from "@/speciesPool";
import { usePersistedOption } from "@/hooks/usePersistedOption";

type UseCurrentSpeciesPoolReturn = {
  currentSpeciesPool: SpeciesPool;
  setCurrentSpeciesPool: (speciesPool: SpeciesPool) => void;
};

export const useCurrentSpeciesPool = (): UseCurrentSpeciesPoolReturn => {
  const [currentSpeciesPool, setCurrentSpeciesPool] =
    usePersistedOption<SpeciesPool>({
      searchParamName: "pool",
      storageKey: LOCAL_STORAGE_KEY.currentSpeciesPool,
      defaultValue: DEFAULT_SPECIES_POOL,
      isValidValue: isSpeciesPool,
    });

  return { currentSpeciesPool, setCurrentSpeciesPool };
};
