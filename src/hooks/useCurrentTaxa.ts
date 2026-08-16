import { LOCAL_STORAGE_KEY } from "@/constants";
import { DEFAULT_TAXA, isTaxa } from "@/taxa";
import type { Taxa } from "@/taxa";
import { usePersistedOption } from "@/hooks/usePersistedOption";

type UseCurrentTaxaReturn = {
  currentTaxa: Taxa;
  setCurrentTaxa: (taxa: Taxa) => void;
};

export const useCurrentTaxa = (): UseCurrentTaxaReturn => {
  const [currentTaxa, setCurrentTaxa] = usePersistedOption<Taxa>({
    searchParamName: "taxa",
    storageKey: LOCAL_STORAGE_KEY.currentTaxa,
    defaultValue: DEFAULT_TAXA,
    isValidValue: isTaxa,
  });

  return { currentTaxa, setCurrentTaxa };
};
