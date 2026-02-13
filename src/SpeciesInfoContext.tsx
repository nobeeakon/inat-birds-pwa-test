import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import { speciesInfoStore, type SpecieInfo } from "@/storage/db";

type SpeciesInfoState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: Map<string, SpecieInfo> };

type SpeciesInfoContextType = {
  state: SpeciesInfoState;
  updateSpeciesInfo: (speciesId: string, newInfo: SpecieInfo) => Promise<void>;
  getSpeciesInfo: (speciesId: string) => SpecieInfo | undefined;
};

const SpeciesInfoContext = createContext<SpeciesInfoContextType>({
  state: { status: "loading" },
  updateSpeciesInfo: async () => {
    throw new Error("updateSpeciesInfo not implemented");
  },
  getSpeciesInfo: () => {
    throw new Error("getSpeciesInfo not implemented");
  },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSpeciesInfoContext = () => {
  const context = useContext(SpeciesInfoContext);
  if (!context) {
    throw new Error(
      "useSpeciesInfoContext must be used within a SpeciesInfoContextProvider"
    );
  }
  return context;
};

const SpeciesInfoContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SpeciesInfoState>({ status: "loading" });
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Load species info on mount and when refreshCounter changes
  useEffect(() => {
    const loadSpeciesInfo = async () => {
      setState({ status: "loading" });
      try {
        const storedInfo = await speciesInfoStore.getAll();
        const speciesMap = new Map<string, SpecieInfo>();
        if (storedInfo) {
          storedInfo.forEach((infoItem) => {
            speciesMap.set(infoItem.data.taxonId, infoItem.data);
          });
        }
        setState({ status: "success", data: speciesMap });
      } catch (error) {
        console.error("Failed to load species info from IndexedDB:", error);
        setState({
          status: "error",
          error:
            error instanceof Error
              ? error
              : new Error("Unknown error loading species info"),
        });
      }
    };
    loadSpeciesInfo();
  }, [refreshCounter]);

  const updateSpeciesInfo = useCallback(
    async (speciesId: string, newInfo: SpecieInfo) => {
      try {
        await speciesInfoStore.set(speciesId, newInfo);
        setRefreshCounter((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to update species info:", error);
        throw error;
      }
    },
    []
  );

  const getSpeciesInfo = useCallback(
    (speciesId: string): SpecieInfo | undefined => {
      if (state.status === "success") {
        return state.data.get(speciesId);
      }
      return undefined;
    },
    [state]
  );

  const value = {
    state,
    updateSpeciesInfo,
    getSpeciesInfo,
  };

  return (
    <SpeciesInfoContext.Provider value={value}>
      {children}
    </SpeciesInfoContext.Provider>
  );
};

export default SpeciesInfoContextProvider;
